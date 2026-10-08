"use client";

import { useState, useCallback } from "react";
import DashboardLayout from "@/components/layouts/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QualitySelector } from "@/components/construction-estimator/quality-selector";
import { InputField } from "@/components/construction-estimator/input-field";
import { ResultCard } from "@/components/construction-estimator/result-card";
import { useConstructionEstimator } from "@/hooks/use-construction-estimator";
import { Home, Ruler, ArrowUpCircle, Info, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateConstructionEstimatorPDF } from "@/lib/construction-estimator-pdf";

export default function ConstructionEstimatorPage() {
  const [inputs, setInputs] = useState({
    landArea: 0,
    floor1Area: 0,
    floor2Area: 0,
    floor3Area: 0
  });
  const [quality, setQuality] = useState('gold');
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const calculation = useConstructionEstimator(inputs, quality);

  const handleInputChange = useCallback((field, value) => {
    setInputs(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleDownloadPDF = useCallback(async () => {
    if (isGeneratingPDF || !calculation.isBuildingValid) return;
    
    setIsGeneratingPDF(true);
    try {
      await generateConstructionEstimatorPDF({
        inputs,
        quality,
        calculation,
        locationMultiplier: 1.0,
        location: 'lainnya',
        includeContingency: false,
        contingencyPercent: 10,
        includeAdditional: false,
        totalAdditional: 0,
        breakdown: null,
        progressPayments: null,
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Terjadi kesalahan saat membuat PDF. Silakan coba lagi.');
    } finally {
      setIsGeneratingPDF(false);
    }
  }, [inputs, quality, calculation, isGeneratingPDF]);

  const handleReset = useCallback(() => {
    setInputs({ landArea: 0, floor1Area: 0, floor2Area: 0, floor3Area: 0 });
    setQuality('gold');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const scrollToResult = useCallback(() => {
    document.getElementById('result-section')?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  return (
    <DashboardLayout
      title="Kalkulator Estimasi Rumah"
      desc="Hitung estimasi biaya pembangunan rumah lengkap dengan pagar, carport, rooftop, dan sisa lahan"
    >
      <div className="space-y-6 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: Inputs */}
          <div className="lg:col-span-5 space-y-6 print:hidden">
            
            {/* Card 1: Dimensi Tanah & Bangunan */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Ruler className="text-blue-500" size={20} />
                  Dimensi Lahan & Bangunan
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <InputField 
                  label="Luas Tanah Total" 
                  value={inputs.landArea} 
                  onChange={(val) => handleInputChange('landArea', val)}
                  icon={Home}
                  placeholder="Contoh: 100"
                  suffix="m²"
                />
                
                <div className="space-y-4 pt-2">
                  <InputField 
                    label="Luas Lantai 1" 
                    value={inputs.floor1Area} 
                    onChange={(val) => handleInputChange('floor1Area', val)}
                    icon={Ruler}
                    placeholder="0"
                    suffix="m²"
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <InputField 
                      label="Luas Lantai 2" 
                      value={inputs.floor2Area} 
                      onChange={(val) => handleInputChange('floor2Area', val)}
                      icon={ArrowUpCircle}
                      placeholder="0"
                      suffix="m²"
                    />
                    <InputField 
                      label="Lt 3 / Rooftop" 
                      value={inputs.floor3Area} 
                      onChange={(val) => handleInputChange('floor3Area', val)}
                      icon={ArrowUpCircle}
                      placeholder="0"
                      suffix="m²"
                    />
                  </div>
                </div>
                
                {/* Info Sisa Lahan Real-time */}
                {calculation.isLandValid && inputs.floor1Area > 0 && (
                  <div className={`p-3 rounded-lg text-sm border flex items-center justify-between ${
                    calculation.remainingLandArea > 0 
                      ? 'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/20 dark:border-emerald-500/30' 
                      : 'bg-muted/50 text-muted-foreground border-border'
                  }`}>
                    <span>Sisa Tanah (Exterior):</span>
                    <span className="font-bold">{calculation.remainingLandArea} m²</span>
                  </div>
                )}

                {calculation.isOverLimit && calculation.isLandValid && (
                  <div className="flex items-start gap-2 p-3 bg-amber-500/10 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 text-sm rounded-lg border border-amber-500/20 dark:border-amber-500/30">
                    <Info className="shrink-0 mt-0.5" size={16} />
                    <p>Luas Lantai 1 lebih besar dari Luas Tanah. Pastikan ini sesuai dengan desain (misal: overstek atau ruko full bangunan).</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Card 2: Kualitas */}
            <Card>
              <CardContent className="">
                <QualitySelector selected={quality} onSelect={setQuality} />
              </CardContent>
            </Card>

            {/* Mobile View Result Button */}
            <Button 
              onClick={scrollToResult}
              className="w-full lg:hidden"
              size="lg"
            >
              Lihat Estimasi <ArrowRight size={18}/>
            </Button>

          </div>

          {/* RIGHT COLUMN: Results */}
          <div id="result-section" className="lg:col-span-7">
            
            {/* Empty State */}
            {!calculation.isBuildingValid ? (
              <Card className="min-h-[400px] flex flex-col items-center justify-center text-center p-8 print:hidden">
                <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-4">
                  <Ruler className="text-muted-foreground" size={40} />
                </div>
                <h3 className="text-lg font-bold text-foreground">Belum ada data</h3>
                <p className="text-muted-foreground max-w-xs mx-auto mt-2">
                  Silakan masukkan luas bangunan di kolom sebelah kiri untuk melihat estimasi biaya.
                </p>
              </Card>
            ) : (
              <ResultCard 
                calculation={calculation}
                inputs={inputs}
                quality={quality}
                onDownloadPDF={handleDownloadPDF}
                isGeneratingPDF={isGeneratingPDF}
                onReset={handleReset}
              />
            )}
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body { background: white; }
          .print\\:hidden { display: none !important; }
          .print\\:shadow-none { box-shadow: none !important; }
          .print\\:border-none { border: none !important; }
        }
      `}} />
    </DashboardLayout>
  );
}
