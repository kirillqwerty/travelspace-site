import { useState, useEffect } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "@/lib/auth.jsx";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ShieldCheck } from "lucide-react";

export default function AdminLogin() {
  const { user, login, loading } = useAuth();
  const [email, setEmail] = useState("admin@belarustours.by");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  if (loading) {
    return <div className="min-h-screen grid place-items-center text-sm text-neutral-500">Загрузка…</div>;
  }
  if (user) return <Navigate to="/admin" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    const res = await login(email, password);
    setSubmitting(false);
    if (res.ok) navigate("/admin");
    else setError(res.error || "Ошибка входа");
  };

  return (
    <div className="min-h-screen grid place-items-center px-4 bg-neutral-50">
      <form
        onSubmit={submit}
        className="w-full max-w-sm bg-white rounded-2xl border border-neutral-200 p-8 shadow-sm"
        data-testid="admin-login-form"
      >
        <div className="size-10 rounded-xl bg-orange-50 grid place-items-center text-[#C2410C]">
          <ShieldCheck className="size-5" />
        </div>
        <h1 className="font-heading text-2xl mt-4">Вход в админ-панель</h1>
        <p className="text-sm text-neutral-500 mt-1">Доступ только для администраторов сайта.</p>

        <div className="mt-6 space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1"
              data-testid="admin-email"
            />
          </div>
          <div>
            <Label htmlFor="password">Пароль</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1"
              data-testid="admin-password"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button
            type="submit"
            disabled={submitting}
            className="w-full rounded-full bg-[#C2410C] hover:bg-[#9A3412] text-white py-6"
            data-testid="admin-submit"
          >
            {submitting ? <Loader2 className="size-4 animate-spin" /> : "Войти"}
          </Button>
        </div>
        <p className="mt-6 text-xs text-neutral-400">
          Демо: admin@belarustours.by · admin123
        </p>
      </form>
    </div>
  );
}
