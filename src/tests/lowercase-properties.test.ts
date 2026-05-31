import assert from "node:assert";
import { readFileSync } from "node:fs";
import { describe, test } from "node:test";

import { icsFilter } from "../index.js";

const content: string = readFileSync("./ics/with-lowercase-properties.ics", "utf-8");
const now: Date = new Date();
const filteredContent: string = icsFilter(content, now);

describe("icsFilter on ics content with lowercase property names", () => {
  test("should handle lowercase DTSTART, DTEND and RRULE", () => {
    assert.ok(filteredContent.includes("lowercase-future@test"), "Future event with lowercase properties should be kept");
    assert.ok(!filteredContent.includes("lowercase-past@test"), "Past event with lowercase properties should be filtered out");
    assert.ok(filteredContent.includes("uppercase-past@test"), "Past recurring event with lowercase rrule should be kept");
  });
});
