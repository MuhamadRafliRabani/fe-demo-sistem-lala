"use client";

import { useState } from "react";
import { Copy, Check, Link as LinkIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import axiosInstance from "@/lib/axios";

export function SurveyModal({ open, setOpen, id, name }) {
  const [generatedUrl, setGeneratedUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const handleOpenChange = (isOpen) => {
    setOpen(isOpen);
    if (!isOpen) {
      setTimeout(() => {
        setGeneratedUrl("");
        setIsCopied(false);
      }, 300);
    }
  };

  const handleGenerate = async () => {
    setIsLoading(true);
    try {
      const response = await axiosInstance.get(`/schedules/generate/formsign`, {
        params: { lead_id: id },
      });

      const url =
        response.data?.data?.url || response.data?.url || response.data;

      setGeneratedUrl(url);
      toast.success("Link berhasil dibuat!");
    } catch (error) {
      console.error("Error generating link:", error);
      toast.error("Gagal membuat link survey.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!generatedUrl) return;
    navigator.clipboard.writeText(generatedUrl);
    setIsCopied(true);
    toast.success("Link disalin ke clipboard");

    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LinkIcon className="h-5 w-5" />
            Generate Link Survey
          </DialogTitle>
          <DialogDescription>
            Buat link survey aman (Signed URL) khusus untuk client{" "}
            <strong>{name}</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {!generatedUrl ? (
            <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg bg-slate-50 text-slate-500">
              <p className="text-sm text-center mb-4">
                Link belum dibuat. Klik tombol di bawah untuk request link baru
                ke server.
              </p>
              <Button onClick={handleGenerate} disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLoading ? "Memproses..." : "Generate Link Sekarang"}
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="link">Link Survey Aktif</Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="link"
                  value={generatedUrl}
                  readOnly
                  className="bg-slate-50 font-mono text-sm"
                />
                <Button
                  size="icon"
                  variant="outline"
                  onClick={handleCopy}
                  className={
                    isCopied
                      ? "text-green-600 border-green-600 bg-green-50"
                      : ""
                  }
                >
                  {isCopied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground">
                *Link ini mengandung tanda tangan digital. Jangan diubah manual.
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="sm:justify-end">
          <DialogClose asChild>
            <Button type="button" variant="secondary">
              Tutup
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
