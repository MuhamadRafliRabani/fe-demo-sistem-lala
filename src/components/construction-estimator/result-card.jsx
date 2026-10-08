"use client";

import { formatCurrency } from "@/lib/construction-estimator-utils";
import {
  QUALITY_TIERS,
  BASE_RATE_LT1,
  BASE_RATE_LT2,
  BASE_RATE_LT3,
  BASE_RATE_LANDSCAPE,
} from "@/hooks/use-construction-estimator";
import { Wallet, Info, Trees, Printer, Save } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ResultCard({
  calculation,
  inputs,
  quality,
  onDownloadPDF,
  isGeneratingPDF = false,
  onReset,
  onSaveToDB,
  isSaving = false,
}) {
  const {
    floor1,
    floor2,
    floor3,
    remainingLandArea,
    totalArea,
    rate1,
    rate2,
    rate3,
    rateLandscape,
    cost1,
    cost2,
    cost3,
    costLandscape,
    totalCost,
    avgCostPerM2,
    estimatedMonthsMin,
    estimatedMonthsMax,
  } = calculation;

  return (
    <div className="bg-card rounded-2xl shadow-xl border border-border overflow-hidden print:shadow-none print:border-none">
      {/* Header Result */}
      <div className="bg-primary text-primary-foreground p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-foreground/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
        <div className="relative z-10">
          <div className="text-primary-foreground/80 font-medium mb-1 flex items-center gap-2">
            <Wallet size={18} />
            Total Estimasi Biaya
          </div>
          <div className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 text-success-foreground">
            {formatCurrency(totalCost)}
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="bg-primary-foreground/10 backdrop-blur-sm px-3 py-1.5 rounded-lg text-sm font-medium border border-primary-foreground/10">
              Total Bangunan: {totalArea} m²
            </div>
            <div className="bg-primary-foreground/10 backdrop-blur-sm px-3 py-1.5 rounded-lg text-sm font-medium border border-primary-foreground/10">
              Sisa Lahan: {remainingLandArea} m²
            </div>
            <div className="bg-primary-foreground/10 backdrop-blur-sm px-3 py-1.5 rounded-lg text-sm font-medium border border-primary-foreground/10 flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  quality === "standard"
                    ? "bg-blue-400"
                    : quality === "premium"
                      ? "bg-emerald-400"
                      : "bg-purple-400"
                }`}
              ></span>
              Kualitas {QUALITY_TIERS[quality].label.split("(")[0]}
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Breakdown Table */}
      <div className="p-8">
        <h4 className="font-bold text-foreground mb-4 flex items-center gap-2">
          <Info size={18} className="text-muted-foreground" />
          Rincian Perhitungan
        </h4>

        <div className="border border-border rounded-xl overflow-hidden mb-6">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground font-semibold border-b border-border">
              <tr>
                <th className="px-4 py-3">Komponen</th>
                <th className="px-4 py-3 text-right">Luas (m²)</th>
                <th className="px-4 py-3 text-right">Harga/m²</th>
                <th className="px-4 py-3 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {/* Lantai 1 */}
              <tr className="hover:bg-accent/50">
                <td className="px-4 py-3 font-medium text-foreground">
                  Lantai 1
                  <div className="text-xs text-muted-foreground font-normal mt-0.5">
                    Base: {formatCurrency(BASE_RATE_LT1)} x{" "}
                    {QUALITY_TIERS[quality].multiplier}
                  </div>
                </td>
                <td className="px-4 py-3 text-right text-muted-foreground">
                  {floor1}
                </td>
                <td className="px-4 py-3 text-right text-muted-foreground">
                  {formatCurrency(rate1)}
                </td>
                <td className="px-4 py-3 text-right font-bold text-foreground">
                  {formatCurrency(cost1)}
                </td>
              </tr>

              {/* Lantai 2 */}
              {floor2 > 0 && (
                <tr className="hover:bg-accent/50">
                  <td className="px-4 py-3 font-medium text-foreground">
                    Lantai 2
                    <div className="text-xs text-muted-foreground font-normal mt-0.5">
                      Base: {formatCurrency(BASE_RATE_LT2)} x{" "}
                      {QUALITY_TIERS[quality].multiplier}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right text-muted-foreground">
                    {floor2}
                  </td>
                  <td className="px-4 py-3 text-right text-muted-foreground">
                    {formatCurrency(rate2)}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-foreground">
                    {formatCurrency(cost2)}
                  </td>
                </tr>
              )}

              {/* Lantai 3 / Rooftop */}
              {floor3 > 0 && (
                <tr className="hover:bg-accent/50">
                  <td className="px-4 py-3 font-medium text-foreground">
                    Lantai 3 / Rooftop
                    <div className="text-xs text-muted-foreground font-normal mt-0.5">
                      Base: {formatCurrency(BASE_RATE_LT3)} x{" "}
                      {QUALITY_TIERS[quality].multiplier}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right text-muted-foreground">
                    {floor3}
                  </td>
                  <td className="px-4 py-3 text-right text-muted-foreground">
                    {formatCurrency(rate3)}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-foreground">
                    {formatCurrency(cost3)}
                  </td>
                </tr>
              )}

              {/* Pengerjaan Luar / Sisa Lahan */}
              {remainingLandArea > 0 && (
                <tr className="bg-success/10 hover:bg-success/20">
                  <td className="px-4 py-3 font-medium text-foreground">
                    <div className="flex items-center gap-1.5">
                      <Trees size={14} className="text-success" />
                      Eksterior / Sisa Lahan
                    </div>
                    <div className="text-xs text-muted-foreground font-normal mt-0.5">
                      Pagar, kanopi, taman, cat luar
                      <br />
                      Rate: {formatCurrency(BASE_RATE_LANDSCAPE)} x{" "}
                      {QUALITY_TIERS[quality].multiplier}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right text-muted-foreground">
                    {remainingLandArea}
                  </td>
                  <td className="px-4 py-3 text-right text-muted-foreground">
                    {formatCurrency(rateLandscape)}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-foreground">
                    {formatCurrency(costLandscape)}
                  </td>
                </tr>
              )}

              <tr className="bg-muted/50">
                <td className="px-4 py-3 font-bold text-foreground">
                  Total Keseluruhan
                </td>
                <td className="px-4 py-3 text-right font-bold text-foreground">
                  LT: {inputs.landArea || 0}
                </td>
                <td className="px-4 py-3 text-right">-</td>
                <td className="px-4 py-3 text-right font-bold text-primary">
                  {formatCurrency(totalCost)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="p-4 bg-primary/10 rounded-xl border-2 border-primary/40 ring-2 ring-primary/10 shadow-sm">
            <h5 className="text-primary font-bold mb-1 text-sm">
              Rata-rata (Build only)
            </h5>
            <p className="text-2xl font-extrabold text-primary tracking-tight">
              {formatCurrency(avgCostPerM2)}{" "}
              <span className="text-sm font-semibold text-primary/80">
                /m² bang.
              </span>
            </p>
          </div>
          <div className="p-4 bg-muted/50 rounded-xl border border-border">
            <h5 className="text-foreground font-bold mb-1 text-sm">
              Estimasi Waktu
            </h5>
            <p className="text-muted-foreground text-sm">
              Untuk luas {totalArea}m², estimasi pengerjaan sekitar{" "}
              <span className="font-bold text-foreground">
                {estimatedMonthsMin} - {estimatedMonthsMax} bulan
              </span>{" "}
              tergantung kondisi lapangan dan cuaca.
            </p>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="bg-warning/10 p-4 rounded-lg border border-warning/20 flex gap-3">
          <Info className="text-warning shrink-0" size={20} />
          <div className="text-xs text-warning-foreground leading-relaxed">
            <strong>Catatan Penting:</strong>
            <ul className="list-disc pl-4 mt-1 space-y-0.5 opacity-90">
              <li>
                Harga <strong>Lantai 3 / Rooftop</strong> diasumsikan lebih
                tinggi karena logistik dan risiko kerja di ketinggian.
              </li>
              <li>
                Biaya <strong>Eksterior</strong> mencakup pengerjaan pagar
                keliling, carport/kanopi standar, teras, dan pengecatan area
                luar.
              </li>
              <li>
                Perhitungan ini adalah estimasi kasar. Biaya aktual tergantung
                desain detail, kondisi tanah (perlu urug/tidak), dan akses jalan
                ke lokasi.
              </li>
            </ul>
          </div>
        </div>

        {/* Action Buttons for Result */}
        <div className="mt-8 flex gap-3 print:hidden">
          {onSaveToDB && (
            <Button
              onClick={onSaveToDB}
              disabled={isSaving || isGeneratingPDF}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save size={18} className="mr-2" />
                  Simpan ke DB
                </>
              )}
            </Button>
          )}
          <Button
            onClick={onDownloadPDF}
            disabled={isGeneratingPDF || isSaving}
            className="flex-1"
            variant={onSaveToDB ? "secondary" : "default"}
          >
            {isGeneratingPDF ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Membuat PDF...
              </>
            ) : (
              <>
                <Printer size={18} className="mr-2" />
                Unduh PDF
              </>
            )}
          </Button>
          <Button
            onClick={onReset}
            variant="outline"
            disabled={isGeneratingPDF || isSaving}
          >
            Hitung Ulang
          </Button>
        </div>
      </div>
    </div>
  );
}
