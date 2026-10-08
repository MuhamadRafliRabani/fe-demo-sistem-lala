"use client";
import { redirect, useParams } from "next/navigation";

export default function ToolsIndexPage() {
  const id = useParams().id;
  // Change the path to whichever child should be the default landing
  redirect(
    `/dashboard/oprations/site-progress/detail/${id}/list-input-pekerjaan`,
  );
}
