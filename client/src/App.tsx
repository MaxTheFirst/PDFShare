import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { Provider } from "react-redux";
import { queryClient } from "./lib/queryClient";
import { store } from "./store";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Landing from "@/pages/landing";
import Explorer from "@/pages/explorer";
import PDFViewer from "@/pages/pdf-viewer";
import About from "@/pages/about";
import PublicFolder from "@/pages/public-folder";
import PublicFile from "@/pages/public-file";
import TelegramLogin from "@/pages/telegram-login";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/explorer" component={Explorer} />
      <Route path="/explorer/:folderId" component={Explorer} />
      <Route path="/pdf/:fileId" component={PDFViewer} />
      <Route path="/about" component={About} />
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
          <Toaster />
          <Router />
        </TooltipProvider>
      </QueryClientProvider>
    </Provider>
  );
}

export default App;
