"use client";
import { DatePicker } from "@/components/date-picker";
import { FormRow } from "@/components/form-row";
import MultiSelect from "@/components/MultiSelect";
import { Input } from "@/components/ui/input";
import { UserSelection } from "@/components/user-selection";
import { statusSurvey } from "@/data/data";
import { formatDateDb } from "@/lib/date-format-db";

const FilterScheduleSurvey = ({ filter, setFilter }) => {
  // Catatan: useApiFetch("/surveyors") dihapus karena
  // UserSelection sudah memanggil data usernya sendiri secara mandiri.

  return (
    <div className="w-full pb-4">
      {/* layout */}
      <div className="flex flex-col gap-5 w-full max-w-5xl">
        {/* TANGGAL SURVEY */}
        <div className="grid grid-cols-12 gap-4 items-center">
          <div className="col-span-12 lg:col-span-2">
            <span className="text-white font-semibold">Tanggal:</span>
          </div>

          <div className="col-span-12 lg:col-span-10">
            <div className="flex flex-row items-center gap-3 w-full">
              <DatePicker
                placeholder="Mulai..."
                label=""
                value={filter.start_date}
                onChange={(date) =>
                  setFilter({
                    ...filter,
                    start_date: formatDateDb(date),
                    page: 1,
                  })
                }
                className="w-full max-w-[260px]"
              />

              <DatePicker
                placeholder="Akhir..."
                label=""
                value={filter.end_date}
                onChange={(date) =>
                  setFilter({
                    ...filter,
                    end_date: formatDateDb(date),
                    page: 1,
                  })
                }
                className="w-full max-w-[260px]"
              />
            </div>
          </div>
        </div>

        {/* NAMA KLIEN */}
        <div className="grid grid-cols-12 gap-4 items-center">
          <div className="col-span-12 lg:col-span-2">
            <span className="text-white font-semibold">Client Name:</span>
          </div>

          <div className="col-span-12 lg:col-span-10">
            <Input
              placeholder="Filter nama..."
              className="w-full"
              value={filter.name}
              onChange={(e) => {
                setFilter({ ...filter, name: e.target.value, page: 1 });
              }}
            />
          </div>
        </div>

        {/* SURVEYOR */}
        <div className="grid grid-cols-12 gap-4 items-center">
          <div className="col-span-12 lg:col-span-2">
            <span className="text-white font-semibold">Surveyors:</span>
          </div>

          <div className="col-span-12 lg:col-span-10">
            <UserSelection
              placeholder="Pilih Surveyor..."
              searchPlaceholder="Cari surveyor..."
              value={filter.surveyors}
              onChange={(selected) =>
                setFilter({ ...filter, surveyors: selected, page: 1 })
              }
            />
          </div>
        </div>

        {/* STATUS */}
        <div className="grid grid-cols-12 gap-4 items-center">
          <div className="col-span-12 lg:col-span-2">
            <span className="text-white font-semibold">Status:</span>
          </div>

          <div className="col-span-12 lg:col-span-10">
            <MultiSelect
              name="Status"
              placeholder="Pilih status..."
              options={statusSurvey}
              value={filter.status}
              onChange={(selected) =>
                setFilter({ ...filter, status: selected, page: 1 })
              }
              className="w-full"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterScheduleSurvey;
