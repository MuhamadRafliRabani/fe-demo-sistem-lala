"use client";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { FormRow } from "@/components/form-row";
import { DatePicker } from "@/components/date-picker";
import { formatDateDb } from "@/lib/date-format-db";

export function FilterOrder({ className }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const createQueryString = (name, value) => {
    const params = new URLSearchParams(searchParams);
    if (value && value !== "all") {
      params.set(name, value);
    } else {
      params.delete(name);
    }
    router.push(pathname + "?" + params.toString());
  };

  const [search, setSearch] = useState(searchParams.get("search") ?? "");

  const handleSearchChange = (event) => {
    setSearch(event.target.value);
  };

  const handleSearch = (event) => {
    if (event.key === "Enter") {
      createQueryString("search", search);
    }
  };

  return (
    <div className="space-y-4">
      {/* Container Utama: Menggunakan Grid 1 Kolom agar tersusun vertikal rapi */}
      <div className="grid grid-cols-1 gap-4">
        {/* 1. ROW TANGGAL */}
        <FormRow label="Date:" className="flex max-md:flex-col items-center max-lg:w-full max-md:gap-2 gap-4">
          <DatePicker
            placeholder="Start date..."
            value={searchParams.get("date_from") ? new Date(searchParams.get("date_from")) : null}
            onChange={(date) => createQueryString("date_from", date ? formatDateDb(date) : null)}
            className="basis-[45%] max-md:basis-full max-lg:w-full"
          />
          <DatePicker
            placeholder="End date..."
            value={searchParams.get("date_to") ? new Date(searchParams.get("date_to")) : null}
            onChange={(date) => createQueryString("date_to", date ? formatDateDb(date) : null)}
            className="basis-[45%] max-md:basis-full max-lg:w-full"
          />
        </FormRow>

        {/* 2. ROW SEARCH */}
        <FormRow label="Search:" className="flex items-center max-lg:w-full max-md:gap-2 gap-4">
          <Input type="search" placeholder="Search by order code or title..." className="max-lg:w-full w-full" /* Menggunakan w-full agar rapi mengisi sisa ruang */ value={search} onChange={handleSearchChange} onKeyDown={handleSearch} />
        </FormRow>

        {/* 3. ROW STATUS */}
        <FormRow label="Status:" className="w-full flex items-center max-md:gap-2 gap-4">
          <Select onValueChange={(value) => createQueryString("status", value)} defaultValue={searchParams.get("status") || "all"}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="waiting_payment">Waiting Payment</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="canceled">Canceled</SelectItem>
            </SelectContent>
          </Select>
        </FormRow>

        {/* 4. ROW PAYMENT STATUS */}
        <FormRow label="Payment Status:" className="w-full flex items-center max-md:gap-2 gap-4">
          <Select onValueChange={(value) => createQueryString("payment_status", value)} defaultValue={searchParams.get("payment_status") || "all"}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Payment Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="unpaid">Unpaid</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
              <SelectItem value="refunded">Refunded</SelectItem>
            </SelectContent>
          </Select>
        </FormRow>
      </div>

      {/* TOMBOL RESET */}
      <div className="flex justify-end pt-2">
        <Button
          variant="outline"
          onClick={() => {
            router.push(pathname);
            setSearch("");
          }}
        >
          Reset Filter
        </Button>
      </div>
    </div>
  );
}
