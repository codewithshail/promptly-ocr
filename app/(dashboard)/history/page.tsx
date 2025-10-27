import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { HistoryClient } from "./history-client";

export const metadata = {
  title: "Answer History | UPSC Aspirant Platform",
  description: "View your answer evaluation history and track your progress",
};

export default async function HistoryPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return <HistoryClient />;
}
