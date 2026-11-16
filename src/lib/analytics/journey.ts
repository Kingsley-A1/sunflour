/**
 * Browser side of Sunflour's first-party analytics.
 *
 * Mental model: every tab keeps an anonymous visitor id (random, stored in
 * localStorage) and a "visit" id that expires after 30 minutes of no
 * activity. Events are queued and sent in small batches, using sendBeacon so
 * the last event before a customer leaves still arrives.
 *
 * Nothing here identifies a person: no cookies, names, phones or emails.
 * Tracking never throws and never blocks the UI.
 */

export type JourneyEventName =
  | "page_view"
  | "product_view"
  | "search"
  | "add_to_cart"
  | "checkout_start"
  | "checkout_submit"
  | "checkout_error"
  | "order_placed"
  | "proof_sent"
  | "product_share";

export interface JourneyEventProps {
  productId?: string;
  productSlug?: string;
  orderNumber?: string;
  valueKobo?: number;
  label?: string;
  metadata?: Record<string, string | number | boolean | null>;
}

interface QueuedEvent extends JourneyEventProps {
  name: JourneyEventName;
  path: string;
  at: number;
}

interface StoredSession {
  id: string;
  lastActivity: number;
  referrer?: string;
  utmSource?: string;
  utmCampaign?: string;
}

const ENDPOINT = "/api/v1/public/journey";
const VISITOR_KEY = "sf_journey_vid";
const SESSION_KEY = "sf_journey_session";
const SESSION_IDLE_MS = 30 * 60_000;
const FLUSH_DELAY_MS = 2_000;
const MAX_BATCH = 20;

let queue: QueuedEvent[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let listenersAttached = false;
let newVisitorThisLoad = false;
// In-memory fallbacks for browsers that block storage (private mode).
let memoryVisitorId: string | null = null;
let memorySession: StoredSession | null = null;

function randomId(): string {
  try {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
      return crypto.randomUUID();
    }
  } catch {
    // fall through
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

function readStorage(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Storage blocked: the in-memory fallback keeps this page load coherent.
  }
}

function isOptedOut(): boolean {
  // Respect Global Privacy Control, the browser-level "do not sell/share".
  const nav = navigator as Navigator & { globalPrivacyControl?: boolean };
  return nav.globalPrivacyControl === true;
}

function getVisitorId(): string {
  const stored = readStorage(VISITOR_KEY) ?? memoryVisitorId;
  if (stored) {
    return stored;
  }
  const id = randomId();
  memoryVisitorId = id;
  newVisitorThisLoad = true;
  writeStorage(VISITOR_KEY, id);
  return id;
}

function readSession(): StoredSession | null {
  const raw = readStorage(SESSION_KEY);
  if (!raw) {
    return memorySession;
  }
  try {
    const parsed = JSON.parse(raw) as StoredSession;
    return typeof parsed?.id === "string" ? parsed : null;
  } catch {
    return null;
  }
}

function getSession(now: number): StoredSession {
  const existing = readSession();
  let session: StoredSession;

  if (existing && now - existing.lastActivity < SESSION_IDLE_MS) {
    session = { ...existing, lastActivity: now };
  } else {
    // A new visit: capture where it came from once, so every event in the
    // visit is credited to the same source.
    const params = new URLSearchParams(window.location.search);
    session = {
      id: randomId(),
      lastActivity: now,
      referrer: document.referrer || undefined,
      utmSource: params.get("utm_source")?.slice(0, 80) || undefined,
      utmCampaign: params.get("utm_campaign")?.slice(0, 80) || undefined,
    };
  }

  memorySession = session;
  writeStorage(SESSION_KEY, JSON.stringify(session));
  return session;
}

function send(useBeacon: boolean) {
  if (queue.length === 0) {
    return;
  }
  const batch = queue.slice(0, MAX_BATCH);
  queue = queue.slice(MAX_BATCH);

  const now = Date.now();
  const session = getSession(now);
  const body = JSON.stringify({
    visitorId: getVisitorId(),
    sessionId: session.id,
    sentAt: now,
    referrer: session.referrer,
    utmSource: session.utmSource,
    utmCampaign: session.utmCampaign,
    events: batch,
  });

  try {
    if (useBeacon && typeof navigator.sendBeacon === "function") {
      const ok = navigator.sendBeacon(
        ENDPOINT,
        new Blob([body], { type: "application/json" }),
      );
      if (ok) {
        if (queue.length > 0) send(useBeacon);
        return;
      }
    }
    void fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
      credentials: "same-origin",
    }).catch(() => undefined);
  } catch {
    // Measurement must never break the storefront.
  }

  if (queue.length > 0) {
    send(useBeacon);
  }
}

function flushNow() {
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
  send(true);
}

function attachListeners() {
  if (listenersAttached) {
    return;
  }
  listenersAttached = true;
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      flushNow();
    }
  });
  window.addEventListener("pagehide", flushNow);
}

/** Record one step of the customer journey. Safe to call anywhere. */
export function trackJourney(
  name: JourneyEventName,
  props: JourneyEventProps = {},
) {
  if (typeof window === "undefined") {
    return;
  }
  try {
    if (isOptedOut()) {
      return;
    }
    attachListeners();
    const now = Date.now();
    getVisitorId();
    getSession(now);

    const metadata =
      name === "page_view" && newVisitorThisLoad
        ? { ...props.metadata, newVisitor: true }
        : props.metadata;

    queue.push({
      ...props,
      ...(metadata ? { metadata } : {}),
      name,
      path: window.location.pathname,
      at: now,
    });

    // Orders and proof are the moments that matter most: send right away in
    // case the customer switches to WhatsApp or the bank app immediately.
    if (name === "order_placed" || name === "proof_sent" || queue.length >= MAX_BATCH) {
      flushNow();
      return;
    }
    if (!flushTimer) {
      flushTimer = setTimeout(() => {
        flushTimer = null;
        send(false);
      }, FLUSH_DELAY_MS);
    }
  } catch {
    // Never let measurement break a customer action.
  }
}
