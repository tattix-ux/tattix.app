import { UpdatePasswordForm } from "@/components/auth/update-password-form";
import { Logo } from "@/components/shared/logo";
import { AppShell, Container } from "@/components/shared/shell";

export default function UpdatePasswordPage() {
  return (
    <AppShell>
      <Container className="py-6 sm:py-8">
        <Logo />
        <div className="mx-auto flex min-h-[80vh] max-w-xl items-center py-10">
          <UpdatePasswordForm />
        </div>
      </Container>
    </AppShell>
  );
}
