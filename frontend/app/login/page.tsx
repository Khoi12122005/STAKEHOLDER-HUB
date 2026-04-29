"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { Message } from "@/components/ui/message";
import { useAuth } from "@/lib/auth-context";
import { connectSocket } from "@/lib/socket";

export default function LoginPage() {
  const router = useRouter();
  const { login, user, isReady } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isReady && user) {
      const token = localStorage.getItem("scmh_token");
      if (token) {
        connectSocket(token);
      }
      router.replace("/dashboard");
    }
  }, [isReady, user, router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await login({ email, password });

      const token = localStorage.getItem("scmh_token");

      if (token) {
        connectSocket(token);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="grid min-h-screen place-items-center bg-background px-4 py-10">
      <section className="w-full max-w-md rounded-md border border-border bg-white p-6 shadow-soft">
        
        <div className="mb-6 flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-md bg-blue-600 text-sm font-bold text-white">
            SC
          </span>
          <div>
            <h1 className="text-xl font-bold text-gray-900">SCMH</h1>
            <p className="text-sm text-gray-500">
              Stakeholder Communication & Meeting Hub
            </p>
          </div>
        </div>

        <form className="grid gap-4" onSubmit={handleSubmit}>
          
          {error && <Message tone="error">{error}</Message>}

          <Field label="Email">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </Field>

          <Field label="Password">
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </Field>

          <Button type="submit" disabled={isSubmitting}>
            <LogIn className="h-4 w-4" />
            {isSubmitting ? "Signing in..." : "Sign in"}
          </Button>

        </form>

        <p className="mt-5 text-center text-sm text-gray-500">
          New user?{" "}
          <Link href="/register" className="text-blue-600 font-semibold hover:underline">
            Create account
          </Link>
        </p>

      </section>
    </main>
  );
}