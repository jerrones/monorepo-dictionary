"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { signup } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import Link from "next/link";

const signupFormSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(4, "Senha deve ter pelo menos 4 caracteres"),
});

export default function SignupPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setFieldErrors({});

    const result = signupFormSchema.safeParse({ name, email, password });

    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) errors[err.path[0] as string] = err.message;
      });
      setFieldErrors(errors);
      return;
    }

    setIsSubmitting(true);

    try {
      const data = await signup(name, email, password);
      login(data.token, { id: data.id, name: data.name });
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar conta");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="glass-card w-full max-w-md p-8 sm:p-10 animate-slide-up shadow-xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-text">DictYOURnary</h1>
          <p className="text-text-muted mt-2">Crie sua conta para começar</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="signup-name" className="block text-sm font-medium text-text mb-1.5">
              Nome
            </label>
            <input
              id="signup-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 bg-input border border-border rounded-xl text-text placeholder-text-light focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all duration-200"
              placeholder="Seu nome"
            />
            {fieldErrors.name && (
              <p className="text-error text-xs mt-1">{fieldErrors.name}</p>
            )}
          </div>

          <div>
            <label htmlFor="signup-email" className="block text-sm font-medium text-text mb-1.5">
              Email
            </label>
            <input
              id="signup-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-input border border-border rounded-xl text-text placeholder-text-light focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all duration-200"
              placeholder="seu@email.com"
            />
            {fieldErrors.email && (
              <p className="text-error text-xs mt-1">{fieldErrors.email}</p>
            )}
          </div>

          <div>
            <label htmlFor="signup-password" className="block text-sm font-medium text-text mb-1.5">
              Senha
            </label>
            <input
              id="signup-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-input border border-border rounded-xl text-text placeholder-text-light focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all duration-200"
              placeholder="Mínimo 4 caracteres"
            />
            {fieldErrors.password && (
              <p className="text-error text-xs mt-1">{fieldErrors.password}</p>
            )}
          </div>

          {error && (
            <div className="px-4 py-3 bg-error-bg border border-error/20 rounded-xl text-error text-sm animate-fade-in">
              {error}
            </div>
          )}

          <button
            id="signup-submit-button"
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 bg-accent text-input font-semibold rounded-xl hover:bg-accent-hover transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-accent/20 hover:shadow-accent/30"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Criando conta...
              </span>
            ) : (
              "Criar conta"
            )}
          </button>
        </form>

        <p className="text-center text-text-muted text-sm mt-6">
          Já tem uma conta?{" "}
          <Link href="/login" className="text-accent font-medium hover:text-accent-hover transition-colors">
            Entrar
          </Link>
        </p>
      </div>
    </main>
  );
}
