"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUploadThing } from "@/lib/uploadthing";
import { validateFile, formatFileSize, ACCEPTED_EXTENSIONS } from "@/lib/file-validation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileText, X, CheckCircle2, Sparkles } from "lucide-react";

export default function UploadPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [useAdvancedAI, setUseAdvancedAI] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { startUpload } = useUploadThing("prescriptionUploader");

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file
    const validation = validateFile(file);
    if (!validation.valid) {
      toast({
        title: "Invalid File",
        description: validation.error,
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setUploadProgress(0);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // Upload file using UploadThing
      const uploadResult = await startUpload([selectedFile]);

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!uploadResult || uploadResult.length === 0) {
        throw new Error("Upload failed");
      }

      const uploadedFile = uploadResult[0];

      // Save file metadata to database with useAdvancedAI flag
      const response = await fetch("/api/prescriptions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileName: selectedFile.name,
          fileUrl: uploadedFile.url,
          fileSize: selectedFile.size,
          fileType: selectedFile.type,
          useAdvancedAI,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save prescription");
      }

      const prescription = await response.json();

      // Trigger OCR processing
      const ocrResponse = await fetch("/api/ocr/process", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prescriptionId: prescription.id,
        }),
      });

      if (!ocrResponse.ok) {
        console.error("OCR processing failed to start");
      }

      toast({
        title: "Upload Successful",
        description: "Your prescription has been uploaded and is being processed.",
      });

      // Redirect to dashboard
      setTimeout(() => {
        router.push("/dashboard");
      }, 1000);
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "An error occurred during upload",
        variant: "destructive",
      });
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="container max-w-2xl mx-auto py-4 sm:py-6 md:py-8 px-4">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">Upload Prescription</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Upload a prescription image or document to extract and read the text
        </p>
      </div>

      <Card className="transition-shadow hover:shadow-lg">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg sm:text-xl">Select File</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Supported formats: {ACCEPTED_EXTENSIONS.join(", ")} (Max 50MB)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6">
          {!selectedFile ? (
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 sm:p-12 text-center hover:border-muted-foreground/50 transition-all duration-200 active:scale-[0.98]">
              <input
                type="file"
                id="file-upload"
                className="hidden"
                accept={ACCEPTED_EXTENSIONS.join(",")}
                onChange={handleFileSelect}
                disabled={isUploading}
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer flex flex-col items-center gap-3 sm:gap-4"
              >
                <div className="rounded-full bg-primary/10 p-3 sm:p-4 transition-transform hover:scale-110">
                  <Upload className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                </div>
                <div>
                  <p className="text-base sm:text-lg font-medium mb-1">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    PNG, JPEG, AVIF, PDF, PPTX, or DOCX
                  </p>
                </div>
              </label>
            </div>
          ) : (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 border rounded-lg transition-shadow hover:shadow-md">
                <div className="rounded-lg bg-primary/10 p-2 sm:p-3">
                  <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate text-sm sm:text-base">{selectedFile.name}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {formatFileSize(selectedFile.size)}
                  </p>
                </div>
                {!isUploading && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleRemoveFile}
                    className="shrink-0 h-8 w-8 sm:h-10 sm:w-10"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {isUploading && (
                <div className="space-y-2 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between text-xs sm:text-sm">
                    <span className="text-muted-foreground">Uploading...</span>
                    <span className="font-medium">{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className="h-2 transition-all" />
                </div>
              )}

              {uploadProgress === 100 && !isUploading && (
                <div className="flex items-center gap-2 text-xs sm:text-sm text-green-600 animate-in fade-in duration-300">
                  <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                  <span>Upload complete! Redirecting...</span>
                </div>
              )}

              {/* Advanced AI Processing Toggle */}
              <div className="flex items-center justify-between p-3 sm:p-4 border rounded-lg bg-muted/50 transition-all hover:bg-muted/70">
                <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
                  <div className="rounded-lg bg-primary/10 p-1.5 sm:p-2 mt-0.5 flex-shrink-0">
                    <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <label
                        htmlFor="advanced-ai"
                        className="font-medium text-xs sm:text-sm cursor-pointer"
                      >
                        Advanced AI Processing
                      </label>
                    </div>
                    <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                      Use AI to enhance OCR accuracy and automatically classify prescription content
                    </p>
                  </div>
                </div>
                <Switch
                  id="advanced-ai"
                  checked={useAdvancedAI}
                  onCheckedChange={setUseAdvancedAI}
                  disabled={isUploading}
                  className="flex-shrink-0"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <Button
                  onClick={handleUpload}
                  disabled={isUploading}
                  className="flex-1 h-11 sm:h-10 text-sm sm:text-base transition-transform active:scale-[0.98]"
                >
                  {isUploading ? "Uploading..." : "Upload Prescription"}
                </Button>
                {!isUploading && (
                  <Button 
                    variant="outline" 
                    onClick={handleRemoveFile}
                    className="h-11 sm:h-10 text-sm sm:text-base transition-transform active:scale-[0.98]"
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
