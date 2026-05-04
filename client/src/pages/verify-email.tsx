import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { CheckCircle2, Loader2, TriangleAlert } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAppDispatch } from "@/store/hooks";
import { setUser } from "@/store/slices/authSlice";
import { queryClient } from "@/lib/queryClient";

type VerificationState = "loading" | "success" | "error";

export default function VerifyEmailPage() {
  const [_, setLocation] = useLocation();
  const dispatch = useAppDispatch();
  const [state, setState] = useState<VerificationState>("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("token");

    if (!token) {
      setState("error");
      setErrorMessage("Токен подтверждения не найден");
      return;
    }

    const verifyEmail = async () => {
      try {
        const response = await fetch(`/api/auth/verify-email/${encodeURIComponent(token)}`, {
          credentials: "include",
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Не удалось подтвердить email");
        }

        dispatch(setUser(data.user));
        queryClient.setQueryData(["/api/auth/me"], { user: data.user });
        setState("success");

        setTimeout(() => {
          setLocation("/explorer");
        }, 1200);
      } catch (error) {
        setState("error");
        setErrorMessage(error instanceof Error ? error.message : "Не удалось подтвердить email");
      }
    };

    verifyEmail();
  }, [dispatch, setLocation]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>
            {state === "loading" && "Подтверждаем email"}
            {state === "success" && "Email подтверждён"}
            {state === "error" && "Ошибка подтверждения"}
          </CardTitle>
          <CardDescription>
            {state === "loading" && "Проверяем ссылку и открываем ваш аккаунт"}
            {state === "success" && "Сейчас перенаправим вас в проводник"}
            {state === "error" && "Ссылка недействительна или срок её действия закончился"}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          {state === "loading" && <Loader2 className="h-12 w-12 animate-spin text-primary" />}
          {state === "success" && <CheckCircle2 className="h-12 w-12 text-emerald-600" />}
          {state === "error" && (
            <>
              <TriangleAlert className="h-12 w-12 text-destructive" />
              <p className="text-center text-sm text-muted-foreground">{errorMessage}</p>
              <Button onClick={() => setLocation("/auth")} data-testid="button-go-auth">
                Перейти ко входу
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
