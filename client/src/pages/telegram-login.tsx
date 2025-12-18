import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function TelegramLogin() {
  const [, setLocation] = useLocation();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (!token) {
      setStatus("error");
      setErrorMessage("Токен авторизации не найден");
      return;
    }

    const authenticateWithToken = async () => {
      try {
        const response = await fetch(`/api/auth/telegram-login/${token}`);
        
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Ошибка авторизации");
        }

        const data = await response.json();
        
        if (data.success) {
          setStatus("success");
          setTimeout(() => {
            setLocation("/explorer");
          }, 1000);
        } else {
          throw new Error("Авторизация не удалась");
        }
      } catch (error) {
        console.error("Ошибка авторизации:", error);
        setStatus("error");
        setErrorMessage(error instanceof Error ? error.message : "Произошла ошибка");
      }
    };

    authenticateWithToken();
  }, [setLocation]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md" data-testid="card-telegram-login">
        <CardHeader className="text-center">
          <CardTitle>
            {status === "loading" && "Вход в систему..."}
            {status === "success" && "Успешная авторизация"}
            {status === "error" && "Ошибка авторизации"}
          </CardTitle>
          <CardDescription>
            {status === "loading" && "Проверяем ваши данные"}
            {status === "success" && "Перенаправление в личный кабинет"}
            {status === "error" && "Не удалось войти в систему"}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          {status === "loading" && (
            <Loader2 
              className="h-12 w-12 animate-spin text-primary" 
              data-testid="icon-loading"
            />
          )}
          {status === "success" && (
            <CheckCircle2 
              className="h-12 w-12 text-green-500" 
              data-testid="icon-success"
            />
          )}
          {status === "error" && (
            <>
              <XCircle 
                className="h-12 w-12 text-destructive" 
                data-testid="icon-error"
              />
              <p className="text-sm text-muted-foreground text-center" data-testid="text-error-message">
                {errorMessage}
              </p>
              <p className="text-xs text-muted-foreground text-center">
                Попробуйте получить новую ссылку в Telegram боте, отправив команду /start
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
