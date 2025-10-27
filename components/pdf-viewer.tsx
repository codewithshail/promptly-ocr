"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, FileText, Maximize2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface PDFViewerProps {
  fileUrl: string;
  fileName: string;
  totalPages?: number;
}

export function PDFViewer({ fileUrl, fileName, totalPages = 40 }: PDFViewerProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePageClick = (page: number) => {
    setCurrentPage(page);
  };

  // Generate page numbers to display (show current page and 2 pages before/after)
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxPagesToShow = 7;
    
    if (totalPages <= maxPagesToShow) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);
      
      if (currentPage > 3) {
        pages.push('...');
      }
      
      // Show pages around current page
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      if (currentPage < totalPages - 2) {
        pages.push('...');
      }
      
      // Always show last page
      pages.push(totalPages);
    }
    
    return pages;
  };

  const PDFContent = ({ fullscreen = false }: { fullscreen?: boolean }) => (
    <div className="space-y-4">
      {/* PDF Display */}
      <div className={`bg-gray-100 dark:bg-gray-900 rounded-lg overflow-hidden ${fullscreen ? 'h-[70vh]' : 'h-[500px]'}`}>
        <iframe
          src={`${fileUrl}#view=FitH&page=${currentPage}&toolbar=0&navpanes=0`}
          className="w-full h-full"
          title={`${fileName} - Page ${currentPage}`}
        />
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <Button
          variant="outline"
          size="sm"
          onClick={handlePreviousPage}
          disabled={currentPage === 1}
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Previous
        </Button>

        <div className="flex items-center gap-1 flex-wrap justify-center">
          {getPageNumbers().map((page, idx) => (
            typeof page === 'number' ? (
              <Button
                key={idx}
                variant={currentPage === page ? "default" : "outline"}
                size="sm"
                onClick={() => handlePageClick(page)}
                className="min-w-[40px]"
              >
                {page}
              </Button>
            ) : (
              <span key={idx} className="px-2 text-muted-foreground">
                {page}
              </span>
            )
          ))}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleNextPage}
          disabled={currentPage === totalPages}
        >
          Next
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>

      {/* Page Info */}
      <div className="text-center text-sm text-muted-foreground">
        Page {currentPage} of {totalPages}
      </div>
    </div>
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            View PDF Document
          </CardTitle>
          <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Maximize2 className="w-4 h-4 mr-2" />
                Fullscreen
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-6xl h-[90vh]">
              <DialogHeader>
                <DialogTitle>{fileName}</DialogTitle>
              </DialogHeader>
              <PDFContent fullscreen />
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <PDFContent />
      </CardContent>
    </Card>
  );
}
