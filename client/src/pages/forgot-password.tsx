import { FormEvent, useState } from "react";
import { useLocation } from "wouter";
import { AlertCircle, Mail } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ForgotPasswordPage() {
  const [_, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Не удалось отправить письмо");
      }

      setSuccess(data.message || "Если email зарегистрирован, письмо уже отправлено");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Не удалось отправить письмо");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Восстановление пароля</CardTitle>
          <CardDescription>Введите email, который вы использовали при регистрации.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Не удалось отправить письмо</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="border-emerald-500/30 bg-emerald-500/5">
                <Mail className="h-4 w-4 text-emerald-600" />
                <AlertTitle>Проверьте почту</AlertTitle>
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="forgot-password-email">Email</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="forgot-password-email"
                  type="email"
                  autoComplete="email"
                  className="pl-9"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  data-testid="input-forgot-password-email"
                />
              </div>
            </div>

            <Button
              className="w-full"
              type="submit"
              disabled={submitting}
              data-testid="button-forgot-password-submit"
            >
              {submitting ? "Отправляем..." : "Отправить ссылку"}
            </Button>
          </form>

          <Button
            variant="ghost"
            className="mt-4 w-full"
            onClick={() => setLocation("/auth")}
            data-testid="button-back-auth"
          >
            Вернуться ко входу
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
