import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Bell,
  BookOpen,
  Bot,
  Code2,
  Database,
  FileText,
  Folder,
  Home,
  Server,
  Share2,
} from "lucide-react";
import { useLocation } from "wouter";

const usageScenario = [
  {
    icon: Bot,
    title: "Пользователь заходит через Telegram Bot",
    text: "Авторизация проходит через Telegram: бот выдаёт одноразовую ссылку для входа в приложение.",
  },
  {
    icon: Folder,
    title: "Создаёт папку и загружает файлы",
    text: "PDF-документы можно раскладывать по папкам, чтобы быстро находить нужные материалы.",
  },
  {
    icon: Share2,
    title: "Делится файлом или всей папкой",
    text: "Для файла или папки создаётся публичная ссылка, которую можно отправить другому человеку.",
  },
  {
    icon: FileText,
    title: "Друг открывает документы в браузере",
    text: "Получатель может посмотреть папку и открыть PDF прямо в веб-приложении без скачивания.",
  },
  {
    icon: Bell,
    title: "Подписывается на обновления",
    text: "На файл или папку можно подписаться, чтобы получать уведомления об изменениях в Telegram Bot.",
  },
];

const technologies = [
  {
    icon: Code2,
    title: "Frontend",
    items: ["React", "Redux Toolkit", "TanStack Query", "Wouter", "Shadcn UI"],
  },
  {
    icon: Server,
    title: "Backend",
    items: ["Express.js", "Node.js", "Drizzle ORM"],
  },
  {
    icon: Database,
    title: "База данных и хранилище",
    items: ["PostgreSQL (Neon)", "Minio"],
  },
  {
    icon: Bot,
    title: "Авторизация",
    items: ["Telegram Bot OAuth"],
  },
];

export default function Docs() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <BookOpen className="h-5 w-5 text-primary" />
            </span>
            <div>
              <h1 className="text-xl font-semibold leading-tight">Документация</h1>
              <p className="text-sm text-muted-foreground">PDFShare</p>
            </div>
          </div>

          <Button variant="outline" onClick={() => setLocation("/")} data-testid="button-home">
            <Home className="mr-2 h-4 w-4" />
            На главную
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-14 px-4 py-12">
        <section className="space-y-6">
          <Badge variant="secondary" className="w-fit">
            Описание
          </Badge>
          <div className="space-y-4">
            <h2 className="max-w-3xl text-4xl font-semibold tracking-tight md:text-5xl">
              PDF-файлообменник с интеграцией Telegram
            </h2>
            <p className="max-w-3xl text-lg text-muted-foreground">
              PDFShare — это приложение для хранения, организации и совместного использования
              PDF-документов. Сервис помогает загружать файлы, группировать их по папкам,
              открывать документы прямо в браузере и делиться доступом по ссылке.
            </p>
            <p className="max-w-3xl text-lg text-muted-foreground">
              Интеграция с Telegram используется для входа в приложение и уведомлений: пользователь
              может подписаться на файл или папку и получать сообщения, когда появляются обновления.
            </p>
          </div>
        </section>

        <section className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
              Сценарий пользования
            </h2>
            <p className="max-w-3xl text-muted-foreground">
              Основной путь пользователя: войти, загрузить документы, поделиться ссылкой и следить
              за обновлениями через Telegram.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {usageScenario.map((step, index) => {
              const Icon = step.icon;
              return (
                <Card key={step.title} className="p-6">
                  <div className="mb-4 flex items-center justify-between gap-4">
                    <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" />
                    </span>
                    <span className="text-sm font-medium text-muted-foreground">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <h3 className="font-medium">{step.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{step.text}</p>
                </Card>
              );
            })}
          </div>
        </section>

        <section className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">Стек технологий</h2>
            <p className="max-w-3xl text-muted-foreground">
              Проект собран на React-фронтенде, Node.js backend, PostgreSQL и объектном хранилище
              для PDF-файлов.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {technologies.map((group) => {
              const Icon = group.icon;
              return (
                <Card key={group.title} className="p-6">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-medium">{group.title}</h3>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {group.items.map((item) => (
                      <Badge key={item} variant="outline">
                        {item}
                      </Badge>
                    ))}
                  </div>
                </Card>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}
