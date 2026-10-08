"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Save, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { usePost, usePut } from "@/hooks/use-api-mutation";

const RegionForm = ({ initialData, isEdit = false }) => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    distance: "",
    estimated_time: "",
    order: "",
    is_active: true,
    status: false,
    issue_image: "",
  });

  const { mutate: createRegion, isPending: isCreating } =
    usePost("/master/regions");
  const { mutate: updateRegion, isPending: isUpdating } = usePut(
    (data) => `/master/regions/${initialData.id}`,
  );

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || "",
        code: initialData.code || "",
        distance: initialData.distance || "",
        estimated_time: initialData.estimated_time || "",
        order: initialData.order || "",
        is_active: initialData.is_active ?? true,
        status: initialData.status ?? false,
        issue_image: initialData.issue_image || "",
      });
    }
  }, [initialData]);

  const handleSubmit = (e) => {
    e.preventDefault();

    const payload = {
      ...formData,
      distance: parseInt(formData.distance),
      estimated_time: parseInt(formData.estimated_time),
      order: parseInt(formData.order),
    };

    if (isEdit) {
      updateRegion(payload, {
        onSuccess: () => {
          toast.success("Region updated successfully");
          router.push("/dashboard/Masters/regions");
        },
        onError: (error) => {
          console.error(error);
          toast.error(
            error.response?.data?.message || "Failed to update region",
          );
        },
      });
    } else {
      createRegion(payload, {
        onSuccess: () => {
          toast.success("Region created successfully");
          router.push("/dashboard/Masters/regions");
        },
        onError: (error) => {
          console.error(error);
          toast.error(
            error.response?.data?.message || "Failed to create region",
          );
        },
      });
    }
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const loading = isCreating || isUpdating;

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => router.back()} className="gap-2">
          <ArrowLeft size={16} /> Back
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{isEdit ? "Edit Region" : "Create New Region"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Region Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="e.g. Jakarta Selatan"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="code">Region Code</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => handleChange("code", e.target.value)}
                placeholder="e.g. JS"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="distance">Distance (km)</Label>
                <Input
                  id="distance"
                  type="number"
                  value={formData.distance}
                  onChange={(e) => handleChange("distance", e.target.value)}
                  placeholder="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="estimated_time">Estimated Time (mins)</Label>
                <Input
                  id="estimated_time"
                  type="number"
                  value={formData.estimated_time}
                  onChange={(e) =>
                    handleChange("estimated_time", e.target.value)
                  }
                  placeholder="0"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="order">Sort Order</Label>
              <Input
                id="order"
                type="number"
                value={formData.order}
                onChange={(e) => handleChange("order", e.target.value)}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="issue_image">Issue Image URL</Label>
              <Input
                id="issue_image"
                value={formData.issue_image || ""}
                onChange={(e) => handleChange("issue_image", e.target.value)}
                placeholder="Image URL"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-0.5">
                  <Label>Active Status</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable/Disable region
                  </p>
                </div>
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) =>
                    handleChange("is_active", checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-0.5">
                  <Label>Status</Label>
                  <p className="text-sm text-muted-foreground">
                    Secondary status
                  </p>
                </div>
                <Switch
                  checked={formData.status}
                  onCheckedChange={(checked) => handleChange("status", checked)}
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ?
                <span className="flex items-center gap-2">
                  <span className="animate-spin">⏳</span> Saving...
                </span>
              : <span className="flex items-center gap-2">
                  <Save size={16} /> Save Region
                </span>
              }
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default RegionForm;
