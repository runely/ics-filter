const isDevRun: boolean = process.env["NODE_ENV"] === "development";

export const icsFilter = (content: string, now: Date, max?: Date): string => {
  if (isDevRun) {
    console.log("now:", now);
    console.log("max:", max);
  }

  const nowStr: string = toICSDateString(now);
  const maxStr: string | undefined = max ? toICSDateString(max) : undefined;
  const unfoldedContent: string = content.replace(/\r?\n[ \t]/g, "");

  let result: string = "";
  let lineStart: number = 0;

  let inEvent: boolean = false;
  let eventStartIndex: number = 0;

  let keep: boolean = true;
  let hasRrule: boolean = false;
  let hasRdate: boolean = false;
  let rdateKeep: boolean = false;
  let hasKeptRecurrenceId: boolean = false;
  let rruleKeep: boolean = true;

  // folded line buffer
  let currentLine: string = "";

  for (let i: number = 0; i <= unfoldedContent.length; i++) {
    if (!(i === unfoldedContent.length || unfoldedContent[i] === "\n")) {
      continue;
    }

    const rawLine: string = unfoldedContent.slice(lineStart, i);
    lineStart = i + 1;
    if (rawLine.startsWith(" ") || rawLine.startsWith("\t")) {
      // continuation
      currentLine += rawLine.slice(1);
      continue;
    }

    currentLine = rawLine;
    processLine(currentLine);
  }

  return result;

  function processLine(line: string): void {
    line = line.trim();
    const lineUpper: string = line.toUpperCase();

    // --- BEGIN EVENT ---
    if (lineUpper === "BEGIN:VEVENT") {
      inEvent = true;
      eventStartIndex = findLineStartIndex(line);
      if (isDevRun) {
        console.log("BEGIN:VEVENT @", eventStartIndex);
      }

      keep = true;
      hasRrule = false;
      hasRdate = false;
      rdateKeep = false;
      hasKeptRecurrenceId = false;
      rruleKeep = true;
      return;
    }

    // --- END EVENT ---
    if (lineUpper === "END:VEVENT") {
      const eventEndIndex: number = findLineEndIndex(line);
      if (isDevRun) {
        if (inEvent && keep && rruleKeep) {
          console.log("\u001b[32mEND:VEVENT @", eventEndIndex, `inEvent: ${inEvent}. keep: ${keep}. rruleKeep: ${rruleKeep}\u001b[0m\n`);
        } else {
          console.log("\u001b[31mEND:VEVENT @", eventEndIndex, `inEvent: ${inEvent}. keep: ${keep}. rruleKeep: ${rruleKeep}\u001b[0m\n`);
        }
      }

      if (inEvent && keep && rruleKeep) {
        const eventBlock: string = unfoldedContent.slice(eventStartIndex, eventEndIndex);
        result += `${eventBlock}\n`;
      }

      inEvent = false;
      return;
    }

    if (!inEvent) {
      result += `${line}\n`;
      return;
    }

    if (!keep && !rruleKeep) {
      return;
    }

    // --- PARSING ---
    if (lineUpper.startsWith("SUMMARY")) {
      const value: string | null = extractValue(line);
      if (isDevRun) {
        console.log("SUMMARY:", value);
      }

      return;
    }

    if (lineUpper.startsWith("DTSTART")) {
      const value: string | null = extractValue(line);
      const dtStart: string | null = normalizeICSDateStr(value);
      if (isDevRun) {
        console.log("DTSTART:", dtStart, "-->", line);
      }

      if (!dtStart) {
        keep = false;
        if (isDevRun) {
          console.error(`\u001b[31mMissing DTSTART: ${dtStart} --> ${line}\u001b[0m`);
        }
        return;
      }

      if (maxStr && dtStart > maxStr) {
        if (isDevRun) {
          console.log("DTSTART greater than max:", dtStart, maxStr, "-->", line);
        }
        keep = false;
      }

      return;
    }

    if (lineUpper.startsWith("DTEND")) {
      const value: string | null = extractValue(line);
      const dtEnd: string | null = normalizeICSDateStr(value);
      if (isDevRun) {
        console.log("DTEND:", dtEnd, "-->", line);
      }

      if (dtEnd && dtEnd < nowStr) {
        if (hasRrule && rruleKeep) {
          if (isDevRun) {
            console.log("DTEND lower than now, but rrule keeps it:", dtEnd, nowStr, "-->", line);
          }

          return;
        }

        if (hasRdate && rdateKeep) {
          if (isDevRun) {
            console.log("DTEND lower than now, but rdate keeps it:", dtEnd, nowStr, "-->", line);
          }

          return;
        }

        if (hasKeptRecurrenceId) {
          if (isDevRun) {
            console.log("DTEND lower than now, but recurrenceId keeps it:", dtEnd, nowStr, "-->", line);
          }

          return;
        }

        if (isDevRun) {
          console.log("DTEND lower than now, and no rrule or recurrenceId yet:", dtEnd, nowStr, "-->", line);
        }
        keep = false;
      }

      return;
    }

    if (lineUpper.startsWith("RRULE")) {
      const idx: number = line.indexOf("UNTIL=");

      keep = true;
      hasRrule = true;
      rruleKeep = true;

      if (idx === -1) {
        if (isDevRun) {
          console.log("RRULE found without UNTIL", "-->", line);
        }

        return;
      }

      const untilRaw: string | undefined = line.slice(idx + 6).split(";")[0];
      const rruleUntil: string | null = normalizeICSDateStr(untilRaw);
      if (isDevRun) {
        console.log("RRULE UNTIL:", rruleUntil, "-->", line);
      }

      if (rruleUntil && rruleUntil < nowStr) {
        keep = false;
        rruleKeep = false;
      }

      return;
    }

    if (lineUpper.startsWith("RDATE")) {
      const value: string | null = extractValue(line);
      if (!value) {
        return;
      }

      hasRdate = true;

      for (const dateRaw of value.split(",")) {
        const date: string | null = normalizeICSDateStr(dateRaw.trim());
        if (!date) {
          continue;
        }

        if (date >= nowStr && (!maxStr || date <= maxStr)) {
          rdateKeep = true;
          keep = true;

          if (isDevRun) {
            console.log("RDATE date in range:", date, "-->", line);
          }

          break;
        }
      }

      if (isDevRun && !rdateKeep) {
        console.log("RDATE: no dates in range", "-->", line);
      }

      return;
    }

    if (lineUpper.startsWith("RECURRENCE-ID")) {
      const value: string | null = extractValue(line);
      const dtRecurrence: string | null = normalizeICSDateStr(value);
      if (isDevRun) {
        console.log("RECURRENCE-ID:", dtRecurrence, "-->", line);
      }

      if (!dtRecurrence) {
        keep = false;
        if (isDevRun) {
          console.error(`\u001b[31mMissing RECURRENCE-ID: ${dtRecurrence} --> ${line}\u001b[0m`);
        }
        return;
      }

      if (maxStr && dtRecurrence > maxStr) {
        if (isDevRun) {
          console.log("RECURRENCE-ID greater than max:", dtRecurrence, maxStr, "-->", line);
        }
        keep = false;
        hasKeptRecurrenceId = false;

        return;
      }

      keep = true;
      hasKeptRecurrenceId = true;
      rruleKeep = true;
      return;
    }

    if (lineUpper.startsWith("STATUS:CANCELLED")) {
      keep = false;
    }
  }

  function findLineStartIndex(line: string): number {
    return unfoldedContent.indexOf(line, lineStart - line.length - 2);
  }

  function findLineEndIndex(line: string): number {
    return unfoldedContent.indexOf(line, lineStart - line.length - 2) + line.length;
  }
};

const extractValue = (line: string): string | null => {
  const idx: number = line.indexOf(":");
  return idx !== -1 ? line.slice(idx + 1) : null;
};

const normalizeICSDateStr = (value: string | null | undefined): string | null => {
  if (!value) {
    return null;
  }

  // For VALUE=PERIOD, compare against the period start date only.
  // The end value is not relevant for the now/max window checks here.
  const normalizedValue: string = value.split("/")[0] ?? value;

  if (normalizedValue.length === 8) {
    return `${normalizedValue}T000000Z`;
  }

  return normalizedValue;
};

const toICSDateString = (date: Date): string => {
  return date
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
};
