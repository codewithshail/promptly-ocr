"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function UploadPage() {
  return (
    <div className="container max-w-2xl mx-auto py-4 sm:py-6 md:py-8 px-4">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">Upload Copy</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Upload your GS or Essay copy for evaluation
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Copy Checking</CardTitle>
          <CardDescription>
            This feature will be implemented in upcoming tasks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            The unified copy checking system for GS and Essay evaluation will be available soon.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
