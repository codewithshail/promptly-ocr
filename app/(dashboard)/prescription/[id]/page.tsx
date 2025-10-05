import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getPrescriptionById } from "@/db/queries";
import ReactMarkdown from "react-markdown";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, Calendar, Loader2, AlertCircle, Sparkles } from "lucide-react";
import { AudioPlayer } from "@/components/audio-player";

interface PrescriptionDetailPageProps {
  params: Promise<{ id: string }>;
}

// Processing Status Component
function ProcessingStatus({ status }: { status: string }) {
  const statusConfig = {
    uploading: { label: "Uploading", color: "bg-blue-500", icon: Loader2 },
    processing: { label: "Processing OCR", color: "bg-yellow-500", icon: Loader2 },
    ai_enhancing: { label: "AI Enhancing", color: "bg-purple-500", icon: Loader2 },
    classifying: { label: "Classifying Content", color: "bg-indigo-500", icon: Loader2 },
    completed: { label: "Completed", color: "bg-green-500", icon: null },
    failed: { label: "Failed", color: "bg-red-500", icon: AlertCircle },
  };

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.processing;
  const Icon = config.icon;

  return (
    <div className="flex items-center gap-2">
      <Badge className={`${config.color} text-white`}>
        {Icon && <Icon className="w-3 h-3 mr-1 animate-spin" />}
        {config.label}
      </Badge>
    </div>
  );
}

// Relevant Section Component
function RelevantSection({ content }: { content: string | null }) {
  if (!content) return null;

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
          <FileText className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
          <span>Relevant Information</span>
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          Medications, dosages, and patient instructions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] sm:h-[400px] w-full rounded-md border p-3 sm:p-4">
          <div className="prose prose-sm max-w-none dark:prose-invert text-sm sm:text-base">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

// Irrelevant Section Component
function IrrelevantSection({ content }: { content: string | null }) {
  if (!content) return null;

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-muted-foreground text-lg sm:text-xl">
          Administrative Information
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          Clinic details, headers, and other administrative content
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[200px] sm:h-[300px] w-full rounded-md border p-3 sm:p-4 bg-muted/30">
          <div className="prose prose-sm max-w-none dark:prose-invert opacity-70 text-sm sm:text-base">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

// Prescription Viewer Component
function PrescriptionViewer({
  prescription,
}: {
  prescription: NonNullable<Awaited<ReturnType<typeof getPrescriptionById>>>;
}) {
  const hasClassifiedContent = prescription.relevantContent || prescription.irrelevantContent;
  const displayText = prescription.enhancedText || prescription.extractedText;

  // Show processing status if not completed
  if (prescription.status !== "completed" && prescription.status !== "failed") {
    return (
      <Card className="transition-shadow">
        <CardContent className="flex flex-col items-center justify-center py-8 sm:py-12 px-4">
          <Loader2 className="w-10 h-10 sm:w-12 sm:h-12 animate-spin text-primary mb-4" />
          <h3 className="text-base sm:text-lg font-semibold mb-2 text-center">Processing Prescription</h3>
          <ProcessingStatus status={prescription.status} />
          <p className="text-xs sm:text-sm text-muted-foreground mt-4 text-center max-w-md px-4">
            Your prescription is being processed. This page will automatically update when complete.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Show error state
  if (prescription.status === "failed") {
    return (
      <Card className="border-red-200 dark:border-red-900 transition-shadow">
        <CardContent className="flex flex-col items-center justify-center py-8 sm:py-12 px-4">
          <AlertCircle className="w-10 h-10 sm:w-12 sm:h-12 text-red-500 mb-4" />
          <h3 className="text-base sm:text-lg font-semibold mb-2 text-center">Processing Failed</h3>
          <p className="text-xs sm:text-sm text-muted-foreground text-center max-w-md px-4">
            {prescription.errorMessage || "An error occurred while processing your prescription."}
          </p>
        </CardContent>
      </Card>
    );
  }

  // Show classified content if available
  if (hasClassifiedContent) {
    return (
      <div className="space-y-6">
        <RelevantSection content={prescription.relevantContent} />
        <IrrelevantSection content={prescription.irrelevantContent} />
      </div>
    );
  }

  // Fallback to unclassified text
  if (displayText) {
    return (
      <Card className="transition-shadow hover:shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <FileText className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
            <span>Extracted Text</span>
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Full prescription content (classification unavailable)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] sm:h-[600px] w-full rounded-md border p-3 sm:p-4">
            <div className="prose prose-sm max-w-none dark:prose-invert text-sm sm:text-base">
              <ReactMarkdown>{displayText}</ReactMarkdown>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    );
  }

  // No content available
  return (
    <Card className="transition-shadow">
      <CardContent className="flex flex-col items-center justify-center py-8 sm:py-12 px-4">
        <AlertCircle className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground mb-4" />
        <h3 className="text-base sm:text-lg font-semibold mb-2 text-center">No Content Available</h3>
        <p className="text-xs sm:text-sm text-muted-foreground text-center max-w-md px-4">
          No text could be extracted from this prescription.
        </p>
      </CardContent>
    </Card>
  );
}

export default async function PrescriptionDetailPage({ params }: PrescriptionDetailPageProps) {
  const { userId } = await auth();
  const { id } = await params;

  if (!userId) {
    redirect("/sign-in");
  }

  const prescription = await getPrescriptionById(id);

  // Handle prescription not found
  if (!prescription) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card className="border-red-200 dark:border-red-900">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Prescription Not Found</h3>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              The prescription you&apos;re looking for doesn&apos;t exist or has been deleted.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Verify user owns this prescription
  if (prescription.userId !== userId) {
    redirect("/dashboard");
  }

  const formattedDate = new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(prescription.createdAt));

  return (
    <div className="container mx-auto py-4 sm:py-6 md:py-8 px-4 max-w-5xl">
      {/* Prescription Metadata */}
      <div className="mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2 break-words">{prescription.fileName}</h1>
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                <span className="truncate">{formattedDate}</span>
              </div>
              <div className="flex items-center gap-1">
                <FileText className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                <span>{(prescription.fileSize / 1024).toFixed(2)} KB</span>
              </div>
            </div>
          </div>
          <div className="flex flex-row sm:flex-col items-start sm:items-end gap-2 flex-shrink-0">
            <ProcessingStatus status={prescription.status} />
            {prescription.useAdvancedAI && (
              <Badge variant="outline" className="flex items-center gap-1 text-xs">
                <Sparkles className="w-3 h-3" />
                AI Enhanced
              </Badge>
            )}
          </div>
        </div>
        <Separator />
      </div>

      {/* Audio Player - Show only when prescription is completed */}
      {prescription.status === "completed" && (prescription.relevantContent || prescription.enhancedText || prescription.extractedText) && (
        <div className="mb-4 sm:mb-6">
          <AudioPlayer 
            prescriptionId={prescription.id}
            text={prescription.relevantContent || prescription.enhancedText || prescription.extractedText || undefined}
          />
        </div>
      )}

      {/* Prescription Content */}
      <PrescriptionViewer prescription={prescription} />
    </div>
  );
}
