"use client";

import React from "react";
import { useApiFetch } from "@/hooks/use-api-fetch";
import { useParams } from "next/navigation";

export default function EditRegionPage() {
  const params = useParams();
  const id = params.id;

  const {
    data: response,
    isLoading,
    isError,
  } = useApiFetch(["region", id], `/master/regions/${id}`, {}, !!id);

  if (isLoading) {
    return <div className="p-6">Loading...</div>;
  }

  if (isError || !response?.data) {
    return <div className="p-6 text-red-500">Error loading region</div>;
  }

  return null;

  // return <RegionForm initialData={response.data} isEdit={true} />;
}
