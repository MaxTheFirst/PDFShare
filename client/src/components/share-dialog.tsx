import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shareUrl: string;
  title: string;
  type: string;
}

export function ShareDialog({ open, onOpenChange, shareUrl, title, type }: ShareDialogProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast({
        title: "Скопировано",
        description: "Ссылка скопирована в буфер обмена",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось скопировать ссылку",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Поделиться {type === 'file' ? 'файлом' : 'папкой'}</DialogTitle>
          <DialogDescription>
            {title}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Публичная ссылка</Label>
            <div className="flex gap-2">
              <Input
                value={shareUrl}
                readOnly
                data-testid="input-share-url"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopy}
                data-testid="button-copy-link"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Любой человек с этой ссылкой сможет просматривать {type === 'file' ? 'файл' : 'папку'}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
