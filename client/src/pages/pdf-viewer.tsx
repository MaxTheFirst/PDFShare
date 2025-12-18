import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { Document, Page, pdfjs } from "react-pdf";
import { Button } from "@/components/ui/button";
import { X, Download, Share2, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ShareDialog } from "@/components/share-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export default function PDFViewer() {
  const { fileId } = useParams<{ fileId: string }>();
  const [_, setLocation] = useLocation();
  const [file, setFile] = useState<any>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (fileId) {
      fetch(`/api/files/${fileId}/metadata`)
        .then(res => res.json())
        .then(data => setFile(data))
        .catch(err => {
          toast({
            title: "Ошибка",
            description: "Не удалось загрузить файл",
            variant: "destructive",
          });
        });
    }
  }, [fileId, toast]);

  const shareUrl = `/api/files/${fileId}`;

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  const handleDownload = () => {
    if (file) {
      window.open(shareUrl, '_blank');
    }
  };

  const handleShare = () => {
    setShowShareDialog(true);
  };

  if (!file) {
    return (
      <div className="h-screen w-screen bg-background flex items-center justify-center">
        <div className="space-y-4 w-full max-w-2xl px-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-[600px] w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-background flex flex-col">
      <header className="flex items-center justify-between gap-4 p-4 border-b bg-card">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation('/explorer')}
            data-testid="button-close-viewer"
          >
            <X className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-medium truncate max-w-md" data-testid="text-filename">
            {file.name}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 border rounded-md">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setScale(s => Math.max(0.5, s - 0.1))}
              disabled={scale <= 0.5}
              data-testid="button-zoom-out"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm px-2 min-w-16 text-center">
              {Math.round(scale * 100)}%
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setScale(s => Math.min(2.0, s + 0.1))}
              disabled={scale >= 2.0}
              data-testid="button-zoom-in"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleDownload}
            data-testid="button-download"
          >
            <Download className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleShare}
            data-testid="button-share"
          >
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <div className="flex-1 overflow-auto flex items-start justify-center p-4 bg-muted/30">
        <Document
          file={shareUrl}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={
            <div className="flex items-center justify-center p-8">
              <Skeleton className="h-[800px] w-[600px]" />
            </div>
          }
        >
          <Page 
            pageNumber={pageNumber} 
            scale={scale}
            renderTextLayer={true}
            renderAnnotationLayer={true}
          />
        </Document>
      </div>

      <footer className="flex items-center justify-center gap-4 p-4 border-t bg-card">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setPageNumber(p => Math.max(1, p - 1))}
          disabled={pageNumber <= 1}
          data-testid="button-prev-page"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm min-w-24 text-center" data-testid="text-page-number">
          Страница {pageNumber} из {numPages}
        </span>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setPageNumber(p => Math.min(numPages, p + 1))}
          disabled={pageNumber >= numPages}
          data-testid="button-next-page"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </footer>

      {file && (
        <ShareDialog
          open={showShareDialog}
          onOpenChange={setShowShareDialog}
          shareUrl={`${window.location.origin}/shared/file/${fileId}`}
          title={file.name}
          type="file"
        />
      )}
    </div>
  );
}
