import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { Document, Page, pdfjs } from "react-pdf";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { X, Download, Home, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Bell, BellOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { File, User, Subscription } from "@shared/schema";
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export default function PublicFile() {
  const { shareToken } = useParams<{ shareToken: string }>();
  const [location, setLocation] = useLocation();

  const [file, setFile] = useState<File | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const { toast } = useToast();

  const { data: currentUser } = useQuery<{ user: User | null }>({
    queryKey: ['/api/auth/me'],
  });

  const { data: subscriptions } = useQuery<Subscription[]>({
    queryKey: ['/api/subscriptions'],
    enabled: !!currentUser?.user,
  });

  const subscription = subscriptions?.find(sub => sub.fileId === file?.id);

  const subscribeMutation = useMutation({
    mutationFn: async () => {
      if (!file?.id) throw new Error('File ID not found');
      const response = await apiRequest('POST', '/api/subscriptions', { fileId: file.id });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/subscriptions'] });
      toast({
        title: "Подписка оформлена",
        description: "Вы будете получать уведомления об обновлениях файла в Telegram",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const unsubscribeMutation = useMutation({
    mutationFn: async () => {
      if (!subscription?.id) throw new Error('Subscription not found');
      const response = await apiRequest('DELETE', `/api/subscriptions/${subscription.id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/subscriptions'] });
      toast({
        title: "Подписка отменена",
        description: "Вы больше не будете получать уведомления об обновлениях файла",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (shareToken) {
      fetch(`/api/files/${shareToken}/metadata`)
        .then(res => {
          if (!res.ok) throw new Error('File not found');
          return res.json();
        })
        .then(data => setFile(data))
        .catch(err => {
          toast({
            title: "Ошибка",
            description: "Файл не найден или доступ к нему ограничен",
            variant: "destructive",
          });
        });
    }
  }, [shareToken, toast]);
  const shareUrl = `/api/files/${file?.id}`;
  let backUrl = '/';

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  const onDocumentLoadError = (error: Error) => {
    console.error("PDF загрузка не удалась:", error);
    toast({
      title: "Ошибка загрузки PDF",
      description: error.message,
      variant: "destructive",
    });
  };

  if (!file) {
    return (
      <div className="h-screen w-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Skeleton className="h-8 w-48 mx-auto" />
          <Skeleton className="h-[600px] w-full max-w-2xl" />
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
            onClick={() => setLocation(backUrl)}
            data-testid="button-close"
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
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>

          {currentUser?.user && (
            <Button
              variant={subscription ? "default" : "ghost"}
              size="icon"
              onClick={() => subscription ? unsubscribeMutation.mutate() : subscribeMutation.mutate()}
              disabled={subscribeMutation.isPending || unsubscribeMutation.isPending}
              data-testid={subscription ? "button-unsubscribe" : "button-subscribe"}
            >
              {subscription ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={() => window.open(shareUrl, '_blank')}
            data-testid="button-download"
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <div className="flex-1 overflow-auto flex items-start justify-center p-4 bg-muted/30">
        <Document
          file={shareUrl}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={onDocumentLoadError}
          loading={
            <div className="flex items-center justify-center p-8">
              <Skeleton className="h-[800px] w-[600px]" />
            </div>
          }
          error={
            <div className="flex items-center justify-center p-8">
              <p className="text-destructive">Failed to load PDF file.</p>
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
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm min-w-24 text-center">
          Страница {pageNumber} из {numPages}
        </span>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setPageNumber(p => Math.min(numPages, p + 1))}
          disabled={pageNumber >= numPages}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </footer>
    </div>
  );
}
