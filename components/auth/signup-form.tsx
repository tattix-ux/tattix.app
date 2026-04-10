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
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { signUpSchema } from "@/lib/forms/schemas";

type SignUpValues = z.infer<typeof signUpSchema>;

export function SignupForm() {
  const form = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      artistName: "",
      slug: "",
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: SignUpValues) {
    if (!isSupabaseConfigured()) {
      form.setError("root", {
        message: "Add Supabase env vars to enable sign up and dashboard access.",
      });
      return;
    }

    const supabase = createSupabaseBrowserClient();
    const redirectTo = `${window.location.origin}/auth/callback?next=/dashboard/profile`;
    const { data, error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        emailRedirectTo: redirectTo,
        data: {
          artist_name: values.artistName,
          slug: values.slug,
        },
      },
    });

    if (error) {
      form.setError("root", { message: error.message });
      return;
    }

    if (data.session) {
      window.location.assign("/dashboard/profile");
      return;
    }

    form.reset();
    form.setError("root", {
      message: "Account created. Check your email to confirm the account and continue.",
    });
  }

  return (
    <Card className="surface-border">
      <CardHeader>
        <CardTitle>Create your artist page</CardTitle>
        <CardDescription>
          Set up your Tattix profile, pricing engine, and public bio link in one place.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
          <Field label="Artist name" error={form.formState.errors.artistName?.message}>
            <Input placeholder="Ink Atelier" {...form.register("artistName")} />
          </Field>
          <Field
            label="Public slug"
            description="This becomes your public page path."
            error={form.formState.errors.slug?.message}
          >
            <Input placeholder="ink-atelier" {...form.register("slug")} />
          </Field>
          <Field label="Email" error={form.formState.errors.email?.message}>
            <Input type="email" placeholder="artist@studio.com" {...form.register("email")} />
          </Field>
          <Field label="Password" error={form.formState.errors.password?.message}>
            <Input type="password" placeholder="At least 8 characters" {...form.register("password")} />
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
                Creating account
              </>
            ) : (
              "Create artist page"
            )}
          </Button>
        </form>
        <p className="mt-6 text-sm text-[var(--foreground-muted)]">
          Already have an account?{" "}
          <Link href="/login" className="text-white hover:text-[var(--accent-soft)]">
            Log in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
