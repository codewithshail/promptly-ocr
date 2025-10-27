import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { BookmarksClient } from "./bookmarks-client";

export const metadata = {
  title: "Bookmarks | UPSC Aspirant Platform",
  description: "Your saved news articles and tips",
};

export default async function BookmarksPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return <BookmarksClient userId={userId} />;
}
