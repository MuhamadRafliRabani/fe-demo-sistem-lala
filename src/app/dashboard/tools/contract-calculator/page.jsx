"use client";

import { useState, useEffect, useCallback } from "react";
import DashboardLayout from "@/components/layouts/dashboard-layout";
import { DatePicker } from "@/components/date-picker";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { calculateEndDate, countWorkingDays } from "@/lib/count-working-days";
import { Calendar, Calculator, Repeat, Clock } from "lucide-react";

export default function WorkingDaysCalculatorPage() {
  const [startDate, setStartDate] = useState(null);
  const [resultDate, setResultDate] = useState(null);
  const [duration, setDuration] = useState("");
  const [durationType, setDurationType] = useState("months");
  const [workingDays, setWorkingDays] = useState(0);

  // Fungsi kalkulasi yang dibungkus useCallback agar stabil
  const handleCalculate = useCallback(() => {
    const numDuration = Number(duration);

    if (startDate && numDuration > 0) {
      const endDate = calculateEndDate(startDate, numDuration, durationType);
      setResultDate(endDate);

      if (endDate) {
        const workingDaysCount = countWorkingDays(startDate, endDate);
        setWorkingDays(workingDaysCount);
      }
    } else {
      setResultDate(null);
      setWorkingDays(0);
    }
  }, [startDate, duration, durationType]);

  // Otomatis kalkulasi setiap kali input berubah
  useEffect(() => {
    handleCalculate();
  }, [handleCalculate]);

  const handleReset = () => {
    setStartDate(null);
    setResultDate(null);
    setDuration("");
    setDurationType("months");
    setWorkingDays(0);
  };

  return (
    <DashboardLayout
      title="Kalkulator Hari Kerja"
      desc="Hitung jumlah hari kerja antara dua tanggal (exclude weekend & hari libur nasional)"
    >
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="size-5 text-primary" />
              Kalkulator Hari Kerja Kontrak
            </CardTitle>
            <CardDescription>
              Masukkan tanggal mulai dan durasi kontrak untuk menghitung tanggal akhir dan jumlah hari kerja
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
              {/* Start Date */}
              <div className="space-y-2">
                <Label htmlFor="start-date" className="flex items-center gap-2">
                  <Calendar className="size-4" />
                  Tanggal Mulai <span className="text-red-500">*</span>
                </Label>
                <DatePicker
                  id="start-date"
                  label=""
                  value={startDate}
                  onChange={setStartDate}
                  placeholder="Pilih tanggal..."
                />
              </div>

              {/* Duration */}
              <div className="space-y-2">
                <Label htmlFor="duration" className="flex items-center gap-2">
                  <Clock className="size-4" />
                  Durasi <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="duration"
                  type="number"
                  min="1"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="Contoh: 12"
                />
              </div>

              {/* Duration Type */}
              <div className="space-y-2">
                <Label htmlFor="duration-type" className="flex items-center gap-2">
                  <Repeat className="size-4" />
                  Satuan
                </Label>
                <Select value={durationType} onValueChange={setDurationType}>
                  <SelectTrigger id="duration-type">
                    <SelectValue placeholder="Pilih tipe" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="months">Bulan</SelectItem>
                    <SelectItem value="years">Tahun</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Reset Button */}
              <Button
                variant="outline"
                onClick={handleReset}
                disabled={!startDate && !duration}
                className="w-full md:w-auto"
                type="button"
              >
                <Repeat className="mr-2 size-4" />
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Result Card */}
        {resultDate && (
          <Card className="border-primary/20 bg-primary/5 transition-all animate-in fade-in zoom-in duration-300">
            <CardHeader>
              <CardTitle className="text-lg">Hasil Perhitungan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-background border">
                    <p className="text-sm text-muted-foreground">Tanggal Mulai</p>
                    <p className="text-base font-semibold">
                      {startDate?.toLocaleDateString("id-ID", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>

                  <div className="p-4 rounded-lg bg-background border">
                    <p className="text-sm text-muted-foreground">Estimasi Tanggal Akhir</p>
                    <p className="text-base font-semibold text-primary">
                      {resultDate.toLocaleDateString("id-ID", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </div>

                <div className="p-6 rounded-lg bg-primary/10 border-2 border-primary/30 text-center">
                  <p className="text-sm text-muted-foreground mb-1">Total Durasi Kerja</p>
                  <p className="text-3xl font-bold text-primary">
                    {workingDays} <span className="text-xl font-medium">Hari Kerja</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-2 italic">
                    *Sudah dikurangi Sabtu, Minggu, dan Libur Nasional
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Info Card */}
        <Card className="bg-muted/50 border-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider">Informasi Parameter</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
              <li className="flex gap-2">
                <span className="text-primary font-bold">01.</span>
                Menghapus hari Sabtu dan Minggu otomatis.
              </li>
              <li className="flex gap-2">
                <span className="text-primary font-bold">02.</span>
                Mengacu pada daftar Hari Libur Nasional yang terdaftar.
              </li>
              <li className="flex gap-2">
                <span className="text-primary font-bold">03.</span>
                Metode perhitungan bersifat inklusif (H+0).
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}