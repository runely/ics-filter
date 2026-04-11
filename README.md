# ics-filter

A simple module that filters out events that are past, and too far in the future (if desired)

## Usage

Install the module from npm:
```bash
npm install ics-filter
```

Then use it in your code:
```typescript
import { icsFilter } from "ics-filter";

const icsContent: string = getIcsContentSomehow(); // your own logic here to get the ics data somehow

// now will be the minimum date for the events to be included in the output, so past events will be filtered out
const now: Date = new Date();

// without setting a max data, the filter will only filter out past events
const filteredIcsContent: string = icsFilter(icsContent, now);

// with setting a max date, the filter will also filter out events that are too far in the future
const maxDate: Date = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000); // 2 weeks from now
const filteredIcsContentWithMaxDate: string = icsFilter(icsContent, now, maxDate);
```

## Testing the filter with the test script

To test the filter:
1. Clone the repository and navigate to the project folder
2. Install the dependencies
    ```bash
    npm install
    ```
3. Add the ics file you want to test with to the `ics/filtered` folder
4. Open the `test.raw.js` file and change the `icsName` variable to the name of your ics file (without the .ics extension)
5. Run the test script with the following command to make sure the module has been correctly built:
    ```bash
    npm run test-run
    ```
6. The output will be printed to the console so you can check which events have been filtered out and which have been kept. You can also check the `ics/filtered` folder to see the filtered ics file that has been generated.