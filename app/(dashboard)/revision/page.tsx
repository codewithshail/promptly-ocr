import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { RevisionSchedulerClient } from "./revision-client";

export const metadata = {
  title: "Revision Scheduler | UPSC Aspirant Platform",
  description: "Manage your revision schedule with spaced repetition",
};

export default async function RevisionPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return <RevisionSchedulerClient />;
}
