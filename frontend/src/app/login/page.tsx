"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { extractErrorMessage } from "@/lib/error-handler";
import { authService } from "@/services/auth.service";
import { selectIsAuthenticated, useAuthStore } from "@/store/auth.store";
import { useFormik } from "formik";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";
import * as Yup from "yup";

const schema = Yup.object({
  email: Yup.string().email("সঠিক ইমেইল দিন").required("ইমেইল দিন"),
  password: Yup.string().required("পাসওয়ার্ড দিন"),
});

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const isAuthenticated = useAuthStore(selectIsAuthenticated);

  useEffect(() => {
    if (isAuthenticated) router.replace("/dashboard");
  }, [isAuthenticated, router]);

  const formik = useFormik({
    initialValues: { email: "", password: "" },
    validationSchema: schema,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        const res = await authService.login(values.email, values.password);
        login(res.accessToken, res.user);
        const redirect = sessionStorage.getItem("redirectAfterLogin");
        if (redirect) {
          sessionStorage.removeItem("redirectAfterLogin");
          router.replace(redirect);
        } else {
          router.replace("/dashboard");
        }
      } catch (err: unknown) {
        const { message } = extractErrorMessage(err);
        toast.error(message);
      } finally {
        setSubmitting(false);
      }
    },
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm shadow-lg">
        <CardHeader className="text-center pb-4 pt-6">
          <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm mx-auto mb-3 shadow">
            ক্যা
          </div>
          <CardTitle className="text-2xl font-bold">বাজার হিসাব</CardTitle>
          <p className="text-muted-foreground text-sm mt-0.5">
            আপনার অ্যাকাউন্টে লগইন করুন
          </p>
        </CardHeader>
        <CardContent className="pb-6">
          <form onSubmit={formik.handleSubmit} className="space-y-4" noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="email">ইমেইল</Label>
              <Input
                id="email"
                type="email"
                placeholder="example@email.com"
                autoFocus
                autoComplete="email"
                {...formik.getFieldProps("email")}
                className={formik.touched.email && formik.errors.email ? "border-destructive focus-visible:ring-destructive/30" : ""}
              />
              {formik.touched.email && formik.errors.email && (
                <p className="text-destructive text-xs" role="alert">
                  {formik.errors.email}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">পাসওয়ার্ড</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                {...formik.getFieldProps("password")}
                className={formik.touched.password && formik.errors.password ? "border-destructive focus-visible:ring-destructive/30" : ""}
              />
              {formik.touched.password && formik.errors.password && (
                <p className="text-destructive text-xs" role="alert">
                  {formik.errors.password}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              loading={formik.isSubmitting}
            >
              লগইন করুন
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              অ্যাকাউন্ট নেই?{" "}
              <Link
                href="/register"
                className="text-foreground font-medium underline underline-offset-4 hover:text-primary transition-colors"
              >
                নিবন্ধন করুন
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
