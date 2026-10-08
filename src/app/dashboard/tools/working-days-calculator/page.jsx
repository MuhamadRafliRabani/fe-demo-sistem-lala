"use client";

import { useState } from "react";
import DashboardLayout from "@/components/layouts/dashboard-layout";
import { DatePicker } from "@/components/date-picker";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { addWorkingDays } from "@/lib/count-working-days";
import { Calendar, Calculator, Repeat } from "lucide-react";

export default function WorkingDaysCalculatorPage() {
  const [startDate, setStartDate] = useState(null);
  const [resultDate, setResultDate] = useState(null);
  const WORKING_DAYS = 60;

  const handleReset = () => {
    setStartDate(null);
    setResultDate(null);
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
              <Calculator className="size-5" />
              Kalkulator Hari Kerja Kontrak
            </CardTitle>
            <CardDescription>
              Masukkan tanggal mulai dan tanggal akhir untuk menghitung jumlah hari kerja
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col md:flex-row gap-2 items-end">
              <div className="flex-1 space-y-2">
                <Label htmlFor="start-date" className="flex items-center gap-2">
                  <Calendar className="size-4" />
                  Start Date
                  <span className="text-red-500">*</span>
                </Label>
                <DatePicker
                  id="start-date"
                  label=""
                  value={startDate}
                  onChange={(date) => {
                    setStartDate(date);
                    if (date) {
                      const endDate = addWorkingDays(date, WORKING_DAYS);
                      setResultDate(endDate);
                    } else {
                      setResultDate(null);
                    }
                  }}
                  placeholder="Pilih tanggal mulai..."
                />
              </div>
              <Button
                variant="outline"
                onClick={handleReset}
                disabled={!startDate && !resultDate}
                className=" flex items-center justify-center ml-0 md:ml-2"
                title="Reset"
                type="button"
              >
                <Repeat className="size-4" />
              </Button>
            </div>

        
          </CardContent>
        </Card>

        {resultDate && (
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-lg">Hasil Perhitungan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2 items-end">
                  <div className="flex items-center justify-between p-4 rounded-lg bg-background border">
                    <div>
                      <p className="text-sm text-muted-foreground">Tanggal Mulai</p>
                      <p className="text-base font-medium">
                        {startDate
                          ? new Date(startDate).toLocaleDateString("id-ID", {
                              weekday: "long",
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })
                          : "-"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-lg bg-background border">
                    <div>
                      <p className="text-sm text-muted-foreground">Tanggal Akhir</p>
                      <p className="text-base font-medium">
                        {resultDate
                          ? new Date(resultDate).toLocaleDateString("id-ID", {
                              weekday: "long",
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })
                          : "-"}
                      </p>
                    </div>
                  </div>
                </div>


                <div className="p-6 rounded-lg bg-primary/10 border-2 border-primary/30">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-2">
                      Jumlah Hari Kerja
                    </p>
                    <p className="text-4xl font-bold text-primary">
                      {WORKING_DAYS} {WORKING_DAYS === 1 ? "Hari" : "Hari"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      (Exclude weekend & hari libur nasional)
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle className="text-base">Informasi</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>
                  Perhitungan hari kerja <strong>exclude</strong> hari Sabtu dan Minggu
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>
                  Perhitungan hari kerja <strong>exclude</strong> hari libur nasional
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>
                  Tanggal mulai dan tanggal akhir <strong>inclusive</strong> (termasuk dalam perhitungan)
                </span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
