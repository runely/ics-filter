export const getEventCount = (content: string): number => {
  const unfolded: string = content.replace(/\r?\n[ \t]/g, "");
  const lines: string[] = unfolded.split(/\r?\n/);
  let eventCount: number = 0;

  for (const line of lines) {
    if (line.includes("BEGIN:VEVENT")) {
      eventCount++;
    }
  }

  return eventCount;
};
