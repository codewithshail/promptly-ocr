# Inngest Background Jobs

This directory contains Inngest configuration and background job functions for the UPSC Aspirant Platform.

## Setup

### Development

For local development, you can use the Inngest Dev Server:

```bash
npx inngest-cli@latest dev
```

This will start a local Inngest server at `http://localhost:8288` where you can:
- View and test your functions
- Trigger events manually
- Monitor job execution
- Debug failures

The Inngest Dev Server automatically discovers your functions from the `/api/inngest` route.

### Production

For production, you'll need to:

1. Sign up at [inngest.com](https://www.inngest.com/)
2. Get your `INNGEST_EVENT_KEY` and `INNGEST_SIGNING_KEY`
3. Add them to your environment variables
4. Deploy your application - Inngest will automatically sync your functions

## Directory Structure

```
inngest/
├── functions/          # Background job functions
│   ├── process-copy.ts       # Copy evaluation processing
│   ├── fetch-news.ts         # Scheduled news fetching
│   ├── cache-tips.ts         # Tips caching
│   ├── generate-daily-quiz.ts # Daily quiz generation
│   └── evaluate-mock-test.ts  # Mock test evaluation
└── README.md
```

## Creating Functions

Functions are created in the `inngest/functions/` directory and imported into `app/api/inngest/route.ts`.

Example function:

```typescript
import { inngest } from "@/lib/inngest/client";

export const myFunction = inngest.createFunction(
  { id: "my-function", retries: 3 },
  { event: "my/event" },
  async ({ event, step }) => {
    // Your function logic here
    return { success: true };
  }
);
```

## Triggering Events

To trigger an Inngest event from your code:

```typescript
import { inngest } from "@/lib/inngest/client";

await inngest.send({
  name: "my/event",
  data: {
    // Your event data
  },
});
```

## Scheduled Functions

For cron-based scheduled functions:

```typescript
export const scheduledFunction = inngest.createFunction(
  { id: "scheduled-function" },
  { cron: "0 */8 * * *" }, // Every 8 hours
  async ({ step }) => {
    // Your scheduled logic here
  }
);
```

## Resources

- [Inngest Documentation](https://www.inngest.com/docs)
- [Next.js Integration Guide](https://www.inngest.com/docs/sdk/serve#framework-next-js)
- [Event Patterns](https://www.inngest.com/docs/guides/events)
