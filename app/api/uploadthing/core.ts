import { createUploadthing, type FileRouter } from "uploadthing/next";
import { auth } from "@clerk/nextjs/server";

const f = createUploadthing();

// FileRouter for the app, can contain multiple FileRoutes
export const ourFileRouter = {
  // Define the prescription uploader route
  prescriptionUploader: f({
    // Supported file types with max 32MB size (UploadThing limit)
    image: { maxFileSize: "32MB", maxFileCount: 1 },
    pdf: { maxFileSize: "32MB", maxFileCount: 1 },
    blob: { maxFileSize: "32MB", maxFileCount: 1 },
  })
    // Set permissions and file types
    .middleware(async () => {
      // Authenticate user with Clerk
      const { userId } = await auth();

      // If user is not authenticated, throw error
      if (!userId) throw new Error("Unauthorized");

      // Return userId to be available in onUploadComplete
      return { userId };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // This code runs on the server after upload completes
      console.log("Upload complete for userId:", metadata.userId);
      console.log("File URL:", file.url);

      // Return data to the client
      return { uploadedBy: metadata.userId, fileUrl: file.url };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
