"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

import { useRouter } from "next/navigation";
import { usePost } from "@/hooks/use-api-mutation";
import { useApiFetch } from "@/hooks/use-api-fetch";
import DashboardLayout from "@/components/layouts/dashboard-layout";
import { toast } from "sonner";
import SearchableSelect from "@/components/searchable-select";

const typeOptions = [
  { label: "Material", value: "Material" },
  { label: "Furniture", value: "Furniture" },
  { label: "Service", value: "Service" },
  { label: "Tool", value: "Tool" },
];

const categoryOptions = [
  { label: "Interior", value: "Interior" },
  { label: "Exterior", value: "Exterior" },
  { label: "Civil / Sipil", value: "Civil" },
  { label: "Finishing", value: "Finishing" },
  { label: "MEP", value: "MEP" },
];

// ----------------------
// VALIDATION
// ----------------------
const schema = z.object({
  name: z.string().min(1, "Product name is required"),
  sku: z.string().optional(),
  type: z.string().optional(),
  category: z.string().optional(),
  price: z.coerce.number().min(0, "Price must be positive"),
  unit: z.string().min(1, "Unit is required"),
  description: z.string().optional(),
  image: z.string().optional(), // In real app, this should be file upload handling
  link: z.string().optional(),
  status: z.boolean().default(true),
});

export default function ProductCreatePage() {
  const router = useRouter();
  const { mutate, isPending } = usePost("/master/products");
  const [submitAction, setSubmitAction] = useState("create");

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      type: "",
      category: "",
      price: 0,
      unit: "pcs",
      description: "",
      image: "",
      link: "",
      status: true,
    },
  });

  const onSubmit = (data) => {
    toast.promise(
      new Promise((resolve, reject) => {
        mutate(data, {
          onSuccess: () => {
            if (submitAction === "create") {
              router.push("/dashboard/Masters/products");
            } else {
              reset();
            }
            resolve();
          },
          onError: (err) => {
            reject(err?.response?.data?.message || "Failed to create product");
          },
        });
      }),
      {
        loading: "Saving...",
        success: "Product created successfully!",
        error: (msg) => msg,
      },
    );
  };

  return (
    <DashboardLayout title="Create Product" desc="Add new product to catalog">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6"
      >
        {/* LEFT COLUMN */}
        <div className="space-y-4">
          <div className="flex flex-col space-y-2">
            <Label>
              Name <span className="text-red-500">*</span>
            </Label>
            <Input
              placeholder="e.g. Premium Teak Chair"
              {...register("name")}
            />
            {errors.name && (
              <span className="text-red-500 text-sm">
                {errors.name.message}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col space-y-2">
              <Label>Type</Label>
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <SearchableSelect
                    value={field.value}
                    onChange={field.onChange}
                    options={typeOptions}
                    placeholder="Select type"
                    className="w-full"
                  />
                )}
              />
            </div>
            <div className="flex flex-col space-y-2">
              <Label>Category</Label>
              <Controller
                name="category"
                control={control}
                render={({ field }) => (
                  <SearchableSelect
                    value={field.value}
                    onChange={field.onChange}
                    options={categoryOptions}
                    placeholder="Select category"
                    className="w-full"
                  />
                )}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col space-y-2">
              <Label>Price</Label>
              <Input type="number" placeholder="0" {...register("price")} />
              {errors.price && (
                <span className="text-red-500 text-sm">
                  {errors.price.message}
                </span>
              )}
            </div>
            <div className="flex flex-col space-y-2">
              <Label>
                Unit <span className="text-red-500">*</span>
              </Label>
              <Input placeholder="e.g. pcs, m2, set" {...register("unit")} />
              {errors.unit && (
                <span className="text-red-500 text-sm">
                  {errors.unit.message}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-4">
          <div className="flex flex-col space-y-2">
            <Label>Image URL</Label>
            <Input placeholder="https://..." {...register("image")} />
            <p className="text-xs text-muted-foreground">
              Paste an image URL for preview.
            </p>
          </div>

          <div className="flex flex-col space-y-2">
            <Label>Purchase Link</Label>
            <Input placeholder="https://..." {...register("link")} />
            <p className="text-xs text-muted-foreground">
              Direct link to product/marketplace.
            </p>
          </div>

          <div className="flex flex-col space-y-2">
            <Label>Description</Label>
            <Textarea
              placeholder="Product details, specifications, etc."
              className="min-h-[150px]"
              {...register("description")}
            />
          </div>

          <div className="flex items-center space-x-2 border p-4 rounded-lg">
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
            <div className="flex flex-col">
              <Label>Active Status</Label>
              <span className="text-xs text-muted-foreground">
                Toggle to enable/disable this product
              </span>
            </div>
          </div>
        </div>

        {/* ACTION BUTTONS */}
        <div className="md:col-span-2 flex items-center gap-3 mt-4">
          <Button
            type="submit"
            disabled={isPending}
            onClick={() => setSubmitAction("create")}
          >
            {isPending ? "Saving..." : "Create Product"}
          </Button>

          <Button
            type="submit"
            disabled={isPending}
            variant="secondary"
            onClick={() => setSubmitAction("create_another")}
          >
            {isPending ? "Saving..." : "Create & Add Another"}
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/dashboard/Masters/products")}
          >
            Cancel
          </Button>
        </div>
      </form>
    </DashboardLayout>
  );
}
