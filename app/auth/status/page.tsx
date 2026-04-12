import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function AuthStatusPage({
  searchParams,
}: {
  searchParams: Promise<{ state?: string; message?: string; next?: string }>;
}) {
  const params = await searchParams;
  const isError = params.state === "error";
  const next = params.next?.startsWith("/") ? params.next : "/dashboard/profile";

  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-xl items-center px-4 py-10">
      <Card className="surface-border w-full">
        <CardHeader>
          <CardTitle>
            {isError ? "Bağlantı kullanılamadı" : "E-posta doğrulandı"}
          </CardTitle>
          <CardDescription>
            {isError
              ? params.message ?? "Doğrulama bağlantısı geçersiz veya süresi dolmuş olabilir."
              : "Hesabın doğrulandı. Şimdi panele güvenle devam edebilirsin."}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href={isError ? "/login" : next}>{isError ? "Girişe dön" : "Panele devam et"}</Link>
          </Button>
          {!isError ? (
            <Button asChild variant="outline">
              <Link href="/login">Giriş sayfası</Link>
            </Button>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
