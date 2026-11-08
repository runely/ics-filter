import assert from "node:assert";
import { readFileSync } from "node:fs";
import { describe, test } from "node:test";

import { icsFilter } from "../index.js";

const content: string = readFileSync("./ics/exchange-events.ics", "utf-8");
const now: Date = new Date();
const filteredContent: string = icsFilter(content, now);

const expectedVEventCount: number = 2;

// NOTE: Handles TZID="tzone://Microsoft/Utc"
describe("icsFilter on ics content with Exchange specific TZID events with colon in the TZID parameter", () => {
  test(`should find ${expectedVEventCount} events`, () => {
    const matches: RegExpMatchArray | null = filteredContent.match(/SUMMARY:.*/gm);
    assert.notEqual(matches, null, "RegExpMatchArray returned null");
    assert.strictEqual(
      matches?.length,
      expectedVEventCount,
      `RegExpMatchArray found ${matches?.length} matches, expected to find ${expectedVEventCount} matches. Matches: ${JSON.stringify(matches)}`
    );

    assert.strictEqual(matches.at(0), "SUMMARY:Quoted TZID with colon");
    assert.strictEqual(matches.at(1), "SUMMARY:Plain TZID");
  });
});
