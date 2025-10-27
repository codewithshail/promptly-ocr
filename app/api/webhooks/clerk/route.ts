import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import { upsertUser, getOrCreateUserPreferences } from "@/db/queries";
import { inngest } from "@/lib/inngest/client";

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    throw new Error("Please add CLERK_WEBHOOK_SECRET to .env");
  }

  // Get the headers
  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Error: Missing svix headers", { status: 400 });
  }

  const payload = await req.json();
  const body = JSON.stringify(payload);

  const wh = new Webhook(WEBHOOK_SECRET);
  let evt: WebhookEvent;

  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Error verifying webhook:", err);
    return new Response("Error: Verification failed", { status: 400 });
  }

  const eventType = evt.type;

  if (eventType === "user.created" || eventType === "user.updated") {
    const { id, email_addresses, first_name, last_name, image_url, public_metadata } = evt.data;

    try {
      // Check if user has admin role in Clerk metadata
      const isAdmin = (public_metadata as { role?: string })?.role === "admin";

      await upsertUser({
        id,
        email: email_addresses[0]?.email_address || "",
        firstName: first_name || null,
        lastName: last_name || null,
        imageUrl: image_url || null,
        isAdmin,
      });

      // Create default preferences on first login (user.created event)
      if (eventType === "user.created") {
        await getOrCreateUserPreferences(id);

        // Trigger Inngest event for user signup
        await inngest.send({
          name: "user/signup.completed",
          data: {
            userId: id,
            email: email_addresses[0]?.email_address || "",
            name: `${first_name || ""} ${last_name || ""}`.trim() || "User",
          },
        });
      }

      return new Response("User synced successfully", { status: 200 });
    } catch (error) {
      console.error("Error syncing user:", error);
      return new Response("Error syncing user", { status: 500 });
    }
  }

  return new Response("Webhook received", { status: 200 });
}
