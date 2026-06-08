import { FormEvent, useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { AlertCircle, KeyRound, Mail, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setUser, verifyAuth } from "@/store/slices/authSlice";
import { queryClient } from "@/lib/queryClient";

type LoginFormState = {
  username: string;
  password: string;
};

type RegisterFormState = {
  username: string;
  email: string;
  password: string;
  passwordConfirmation: string;
};

const initialLoginForm: LoginFormState = {
  username: "",
  password: "",
};

const initialRegisterForm: RegisterFormState = {
  username: "",
  email: "",
  password: "",
  passwordConfirmation: "",
};

export default function AuthPage() {
  const [_, setLocation] = useLocation();
  const dispatch = useAppDispatch();
  const { user, loading: authLoading } = useAppSelector((state) => state.auth);
  const initialTab = useMemo(() => {
    const tab = new URLSearchParams(window.location.search).get("tab");
    return tab === "register" ? "register" : "login";
  }, []);

  const [activeTab, setActiveTab] = useState<"login" | "register">(initialTab);
  const [loginForm, setLoginForm] = useState<LoginFormState>(initialLoginForm);
  const [registerForm, setRegisterForm] = useState<RegisterFormState>(initialRegisterForm);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [registerSuccess, setRegisterSuccess] = useState<string | null>(null);
  const [loginSubmitting, setLoginSubmitting] = useState(false);
  const [registerSubmitting, setRegisterSubmitting] = useState(false);

  useEffect(() => {
    dispatch(verifyAuth());
  }, [dispatch]);

  useEffect(() => {
    if (!authLoading && user) {
      setLocation("/explorer");
    }
  }, [authLoading, setLocation, user]);

  const handleTelegramLogin = () => {
    window.location.href = "https://telegram.me/pdfshareauth_bot?start=auth";
  };

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoginSubmitting(true);
    setLoginError(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(loginForm),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Не удалось войти");
      }

      dispatch(setUser(data.user));
      queryClient.setQueryData(["/api/auth/me"], { user: data.user });
      setLocation("/explorer");
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : "Не удалось войти");
    } finally {
      setLoginSubmitting(false);
    }
  };

  const handleRegister = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setRegisterSubmitting(true);
    setRegisterError(null);
    setRegisterSuccess(null);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(registerForm),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Не удалось зарегистрироваться");
      }

      setRegisterForm(initialRegisterForm);
      setRegisterSuccess(data.message || "Письмо с подтверждением отправлено");
      setActiveTab("login");
    } catch (error) {
      setRegisterError(error instanceof Error ? error.message : "Не удалось зарегистрироваться");
    } finally {
      setRegisterSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="text-sm text-muted-foreground">Проверяем авторизацию...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-lg items-center justify-center">
        <div className="w-full">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Доступ к аккаунту</CardTitle>
              <CardDescription>
                Выберите вход или регистрацию. После подтверждения email вы сразу попадёте в личный кабинет.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6 rounded-2xl border border-dashed border-border p-5">
                <p className="text-sm text-muted-foreground">
                  Telegram-вход остаётся доступен для тех, кто уже пользуется ботом.
                </p>
                <Button
                  className="mt-4 w-full"
                  variant="outline"
                  onClick={handleTelegramLogin}
                  data-testid="button-telegram-login-auth"
                >
                  Войти через Telegram
                </Button>
              </div>

              {registerSuccess && (
                <Alert className="mb-4 border-emerald-500/30 bg-emerald-500/5">
                  <Mail className="h-4 w-4 text-emerald-600" />
                  <AlertTitle>Письмо отправлено</AlertTitle>
                  <AlertDescription>{registerSuccess}</AlertDescription>
                </Alert>
              )}

              <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "login" | "register")}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="login">Вход</TabsTrigger>
                  <TabsTrigger value="register">Регистрация</TabsTrigger>
                </TabsList>

                <TabsContent value="login">
                  <form className="space-y-4 pt-4" onSubmit={handleLogin}>
                    {loginError && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Не удалось войти</AlertTitle>
                        <AlertDescription>{loginError}</AlertDescription>
                      </Alert>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="login-username">Username</Label>
                      <div className="relative">
                        <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="login-username"
                          autoComplete="username"
                          className="pl-9"
                          value={loginForm.username}
                          onChange={(event) => setLoginForm((current) => ({ ...current, username: event.target.value }))}
                          data-testid="input-login-username"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="login-password">Пароль</Label>
                      <div className="relative">
                        <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="login-password"
                          type="password"
                          autoComplete="current-password"
                          className="pl-9"
                          value={loginForm.password}
                          onChange={(event) => setLoginForm((current) => ({ ...current, password: event.target.value }))}
                          data-testid="input-login-password"
                        />
                      </div>
                    </div>

                    <Button
                      className="w-full"
                      type="submit"
                      disabled={loginSubmitting}
                      data-testid="button-login-submit"
                    >
                      {loginSubmitting ? "Входим..." : "Войти"}
                    </Button>

                    <Button
                      type="button"
                      variant="link"
                      className="h-auto w-full p-0"
                      onClick={() => setLocation("/auth/forgot-password")}
                      data-testid="button-forgot-password"
                    >
                      Забыли пароль?
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="register">
                  <form className="space-y-4 pt-4" onSubmit={handleRegister}>
                    {registerError && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Не удалось зарегистрироваться</AlertTitle>
                        <AlertDescription>{registerError}</AlertDescription>
                      </Alert>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="register-username">Username</Label>
                      <Input
                        id="register-username"
                        autoComplete="username"
                        value={registerForm.username}
                        onChange={(event) => setRegisterForm((current) => ({ ...current, username: event.target.value }))}
                        data-testid="input-register-username"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="register-email">Email</Label>
                      <Input
                        id="register-email"
                        type="email"
                        autoComplete="email"
                        value={registerForm.email}
                        onChange={(event) => setRegisterForm((current) => ({ ...current, email: event.target.value }))}
                        data-testid="input-register-email"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="register-password">Пароль</Label>
                      <Input
                        id="register-password"
                        type="password"
                        autoComplete="new-password"
                        value={registerForm.password}
                        onChange={(event) => setRegisterForm((current) => ({ ...current, password: event.target.value }))}
                        data-testid="input-register-password"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="register-password-confirmation">Подтверждение пароля</Label>
                      <Input
                        id="register-password-confirmation"
                        type="password"
                        autoComplete="new-password"
                        value={registerForm.passwordConfirmation}
                        onChange={(event) =>
                          setRegisterForm((current) => ({ ...current, passwordConfirmation: event.target.value }))
                        }
                        data-testid="input-register-password-confirmation"
                      />
                    </div>

                    <Button
                      className="w-full"
                      type="submit"
                      disabled={registerSubmitting}
                      data-testid="button-register-submit"
                    >
                      {registerSubmitting ? "Создаём аккаунт..." : "Зарегистрироваться"}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>

              <Button
                variant="ghost"
                className="mt-4 w-full"
                onClick={() => setLocation("/")}
                data-testid="button-back-home"
              >
                На главную
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
