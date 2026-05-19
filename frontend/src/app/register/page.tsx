"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { extractErrorMessage } from "@/lib/error-handler";
import { authService } from "@/services/auth.service";
import { useAuthStore } from "@/store/auth.store";
import { useFormik } from "formik";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import * as Yup from "yup";

const schema = Yup.object({
  name: Yup.string().min(2, "কমপক্ষে ২ অক্ষর").required("নাম দিন"),
  email: Yup.string().email("সঠিক ইমেইল দিন").required("ইমেইল দিন"),
  password: Yup.string()
    .min(8, "পাসওয়ার্ড কমপক্ষে ৮ অক্ষর হতে হবে")
    .matches(/[a-zA-Z]/, "পাসওয়ার্ডে কমপক্ষে একটি অক্ষর (a-z) থাকতে হবে")
    .matches(/[0-9]/, "পাসওয়ার্ডে কমপক্ষে একটি সংখ্যা (0-9) থাকতে হবে")
    .required("পাসওয়ার্ড দিন"),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("password")], "পাসওয়ার্ড মিলছে না")
    .required("পাসওয়ার্ড নিশ্চিত করুন"),
});

export default function RegisterPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);

  const formik = useFormik({
    initialValues: { name: "", email: "", password: "", confirmPassword: "" },
    validationSchema: schema,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        await authService.register(values.name, values.email, values.password);
        toast.success("নিবন্ধন সফল হয়েছে! এখন লগইন করুন।");
        router.replace("/login");
      } catch (err: unknown) {
        const { message } = extractErrorMessage(err);
        toast.error(message);
      } finally {
        setSubmitting(false);
      }
    },
  });

  const field = (
    id: keyof typeof formik.values,
    label: string,
    type = "text",
    placeholder = "",
    autoComplete?: string,
    autoFocus?: boolean,
  ) => (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        placeholder={placeholder}
        autoComplete={autoComplete}
        autoFocus={autoFocus}
        {...formik.getFieldProps(id)}
      />
      {formik.touched[id] && formik.errors[id] && (
        <p className="text-destructive text-xs">{formik.errors[id]}</p>
      )}
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-2xl font-bold">নিবন্ধন</CardTitle>
          <p className="text-muted-foreground text-sm">
            নতুন অ্যাকাউন্ট তৈরি করুন
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={formik.handleSubmit} className="space-y-4">
            {field("name", "পূর্ণ নাম", "text", "আপনার নাম", "name", true)}
            {field("email", "ইমেইল", "email", "example@email.com", "email")}
            {field("password", "পাসওয়ার্ড", "password", "••••••••", "new-password")}
            {field(
              "confirmPassword",
              "পাসওয়ার্ড নিশ্চিত করুন",
              "password",
              "••••••••",
              "new-password",
            )}

            <Button
              type="submit"
              className="w-full"
              loading={formik.isSubmitting}
            >
              অ্যাকাউন্ট তৈরি করুন
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              অ্যাকাউন্ট আছে?{" "}
              <Link
                href="/login"
                className="text-foreground underline underline-offset-4"
              >
                লগইন করুন
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
