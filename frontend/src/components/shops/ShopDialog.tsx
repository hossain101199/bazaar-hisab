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
import { shopsService } from "@/services/shops.service";
import type { Shop } from "@/types";
import { useFormik } from "formik";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import * as Yup from "yup";

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  shop?: Shop | null;
}

const schema = Yup.object({
  name: Yup.string().trim().required("দোকানের নাম দিন").max(100, "নাম সর্বোচ্চ ১০০ অক্ষর হতে পারে"),
  address: Yup.string().max(300, "ঠিকানা সর্বোচ্চ ৩০০ অক্ষর হতে পারে"),
});

export function ShopDialog({ open, onClose, onSuccess, shop }: Props) {
  const isEdit = !!shop;

  const formik = useFormik({
    initialValues: {
      name: shop?.name ?? "",
      address: shop?.address ?? "",
    },
    enableReinitialize: true,
    validationSchema: schema,
    onSubmit: async (values, { setSubmitting, resetForm }) => {
      try {
        if (isEdit) {
          await shopsService.update(shop!.id, {
            name: values.name,
            address: values.address || null,
          });
          toast.success("দোকান আপডেট হয়েছে");
        } else {
          await shopsService.create({
            name: values.name,
            address: values.address || undefined,
          });
          toast.success("দোকান তৈরি হয়েছে");
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
      <p className="text-destructive text-xs mt-1">{String(formik.errors[f])}</p>
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
          <DialogTitle>{isEdit ? "দোকান সম্পাদনা" : "নতুন দোকান"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={formik.handleSubmit} className="space-y-4 mt-2">
          <div>
            <Label htmlFor="shop-name">দোকানের নাম</Label>
            <Input
              id="shop-name"
              autoFocus
              placeholder="যেমন: করিম স্টোর, আগোরা"
              className="mt-1.5"
              disabled={isSubmitting}
              {...formik.getFieldProps("name")}
            />
            {err("name")}
          </div>

          <div>
            <Label htmlFor="shop-address">ঠিকানা (ঐচ্ছিক)</Label>
            <Input
              id="shop-address"
              placeholder="যেমন: মিরপুর-১, ঢাকা"
              className="mt-1.5"
              disabled={isSubmitting}
              {...formik.getFieldProps("address")}
            />
            {err("address")}
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
