import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useLocation } from "wouter";
import { Home, FileText, Folder, Share2, Bell } from "lucide-react";

export default function About() {
  const [_, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-semibold">О проекте</h1>
          <Button
            variant="ghost"
            onClick={() => setLocation('/')}
            data-testid="button-home"
          >
            <Home className="h-4 w-4 mr-2" />
            На главную
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12 space-y-12">
        <section className="space-y-4">
          <h2 className="text-3xl font-semibold">PDFShare</h2>
          <p className="text-lg text-muted-foreground">
            Удобный сервис для хранения, организации и совместного использования PDF-документов 
            с интеграцией Telegram для уведомлений.
          </p>
        </section>

        <section className="space-y-6">
          <h3 className="text-2xl font-semibold">Как использовать</h3>
          
          <Card className="p-6 space-y-4">
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-xl font-semibold text-primary">1</span>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Авторизация через Telegram</h4>
                <p className="text-sm text-muted-foreground">
                  Нажмите кнопку "Войти через Telegram" на главной странице. Бот отправит вам 
                  ссылку для входа в аккаунт. Перейдите по ссылке, чтобы начать работу.
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6 space-y-4">
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Folder className="w-6 h-6 text-primary" />
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Создание папок</h4>
                <p className="text-sm text-muted-foreground">
                  В проводнике создайте папки для организации документов. Автоматически 
                  создаётся папка "Недавние" для быстрого доступа к последним открытым файлам.
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6 space-y-4">
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Загрузка PDF-файлов</h4>
                <p className="text-sm text-muted-foreground">
                  Перетащите PDF-файлы в окно или нажмите кнопку загрузки. Если файл с таким 
                  именем уже существует, система предложит обновить его (создаётся новая версия).
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6 space-y-4">
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Share2 className="w-6 h-6 text-primary" />
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Совместный доступ</h4>
                <p className="text-sm text-muted-foreground">
                  Нажмите кнопку "Поделиться" на файле или папке, чтобы получить публичную ссылку. 
                  Любой человек с этой ссылкой сможет просматривать документы без регистрации.
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6 space-y-4">
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Bell className="w-6 h-6 text-primary" />
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Подписки и уведомления</h4>
                <p className="text-sm text-muted-foreground">
                  Подпишитесь на чужие папки или файлы, чтобы получать уведомления в Telegram 
                  при их обновлении. Так вы всегда будете в курсе последних изменений.
                </p>
              </div>
            </div>
          </Card>
        </section>

        <section className="space-y-4">
          <h3 className="text-2xl font-semibold">Технологии</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-4">
              <h4 className="font-medium mb-2">Frontend</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• React 18 с TypeScript</li>
                <li>• Redux Toolkit для state management</li>
                <li>• React Router для навигации</li>
                <li>• Tailwind CSS для стилизации</li>
                <li>• React PDF для просмотра документов</li>
              </ul>
            </Card>
            <Card className="p-4">
              <h4 className="font-medium mb-2">Backend</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Node.js + Express</li>
                <li>• PostgreSQL + Drizzle ORM</li>
                <li>• Telegram Bot API</li>
                <li>• Object Storage для файлов</li>
                <li>• JWT для авторизации</li>
              </ul>
            </Card>
          </div>
        </section>

        <section className="pt-8 border-t text-center">
          <Button onClick={() => setLocation('/')} size="lg" data-testid="button-get-started">
            Начать работу
          </Button>
        </section>
      </main>
    </div>
  );
}
