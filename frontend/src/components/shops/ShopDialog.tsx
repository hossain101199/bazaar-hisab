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
import { selectIsAdmin, useAuthStore } from "@/store/auth.store";
import type { Shop } from "@/types";
import { useFormik } from "formik";
import { useEffect } from "react";
import { toast } from "sonner";
import * as Yup from "yup";

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  shop?: Shop | null;
}

const schema = Yup.object({
  name: Yup.string().trim().required("দোকানের নাম দিন"),
  address: Yup.string(),
  type: Yup.string().oneOf(["USER", "SYSTEM"]),
});

const selectClass =
  "mt-1.5 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm shadow-sm transition-all outline-none cursor-pointer appearance-none focus:border-ring focus:ring-2 focus:ring-ring/30 hover:border-primary/50 disabled:opacity-50 disabled:cursor-not-allowed";

export function ShopDialog({ open, onClose, onSuccess, shop }: Props) {
  const isAdmin = useAuthStore(selectIsAdmin);
  const isEdit = !!shop;

  const formik = useFormik({
    initialValues: {
      name: shop?.name ?? "",
      address: shop?.address ?? "",
      type: (shop?.type ?? "USER") as "USER" | "SYSTEM",
    },
    enableReinitialize: true,
    validationSchema: schema,
    onSubmit: async (values, { setSubmitting, resetForm }) => {
      try {
        if (isEdit) {
          await shopsService.update(shop!.id, {
            name: values.name,
            address: values.address || undefined,
          });
          toast.success("দোকান আপডেট হয়েছে");
        } else {
          await shopsService.create({
            name: values.name,
            address: values.address || undefined,
            type: values.type,
          });
          toast.success("দোকান তৈরি হয়েছে");
        }
        resetForm();
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
      <p className="text-destructive text-xs mt-1">
        {String(formik.errors[f])}
      </p>
    ) : null;

  const { isSubmitting } = formik;

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v && !isSubmitting) onClose();
      }}
      modal={true}
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
          </div>

          {isAdmin && !isEdit && (
            <div>
              <Label htmlFor="shop-type">ধরন</Label>
              <select
                id="shop-type"
                className={selectClass}
                disabled={isSubmitting}
                {...formik.getFieldProps("type")}
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
