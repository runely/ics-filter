import { readFileSync, writeFileSync } from "node:fs";

import { icsFilter } from "./dist/index.js";

import { getEventCount } from "./dist/tests/lib/get-event-count.js";

const now = new Date();
const max = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000); // 2 weeks from now

const icsName = "add-an-ics-file-to-test-the-output-with-this-script";

const rawPastAndFutureEventsContent = readFileSync(`./ics/filtered/${icsName}.ics`, "utf-8");
const filteredPastAndFutureEventsContent = icsFilter(rawPastAndFutureEventsContent, now, max);

console.log(filteredPastAndFutureEventsContent);
console.log("rawPastAndFutureEventsContent length:", rawPastAndFutureEventsContent.length);
console.log("rawPastAndFutureEventsCount:", getEventCount(rawPastAndFutureEventsContent));
console.log("filteredPastAndFutureEventsContent length:", filteredPastAndFutureEventsContent.length);
console.log("filteredPastAndFutureEventsCount:", getEventCount(filteredPastAndFutureEventsContent));

writeFileSync(`./ics/filtered/${icsName}_filtered_2weeks.ics`, filteredPastAndFutureEventsContent, "utf-8");
