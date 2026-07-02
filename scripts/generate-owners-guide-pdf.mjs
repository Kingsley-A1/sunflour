import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "@playwright/test";
import { marked } from "marked";

const BRAND = {
  red: "#B22416",
  redStrong: "#8F1C12",
  yellow: "#FFD400",
  yellowSoft: "#FFF3B0",
  cream: "#FFF8EC",
  paper: "#FFFCF6",
  surface: "#FFFFFF",
  surfaceMuted: "#F8F3EA",
  ink: "#24150D",
  inkMuted: "#6F4B33",
  border: "#E9DCC8",
  borderStrong: "#D9C0A0",
};

const ROOT = process.cwd();
const DOCS_DIR = path.join(ROOT, "docs");
const INPUT_MARKDOWN_PATH = path.join(DOCS_DIR, "OWNERS_GUIDE.md");
const OUTPUT_PDF_PATH = path.join(DOCS_DIR, "OWNERS_GUIDE.pdf");
const TMP_DIR = path.join(ROOT, "tmp", "pdfs", "owners-guide");
const HTML_PREVIEW_PATH = path.join(TMP_DIR, "OWNERS_GUIDE.preview.html");
const COVER_PREVIEW_PATH = path.join(TMP_DIR, "cover-preview.png");
const PARTNER_PREVIEW_PATH = path.join(TMP_DIR, "partner-preview.png");
const CONTENT_PREVIEW_PATH = path.join(TMP_DIR, "content-preview.png");

function toSlug(value) {
  return value
    .toLowerCase()
    .replace(/&[a-z]+;/g, " ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function tokensToText(tokens) {
  return tokens
    .map((token) => {
      if (Array.isArray(token.tokens) && token.tokens.length > 0)
        return tokensToText(token.tokens);
      if (typeof token.text === "string") return token.text;
      if (typeof token.raw === "string") return token.raw;
      return "";
    })
    .join("");
}

function createMarkedRenderer() {
  const renderer = new marked.Renderer();
  const seenSlugs = new Map();

  renderer.heading = function heading({ tokens, depth }) {
    const innerHtml = this.parser.parseInline(tokens);
    const rawText = tokensToText(tokens);
    const baseSlug = toSlug(rawText) || "section";
    const duplicateCount = seenSlugs.get(baseSlug) ?? 0;
    seenSlugs.set(baseSlug, duplicateCount + 1);
    const slug =
      duplicateCount === 0 ? baseSlug : `${baseSlug}-${duplicateCount + 1}`;

    return `<h${depth} id="${slug}">${innerHtml}</h${depth}>\n`;
  };

  return renderer;
}

function stripOwnerGuideFrontMatter(markdown) {
  return markdown
    .replace(/<!--[\s\S]*?-->\s*/u, "")
    .replace(/<div align="center">[\s\S]*?<\/div>\s*/u, "")
    .replace(/^---\s*/u, "")
    .trim();
}

async function imageToDataUrl(filePath) {
  const buffer = await fs.readFile(filePath);
  const ext = path.extname(filePath).toLowerCase();
  const mimeType =
    ext === ".png" ? "image/png" : ext === ".jpg" || ext === ".jpeg"
      ? "image/jpeg"
      : "application/octet-stream";

  return `data:${mimeType};base64,${buffer.toString("base64")}`;
}

function buildHtml({
  contentHtml,
  sunflourLogoSrc,
  bespokeLogoSrc,
}) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1"
    />
    <title>Sunflour Bakery Owner's Guide</title>
    <style>
      :root {
        --brand-red: ${BRAND.red};
        --brand-red-strong: ${BRAND.redStrong};
        --brand-yellow: ${BRAND.yellow};
        --brand-yellow-soft: ${BRAND.yellowSoft};
        --brand-cream: ${BRAND.cream};
        --brand-paper: ${BRAND.paper};
        --brand-surface: ${BRAND.surface};
        --brand-surface-muted: ${BRAND.surfaceMuted};
        --brand-ink: ${BRAND.ink};
        --brand-ink-muted: ${BRAND.inkMuted};
        --brand-border: ${BRAND.border};
        --brand-border-strong: ${BRAND.borderStrong};
      }

      * {
        box-sizing: border-box;
      }

      html {
        background: var(--brand-surface-muted);
      }

      body {
        margin: 0;
        color: var(--brand-ink);
        background: var(--brand-surface-muted);
        font-family: "Segoe UI", Inter, Arial, sans-serif;
        line-height: 1.6;
      }

      img {
        max-width: 100%;
        display: block;
      }

      a {
        color: var(--brand-red-strong);
        text-decoration: none;
        border-bottom: 1px solid rgba(178, 36, 22, 0.24);
      }

      @page {
        size: A4;
        margin: 14mm 14mm 16mm;
      }

      .print-shell {
        width: 100%;
      }

      .cover-page,
      .partner-page {
        position: relative;
        min-height: calc(297mm - 30mm);
        break-after: page;
        overflow: hidden;
      }

      .cover-page {
        padding: 12mm;
        border: 0.45mm solid rgba(178, 36, 22, 0.18);
        outline: 0.28mm solid rgba(178, 36, 22, 0.14);
        outline-offset: -4.5mm;
        border-radius: 6mm;
        background:
          linear-gradient(145deg, rgba(255, 248, 236, 0.98), rgba(255, 252, 246, 0.98));
      }

      .cover-page::before,
      .cover-page::after {
        content: "";
        position: absolute;
        inset: auto;
        border-radius: 999px;
        opacity: 0.9;
        pointer-events: none;
      }

      .cover-page::before {
        top: -22mm;
        right: -26mm;
        width: 72mm;
        height: 72mm;
        background:
          radial-gradient(circle at 34% 36%, rgba(255, 212, 0, 0.68), rgba(255, 212, 0, 0.18) 58%, transparent 62%);
      }

      .cover-page::after {
        left: -22mm;
        bottom: -26mm;
        width: 78mm;
        height: 78mm;
        background:
          radial-gradient(circle at 58% 42%, rgba(178, 36, 22, 0.08), rgba(178, 36, 22, 0.015) 60%, transparent 64%);
      }

      .cover-inner,
      .partner-inner {
        position: relative;
        z-index: 1;
        height: 100%;
      }

      .cover-inner {
        display: grid;
        grid-template-rows: auto 1fr auto;
        gap: 12mm;
      }

      .cover-topline {
        display: flex;
        align-items: center;
        justify-content: flex-start;
        gap: 6mm;
      }

      .eyebrow-chip {
        display: inline-flex;
        align-items: center;
        gap: 2mm;
        min-height: 8mm;
        padding: 0 3.6mm;
        border-radius: 999px;
        font-size: 8.5pt;
        font-weight: 700;
        letter-spacing: 0.06em;
        text-transform: uppercase;
      }

      .eyebrow-chip {
        background: rgba(178, 36, 22, 0.08);
        color: var(--brand-red-strong);
        border: 0.3mm solid rgba(178, 36, 22, 0.1);
      }

      .cover-brand {
        display: grid;
        justify-items: start;
        align-content: center;
        gap: 7mm;
      }

      .sunflour-mark {
        width: 34mm;
        height: 34mm;
        padding: 3.4mm;
        border-radius: 7mm;
        background: rgba(255, 255, 255, 0.94);
        border: 0.45mm solid rgba(178, 36, 22, 0.12);
        box-shadow: 0 4mm 10mm rgba(36, 21, 13, 0.06);
      }

      .cover-title-stack {
        display: grid;
        gap: 3mm;
        max-width: 132mm;
      }

      .website-kicker {
        margin: 0;
        color: var(--brand-red-strong);
        font-size: 12pt;
        font-weight: 800;
        letter-spacing: 0.16em;
        text-transform: uppercase;
      }

      .cover-title {
        margin: 0;
        font-family: "Segoe UI", Inter, Arial, sans-serif;
        font-size: 31pt;
        font-weight: 800;
        line-height: 1.06;
        letter-spacing: 0;
      }

      .cover-domain {
        margin: 0;
        color: var(--brand-red-strong);
        font-size: 16pt;
        font-weight: 700;
        letter-spacing: 0.03em;
      }

      .cover-footer-panel {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 6mm;
        padding-top: 4mm;
        border-top: 0.3mm solid rgba(111, 75, 51, 0.14);
      }

      .cover-footer-label {
        margin: 0;
        color: var(--brand-ink-muted);
        font-size: 7.8pt;
        font-weight: 700;
        letter-spacing: 0.1em;
        text-transform: uppercase;
      }

      .cover-footer-main {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 4mm;
      }

      .cover-credit {
        display: grid;
        gap: 0.8mm;
      }

      .cover-credit strong {
        font-size: 9.4pt;
      }

      .cover-credit span {
        color: var(--brand-ink-muted);
        font-size: 8.4pt;
      }

      .cover-seal {
        padding: 1.8mm 2.8mm;
        border-radius: 999px;
        background: rgba(178, 36, 22, 0.08);
        color: var(--brand-red-strong);
        font-size: 8.2pt;
        font-weight: 700;
        white-space: nowrap;
      }

      .partner-page {
        display: grid;
        align-items: stretch;
        padding: 7mm 0;
      }

      .partner-inner {
        display: grid;
        place-items: center;
        padding: 16mm 10mm;
        border-radius: 8mm;
        background:
          linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(255, 248, 236, 0.98)),
          radial-gradient(circle at top right, rgba(255, 212, 0, 0.18), transparent 48%);
        border: 0.35mm solid rgba(111, 75, 51, 0.12);
      }

      .partner-card {
        width: 100%;
        max-width: 138mm;
        display: grid;
        justify-items: center;
        gap: 5mm;
        text-align: center;
      }

      .partner-logo {
        width: 88mm;
        object-fit: contain;
      }

      .partner-kicker {
        margin: 0;
        color: var(--brand-red-strong);
        font-size: 10.5pt;
        font-weight: 800;
        letter-spacing: 0.14em;
        text-transform: uppercase;
      }

      .partner-title {
        margin: 0;
        font-family: Georgia, "Times New Roman", serif;
        font-size: 23pt;
        line-height: 1.15;
      }

      .partner-copy {
        margin: 0;
        color: var(--brand-ink-muted);
        font-size: 12pt;
        max-width: 118mm;
      }

      .partner-link {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 12mm;
        padding: 0 6mm;
        border-radius: 999px;
        border: 0.35mm solid rgba(178, 36, 22, 0.14);
        background: rgba(178, 36, 22, 0.06);
        color: var(--brand-red-strong);
        font-size: 11pt;
        font-weight: 700;
      }

      .document-content {
        color: var(--brand-ink);
        font-size: 10.5pt;
      }

      .document-content > :first-child {
        margin-top: 0;
      }

      .document-content h1,
      .document-content h2,
      .document-content h3,
      .document-content h4 {
        color: var(--brand-ink);
        break-after: avoid;
      }

      .document-content h1 {
        margin: 0 0 6mm;
        padding-bottom: 3mm;
        border-bottom: 0.45mm solid rgba(178, 36, 22, 0.18);
        font-family: Georgia, "Times New Roman", serif;
        font-size: 24pt;
        line-height: 1.1;
      }

      .document-content h2 {
        margin: 10mm 0 3.5mm;
        font-family: Georgia, "Times New Roman", serif;
        font-size: 18pt;
        line-height: 1.18;
      }

      .document-content h3 {
        margin: 7mm 0 2.6mm;
        color: var(--brand-red-strong);
        font-size: 12.6pt;
        font-weight: 800;
        letter-spacing: 0.01em;
      }

      .document-content h4 {
        margin: 5mm 0 2mm;
        font-size: 11.2pt;
        font-weight: 800;
      }

      .document-content p,
      .document-content ul,
      .document-content ol,
      .document-content table,
      .document-content blockquote {
        margin: 0 0 3.8mm;
      }

      .document-content ul,
      .document-content ol {
        padding-left: 6mm;
      }

      .document-content li + li {
        margin-top: 1.2mm;
      }

      .document-content hr {
        margin: 7mm 0;
        border: none;
        height: 0.4mm;
        background: linear-gradient(
          to right,
          rgba(178, 36, 22, 0.06),
          rgba(178, 36, 22, 0.3),
          rgba(178, 36, 22, 0.06)
        );
      }

      .document-content strong {
        color: var(--brand-ink);
      }

      .document-content em {
        color: var(--brand-ink-muted);
      }

      .document-content blockquote {
        padding: 4mm 4.5mm;
        border-left: 1.2mm solid rgba(178, 36, 22, 0.34);
        border-radius: 0 4mm 4mm 0;
        background: rgba(255, 248, 236, 0.9);
      }

      .document-content table {
        width: 100%;
        border-collapse: collapse;
        break-inside: avoid;
        font-size: 10pt;
      }

      .document-content thead {
        background: rgba(178, 36, 22, 0.08);
      }

      .document-content th,
      .document-content td {
        padding: 3mm 3.2mm;
        vertical-align: top;
        border: 0.3mm solid rgba(111, 75, 51, 0.16);
      }

      .document-content tr:nth-child(even) td {
        background: rgba(255, 248, 236, 0.55);
      }

      .document-content code {
        padding: 0.5mm 1.2mm;
        border-radius: 2mm;
        background: rgba(111, 75, 51, 0.09);
        font-size: 0.95em;
      }

      .document-content input[type="checkbox"] {
        width: 3.6mm;
        height: 3.6mm;
        vertical-align: -0.55mm;
        accent-color: var(--brand-red);
      }
    </style>
  </head>
  <body>
    <div class="print-shell">
      <section class="cover-page" aria-label="Sunflour Bakery cover page">
        <div class="cover-inner">
          <div class="cover-topline">
            <div class="eyebrow-chip">Official Owner Handover Guide</div>
          </div>

          <div class="cover-brand">
            <img
              class="sunflour-mark"
              src="${sunflourLogoSrc}"
              alt="Sunflour Bakery logo"
            />
            <div class="cover-title-stack">
              <p class="website-kicker">Sunflour Bakery Website</p>
              <h1 class="cover-title">Owner's Operating Guide</h1>
              <p class="cover-domain">sunflourbakery.ng</p>
            </div>
          </div>

          <div class="cover-footer-panel">
            <div class="cover-footer-main">
              <div class="cover-credit">
                <span>Prepared and handed over by</span>
                <strong>Bespoke Technologies</strong>
              </div>
            </div>
            <div class="cover-seal">bespoketech.com.ng</div>
          </div>
        </div>
      </section>

      <section class="partner-page" aria-label="Bespoke Technologies page">
        <div class="partner-inner">
          <div class="partner-card">
            <p class="partner-kicker">Technology Partner</p>
            <img
              class="partner-logo"
              src="${bespokeLogoSrc}"
              alt="Bespoke Technologies"
            />
            <h2 class="partner-title">Designed, engineered, and prepared for handover by Bespoke Technologies</h2>
            <p class="partner-copy">
              Product design, systems thinking, software engineering, and
              operational documentation aligned into one production-ready bakery platform.
            </p>
            <div class="partner-link">bespoketech.com.ng</div>
          </div>
        </div>
      </section>

      <article class="document-content">
        ${contentHtml}
      </article>
    </div>
  </body>
</html>`;
}

async function createPreviews(page) {
  await page.locator(".cover-page").screenshot({
    path: COVER_PREVIEW_PATH,
  });
  await page.locator(".partner-page").screenshot({
    path: PARTNER_PREVIEW_PATH,
  });

  const article = page.locator(".document-content");
  await article.scrollIntoViewIfNeeded();
  await page.screenshot({
    path: CONTENT_PREVIEW_PATH,
  });
}

async function main() {
  await fs.mkdir(TMP_DIR, { recursive: true });

  const [markdown, sunflourLogoSrc, bespokeLogoSrc] = await Promise.all([
    fs.readFile(INPUT_MARKDOWN_PATH, "utf8"),
    imageToDataUrl(path.join(ROOT, "public", "logo.png")),
    imageToDataUrl(
      path.join(ROOT, "public", "bespoketechnology-logo-main.png"),
    ),
  ]);

  const contentMarkdown = stripOwnerGuideFrontMatter(markdown);
  const renderer = createMarkedRenderer();
  const contentHtml = marked.parse(contentMarkdown, {
    breaks: false,
    gfm: true,
    renderer,
  });

  const html = buildHtml({
    contentHtml,
    sunflourLogoSrc,
    bespokeLogoSrc,
  });

  await fs.writeFile(HTML_PREVIEW_PATH, html, "utf8");

  const browser = await chromium.launch({ headless: true });

  try {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 2048 },
      deviceScaleFactor: 2,
    });

    await page.goto(pathToFileURL(HTML_PREVIEW_PATH).href, {
      waitUntil: "load",
    });
    await page.emulateMedia({ media: "print" });
    await createPreviews(page);
    await page.pdf({
      path: OUTPUT_PDF_PATH,
      preferCSSPageSize: true,
      printBackground: true,
    });
  } finally {
    await browser.close();
  }

  console.log(`Generated ${OUTPUT_PDF_PATH}`);
  console.log(`Preview HTML: ${HTML_PREVIEW_PATH}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
