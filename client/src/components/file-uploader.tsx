import { useState } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Upload, FileText, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";

interface FileUploaderProps {
  folderId: string;
  onUploadComplete?: () => void;
}

export function FileUploader({ folderId, onUploadComplete }: FileUploaderProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [showConflictDialog, setShowConflictDialog] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [conflictFile, setConflictFile] = useState<{ file: File; existingName: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'application/pdf': ['.pdf'],
    },
    onDrop: (acceptedFiles) => {
      setSelectedFiles(acceptedFiles);
      setShowDialog(true);
    },
  });

  const handleUpload = async (replaceExisting: boolean = false) => {
    if (selectedFiles.length === 0) return;

    setUploading(true);
    setProgress(0);

    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        
        const checkResponse = await fetch(`/api/folders/${folderId}/files/check?name=${encodeURIComponent(file.name)}`);
        
        if (!checkResponse.ok) {
          const errorData = await checkResponse.json().catch(() => ({}));
          throw new Error(errorData.error || 'Не удалось проверить файл');
        }
        
        const { exists } = await checkResponse.json();

        if (exists && !replaceExisting) {
          setConflictFile({ file, existingName: file.name });
          setShowConflictDialog(true);
          setUploading(false);
          return;
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('name', file.name);

        const storageResponse = await fetch(`/api/folders/${folderId}/files`, {
          method: 'POST',
          body: formData,
          credentials: 'include'
        });

        if (!storageResponse.ok) {
          throw new Error('Не удалось загрузить файл в хранилище');
        }

        setProgress(((i + 1) / selectedFiles.length) * 100);
      }

      toast({
        title: "Успех",
        description: `Загружено файлов: ${selectedFiles.length}`,
      });

      setSelectedFiles([]);
      setShowDialog(false);
      
      if (onUploadComplete) {
        onUploadComplete();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Не удалось загрузить файл";
      toast({
        title: "Ошибка",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const handleConflictReplace = () => {
    setShowConflictDialog(false);
    handleUpload(true);
  };

  return (
    <>
      <div {...getRootProps()}>
        <input {...getInputProps()} data-testid="input-file-upload" />
        <Button data-testid="button-upload-file">
          <Upload className="h-4 w-4 mr-2" />
          Загрузить файл
        </Button>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Загрузка файлов</DialogTitle>
            <DialogDescription>
              {uploading ? "Загрузка..." : `Выбрано файлов: ${selectedFiles.length}`}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {uploading && (
              <Progress value={progress} />
            )}
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {selectedFiles.map((file, index) => (
                <div key={index} className="flex items-center gap-3 p-2 border rounded-md">
                  <FileText className="w-5 h-5 text-primary flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  {!uploading && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => setSelectedFiles(files => files.filter((_, i) => i !== index))}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setShowDialog(false)}
              disabled={uploading}
            >
              Отмена
            </Button>
            <Button
              onClick={() => handleUpload()}
              disabled={selectedFiles.length === 0 || uploading}
              data-testid="button-confirm-upload"
            >
              {uploading ? "Загрузка..." : "Загрузить"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showConflictDialog} onOpenChange={setShowConflictDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Файл уже существует</AlertDialogTitle>
            <AlertDialogDescription>
              Файл с именем "{conflictFile?.existingName}" уже существует в этой папке.
              Хотите обновить файл?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отменить</AlertDialogCancel>
            <AlertDialogAction onClick={handleConflictReplace} data-testid="button-replace-file">
              Заменить файл
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
