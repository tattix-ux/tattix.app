"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { LoaderCircle } from "lucide-react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/shared/field";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { loginSchema } from "@/lib/forms/schemas";

type LoginValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  useEffect(() => {
    router.prefetch("/dashboard/profile");
  }, [router]);

  async function onSubmit(values: LoginValues) {
    if (!isSupabaseConfigured()) {
      form.setError("root", {
        message: "Add Supabase env vars to enable authentication.",
      });
      return;
    }

    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithPassword(values);

    if (error) {
      form.setError("root", { message: error.message });
      return;
    }

    router.replace("/dashboard/profile");
  }

  return (
    <Card className="surface-border">
      <CardHeader>
        <CardTitle>Welcome back</CardTitle>
        <CardDescription>
          Sign in to manage your public page, pricing rules, and incoming leads.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
          <Field label="Email" error={form.formState.errors.email?.message}>
            <Input
              type="email"
              placeholder="artist@studio.com"
              {...form.register("email")}
            />
          </Field>
          <Field label="Password" error={form.formState.errors.password?.message}>
            <Input
              type="password"
              placeholder="••••••••"
              {...form.register("password")}
            />
          </Field>
          {form.formState.errors.root?.message ? (
            <p className="text-sm text-red-300">{form.formState.errors.root.message}</p>
          ) : null}
          <Button className="w-full" type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? (
              <>
                <LoaderCircle className="size-4 animate-spin" />
                Signing in
              </>
            ) : (
              "Log in"
            )}
          </Button>
        </form>
        <div className="mt-6 flex items-center justify-between text-sm text-[var(--foreground-muted)]">
          <Link href="/reset-password" className="hover:text-white">
            Forgot password?
          </Link>
          <Link href="/signup" className="hover:text-white">
            Create account
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
