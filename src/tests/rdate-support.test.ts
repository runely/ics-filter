import assert from "node:assert";
import { readFileSync } from "node:fs";
import { describe, test } from "node:test";

import { icsFilter } from "../index.js";

const content: string = readFileSync("./ics/with-rdate.ics", "utf-8");
const now: Date = new Date();
const max: Date = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000); // 1 year from now
const filteredContent: string = icsFilter(content, now);
const filteredMaxContent: string = icsFilter(content, now, max);

describe("icsFilter on ics content with RDATE properties", () => {
  test("should keep event with RDATE dates in the future", () => {
    assert.ok(filteredContent.includes("rdate-future@test"), "Event with future RDATE dates should be kept");
  });

  test("should drop event with only past RDATE dates", () => {
    assert.ok(!filteredContent.includes("rdate-past@test"), "Event with only past RDATE dates should be dropped");
  });

  test("should keep event with RDATE;VALUE=DATE format dates in the future", () => {
    assert.ok(filteredContent.includes("rdate-value-date@test"), "Event with future RDATE;VALUE=DATE dates should be kept");
  });

  test("should keep event with RDATE;VALUE=PERIOD format dates in the future", () => {
    assert.ok(filteredContent.includes("rdate-period@test"), "Event with future RDATE;VALUE=PERIOD dates should be kept");
  });
});

describe("icsFilter on ics content with RDATE properties and max limit", () => {
  test("should drop events whose RDATE dates are all beyond max", () => {
    assert.ok(!filteredMaxContent.includes("rdate-future@test"), "Event with RDATE dates beyond max should be dropped");
    assert.ok(!filteredMaxContent.includes("rdate-value-date@test"), "Event with RDATE;VALUE=DATE dates beyond max should be dropped");
    assert.ok(!filteredMaxContent.includes("rdate-period@test"), "Event with RDATE;VALUE=PERIOD dates beyond max should be dropped");
  });

  test("should keep RDATE;VALUE=PERIOD when the start date is within max", () => {
    const now = new Date("2025-01-01T00:00:00.000Z");
    const max = new Date("2030-06-01T10:00:00.000Z");
    const periodContent =
      "BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nUID:period-within-max@test\nDTSTART:20200601T100000Z\nDTEND:20200601T120000Z\nRDATE;VALUE=PERIOD:20300601T100000Z/20300601T120000Z\nEND:VEVENT\nEND:VCALENDAR";

    const filtered = icsFilter(periodContent, now, max);

    assert.ok(filtered.includes("period-within-max@test"), "Event with PERIOD RDATE starting at max should be kept");
  });
});
