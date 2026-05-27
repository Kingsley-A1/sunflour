export type DeliveryMethod = "DELIVERY" | "PICKUP";

export interface DeliverySurchargeInput {
  deliveryMethod: DeliveryMethod;
  orderedAt: Date;
  timeZone?: string;
  startsAtTime?: string;
  endsAtTime?: string | null;
  isActive?: boolean;
}

interface LocalTimeParts {
  hour: number;
  minute: number;
  second: number;
}

const DEFAULT_TIME_ZONE = "Africa/Lagos";
const DEFAULT_SURCHARGE_START = "18:00";

export function getLocalTimeParts(
  date: Date,
  timeZone = DEFAULT_TIME_ZONE,
): LocalTimeParts {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const getPart = (type: Intl.DateTimeFormatPartTypes): number => {
    const value = parts.find((part) => part.type === type)?.value;
    return Number(value ?? 0);
  };

  return {
    hour: getPart("hour"),
    minute: getPart("minute"),
    second: getPart("second"),
  };
}

export function parseClockTime(time: string): number {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(time);

  if (!match) {
    throw new RangeError("Clock time must use HH:mm 24-hour format.");
  }

  const [, hour, minute] = match;
  return Number(hour) * 60 + Number(minute);
}

export function minutesSinceMidnight(parts: LocalTimeParts): number {
  return parts.hour * 60 + parts.minute;
}

export function isClockTimeInRange(
  timeMinutes: number,
  startsAtTime: string,
  endsAtTime?: string | null,
): boolean {
  const startMinutes = parseClockTime(startsAtTime);

  if (!endsAtTime) {
    return timeMinutes >= startMinutes;
  }

  const endMinutes = parseClockTime(endsAtTime);

  if (startMinutes === endMinutes) {
    return true;
  }

  if (startMinutes < endMinutes) {
    return timeMinutes >= startMinutes && timeMinutes < endMinutes;
  }

  return timeMinutes >= startMinutes || timeMinutes < endMinutes;
}

export function shouldApplyDeliverySurcharge({
  deliveryMethod,
  orderedAt,
  timeZone = DEFAULT_TIME_ZONE,
  startsAtTime = DEFAULT_SURCHARGE_START,
  endsAtTime,
  isActive = true,
}: DeliverySurchargeInput): boolean {
  if (!isActive || deliveryMethod === "PICKUP") {
    return false;
  }

  const localTime = getLocalTimeParts(orderedAt, timeZone);
  return isClockTimeInRange(
    minutesSinceMidnight(localTime),
    startsAtTime,
    endsAtTime,
  );
}
