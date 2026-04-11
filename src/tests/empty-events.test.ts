import assert from "node:assert";
import { readFileSync } from "node:fs";
import { describe, test } from "node:test";

import { icsFilter } from "../index.js";

import { getEventCount } from "./lib/get-event-count.js";

const now: Date = new Date();

const content: string = readFileSync("./ics/empty.ics", "utf-8");
const expectedVEventCount: number = 0;
const filteredContent: string = icsFilter(content, now);
const filteredVEventActualCount: number = getEventCount(filteredContent);

describe("icsFilter on empty ics content", () => {
  test("should always return ics content with a 'BEGIN:VCALENDAR' and a 'END:VCALENDAR'", () => {
    assert.ok(filteredContent.includes("BEGIN:VCALENDAR"), "Filtered content is missing 'BEGIN:VCALENDAR'");
    assert.ok(filteredContent.includes("END:VCALENDAR"), "Filtered content is missing 'END:VCALENDAR'");
  });

  test(`should contain ${expectedVEventCount} 'VEVENT' sections`, () => {
    assert.ok(
      expectedVEventCount === filteredVEventActualCount,
      `Filtered content should have ${expectedVEventCount} 'VEVENT' sections but found ${filteredVEventActualCount} 'VEVENT' sections`
    );
  });
});
