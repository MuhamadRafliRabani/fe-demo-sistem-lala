"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { MessageSquare, Send } from "lucide-react";
import { toast } from "sonner";

// Template chat untuk follow-up
const FOLLOW_UP_TEMPLATES = {
  1: {
    title: "Follow-up 1",
    message: `Halo {name}, 

Saya dari Langit Langit ingin follow-up terkait kebutuhan {request_type} untuk {building_type} di {location}.

Apakah masih tertarik untuk melanjutkan diskusi? Kami siap membantu mewujudkan impian Anda.

Terima kasih 🙏`,
  },
  2: {
    title: "Follow-up 2",
    message: `Halo {name},

Kami dari Langit Langit ingin menindaklanjuti pembahasan sebelumnya terkait proyek {building_type} Anda.

Apakah ada pertanyaan atau hal yang ingin didiskusikan lebih lanjut? Kami siap membantu memberikan solusi terbaik.

Silakan balas jika ada yang ingin ditanyakan. Terima kasih 🙏`,
  },
  3: {
    title: "Follow-up 3",
    message: `Halo {name},

Kami ingin menindaklanjuti kembali pembicaraan tentang kebutuhan {request_type} untuk {building_type} di {location}.

Kami memiliki beberapa opsi menarik yang mungkin sesuai dengan kebutuhan Anda. Apakah ada waktu untuk diskusi lebih lanjut?

Mohon konfirmasinya. Terima kasih 🙏`,
  },
  4: {
    title: "Follow-up 4 (Final)",
    message: `Halo {name},

Ini adalah follow-up terakhir kami terkait kebutuhan {request_type} untuk {building_type} di {location}.

Kami sangat menghargai waktu Anda. Jika di kemudian hari Anda membutuhkan jasa kami, jangan ragu untuk menghubungi kami.

Terima kasih atas perhatiannya 🙏`,
  },
};

export function FollowUpTemplateModal({
  open,
  onOpenChange,
  lead,
  onFollowUp,
}) {
  if (!lead) return null;

  const followUpCount = lead.follow_up_count || 0;
  const nextFollowUp = Math.min(followUpCount + 1, 4);

  // Jika sudah 4 kali follow-up, tidak bisa lagi
  const isMaxFollowUp = followUpCount >= 4;

  const [selectedTemplate, setSelectedTemplate] = useState(nextFollowUp);
  const [customMessage, setCustomMessage] = useState("");

  // Reset state when modal opens or lead changes
  useEffect(() => {
    if (open && lead) {
      setSelectedTemplate(nextFollowUp);
      setCustomMessage("");
    }
  }, [open, lead, nextFollowUp]);

  const selectedTemplateData =
    FOLLOW_UP_TEMPLATES[selectedTemplate] || FOLLOW_UP_TEMPLATES[1];

  // Replace template variables
  const getMessage = () => {
    if (customMessage) return customMessage;

    let message = selectedTemplateData.message;
    message = message.replace(/{name}/g, lead.name || "Bapak/Ibu");
    message = message.replace(/{request_type}/g, lead.request_type || "proyek");
    message = message.replace(
      /{building_type}/g,
      lead.building_type || "bangunan",
    );
    message = message.replace(/{location}/g, lead.location || "lokasi");
    return message;
  };

  const handleSend = () => {
    const message = getMessage();

    // --- 1. PROSES NOMOR (WAJIB 62 SUPER KETAT) ---
    let rawNumber = lead.whatsapp_number?.toString() || "";
    let cleanedNumber = rawNumber.replace(/\D/g, "");

    // Copot awalan 62 jika ada
    if (cleanedNumber.startsWith("62")) {
      cleanedNumber = cleanedNumber.substring(2);
    }
    // Copot awalan 0 jika ada (bahkan jika ada dobel 0)
    while (cleanedNumber.startsWith("0")) {
      cleanedNumber = cleanedNumber.substring(1);
    }
    // Pasang 62 di awal (sekarang pasti formatnya murni 628...)
    if (cleanedNumber.length > 0) {
      cleanedNumber = "62" + cleanedNumber;
    }

    // Validasi akhir
    if (!cleanedNumber || cleanedNumber === "62") {
      toast.error("Nomor WhatsApp tidak valid");
      return;
    }

    const encodedMessage = encodeURIComponent(message);

    // --- 2. DETEKSI PERANGKAT iOS ---
    // Deteksi iOS (iPhone, iPad) dan macOS Safari agar Universal Link berjalan lancar
    const isIOS =
      typeof navigator !== "undefined" &&
      (/iPad|iPhone|iPod/.test(navigator.userAgent) ||
        (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1));

    // --- 3. BUAT URL FINAL ---
    // iOS Safari merespons Universal Link lebih baik dengan wa.me
    // Desktop / Android tetap api.whatsapp.com untuk mencegah bug routing ke 08
    const whatsappUrl =
      isIOS ?
        `https://wa.me/${cleanedNumber}?text=${encodedMessage}`
      : `https://api.whatsapp.com/send?phone=${cleanedNumber}&text=${encodedMessage}`;

    // --- 4. BUKA WHATSAPP ---
    if (isIOS) {
      // Di iOS/Safari, window.open('_blank') rentan diblokir popup blocker
      window.open(whatsappUrl, "_top");
    } else {
      window.open(whatsappUrl, "_blank", "noopener,noreferrer");
    }

    // Call onFollowUp callback to increment counter
    if (onFollowUp) {
      onFollowUp(lead.id);
    }

    // Close modal
    onOpenChange(false);

    // Reset state
    setCustomMessage("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="size-5" />
            Follow-up Chat - {lead.name}
          </DialogTitle>
          <DialogDescription>
            Pilih template chat untuk follow-up ke-{nextFollowUp} (Total:{" "}
            {followUpCount}/4)
          </DialogDescription>
        </DialogHeader>

        {isMaxFollowUp ?
          <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <p className="text-sm text-amber-800 dark:text-amber-300">
              ⚠️ Follow-up sudah mencapai maksimum (4 kali). Anda masih bisa
              mengirim chat manual.
            </p>
          </div>
        : <>
            {/* Template Selection */}
            <div className="space-y-3">
              <Label>Pilih Template</Label>
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 4].map((num) => {
                  // User bisa pilih template yang sudah pernah digunakan atau template berikutnya
                  const isAvailable = num <= nextFollowUp;
                  const isSelected = selectedTemplate === num;
                  const isNext = num === nextFollowUp;

                  return (
                    <button
                      key={num}
                      onClick={() => isAvailable && setSelectedTemplate(num)}
                      disabled={!isAvailable}
                      className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                        isSelected ? "border-primary bg-primary/10 text-primary"
                        : isAvailable ?
                          "border-border hover:border-primary/50 bg-card text-foreground"
                        : "border-border bg-muted text-muted-foreground opacity-50 cursor-not-allowed"
                      }`}
                    >
                      Follow-up {num}
                      {isNext && (
                        <span className="block text-xs mt-1 text-muted-foreground">
                          (Sekarang)
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Message Preview */}
            <div className="space-y-3">
              <Label>Preview Pesan</Label>
              <div className="p-4 bg-muted rounded-lg border border-border">
                <p className="text-sm whitespace-pre-wrap text-foreground">
                  {getMessage()}
                </p>
              </div>
            </div>

            {/* Custom Message (Optional) */}
            <div className="space-y-3">
              <Label>
                Edit Pesan (Opsional)
                <span className="text-xs text-muted-foreground ml-2">
                  Anda bisa mengedit pesan sesuai kebutuhan
                </span>
              </Label>
              <Textarea
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder={getMessage()}
                rows={8}
                className="font-mono text-sm"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button onClick={handleSend} className="flex-1">
                <Send className="size-4 mr-2" />
                Kirim via WhatsApp
              </Button>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Batal
              </Button>
            </div>
          </>
        }
      </DialogContent>
    </Dialog>
  );
}
