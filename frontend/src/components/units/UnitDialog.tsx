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
import { validatePositiveNumber, validateUnitName } from "@/lib/validators";
import { unitsService } from "@/services/units.service";
import { selectIsAdmin, useAuthStore } from "@/store/auth.store";
import type { Unit } from "@/types";
import { useFormik } from "formik";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import * as Yup from "yup";

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  unit?: Unit | null;
}

const schema = Yup.object({
  name: Yup.string()
    .trim()
    .required("এককের নাম দিন")
    .test("valid-name", "অবৈধ একক নাম", (value) =>
      value ? validateUnitName(value) : false,
    ),
  type: Yup.string().oneOf(["USER", "SYSTEM"]),
  groupKey: Yup.string(),
  baseRatio: Yup.number()
    .nullable()
    .when("groupKey", {
      is: (v: string) => !!v,
      then: (s) =>
        s
          .required("রূপান্তর অনুপাত দিন")
          .test("positive", "ধনাত্মক সংখ্যা দিন", (val) =>
            val ? validatePositiveNumber(val) : false,
          ),
    }),
});

const selectClass =
  "mt-1.5 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm shadow-sm transition-all outline-none cursor-pointer appearance-none focus:border-ring focus:ring-2 focus:ring-ring/30 hover:border-primary/50 disabled:opacity-50 disabled:cursor-not-allowed";

export function UnitDialog({ open, onClose, onSuccess, unit }: Props) {
  const isAdmin = useAuthStore(selectIsAdmin);
  const isEdit = !!unit;
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formik = useFormik({
    initialValues: {
      name: unit?.name ?? "",
      type: (unit?.type ?? "USER") as "USER" | "SYSTEM",
      groupKey: unit?.groupKey ?? "",
      baseRatio: unit?.baseRatio != null ? String(unit.baseRatio) : "",
    },
    enableReinitialize: true,
    validationSchema: schema,
    onSubmit: async (values) => {
      setIsSubmitting(true);
      const groupKey = values.groupKey || null;
      const baseRatio =
        groupKey && values.baseRatio ? Number(values.baseRatio) : null;
      try {
        if (isEdit) {
          await unitsService.update(unit!.id, {
            name: values.name,
            groupKey,
            baseRatio,
          });
          toast.success("একক আপডেট হয়েছে");
        } else {
          await unitsService.create({
            name: values.name,
            type: values.type,
            groupKey,
            baseRatio,
          });
          toast.success("একক তৈরি হয়েছে");
        }
        formik.resetForm();
        onSuccess();
        onClose();
      } catch (err: unknown) {
        const { message } = extractErrorMessage(err);
        toast.error(message);
      } finally {
        setIsSubmitting(false);
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
          <DialogTitle>{isEdit ? "একক সম্পাদনা" : "নতুন একক"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={formik.handleSubmit} className="space-y-4 mt-2">
          <div>
            <Label htmlFor="u-name">এককের নাম</Label>
            <Input
              id="u-name"
              placeholder="যেমন: কেজি, লিটার, পিস"
              className="mt-1.5"
              disabled={isSubmitting}
              {...formik.getFieldProps("name")}
            />
            {err("name")}
          </div>

          <div>
            <Label htmlFor="u-group">রূপান্তর গ্রুপ</Label>
            <select
              id="u-group"
              className={selectClass}
              disabled={isSubmitting}
              {...formik.getFieldProps("groupKey")}
            >
              <option value="">কোনো গ্রুপ নেই</option>
              <option value="weight">ওজন</option>
              <option value="volume">পরিমাণ / আয়তন</option>
              <option value="count">সংখ্যা</option>
            </select>
          </div>

          {formik.values.groupKey && (
            <div>
              <Label htmlFor="u-ratio">বেস অনুপাত</Label>
              <Input
                id="u-ratio"
                type="number"
                step="any"
                placeholder="যেমন: কেজি=1, গ্রাম=0.001"
                className="mt-1.5"
                disabled={isSubmitting}
                {...formik.getFieldProps("baseRatio")}
              />
              <p className="text-xs text-muted-foreground mt-1">
                base unit-এর তুলনায় অনুপাত
              </p>
              {err("baseRatio")}
            </div>
          )}

          {isAdmin && !isEdit && (
            <div>
              <Label htmlFor="u-type">ধরন</Label>
              <select
                id="u-type"
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
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? "সংরক্ষণ হচ্ছে..." : "সংরক্ষণ করুন"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
