"use client";

import { useState, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  History,
} from "lucide-react";
import { useDropzone } from "react-dropzone";
import { useToast } from "@/hooks/use-toast";
import { CopyCheckingErrorBoundary } from "@/components/error-boundary";
import { useRouter } from "next/navigation";

type CopyType = "gs" | "essay";

interface UploadedFile {
  file: File;
  preview: string;
}

export default function CopyCheckingPage() {
  const [selectedType, setSelectedType] = useState<CopyType>("gs");
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];

        // Validate file type
        const validTypes = [
          "application/pdf",
          "image/jpeg",
          "image/jpg",
          "image/png",
        ];
        if (!validTypes.includes(file.type)) {
          toast({
            title: "Invalid file type",
            description: "Please upload a PDF or image file (JPG, PNG)",
            variant: "destructive",
          });
          return;
        }

        // Validate file size (max 10MB)
        const maxSize = 10 * 1024 * 1024;
        if (file.size > maxSize) {
          toast({
            title: "File too large",
            description: "Please upload a file smaller than 10MB",
            variant: "destructive",
          });
          return;
        }

        setUploadedFile({
          file,
          preview: URL.createObjectURL(file),
        });
      }
    },
    [toast]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
    },
    maxFiles: 1,
    multiple: false,
  });

  const handleUpload = async () => {
    if (!uploadedFile) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", uploadedFile.file);
      formData.append("copyType", selectedType);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      await response.json();

      toast({
        title: "Upload successful",
        description:
          "Your copy is being processed. You'll be notified when evaluation is complete.",
      });

      // Reset form
      setUploadedFile(null);
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description:
          error instanceof Error
            ? error.message
            : "There was an error uploading your file. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveFile = () => {
    if (uploadedFile?.preview) {
      URL.revokeObjectURL(uploadedFile.preview);
    }
    setUploadedFile(null);
  };

  return (
    <CopyCheckingErrorBoundary>
      <div className="container max-w-4xl mx-auto py-4 sm:py-6 md:py-8 px-4">
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl sm:text-3xl font-bold">Copy Checking</h1>
            <Button
              variant="outline"
              onClick={() => router.push("/history")}
              className="gap-2"
            >
              <History className="h-4 w-4" />
              View History
            </Button>
          </div>
          <p className="text-sm sm:text-base text-muted-foreground">
            Upload your answer copy for AI-powered evaluation and feedback
          </p>
        </div>

        {/* Upload Form */}
        <div className="space-y-6">
          {/* Copy Type Selector */}
          <Card>
            <CardHeader>
              <CardTitle>Select Copy Type</CardTitle>
              <CardDescription>
                Choose whether you&apos;re uploading a General Studies or Essay
                answer
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={() => setSelectedType("gs")}
                  className={`p-6 rounded-lg border-2 transition-all ${
                    selectedType === "gs"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`mt-1 ${
                        selectedType === "gs"
                          ? "text-primary"
                          : "text-muted-foreground"
                      }`}
                    >
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold mb-1">
                        General Studies (GS)
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        For GS papers covering current affairs, mathematics, and
                        factual content
                      </p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setSelectedType("essay")}
                  className={`p-6 rounded-lg border-2 transition-all ${
                    selectedType === "essay"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`mt-1 ${
                        selectedType === "essay"
                          ? "text-primary"
                          : "text-muted-foreground"
                      }`}
                    >
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold mb-1">Essay</h3>
                      <p className="text-sm text-muted-foreground">
                        For essay papers focusing on structure, argumentation,
                        and expression
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            </CardContent>
          </Card>

          {/* File Upload Interface */}
          <Card>
            <CardHeader>
              <CardTitle>Upload Your Copy</CardTitle>
              <CardDescription>
                Upload a PDF or image file (JPG, PNG) of your answer copy.
                Maximum file size: 10MB
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!uploadedFile ? (
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-8 sm:p-12 text-center cursor-pointer transition-colors ${
                    isDragActive
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <input {...getInputProps()} />
                  <div className="flex flex-col items-center gap-4">
                    <div className="p-4 rounded-full bg-primary/10">
                      <Upload className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                      <p className="text-lg font-semibold mb-1">
                        {isDragActive
                          ? "Drop your file here"
                          : "Drag & drop your file here"}
                      </p>
                      <p className="text-sm text-muted-foreground mb-4">
                        or click to browse from your device
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Supported formats: PDF, JPG, PNG (max 10MB)
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 rounded-lg border bg-muted/50">
                    <div className="p-2 rounded bg-primary/10">
                      <FileText className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {uploadedFile.file.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {(uploadedFile.file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleRemoveFile}
                      disabled={isUploading}
                    >
                      Remove
                    </Button>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      onClick={handleUpload}
                      disabled={isUploading}
                      className="flex-1"
                    >
                      {isUploading ? "Uploading..." : "Upload & Evaluate"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleRemoveFile}
                      disabled={isUploading}
                    >
                      Choose Different File
                    </Button>
                  </div>
                </div>
              )}

              {/* Information Box */}
              <div className="mt-6 p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900">
                <div className="flex gap-3">
                  <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                      Evaluation Process
                    </p>
                    <p className="text-blue-800 dark:text-blue-200">
                      Your copy will be processed using AI to extract text and
                      evaluate based on{" "}
                      {selectedType === "gs" ? "GS criteria" : "essay criteria"}
                      . This typically takes 2-3 minutes. You&apos;ll receive a
                      notification when the evaluation is complete.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </CopyCheckingErrorBoundary>
  );
}
