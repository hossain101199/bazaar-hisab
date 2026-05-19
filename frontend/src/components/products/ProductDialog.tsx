"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { extractErrorMessage } from "@/lib/error-handler";
import { validateProductName } from "@/lib/validators";
import { productsService } from "@/services/products.service";
import { selectIsAdmin, useAuthStore } from "@/store/auth.store";
import type { Product, Unit } from "@/types";
import { useFormik } from "formik";
import { useEffect } from "react";
import { toast } from "sonner";
import * as Yup from "yup";

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  units: Unit[];
  product?: Product | null;
}

const schema = Yup.object({
  name: Yup.string()
    .trim()
    .required("পণ্যের নাম দিন")
    .test("valid-name", "অবৈধ পণ্য নাম", (value) =>
      value ? validateProductName(value) : false,
    ),
  unitId: Yup.string().required("একক বেছে নিন"),
  type: Yup.string().oneOf(["USER", "SYSTEM"]),
});

const selectClass =
  "mt-1.5 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm shadow-sm transition-all outline-none cursor-pointer appearance-none focus:border-ring focus:ring-2 focus:ring-ring/30 hover:border-primary/50 disabled:opacity-50 disabled:cursor-not-allowed";

export function ProductDialog({ open, onClose, onSuccess, units, product }: Props) {
  const isAdmin = useAuthStore(selectIsAdmin);
  const isEdit = !!product;

  const formik = useFormik({
    initialValues: {
      name: product?.name ?? "",
      unitId: product?.unitId ? String(product.unitId) : "",
      type: product?.type ?? "USER",
    },
    enableReinitialize: true,
    validationSchema: schema,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        if (isEdit) {
          await productsService.update(product!.id, {
            name: values.name,
            unitId: Number(values.unitId),
          });
          toast.success("পণ্য আপডেট হয়েছে");
        } else {
          await productsService.create({
            name: values.name,
            unitId: Number(values.unitId),
            type: values.type,
          });
          toast.success("পণ্য তৈরি হয়েছে");
        }
        formik.resetForm();
        onSuccess();
        onClose();
      } catch (err: unknown) {
        const { message } = extractErrorMessage(err);
        toast.error(message);
      } finally {
        setSubmitting(false);
      }
    },
  });

  useEffect(() => {
    if (!open) formik.resetForm();
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const err = (f: keyof typeof formik.values) =>
    formik.touched[f] && formik.errors[f] ? (
      <p className="text-destructive text-xs mt-1">{formik.errors[f]}</p>
    ) : null;

  const { isSubmitting } = formik;

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => { if (!v && !isSubmitting) onClose(); }}
      modal={true}
    >
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{isEdit ? "পণ্য সম্পাদনা" : "নতুন পণ্য"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={formik.handleSubmit} className="space-y-4 mt-2">
          <div>
            <Label htmlFor="p-name">পণ্যের নাম</Label>
            <Input
              id="p-name"
              placeholder="যেমন: আলু, পেঁয়াজ"
              className="mt-1.5"
              disabled={isSubmitting}
              {...formik.getFieldProps("name")}
            />
            {err("name")}
          </div>

          <div>
            <Label htmlFor="p-unit">একক</Label>
            <select
              id="p-unit"
              className={selectClass}
              disabled={isEdit || isSubmitting}
              {...formik.getFieldProps("unitId")}
            >
              <option value="">একক বেছে নিন</option>
              {(formik.values.type === "SYSTEM" ? units.filter(u => u.type === "SYSTEM") : units).map((u) => (
                <option key={u.id} value={String(u.id)}>
                  {u.name}
                  {u.type === "SYSTEM" ? " ★" : ""}
                </option>
              ))}
            </select>
            {isEdit && (
              <p className="text-muted-foreground text-xs mt-1">
                একক পরিবর্তন করা যাবে না
              </p>
            )}
            {err("unitId")}
          </div>

          {isAdmin && !isEdit && (
            <div>
              <Label htmlFor="p-type">ধরন</Label>
              <select
                id="p-type"
                className={selectClass}
                disabled={isSubmitting}
                {...formik.getFieldProps("type")}
                onChange={(e) => {
                  formik.setFieldValue("type", e.target.value);
                  // Clear unit selection when switching types — the unit list changes.
                  formik.setFieldValue("unitId", "");
                }}
              >
                <option value="USER">ব্যক্তিগত</option>
                <option value="SYSTEM">সিস্টেম (সবার জন্য)</option>
              </select>
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={onClose}
              disabled={isSubmitting}
            >
              বাতিল
            </Button>
            <Button type="submit" className="flex-1" loading={isSubmitting}>
              সংরক্ষণ করুন
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
