import { FormEvent, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { AlertCircle, CheckCircle2, KeyRound } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppDispatch } from "@/store/hooks";
import { setUser } from "@/store/slices/authSlice";
import { queryClient } from "@/lib/queryClient";

type ResetPasswordFormState = {
  password: string;
  passwordConfirmation: string;
};

const initialForm: ResetPasswordFormState = {
  password: "",
  passwordConfirmation: "",
};

export default function ResetPasswordPage() {
  const [_, setLocation] = useLocation();
  const dispatch = useAppDispatch();
  const token = useMemo(() => new URLSearchParams(window.location.search).get("token") || "", []);
  const [form, setForm] = useState<ResetPasswordFormState>(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(token ? null : "Токен сброса пароля не найден");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!token) {
      setError("Токен сброса пароля не найден");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ token, ...form }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Не удалось сбросить пароль");
      }

      dispatch(setUser(data.user));
      queryClient.setQueryData(["/api/auth/me"], { user: data.user });
      setSuccess(true);

      setTimeout(() => {
        setLocation("/explorer");
      }, 1200);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Не удалось сбросить пароль");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{success ? "Пароль обновлён" : "Новый пароль"}</CardTitle>
          <CardDescription>
            {success ? "Сейчас перенаправим вас в проводник" : "Задайте новый пароль для аккаунта PDFShare."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {success ? (
            <div className="flex flex-col items-center gap-4">
              <CheckCircle2 className="h-12 w-12 text-emerald-600" />
            </div>
          ) : (
            <form className="space-y-4" onSubmit={handleSubmit}>
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Не удалось обновить пароль</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="reset-password">Пароль</Label>
                <div className="relative">
                  <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="reset-password"
                    type="password"
                    autoComplete="new-password"
                    className="pl-9"
                    value={form.password}
                    onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                    data-testid="input-reset-password"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reset-password-confirmation">Подтверждение пароля</Label>
                <div className="relative">
                  <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="reset-password-confirmation"
                    type="password"
                    autoComplete="new-password"
                    className="pl-9"
                    value={form.passwordConfirmation}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, passwordConfirmation: event.target.value }))
                    }
                    data-testid="input-reset-password-confirmation"
                  />
                </div>
              </div>

              <Button
                className="w-full"
                type="submit"
                disabled={submitting || !token}
                data-testid="button-reset-password-submit"
              >
                {submitting ? "Обновляем..." : "Обновить пароль"}
              </Button>
            </form>
          )}

          {!success && (
            <Button
              variant="ghost"
              className="mt-4 w-full"
              onClick={() => setLocation("/auth")}
              data-testid="button-back-auth"
            >
              Вернуться ко входу
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
