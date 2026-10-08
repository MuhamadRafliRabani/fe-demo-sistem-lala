"use client";
import { DatePicker } from "@/components/date-picker";
import { FormRow } from "@/components/form-row";
import MultiSelect from "@/components/MultiSelect";
import { Input } from "@/components/ui/input";
import {
  buildingTypes,
  INCOME,
  requestTypes,
  sourceLeads,
  statusLeads,
} from "@/data/data";
import { formatDateDb } from "@/lib/date-format-db";
import { useState } from "react";
const FilterReportLeads = ({ filter, setFilter }) => {
  const [prevStatus, setPrevStatus] = useState([]);
  const TERBALAS = "Terbalas";

  const TERBALAS_VALUES = statusLeads
    .filter(
      (s) =>
        s.value !== "Gajelas" &&
        s.value !== "Follow up" &&
        s.value !== TERBALAS,
    )
    .map((s) => s.value);

  const isTerbalasActive =
    filter.status.length === TERBALAS_VALUES.length &&
    TERBALAS_VALUES.every((v) => filter.status.includes(v));

  const cleanSelected = (arr) => arr.filter((v) => v !== TERBALAS);

  return (
    <div className="space-y-2 max-md:space-y-0">
      <div className="grid grid-cols-1 grid-rows-3 gap-2 max-md:grid-rows-1">
        <div className="flex items-center gap-4 max-md:gap-2 ">
          <FormRow
            label="Tanggal:"
            className="flex max-md:flex-col items-center max-lg:w-full max-md:gap-2 gap-4"
          >
            <DatePicker
              placeholder="Pilih tanggal mulai..."
              label=""
              value={filter.start_date}
              onChange={(date) =>
                setFilter({
                  ...filter,
                  start_date: formatDateDb(date),
                  page: 1,
                })
              }
              className="max-md:basis-full max-lg:w-full basis-[45%]"
            />
            <DatePicker
              placeholder="Pilih tanggal akhir..."
              label=""
              value={filter.end_date}
              onChange={(date) =>
                setFilter({ ...filter, end_date: formatDateDb(date), page: 1 })
              }
              className="basis-[45%] max-md:basis-full max-lg:w-full"
            />
          </FormRow>
        </div>

        <div className="flex items-center gap-4 max-md:gap-2 ">
          <FormRow
            label="Modtime:"
            className="flex max-md:flex-col items-center max-lg:w-full max-md:gap-2 gap-4"
          >
            <DatePicker
              placeholder="Pilih tanggal mulai..."
              label=""
              value={filter.modtime_start}
              onChange={(date) =>
                setFilter({
                  ...filter,
                  modtime_start: formatDateDb(date),
                  page: 1,
                })
              }
              className="max-md:basis-full max-lg:w-full basis-[45%]"
            />
            <DatePicker
              placeholder="Pilih tanggal akhir..."
              label=""
              value={filter.modtime_end}
              onChange={(date) =>
                setFilter({
                  ...filter,
                  modtime_end: formatDateDb(date),
                  page: 1,
                })
              }
              className="basis-[45%] max-md:basis-full max-lg:w-full"
            />
          </FormRow>
        </div>

        <FormRow
          label="Client Name:"
          className="flex items-center max-lg:w-full max-md:gap-2 gap-4"
        >
          <Input
            placeholder="Filter name..."
            className="max-lg:w-full w-1/2"
            value={filter.name}
            onChange={(e) => {
              setFilter({ ...filter, name: e.target.value, page: 1 });
            }}
          />
        </FormRow>

        <FormRow
          label="Phone:"
          className="flex items-center max-lg:w-full max-md:gap-2 gap-4"
        >
          <Input
            placeholder="Filter phone..."
            className="max-lg:w-full w-1/2"
            value={filter.whatsapp_number}
            onChange={(e) => {
              setFilter({
                ...filter,
                whatsapp_number: e.target.value,
                page: 1,
              });
            }}
          />
        </FormRow>

        <FormRow
          label="Status:"
          className="flex items-center max-lg:w-full max-md:gap-2 gap-4"
        >
          <MultiSelect
            name="Leads Status"
            placeholder="Pilih status..."
            options={statusLeads}
            value={filter.status}
            onChange={(selected) => {
              const clickedTerbalas = selected.includes(TERBALAS);
              const cleaned = cleanSelected(selected);

              if (clickedTerbalas && !isTerbalasActive) {
                setPrevStatus(filter.status);
                setFilter({
                  ...filter,
                  status: TERBALAS_VALUES,
                });
                return;
              }

              if (clickedTerbalas && isTerbalasActive) {
                setFilter({
                  ...filter,
                  status: prevStatus,
                });
                return;
              }

              if (isTerbalasActive) {
                setPrevStatus(cleaned);
              }

              setFilter({
                ...filter,
                status: cleaned,
              });
            }}
            className="max-lg:w-full min-w-1/2 w-fit "
          />
        </FormRow>

        <FormRow
          label="Sumber:"
          className="flex items-center max-lg:w-full max-md:gap-2 gap-4"
        >
          <MultiSelect
            name="Leads Source"
            placeholder="Pilih sumber..."
            options={sourceLeads}
            value={filter.source}
            onChange={(selected) =>
              setFilter({ ...filter, source: selected, page: 1 })
            }
            className="min-w-1/2 w-fit max-lg:w-full"
          />
        </FormRow>
      </div>

      <FormRow
        label="Jenis Bangunan:"
        className="flex items-center max-lg:w-full max-md:gap-2 gap-4"
      >
        <MultiSelect
          placeholder="Pilih Jenis Bangunan..."
          options={buildingTypes}
          value={filter.building_type}
          onChange={(selected) =>
            setFilter({ ...filter, building_type: selected, page: 1 })
          }
          className="w-1/2 max-lg:w-full"
        />
      </FormRow>

      <FormRow
        label="Request Type:"
        className="flex items-center max-lg:w-full max-md:gap-2 gap-4"
      >
        <MultiSelect
          placeholder="Pilih Jenis Kebutuhan..."
          options={requestTypes}
          value={filter.request_type}
          onChange={(selected) =>
            setFilter({ ...filter, request_type: selected, page: 1 })
          }
          className="w-1/2 max-lg:w-full"
        />
      </FormRow>
      <FormRow
        label="Income:"
        className="flex items-center max-lg:w-full max-md:gap-2 gap-4"
      >
        <MultiSelect
          placeholder="Pilih Pendapatan..."
          options={INCOME}
          value={filter.income}
          onChange={(selected) =>
            setFilter({ ...filter, income: selected, page: 1 })
          }
          className="w-1/2 max-lg:w-full"
        />
      </FormRow>
    </div>
  );
};

export default FilterReportLeads;
