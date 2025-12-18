import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Upload, Trash2, Share2, MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FileUploader } from "./file-uploader";
import { ShareDialog } from "./share-dialog";
import { useLocation } from "wouter";
import { useAppDispatch } from "@/store/hooks";
import { deleteFile } from "@/store/slices/filesSlice";
import { fetchFolderById } from "@/store/slices/foldersSlice";
import { useToast } from "@/hooks/use-toast";
import type { FolderWithFiles, File } from "@shared/schema";

interface FileExplorerProps {
  folderId?: string;
  folder: FolderWithFiles | null;
  loading: boolean;
}

export function FileExplorer({ folderId, folder, loading }: FileExplorerProps) {
  const [_, setLocation] = useLocation();
  const dispatch = useAppDispatch();
  const [shareItem, setShareItem] = useState<{ url: string; title: string; type: string } | null>(null);
  const { toast } = useToast();

  const handleDeleteFile = async (fileId: string) => {
    if (confirm('Вы уверены, что хотите удалить этот файл?')) {
      try {
        await dispatch(deleteFile(fileId)).unwrap();
        if (folderId) {
          await dispatch(fetchFolderById(folderId));
        }
        toast({
          title: "Успех",
          description: "Файл удалён",
        });
      } catch (error) {
        toast({
          title: "Ошибка",
          description: "Не удалось удалить файл",
          variant: "destructive",
        });
      }
    }
  };

  const handleShareFile = async (file: File) => {
    try {
      const shareUrl = `${window.location.origin}/file/${file.id}`;
      setShareItem({ url: shareUrl, title: file.name, type: 'file' });
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось создать публичную ссылку",
        variant: "destructive",
      });
    }
  };

  const handleShareFolder = async () => {
    if (!folder) return;
    
    try {
      const response = await fetch(`/api/folders/${folder.id}/share`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to generate share link');
      }

      const { shareToken } = await response.json();
      const shareUrl = `${window.location.origin}/shared/folder/${shareToken}`;
      setShareItem({ url: shareUrl, title: folder.name, type: 'folder' });
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось создать публичную ссылку",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  if (!folder) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Выберите папку из списка</p>
        </div>
      </div>
    );
  }

  const files = folder?.files || [];

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-end gap-2 p-4 border-b">
        {folder && (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={handleShareFolder}
              data-testid="button-share-folder"
            >
              <Share2 className="h-4 w-4 mr-2" />
              Поделиться папкой
            </Button>
            <FileUploader 
              folderId={folder.id} 
              onUploadComplete={() => folderId && dispatch(fetchFolderById(folderId))}
            />
          </>
        )}
      </div>

      <div className="flex-1 overflow-auto p-6">
        {files.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <Upload className="w-8 h-8 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <h3 className="font-medium">Загрузите первый файл</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                Нажмите кнопку "Загрузить файл"
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {files.map(file => (
              <Card
                key={file.id}
                className="p-4 space-y-3 hover-elevate cursor-pointer"
                onClick={() => setLocation(`/pdf/${file.id}`)}
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
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-8 w-8" data-testid={`button-file-menu-${file.id}`}>
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation();
                        handleShareFile(file);
                      }} data-testid={`menu-share-file-${file.id}`}>
                        <Share2 className="h-4 w-4 mr-2" />
                        Поделиться
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteFile(file.id);
                        }}
                        className="text-destructive"
                        data-testid={`menu-delete-file-${file.id}`}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Удалить
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {shareItem && (
        <ShareDialog
          open={!!shareItem}
          onOpenChange={(open) => !open && setShareItem(null)}
          shareUrl={shareItem.url}
          title={shareItem.title}
          type={shareItem.type}
        />
      )}
    </div>
  );
}
