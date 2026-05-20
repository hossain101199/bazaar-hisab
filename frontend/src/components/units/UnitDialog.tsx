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
import { unitsService } from "@/services/units.service";
import type { Unit } from "@/types";
import { useFormik } from "formik";
import { useEffect, useRef } from "react";
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
    .max(100, "নাম সর্বোচ্চ ১০০ অক্ষর হতে পারবে"),
  groupKey: Yup.string(),
  baseRatio: Yup.number()
    .nullable()
    .when("groupKey", {
      is: (v: string) => !!v,
      then: (s) => s.required("রূপান্তর অনুপাত দিন").positive("ধনাত্মক সংখ্যা দিন"),
    }),
});

export function UnitDialog({ open, onClose, onSuccess, unit }: Props) {
  const isEdit = !!unit;

  const formik = useFormik({
    initialValues: {
      name: unit?.name ?? "",
      groupKey: unit?.groupKey ?? "",
      baseRatio: unit?.baseRatio != null ? String(unit.baseRatio) : "",
    },
    enableReinitialize: true,
    validationSchema: schema,
    onSubmit: async (values, { setSubmitting, resetForm }) => {
      const groupKey = values.groupKey || null;
      const baseRatio = groupKey && values.baseRatio ? Number(values.baseRatio) : null;
      try {
        if (isEdit) {
          await unitsService.update(unit!.id, { name: values.name, groupKey, baseRatio });
          toast.success("একক আপডেট হয়েছে");
        } else {
          await unitsService.create({
            name: values.name,
            groupKey,
            baseRatio,
          });
          toast.success("একক তৈরি হয়েছে");
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
          <DialogTitle>{isEdit ? "একক সম্পাদনা" : "নতুন একক"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={formik.handleSubmit} className="space-y-4 mt-2">
          <div>
            <Label htmlFor="u-name">এককের নাম</Label>
            <Input
              id="u-name"
              autoFocus
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
              className={nativeSelectClass}
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
