"use client";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { FormRow } from "@/components/form-row";
import { DatePicker } from "@/components/date-picker";
import { formatDateDb } from "@/lib/date-format-db";

export function FilterPayment({ className }) {
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
    <div className="space-y-2">
        <div className="grid grid-cols-1 gap-4">
            <FormRow label="Paid Date:" className="w-1/2 flex items-center gap-4">
                <DatePicker
                  placeholder="Start date..."
                  value={searchParams.get("date_from") ? new Date(searchParams.get("date_from")) : null}
                  onChange={(date) => createQueryString("date_from", date ? formatDateDb(date) : null)}
                  className="w-full"
                />
                <DatePicker
                  placeholder="End date..."
                  value={searchParams.get("date_to") ? new Date(searchParams.get("date_to")) : null}
                  onChange={(date) => createQueryString("date_to", date ? formatDateDb(date) : null)}
                  className="w-full"
                />
            </FormRow>
            <FormRow label="Search:" className="w-1/2">
                <Input
                  type="search"
                  placeholder="Search by Order Code or Transaction ID..."
                  className="w-full"
                  value={search}
                  onChange={handleSearchChange}
                  onKeyDown={handleSearch}
                />
            </FormRow>
            <FormRow label="Transaction Status:" className="w-1/2">
                <Select
                  onValueChange={(value) => createQueryString("transaction_status", value)}
                  defaultValue={searchParams.get("transaction_status")}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Transaction Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="capture">Capture</SelectItem>
                    <SelectItem value="settlement">Settlement</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="deny">Deny</SelectItem>
                    <SelectItem value="cancel">Cancel</SelectItem>
                    <SelectItem value="expire">Expire</SelectItem>
                  </SelectContent>
                </Select>
            </FormRow>
            <FormRow label="Fraud Status:" className="w-1/2">
                 <Select
                  onValueChange={(value) => createQueryString("fraud_status", value)}
                  defaultValue={searchParams.get("fraud_status")}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Fraud Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="accept">Accept</SelectItem>
                    <SelectItem value="challenge">Challenge</SelectItem>
                    <SelectItem value="deny">Deny</SelectItem>
                  </SelectContent>
                </Select>
            </FormRow>
        </div>
      <Button
        variant="outline"
        onClick={() => {
          router.push(pathname);
          setSearch("");
        }}
      >
        Reset
      </Button>
    </div>
  );
}