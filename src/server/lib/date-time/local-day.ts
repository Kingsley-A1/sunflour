interface LocalDateParts {
  year: number;
  month: number;
  day: number;
}

function getDateParts(date: Date, timeZone: string): LocalDateParts {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const getPart = (type: Intl.DateTimeFormatPartTypes): number => {
    const value = parts.find((part) => part.type === type)?.value;
    return Number(value);
  };

  return {
    year: getPart("year"),
    month: getPart("month"),
    day: getPart("day"),
  };
}

function getTimeZoneOffsetMs(date: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const values = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, Number(part.value)]),
  );
  const getValue = (key: string): number => {
    const value = values[key];

    if (typeof value !== "number") {
      throw new RangeError(`Missing ${key} part for ${timeZone}.`);
    }

    return value;
  };
  const asUtc = Date.UTC(
    getValue("year"),
    getValue("month") - 1,
    getValue("day"),
    getValue("hour"),
    getValue("minute"),
    getValue("second"),
  );

  return asUtc - date.getTime();
}

function zonedDateTimeToUtc(
  parts: LocalDateParts,
  timeZone: string,
): Date {
  const guess = new Date(Date.UTC(parts.year, parts.month - 1, parts.day));
  const firstOffset = getTimeZoneOffsetMs(guess, timeZone);
  const corrected = new Date(guess.getTime() - firstOffset);
  const secondOffset = getTimeZoneOffsetMs(corrected, timeZone);

  return new Date(guess.getTime() - secondOffset);
}

function addLocalDays(parts: LocalDateParts, days: number): LocalDateParts {
  const date = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + days));

  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
  };
}

export function getLocalDayUtcRange(
  date: Date,
  timeZone: string,
): { start: Date; end: Date } {
  const localDate = getDateParts(date, timeZone);

  return {
    start: zonedDateTimeToUtc(localDate, timeZone),
    end: zonedDateTimeToUtc(addLocalDays(localDate, 1), timeZone),
  };
}
