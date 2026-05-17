"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  validateDate,
  validatePrice,
  validateQuantity,
} from "@/lib/validators";
import { extractErrorMessage } from "@/lib/error-handler";
import { purchasesService } from "@/services/purchases.service";
import type { Product, Purchase } from "@/types";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { useFormik } from "formik";
import { ChevronLeft, Plus, Trash2 } from "lucide-react";
import { useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import * as Yup from "yup";
import { ProductSelect } from "./ProductSelect";

interface ItemValue {
  productId: number | "";
  quantity: string;
  totalPrice: string;
}

interface FormValues {
  date: string;
  note: string;
  items: ItemValue[];
}

const emptyItem: ItemValue = { productId: "", quantity: "", totalPrice: "" };

const schema = Yup.object({
  date: Yup.string()
    .required("তারিখ দিন")
    .test("valid-date", "অবৈধ তারিখ", (value) =>
      value ? validateDate(value) : false,
    )
    .test("not-future", "ভবিষ্যতের তারিখ দিতে পারবেন না", (value) => {
      if (!value) return true;
      const todayStr = new Date().toLocaleDateString('en-CA');
      return value <= todayStr;
    }),
  note: Yup.string(),
  items: Yup.array()
    .of(
      Yup.object({
        productId: Yup.number()
          .typeError("পণ্য বেছে নিন")
          .required("পণ্য বেছে নিন")
          .positive("পণ্য বেছে নিন"),
        quantity: Yup.number()
          .typeError("সংখ্যা দিন")
          .required("পরিমাণ দিন")
          .test("positive-quantity", "ধনাত্মক সংখ্যা দিন", (val) =>
            val ? validateQuantity(val) : false,
          )
          .test("reasonable-quantity", "অযৌক্তিক পরিমাণ", (val) =>
            val ? val < 1000000 : true,
          ),
        totalPrice: Yup.number()
          .typeError("সংখ্যা দিন")
          .required("মোট দাম দিন")
          .test("positive-price", "ধনাত্মক মূল্য দিন", (val) =>
            val ? validatePrice(val) : false,
          ),
      }),
    )
    .min(1, "কমপক্ষে একটি পণ্য যোগ করুন"),
});

interface Props {
  products: Product[];
  purchase?: Purchase | null;
  onCancel?: () => void;
}

export function PurchaseForm({ products, purchase, onCancel }: Props) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isEdit = !!purchase;

  // Stable keys for item cards — avoids React unmount/remount when removing mid-list items
  const nextKey = useRef(0)
  const itemKeys = useRef<number[]>(
    (purchase?.items ?? [emptyItem]).map(() => nextKey.current++)
  )

  const initialItems: ItemValue[] = purchase?.items.map((item) => ({
    productId: item.product.id,
    quantity: String(item.quantity),
    totalPrice: String(item.totalPrice),
  })) ?? [emptyItem];

  const formik = useFormik<FormValues>({
    initialValues: {
      date: purchase
        ? format(new Date(purchase.date), "yyyy-MM-dd")
        : format(new Date(), "yyyy-MM-dd"),
      note: purchase?.note ?? "",
      items: initialItems,
    },
    validationSchema: schema,
    onSubmit: async (values, { setSubmitting }) => {
      const payload = {
        date: values.date,
        note: values.note || undefined,
        items: values.items.map((item) => ({
          productId: Number(item.productId),
          quantity: Number(item.quantity),
          totalPrice: Number(item.totalPrice),
        })),
      };
      try {
        if (isEdit) {
          await purchasesService.update(purchase!.id, payload);
          toast.success("বাজার আপডেট হয়েছে");
          // Invalidate this specific purchase so detail view shows fresh data
          queryClient.invalidateQueries({ queryKey: ['purchase', purchase!.id] })
        } else {
          await purchasesService.create(payload);
          toast.success("বাজার সংরক্ষণ হয়েছে");
        }
        queryClient.invalidateQueries({ queryKey: ['purchases'] })
        queryClient.invalidateQueries({ queryKey: ['summary'] })
        router.replace("/purchases");
      } catch (err: unknown) {
        const { message } = extractErrorMessage(err);
        toast.error(message);
      } finally {
        setSubmitting(false);
      }
    },
  });

  const items = formik.values.items;
  const totalAmount = items.reduce(
    (s, item) => s + (Number(item.totalPrice) || 0),
    0,
  );

  const addItem = () => {
    itemKeys.current = [...itemKeys.current, nextKey.current++]
    formik.setFieldValue("items", [...items, emptyItem])
  }

  const removeItem = (i: number) => {
    itemKeys.current = itemKeys.current.filter((_, idx) => idx !== i)
    formik.setFieldValue("items", items.filter((_, idx) => idx !== i))
  }

  const setItem = (
    i: number,
    key: keyof ItemValue,
    val: string | number | "",
  ) => formik.setFieldValue(`items[${i}].${key}`, val);

  const itemErrors = (i: number, key: keyof ItemValue) => {
    const errs = formik.errors.items as
      | (Record<string, string> | undefined)[]
      | undefined;
    const touched = formik.touched.items as
      | (Record<string, boolean> | undefined)[]
      | undefined;
    return touched?.[i]?.[key] && errs?.[i]?.[key] ? (
      <p className="text-destructive text-xs mt-0.5">{errs[i]![key]}</p>
    ) : null;
  };

  return (
    <form
      onSubmit={formik.handleSubmit}
      className="p-4 md:p-6 space-y-5 max-w-2xl mx-auto"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onCancel ?? (() => router.back())}
          aria-label="ফিরে যান"
          className="text-muted-foreground"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h1 className="text-xl font-bold">
          {isEdit ? "বাজার সম্পাদনা" : "নতুন বাজার"}
        </h1>
      </div>

      {/* Date + Note */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div>
            <Label htmlFor="date">তারিখ</Label>
            <Input
              id="date"
              type="date"
              className="mt-1.5"
              {...formik.getFieldProps("date")}
            />
            {formik.touched.date && formik.errors.date && (
              <p className="text-destructive text-xs mt-0.5">
                {formik.errors.date}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="note">নোট (ঐচ্ছিক)</Label>
            <Input
              id="note"
              placeholder="যেমন: সাপ্তাহিক বাজার"
              className="mt-1.5"
              {...formik.getFieldProps("note")}
            />
          </div>
        </CardContent>
      </Card>

      {/* Items */}
      <div className="space-y-3">
        <h2 className="font-semibold">পণ্য তালিকা</h2>

        {typeof formik.errors.items === "string" && (
          <p className="text-destructive text-sm">{formik.errors.items}</p>
        )}

        {items.map((item, i) => {
          const product = products.find((p) => p.id === item.productId);
          const pricePerUnit =
            Number(item.quantity) > 0 && Number(item.totalPrice) > 0
              ? (Number(item.totalPrice) / Number(item.quantity)).toFixed(2)
              : null;

          return (
            <Card key={itemKeys.current[i]} className="border-border shadow-sm">
              <CardContent className="p-0">
                {/* Card header */}
                <div className="flex items-center justify-between px-3 py-2 border-b bg-secondary/50 rounded-t-lg">
                  <span className="text-xs font-semibold text-muted-foreground">
                    পণ্য #{i + 1}
                    {product && (
                      <span className="text-foreground ml-1.5">
                        {product.name}
                      </span>
                    )}
                  </span>
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(i)}
                      aria-label={`পণ্য #${i + 1} সরিয়ে দিন`}
                      className="text-destructive/70 hover:text-destructive transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                <div className="p-3 space-y-3">
                  {/* Product select */}
                  <div>
                    <ProductSelect
                      products={products}
                      value={item.productId}
                      onChange={(id) => setItem(i, "productId", id)}
                    />
                    {product?.lastPrice != null && (
                      <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary/60" />
                        সর্বশেষ দাম: ৳{product.lastPrice.toFixed(2)} /{" "}
                        {product.unit.name}
                      </p>
                    )}
                    {itemErrors(i, "productId")}
                  </div>

                  {/* Quantity + Price */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <Label className="text-xs mb-1 block text-muted-foreground">
                        পরিমাণ {product ? `(${product.unit.name})` : ""}
                      </Label>
                      <Input
                        type="number"
                        step="any"
                        min="0"
                        placeholder="0"
                        value={item.quantity}
                        onChange={(e) => setItem(i, "quantity", e.target.value)}
                        onBlur={() =>
                          formik.setFieldTouched(`items[${i}].quantity`, true)
                        }
                      />
                      {itemErrors(i, "quantity")}
                    </div>
                    <div>
                      <Label className="text-xs mb-1 block text-muted-foreground">
                        মোট দাম (৳)
                      </Label>
                      <Input
                        type="number"
                        step="any"
                        min="0"
                        placeholder="0"
                        value={item.totalPrice}
                        onChange={(e) =>
                          setItem(i, "totalPrice", e.target.value)
                        }
                        onBlur={() =>
                          formik.setFieldTouched(`items[${i}].totalPrice`, true)
                        }
                      />
                      {itemErrors(i, "totalPrice")}
                    </div>
                  </div>

                  {/* Calculated unit price */}
                  {pricePerUnit && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-secondary/60 rounded-md px-2.5 py-1.5">
                      <span>একক দাম:</span>
                      <span className="font-semibold text-foreground">
                        ৳{pricePerUnit} / {product?.unit.name || "একক"}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}

        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={addItem}
          className="w-full"
        >
          <Plus className="h-3.5 w-3.5 mr-1" /> পণ্য যোগ করুন
        </Button>
      </div>

      {/* Summary + Submit */}
      <Separator />
      <div className="flex items-center justify-between py-1">
        <div>
          <p className="text-sm text-muted-foreground">
            মোট ({items.length} পণ্য)
          </p>
          <p className="text-2xl font-bold">
            ৳{totalAmount.toLocaleString("bn-BD", { maximumFractionDigits: 2 })}
          </p>
        </div>
        <Button
          type="submit"
          loading={formik.isSubmitting}
          className="min-w-28"
        >
          সংরক্ষণ করুন
        </Button>
      </div>
    </form>
  );
}
