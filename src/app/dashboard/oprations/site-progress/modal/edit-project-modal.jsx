import { DatePicker } from "@/components/date-picker";
import SearchableSelect from "@/components/searchable-select";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { statusJenisPembangunan } from "@/data/data";
import { usePut } from "@/hooks/use-api-mutation";
import { formatDateDb } from "@/lib/date-format-db";
import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function EditProjectModal({
  project,
  isOpen,
  onClose,
  userOptions,
}) {
  const [formData, setFormData] = useState({
    project_name: "",
    site_leader_id: null,
    building_type: "",
    target: "",
    budget_rap: "",
    overdue_date: null,
  });
  const [isPending, setIsPending] = useState(false);

  const { mutate: updateProject } = usePut(
    project ? `/site-progress/${project.id}` : "/site-progress/0",
    {
      invalidate: [["site-progress"], ["dashboard"]],
    },
  );

  useEffect(() => {
    if (!project || !isOpen) return;
    const matchedLeader = userOptions?.find(
      (u) => String(u.label) === String(project.site_leader ?? ""),
    );
    setFormData({
      project_name: project.project_name ?? "",
      building_type: project.building_type ?? "",
      site_leader_id: matchedLeader ? Number(matchedLeader.value) : null,
      target: project.target ?? "",
      budget_rap: project.budget_rap ?? "",
      overdue_date: project.overdue_date ?? null,
    });
  }, [project, isOpen, userOptions]);

  const selectedLeader = userOptions?.find(
    (u) => String(u.value) === String(formData.site_leader_id),
  );

  if (!isOpen || !project) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsPending(true);
    const payload = {
      ...formData,
      site_leader: selectedLeader?.label ?? null,
      overdue_date: formData.overdue_date
        ? formatDateDb(formData.overdue_date)
        : null,
    };
    delete payload.site_leader_id;
    toast.promise(
      new Promise((resolve, reject) => {
        updateProject(payload, {
          onSuccess: () => {
            setIsPending(false);
            onClose();
            resolve();
          },
          onError: (err) => {
            setIsPending(false);
            if (err) reject(err?.response?.data.message);
          },
        });
      }),
      {
        loading: "Menyimpan...",
        success: "Site Progress berhasil diupdate!",
        error: (msg) => msg ?? "Gagal menyimpan data!",
      },
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <h3 className="text-lg font-bold text-gray-900">Edit Project</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">
              Nama Project <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              required
              value={formData.project_name}
              onChange={(e) =>
                setFormData({ ...formData, project_name: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">
              Site Leader
            </label>
            <SearchableSelect
              options={userOptions}
              value={
                formData.site_leader_id !== null
                  ? String(formData.site_leader_id)
                  : null
              }
              onChange={(value) =>
                setFormData({
                  ...formData,
                  site_leader_id: value ? Number(value) : null,
                })
              }
              placeholder="Pilih Site Leader..."
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">
              Type Pembangunan
            </label>
            <Select
              value={formData.building_type || ""}
              onValueChange={(value) =>
                setFormData({ ...formData, building_type: value })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Pilih type pembangunan..." />
              </SelectTrigger>
              <SelectContent>
                {statusJenisPembangunan.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">
              Target Porgress (%) <span className="text-red-500">*</span>
            </label>
            <Input
              type="number"
              step="0.01"
              min="0"
              required
              value={formData.target}
              onChange={(e) =>
                setFormData({ ...formData, target: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">
              Budget RAP (Rp) <span className="text-red-500">*</span>
            </label>
            <Input
              type="number"
              step="0.01"
              min="0"
              required
              value={formData.budget_rap}
              onChange={(e) =>
                setFormData({ ...formData, budget_rap: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">
              Batas Waktu (Overdue Date) <span className="text-red-500">*</span>
            </label>
            <DatePicker
              value={formData.overdue_date}
              onChange={(d) => setFormData({ ...formData, overdue_date: d })}
              label={null}
              className="w-full"
              required
            />
          </div>

          <div className="pt-4 border-t border-gray-100 flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              {isPending ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
