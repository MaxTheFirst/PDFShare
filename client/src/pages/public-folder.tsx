import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Download, Home, Bell, BellOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { FolderWithFiles, User, Subscription } from "@shared/schema";

export default function PublicFolder() {
  const { shareToken } = useParams<{ shareToken: string }>();
  const [_, setLocation] = useLocation();
  const [folder, setFolder] = useState<FolderWithFiles | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const { data: currentUser } = useQuery<{ user: User | null }>({
    queryKey: ['/api/auth/me'],
  });

  const { data: subscriptions } = useQuery<Subscription[]>({
    queryKey: ['/api/subscriptions'],
    enabled: !!currentUser?.user,
  });

  const subscription = subscriptions?.find(sub => sub.folderId === folder?.id);

  const subscribeMutation = useMutation({
    mutationFn: async () => {
      if (!folder?.id) throw new Error('Folder ID not found');
      const response = await apiRequest('POST', '/api/subscriptions', { folderId: folder.id });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/subscriptions'] });
      toast({
        title: "Подписка оформлена",
        description: "Вы будете получать уведомления об обновлениях папки в Telegram",
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
        description: "Вы больше не будете получать уведомления об обновлениях папки",
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
      fetch(`/api/shared/folder/${shareToken}`)
        .then(res => {
          if (!res.ok) throw new Error('Folder not found');
          return res.json();
        })
        .then(data => {
          setFolder(data);
          setLoading(false);
        })
        .catch(err => {
          toast({
            title: "Ошибка",
            description: "Папка не найдена или доступ к ней ограничен",
            variant: "destructive",
          });
          setLoading(false);
        });
    }
  }, [shareToken, toast]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-6xl mx-auto space-y-4">
          <Skeleton className="h-12 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!folder) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-semibold">Папка не найдена</h1>
          <Button onClick={() => setLocation('/')}>
            <Home className="h-4 w-4 mr-2" />
            На главную
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-semibold" data-testid="text-folder-name">
            {folder.name}
          </h1>
          <div className="flex items-center gap-2">
            {currentUser?.user && (
              <Button
                variant={subscription ? "default" : "outline"}
                onClick={() => subscription ? unsubscribeMutation.mutate() : subscribeMutation.mutate()}
                disabled={subscribeMutation.isPending || unsubscribeMutation.isPending}
                data-testid={subscription ? "button-unsubscribe" : "button-subscribe"}
              >
                {subscription ? (
                  <>
                    <Bell className="h-4 w-4 mr-2" />
                    Отписаться
                  </>
                ) : (
                  <>
                    <BellOff className="h-4 w-4 mr-2" />
                    Подписаться
                  </>
                )}
              </Button>
            )}
            <Button variant="ghost" onClick={() => setLocation('/')}>
              <Home className="h-4 w-4 mr-2" />
              PDFShare
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {folder.files.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            В этой папке пока нет файлов
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {folder.files.map(file => (
              <Card
                key={file.id}
                className="p-4 space-y-3 hover-elevate cursor-pointer"
                onClick={() => setLocation(`/shared/file/${file.id}`)}
                data-testid={`card-file-${file.id}`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate" title={file.name}>
                      {file.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(`/api/files/${file.id}`, '_blank');
                  }}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Скачать
                </Button>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
