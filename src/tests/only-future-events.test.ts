import assert from "node:assert";
import { readFileSync } from "node:fs";
import { describe, test } from "node:test";

import { icsFilter } from "../index.js";

import { getEventCount } from "./lib/get-event-count.js";

const now: Date = new Date();
const max: Date = new Date(now.getTime() + 3 * 30 * 24 * 60 * 60 * 1000); // 3 months from now

const content: string = readFileSync("./ics/with-only-future-events.ics", "utf-8");
const expectedVEventCount: number = 2;
const expectedVEventMaxCount: number = 1;
const filteredContent: string = icsFilter(content, now);
const filteredMaxContent: string = icsFilter(content, now, max);
const filteredVEventActualCount: number = getEventCount(filteredContent);
const filteredVEventActualMaxCount: number = getEventCount(filteredMaxContent);

describe("icsFilter on ics content with only future events and no max limit", () => {
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

describe("icsFilter on ics content with only future events with max limit", () => {
  test("should always return ics content with a 'BEGIN:VCALENDAR' and a 'END:VCALENDAR'", () => {
    assert.ok(filteredMaxContent.includes("BEGIN:VCALENDAR"), "Filtered content is missing 'BEGIN:VCALENDAR'");
    assert.ok(filteredMaxContent.includes("END:VCALENDAR"), "Filtered content is missing 'END:VCALENDAR'");
  });

  test(`should contain ${expectedVEventMaxCount} 'VEVENT' sections`, () => {
    assert.ok(
      expectedVEventMaxCount === filteredVEventActualMaxCount,
      `Filtered content should have ${expectedVEventMaxCount} 'VEVENT' sections but found ${filteredVEventActualMaxCount} 'VEVENT' sections`
    );
  });
});
