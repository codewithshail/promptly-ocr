import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { NotesClient } from "./notes-client";

export default async function NotesPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return <NotesClient userId={userId} />;
}
