import { useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { Provider } from "react-redux";
import { queryClient } from "./lib/queryClient";
import { store } from "./store";
import { getPageTitle } from "@/hooks/use-page-title";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Landing from "@/pages/landing";
import Explorer from "@/pages/explorer";
import PDFViewer from "@/pages/pdf-viewer";
import About from "@/pages/about";
import Docs from "@/pages/docs";
import PublicFolder from "@/pages/public-folder";
import PublicFile from "@/pages/public-file";
import TelegramLogin from "@/pages/telegram-login";
import AuthPage from "@/pages/auth";
import VerifyEmailPage from "@/pages/verify-email";
import ForgotPasswordPage from "@/pages/forgot-password";
import ResetPasswordPage from "@/pages/reset-password";
import NotFound from "@/pages/not-found";

const routeTitles: Array<[RegExp, string]> = [
  [/^\/$/, "Главная"],
  [/^\/explorer(?:\/.*)?$/, "Проводник"],
  [/^\/pdf\/[^/]+$/, "Загрузка файла"],
  [/^\/about$/, "О проекте"],
  [/^\/docs$/, "Документация"],
  [/^\/auth$/, "Вход"],
  [/^\/auth\/verify-email$/, "Подтверждение email"],
  [/^\/auth\/forgot-password$/, "Восстановление пароля"],
  [/^\/auth\/reset-password$/, "Новый пароль"],
  [/^\/auth\/telegram-login$/, "Вход через Telegram"],
  [/^\/shared\/folder\/[^/]+$/, "Загрузка папки"],
  [/^\/shared\/file\/[^/]+$/, "Загрузка файла"],
];

function PageTitle() {
  const [location] = useLocation();

  useEffect(() => {
    const routeTitle = routeTitles.find(([pattern]) => pattern.test(location))?.[1];
    document.title = getPageTitle(routeTitle ?? "Страница не найдена");
  }, [location]);

  return null;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/explorer" component={Explorer} />
      <Route path="/explorer/:folderId" component={Explorer} />
      <Route path="/pdf/:fileId" component={PDFViewer} />
      <Route path="/about" component={About} />
      <Route path="/docs" component={Docs} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/auth/verify-email" component={VerifyEmailPage} />
      <Route path="/auth/forgot-password" component={ForgotPasswordPage} />
      <Route path="/auth/reset-password" component={ResetPasswordPage} />
      <Route path="/auth/telegram-login" component={TelegramLogin} />
      <Route path="/shared/folder/:shareToken" component={PublicFolder} />
      <Route path="/shared/file/:shareToken" component={PublicFile} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <PageTitle />
          <Toaster />
          <Router />
        </TooltipProvider>
      </QueryClientProvider>
    </Provider>
  );
}

export default App;
