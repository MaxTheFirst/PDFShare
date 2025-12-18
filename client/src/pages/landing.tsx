import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FileText, Folder, Bell, Share2, Upload, Clock } from "lucide-react";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { verifyAuth } from "@/store/slices/authSlice";

export default function Landing() {
  const [_, setLocation] = useLocation();
  const dispatch = useAppDispatch();
  const { user, loading } = useAppSelector(state => state.auth);

  useEffect(() => {
    dispatch(verifyAuth());
  }, [dispatch]);

  useEffect(() => {
    if (!loading && user) {
      setLocation('/explorer');
    }
  }, [user, loading, setLocation]);

  const handleTelegramLogin = () => {
    window.location.href = 'https://telegram.me/pdfshareauth_bot?start=auth';
  };

  return (
    <div className="min-h-screen bg-background">
      <section className="relative flex items-center justify-center min-h-[70vh] px-4 py-12">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold text-foreground tracking-tight">
              PDFShare
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
              Делитесь документами легко
            </p>
          </div>
          
          <p className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto">
            Храните, систематизируйте и делитесь PDF-документами с коллегами и друзьями. 
            Получайте уведомления об обновлениях через Telegram.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              size="lg"
              onClick={handleTelegramLogin}
              className="gap-2 min-h-12 px-8"
              data-testid="button-telegram-login"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.941z"/>
              </svg>
              Войти через Telegram
            </Button>
          </div>

          <p className="text-sm text-muted-foreground">
            Новый пользователь? Нажмите кнопку выше для регистрации
          </p>
        </div>
      </section>

      <section className="px-4 py-16 bg-card/30">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-semibold text-center mb-12">
            Возможности PDFShare
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="p-6 space-y-4 hover-elevate" data-testid="card-feature-upload">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Upload className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-medium">Загрузка файлов</h3>
              <p className="text-muted-foreground text-sm">
                Перетаскивайте PDF-файлы для быстрой загрузки. Организуйте документы в папки.
              </p>
            </Card>

            <Card className="p-6 space-y-4 hover-elevate" data-testid="card-feature-folders">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Folder className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-medium">Организация</h3>
              <p className="text-muted-foreground text-sm">
                Создавайте папки для систематизации документов. Папка "Недавние" для быстрого доступа.
              </p>
            </Card>

            <Card className="p-6 space-y-4 hover-elevate" data-testid="card-feature-share">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Share2 className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-medium">Общий доступ</h3>
              <p className="text-muted-foreground text-sm">
                Делитесь файлами и папками по ссылке. Доступ без регистрации для просмотра.
              </p>
            </Card>

            <Card className="p-6 space-y-4 hover-elevate" data-testid="card-feature-viewer">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-medium">PDF Viewer</h3>
              <p className="text-muted-foreground text-sm">
                Просматривайте документы онлайн в удобном полноэкранном режиме.
              </p>
            </Card>

            <Card className="p-6 space-y-4 hover-elevate" data-testid="card-feature-notifications">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Bell className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-medium">Уведомления</h3>
              <p className="text-muted-foreground text-sm">
                Подписывайтесь на папки и файлы. Получайте уведомления в Telegram об обновлениях.
              </p>
            </Card>

            <Card className="p-6 space-y-4 hover-elevate" data-testid="card-feature-recent">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Clock className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-medium">Недавние</h3>
              <p className="text-muted-foreground text-sm">
                Автоматическая папка с недавно открытыми файлами для быстрого доступа.
              </p>
            </Card>
          </div>
        </div>
      </section>

      <footer className="border-t py-8 px-4">
        <div className="max-w-6xl mx-auto text-center text-sm text-muted-foreground">
          <p>© 2025 PDFShare. Все права защищены.</p>
        </div>
      </footer>
    </div>
  );
}
