"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { Message } from "@/components/ui/message";
import { useAuth } from "@/lib/auth-context";
import type { Role } from "@/types/api";

const roles: Role[] = ["BA", "STAKEHOLDER", "DEVELOPER", "TESTER"];

export default function RegisterPage() {
  const router = useRouter();
  const { register, user, isReady } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("STAKEHOLDER");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isReady && user) {
      router.replace("/dashboard");
    }
  }, [isReady, router, user]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await register({ name, email, password, role });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="grid min-h-screen place-items-center bg-background px-4 py-10">
      <section className="w-full max-w-md rounded-md border border-border bg-white p-6 shadow-soft">
        <div className="mb-6 flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-md bg-brand-600 text-sm font-bold text-white">
            SC
          </span>
          <div>
            <h1 className="text-xl font-bold text-ink">Create SCMH account</h1>
            <p className="text-sm text-muted">Access is controlled by role.</p>
          </div>
        </div>

        <form className="grid gap-4" onSubmit={handleSubmit}>
          {error ? <Message tone="error">{error}</Message> : null}

          <Field label="Name">
            <Input value={name} onChange={(event) => setName(event.target.value)} required autoComplete="name" />
          </Field>

          <Field label="Email">
            <Input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              autoComplete="email"
            />
          </Field>

          <Field label="Password">
            <Input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
            />
          </Field>

          <Field label="Role">
            <Select value={role} onChange={(event) => setRole(event.target.value as Role)}>
              {roles.map((item) => (
                <option key={item} value={item}>
                  {item === "STAKEHOLDER" ? "Stakeholder" : item.charAt(0) + item.slice(1).toLowerCase()}
                </option>
              ))}
            </Select>
          </Field>

          <Button type="submit" disabled={isSubmitting}>
            <UserPlus className="h-4 w-4" />
            {isSubmitting ? "Creating" : "Create account"}
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-muted">
          Already registered?{" "}
          <Link className="font-semibold text-brand-700 hover:underline" href="/login">
            Sign in
          </Link>
        </p>
      </section>
    </main>
  );
}
