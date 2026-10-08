"use client";

import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

import { useRouter, useParams } from "next/navigation";
import { usePut } from "@/hooks/use-api-mutation";
import { useApiFetch } from "@/hooks/use-api-fetch";
import DashboardLayout from "@/components/layouts/dashboard-layout";
import { toast } from "sonner";
import SearchableSelect from "@/components/searchable-select";
import Loader from "@/components/ui/loader";

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

const schema = z.object({
  id: z.number().optional(),
  name: z.string().min(1, "Product name is required"),
  sku: z.string().optional(),
  type: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  price: z.coerce.number().min(0, "Price must be positive"),
  unit: z.string().min(1, "Unit is required"),
  description: z.string().optional().nullable(),
  image: z.string().optional().nullable(),
  link: z.string().optional().nullable(),
  status: z.boolean().default(true),
});

export default function ProductEditPage() {
  const router = useRouter();
  const { id } = useParams();

  const { data, isLoading } = useApiFetch(
    ["product", id],
    `/master/products/${id}`,
  );
  const { mutate, isPending } = usePut(`/master/products/${id}`);

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
      sku: "",
      type: "",
      category: "",
      price: 0,
      unit: "",
      description: "",
      image: "",
      link: "",
      status: true,
    },
  });

  useEffect(() => {
    if (data?.data) {
      reset({
        id: data.data.id,
        name: data.data.name || "",
        sku: data.data.sku || "",
        type: data.data.type || "",
        category: data.data.category || "",
        price: data.data.price || 0,
        unit: data.data.unit || "",
        description: data.data.description || "",
        image: data.data.image || "",
        link: data.data.link || "",
        status: data.data.status === 1 || data.data.status === true,
      });
    }
  }, [data, reset]);

  const onSubmit = (formData) => {
    const cleanData = {
      ...formData,
      sku: formData.sku || "",
      type: formData.type || null,
      category: formData.category || null,
      description: formData.description || null,
      image: formData.image || null,
      link: formData.link || null,
    };

    toast.promise(
      new Promise((resolve, reject) => {
        mutate(cleanData, {
          onSuccess: () => {
            router.push("/dashboard/Masters/products");
            resolve();
          },
          onError: (err) => {
            reject(err?.response?.data?.message || "Failed to update product");
          },
        });
      }),
      {
        loading: "Updating...",
        success: "Product updated successfully!",
        error: (msg) => msg,
      },
    );
  };

  if (isLoading) return <Loader />;

  return (
    <DashboardLayout title="Edit Product" desc="Update product details">
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

          <div className="flex flex-col space-y-2">
            <Label>SKU</Label>
            <Input
              placeholder="Auto-generated"
              {...register("sku")}
              readOnly
              className="bg-muted text-muted-foreground cursor-not-allowed"
            />
            <p className="text-xs text-muted-foreground">
              SKU is auto-generated based on Category and Product ID. Changing
              category will update SKU.
            </p>
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
          </div>

          <div className="flex flex-col space-y-2">
            <Label>Purchase Link</Label>
            <Input placeholder="https://..." {...register("link")} />
          </div>

          <div className="flex flex-col space-y-2">
            <Label>Description</Label>
            <Textarea
              placeholder="Product details..."
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
          <Button type="submit" disabled={isPending}>
            {isPending ? "Updating..." : "Update Product"}
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
