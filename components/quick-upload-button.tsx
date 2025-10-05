import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";

export function QuickUploadButton() {
  return (
    <Button asChild size="lg" className="h-11 sm:h-12 text-sm sm:text-base transition-transform active:scale-[0.98] hover:shadow-md">
      <Link href="/upload">
        <Upload className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
        <span className="hidden xs:inline">Upload Prescription</span>
        <span className="xs:hidden">Upload</span>
      </Link>
    </Button>
  );
}
