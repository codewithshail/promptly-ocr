import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import { processCopy } from "@/inngest/functions/process-copy";
import { fetchNews, fetchNewsManual } from "@/inngest/functions/fetch-news";
import { cacheTips } from "@/inngest/functions/cache-tips";
import { archiveOldChats } from "@/inngest/functions/archive-old-chats";
import { evaluateMockTest } from "@/inngest/functions/evaluate-mock-test";
import { checkDueRevisions } from "@/inngest/functions/check-due-revisions";
import { generateDailyQuiz } from "@/inngest/functions/generate-daily-quiz";
import { updateLeaderboard } from "@/inngest/functions/update-leaderboard";

// Create an array of all functions to serve
const functions = [
  processCopy,
  fetchNews,
  fetchNewsManual,
  cacheTips,
  archiveOldChats,
  evaluateMockTest,
  checkDueRevisions,
  generateDailyQuiz,
  updateLeaderboard,
];

// Serve the Inngest API route
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions,
});
