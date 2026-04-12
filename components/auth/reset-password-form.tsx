"use client";

import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { LoaderCircle } from "lucide-react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/shared/field";
import { getAppOrigin } from "@/lib/config/site";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { resetPasswordSchema } from "@/lib/forms/schemas";

type ResetValues = z.infer<typeof resetPasswordSchema>;

export function ResetPasswordForm() {
  const form = useForm<ResetValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  async function onSubmit(values: ResetValues) {
    if (!isSupabaseConfigured()) {
      form.setError("root", {
        message: "Add Supabase env vars to enable password reset emails.",
      });
      return;
    }

    const supabase = createSupabaseBrowserClient();
    const redirectTo = `${getAppOrigin()}/auth/callback?next=/update-password`;
    const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
      redirectTo,
    });

    if (error) {
      form.setError("root", { message: error.message });
      return;
    }

    form.reset();
    form.setError("root", {
      message: "Reset link sent. Check your inbox to continue.",
    });
  }

  return (
    <Card className="surface-border">
      <CardHeader>
        <CardTitle>Reset password</CardTitle>
        <CardDescription>
          We’ll send you a secure link so you can set a new password.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
          <Field label="Email" error={form.formState.errors.email?.message}>
            <Input type="email" placeholder="artist@studio.com" {...form.register("email")} />
          </Field>
          {form.formState.errors.root?.message ? (
            <p className="text-sm text-[var(--accent-soft)]">
              {form.formState.errors.root.message}
            </p>
          ) : null}
          <Button className="w-full" type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? (
              <>
                <LoaderCircle className="size-4 animate-spin" />
                Sending link
              </>
            ) : (
              "Send reset link"
            )}
          </Button>
        </form>
        <p className="mt-6 text-sm text-[var(--foreground-muted)]">
          Back to{" "}
          <Link href="/login" className="text-white hover:text-[var(--accent-soft)]">
            login
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
