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
import { nativeSelectClass } from "@/lib/utils";
import { productsService } from "@/services/products.service";
import type { Product, Unit } from "@/types";
import { useFormik } from "formik";
import { useEffect, useRef } from "react";
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
    .max(200, "নাম সর্বোচ্চ ২০০ অক্ষর হতে পারবে"),
  unitId: Yup.string().required("একক বেছে নিন"),
});

export function ProductDialog({ open, onClose, onSuccess, units, product }: Props) {
  const isEdit = !!product;

  const formik = useFormik({
    initialValues: {
      name: product?.name ?? "",
      unitId: product?.unitId ? String(product.unitId) : "",
    },
    enableReinitialize: true,
    validationSchema: schema,
    onSubmit: async (values, { setSubmitting, resetForm }) => {
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
          });
          toast.success("পণ্য তৈরি হয়েছে");
        }
        resetForm();
        onSuccess();
        onClose();
      } catch (err: unknown) {
        toast.error(extractErrorMessage(err).message);
      } finally {
        setSubmitting(false);
      }
    },
  });

  // Keep ref updated every render so the effect always calls the latest resetForm.
  const resetFormRef = useRef(formik.resetForm);
  resetFormRef.current = formik.resetForm;
  useEffect(() => {
    if (!open) resetFormRef.current();
  }, [open]);

  const err = (f: keyof typeof formik.values) =>
    formik.touched[f] && formik.errors[f] ? (
      <p className="text-destructive text-xs mt-1">{formik.errors[f]}</p>
    ) : null;

  const { isSubmitting } = formik;

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v && !isSubmitting) onClose();
      }}
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
              autoFocus
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
              className={nativeSelectClass}
              disabled={isEdit || isSubmitting}
              {...formik.getFieldProps("unitId")}
            >
              <option value="">একক বেছে নিন</option>
              {units.map((u) => (
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
