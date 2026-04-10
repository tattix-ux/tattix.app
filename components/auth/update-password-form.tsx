"use client";

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
import { updatePasswordSchema } from "@/lib/forms/schemas";

type UpdateValues = z.infer<typeof updatePasswordSchema>;

export function UpdatePasswordForm() {
  const form = useForm<UpdateValues>({
    resolver: zodResolver(updatePasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(values: UpdateValues) {
    if (!isSupabaseConfigured()) {
      form.setError("root", {
        message: "Add Supabase env vars to update passwords.",
      });
      return;
    }

    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.updateUser({ password: values.password });

    if (error) {
      form.setError("root", { message: error.message });
      return;
    }

    window.location.assign("/dashboard/profile");
  }

  return (
    <Card className="surface-border">
      <CardHeader>
        <CardTitle>Set a new password</CardTitle>
        <CardDescription>
          Choose a fresh password for your Tattix account.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
          <Field label="New password" error={form.formState.errors.password?.message}>
            <Input type="password" placeholder="At least 8 characters" {...form.register("password")} />
          </Field>
          <Field
            label="Confirm password"
            error={form.formState.errors.confirmPassword?.message}
          >
            <Input type="password" placeholder="Repeat password" {...form.register("confirmPassword")} />
          </Field>
          {form.formState.errors.root?.message ? (
            <p className="text-sm text-red-300">{form.formState.errors.root.message}</p>
          ) : null}
          <Button className="w-full" type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? (
              <>
                <LoaderCircle className="size-4 animate-spin" />
                Updating password
              </>
            ) : (
              "Update password"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
