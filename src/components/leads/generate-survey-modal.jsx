"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CalendarClock, MapPin, UserRound } from "lucide-react";
import { usePost } from "@/hooks/use-api-mutation";
import { useApiFetch } from "@/hooks/use-api-fetch";
import SearchableSelect from "@/components/searchable-select";
import { DatePicker } from "@/components/date-picker";
import { toast } from "sonner";
import generateInvoice from "@/app/dashboard/surveys/schedule-surveys/libs/generate-invoice-survey";

const DEFAULT_SURVEY_PRICE = 2_000_000;
const EMAIL_REGEX = /^\S+@\S+\.\S+$/;

const initialFormState = {
  name: "",
  phone: "",
  email: "",
  shareloc: "",
  alamat: "",
  notes: "",
  region_id: "",
};

// Gabungin alamat manual + nama domisili jadi satu string alamat lengkap.
function buildFullAddress(alamat, domicileName) {
  const trimmedAlamat = alamat.trim();
  if (trimmedAlamat && domicileName) return `${trimmedAlamat}, ${domicileName}`;
  return trimmedAlamat || domicileName || "";
}

// Pecah objek Date jadi string "YYYY-MM-DD" dan "HH:mm" sesuai format yang API minta.
function splitDateTime(date) {
  const pad = (n) => String(n).padStart(2, "0");
  return {
    date: `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
    time: `${pad(date.getHours())}:${pad(date.getMinutes())}`,
  };
}

// Tampilan "2.000.000" doang, value asli tetap number biasa.
function formatRupiah(value) {
  return value ? value.toLocaleString("id-ID") : "";
}

function openPaymentLinkSafely(url) {
  if (!url) return false;

  try {
    const popup = window.open(url, "_blank", "noopener,noreferrer");
    if (popup) {
      popup.opener = null;
      return true;
    }
  } catch {
    // fallback below
  }

  try {
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.target = "_blank";
    anchor.rel = "noopener noreferrer";
    anchor.style.display = "none";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    return true;
  } catch {
    window.location.href = url;
    return true;
  }
}

// Header seksi (ikon + judul) dipakai berulang, jadi ditarik jadi satu komponen kecil
// biar tiap seksi form gak nulis markup yang sama tiga kali.
function FormSection({ icon: Icon, title, children }) {
  return (
    <section className="space-y-4 rounded-lg border bg-muted/30 p-4">
      <h3 className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Icon className="size-4" />
        {title}
      </h3>
      {children}
    </section>
  );
}

export function GenerateSurveyModal({ open, onOpenChange, lead, refetch }) {
  const [form, setForm] = useState(initialFormState);
  const [scheduleAt, setScheduleAt] = useState(null);
  const [price, setPrice] = useState(DEFAULT_SURVEY_PRICE);

  const { mutate: createSurveyOrder, isPending } = usePost(
    "/orders/survey-from-lead",
  );

  const { data: regionsResponse, isLoading: isLoadingRegions } = useApiFetch(
    ["regions"],
    "/master/regions",
    { page: 1, per_page: 100, is_active: true },
  );

  const regions = useMemo(
    () => regionsResponse?.data?.data ?? [],
    [regionsResponse],
  );

  const regionOptions = useMemo(
    () => regions.map((r) => ({ label: r.name, value: r.id })),
    [regions],
  );

  // Setiap modal dibuka, form di-reset & diisi otomatis dari data lead.
  useEffect(() => {
    if (!open) return;

    const defaultSchedule = new Date();
    defaultSchedule.setHours(9, 0, 0, 0);

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setForm({
      ...initialFormState,
      name: lead?.name || "",
      phone: lead?.whatsapp_number || "",
      alamat: lead?.location || "",
      notes: lead?.notes || "",
    });
    setScheduleAt(defaultSchedule);
    setPrice(DEFAULT_SURVEY_PRICE);
  }, [open, lead]);

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handlePriceChange = (e) => {
    const digitsOnly = e.target.value.replace(/\D/g, "");
    setPrice(digitsOnly ? parseInt(digitsOnly, 10) : 0);
  };

  // Semua aturan validasi dikumpulin di satu tempat, dicek urut dari atas ke bawah.
  const validate = () => {
    if (!lead?.id) return "Lead tidak valid";
    if (!form.name.trim()) return "Nama wajib diisi";
    if (!form.email.trim()) return "Email wajib diisi";
    if (!EMAIL_REGEX.test(form.email.trim())) return "Format email tidak valid";
    if (!scheduleAt) return "Tanggal dan jam survei wajib diisi";
    if (!price || price <= 0) return "Harga survei wajib diisi";
    return null;
  };

  const handleSubmit = () => {
    const errorMessage = validate();
    if (errorMessage) {
      toast.error(errorMessage);
      return;
    }

    const domicileName =
      regions.find((r) => r.id === form.region_id)?.name || "";
    const { date, time } = splitDateTime(scheduleAt);

    createSurveyOrder(
      {
        lead_id: lead.id,
        name: form.name,
        phone: form.phone,
        email: form.email,
        address: buildFullAddress(form.alamat, domicileName),
        shareloc: form.shareloc || undefined,
        notes: form.notes || undefined,
        date,
        time,
        region_id: form.region_id || undefined,
        price,
      },
      {
        onSuccess: async (res) => {
          const paymentUrl = res?.payment_url || res?.data?.payment_url;

          try {
            await generateInvoice({
              client: {
                name: form.name,
                phone: form.phone,
                email: form.email,
              },
              address: buildFullAddress(form.alamat, domicileName),
              date: `${date} ${time}`,
              datetime: `${date} ${time}`,
              issueDate: new Date().toLocaleDateString("id-ID", {
                day: "numeric",
                month: "long",
                year: "numeric",
              }),
              order: {
                amount: Number(price) || 0,
                title: "Survey Lapangan",
                status: "waiting_payment",
                payment: {
                  payment_code: `INV-SRV/${new Date().getFullYear()}/${String(
                    Math.floor(1000 + Math.random() * 9000),
                  )}`,
                },
              },
            });
          } catch {
            toast.error("Invoice survey gagal didownload otomatis.");
          }

          if (paymentUrl) {
            openPaymentLinkSafely(paymentUrl);
            toast.success(
              "Order survei berhasil dibuat. Invoice survey telah didownload dan pembayaran siap diproses.",
            );
          } else {
            toast.success("Order survei berhasil dibuat.");
          }

          refetch?.();
          onOpenChange(false);
        },
        onError: (err) => {
          toast.error(
            err?.response?.data?.message || "Gagal membuat order survei",
          );
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarClock className="size-5" />
            Generate Survey & Pembayaran
          </DialogTitle>
          <DialogDescription>
            Buat jadwal survei dan link pembayaran Midtrans untuk lead ini.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <FormSection icon={UserRound} title="Data Pemohon">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>
                  Nama Lengkap <span className="text-destructive">*</span>
                </Label>
                <Input
                  value={form.name}
                  onChange={handleChange("name")}
                  placeholder="Nama lengkap"
                  disabled={true}
                />
              </div>
              <div className="space-y-2">
                <Label>WhatsApp</Label>
                <Input
                  value={form.phone}
                  onChange={handleChange("phone")}
                  placeholder="08xx..."
                  disabled={true}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>
                Email <span className="text-destructive">*</span>
              </Label>
              <Input
                type="email"
                value={form.email}
                onChange={handleChange("email")}
                placeholder="user@domain.com"
                disabled={isPending}
              />
              <p className="text-xs text-muted-foreground">
                Link pembayaran akan dikirim ke email ini.
              </p>
            </div>
          </FormSection>

          <FormSection icon={MapPin} title="Lokasi Survey">
            <div className="space-y-2">
              <Label>Domisili</Label>
              <SearchableSelect
                value={form.region_id}
                options={regionOptions}
                onChange={(val) =>
                  setForm((prev) => ({ ...prev, region_id: val }))
                }
                placeholder={
                  isLoadingRegions ? "Memuat domisili..." : "Pilih domisili"
                }
                disabled={isLoadingRegions || isPending}
              />
            </div>

            <div className="space-y-2">
              <Label>Alamat</Label>
              <Textarea
                rows={4}
                value={form.alamat}
                onChange={handleChange("alamat")}
                placeholder="Alamat lengkap lokasi survei"
                disabled={isPending}
              />
            </div>

            <div className="space-y-2">
              <Label>Link Google Maps (Shareloc)</Label>
              <Input
                type="url"
                value={form.shareloc}
                onChange={handleChange("shareloc")}
                placeholder="https://maps.google.com/..."
                disabled={isPending}
              />
            </div>

            <div className="space-y-2">
              <Label>Catatan Tambahan</Label>
              <Textarea
                rows={3}
                value={form.notes}
                onChange={handleChange("notes")}
                placeholder="Instruksi khusus untuk surveyor (opsional)"
                disabled={isPending}
              />
            </div>
          </FormSection>

          <FormSection icon={CalendarClock} title="Jadwal & Pembayaran">
            <DatePicker
              value={scheduleAt}
              onChange={setScheduleAt}
              withTime
              inline
              disabled={isPending}
            />

            <div className="space-y-2">
              <Label>
                Harga Survey <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  Rp
                </span>
                <Input
                  inputMode="numeric"
                  value={formatRupiah(price)}
                  onChange={handlePriceChange}
                  placeholder="2.000.000"
                  disabled={isPending}
                  className="pl-9"
                />
              </div>
            </div>
          </FormSection>
        </div>

        <div className="flex justify-end gap-3 border-t pt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Batal
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? "Memproses..." : "Generate Survey"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
