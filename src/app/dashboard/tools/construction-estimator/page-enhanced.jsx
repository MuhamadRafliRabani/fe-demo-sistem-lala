import React, { useState, useRef } from 'react';
import { 
  Calculator, Home, Ruler, Wallet, Info, Printer, ArrowRight, 
  Trees, ArrowUpCircle, Zap, BrickWall, Umbrella, Wind, Layers, 
  Droplet, PaintBucket, DoorOpen, Check, X, Bed, Bath, Car,
  MapPin, Building2, DollarSign, TrendingUp, FileText, Lightbulb
} from 'lucide-react';

// --- Constants & Configuration ---
const BASE_RATE_LT1 = 6000000; // 6 Juta (Base untuk Gold/Medium)
const BASE_RATE_LT2 = 6500000; // 6.5 Juta
const BASE_RATE_LT3 = 7000000; // 7 Juta
const BASE_RATE_LANDSCAPE = 3000000; // 3 Juta

// Biaya tambahan per m²
const ADDITIONAL_COSTS = {
  survey: 50000, // Biaya survey per m²
  imb: 50000, // Biaya IMB per m²
  konsultan: 100000, // Biaya konsultan per m²
};

// Persentase breakdown
const BREAKDOWN_PERCENTAGES = {
  struktur: 0.30, // 30%
  finishing: 0.25, // 25%
  instalasi: 0.15, // 15%
  landscape: 0.10, // 10%
  overhead: 0.20, // 20%
};

// Data Spesifikasi Detail
const SPEC_DETAILS = {
  gold: {
    electrical: { title: "Electrical (Listrik)", items: ["Lampu: In-Lite, Philips, LED-Down Light", "Saklar: Panasonic, Nero Schneider", "Kabel: Eterna, Supreme"] },
    structure: { title: "Structure (Struktur)", items: ["Beton: K225 / K250 (Sitemix / Readymix)", "Besi: Ulir 8, 10, 12, 13", "Plat Lantai: Konvensional / Bondek"] },
    wall: { title: "Wall (Dinding)", items: ["Bata: Hebel 7,5 / 10 / Bata Merah", "Semen: Tiga Roda / Gresik / Padang"] },
    roof: { title: "Roof (Atap)", items: ["Genteng: Beton (ex. Cisangkan), Bitumen, uPVC Alderon", "Rangka Atap: Baja Ringan 0.75 mm", "Kanopi: Onduline, Alderon, Solarflat 3 mm"] },
    plafond: { title: "Plafond (Plafon)", items: ["Gypsum: Aplus, Elephant 9 mm", "PVC: Shunda Plafon", "Rangka: Hollow 2×2, 4×4"] },
    flooring: { title: "Flooring (Lantai)", items: ["Granit Tile 60×60, Mainfloor 80×80", "Deck WPC / Vinyl / SPC Flooring", "Keramik 40×40, 50×50 (Service Area)"] },
    sanitary: { title: "Sanitary (Sanitasi)", items: ["Kloset: Toto, Wasser / setara", "Shower: Toto, Wasser, Onda", "Wastafel: Toto, Ceramax"] },
    plumbing: { title: "Plumbing (Instalasi Air)", items: ["Kitchen Sink: Inobe, Onan / setara", "Kran: Onda, Wasser", "Pipa: Rucika Type D & AW"] },
    paint: { title: "Finishing (Cat)", items: ["Interior: Dulux Catylac, Nippon, Mowilex", "Exterior: Propan Exterior, No Drop / Aquaproof"] },
    door: { title: "Door & Window", items: ["Pintu Kamar: Kayu Kamper, Multiplek Fin HPL", "Pintu KM: uPVC S-Plus / Alumunium", "Kusen: Kamper/Merbau atau Alumunium"] }
  },
  diamond: {
    electrical: { title: "Electrical (Listrik)", items: ["Lampu: LED-Down Light, Philips, Bardi", "Saklar: Schneider", "Kabel: Supreme"] },
    structure: { title: "Structure (Struktur)", items: ["Beton: K250 / K275 (Sitemix / Readymix)", "Besi: Ulir 8, 10, 12, 13, 16", "Plat Lantai: Konvensional / Bondek"] },
    wall: { title: "Wall (Dinding)", items: ["Bata: Bata Merah / Sandwich Panel", "Semen: Tiga Roda"] },
    roof: { title: "Roof (Atap)", items: ["Genteng: Keramik (Kanmuri/m-Class), Bitumen, Beton", "Rangka Atap: Baja Ringan >0.75 mm", "Kanopi: Tempered Glass 8-10 mm"] },
    plafond: { title: "Plafond (Plafon)", items: ["Gypsum: Jaya Board Water Resistant", "PVC: Sekayu / Setara", "Rangka: Hollow 2×2, 4×4"] },
    flooring: { title: "Flooring (Lantai)", items: ["Granit Tile 100×100", "Granit Alam & Marmer Slab 120×60 / 120×120", "(ex. Niro Granite, Roman, Quadra)"] },
    sanitary: { title: "Sanitary (Sanitasi)", items: ["Kloset: Grohe, Kohler, Toto One Piece", "Shower: Paloma, Toto", "Wastafel: Grohe, Kohler"] },
    plumbing: { title: "Plumbing (Instalasi Air)", items: ["Kitchen Sink: Well Up 8050, Blanco", "Kran: Toto, Kohler", "Pipa: Rucika Type AW"] },
    paint: { title: "Finishing (Cat)", items: ["Interior: Jotun Easy Wipe, Dulux Easy Clean", "Exterior: Jotun Weather Shield, Dulux Weathershield"] },
    door: { title: "Door & Window", items: ["Pintu: Kayu Solid Engineering", "Kusen: Kayu Solid Engineering / Alumunium YKK", "Aksesories: Paloma Exclusive"] }
  }
};

const QUALITY_TIERS = {
  gold: {
    id: 'gold',
    label: 'Gold Class',
    subLabel: '(Spesifikasi Medium)',
    multiplier: 1, // Base Price
    description: 'Pilihan cerdas dengan keseimbangan harga dan kualitas material tahan lama.',
    color: 'bg-amber-50 border-amber-200 text-amber-700 ring-amber-500',
    iconColor: 'bg-amber-100 text-amber-600'
  },
  diamond: {
    id: 'diamond',
    label: 'Diamond Class',
    subLabel: '(Spesifikasi Premium)',
    multiplier: 1.5, // 50% Higher for Luxury Specs (Marmer, Grohe, Solid Wood)
    description: 'Kemewahan maksimal dengan material high-end, sanitari premium, dan finishing sempurna.',
    color: 'bg-cyan-50 border-cyan-200 text-cyan-700 ring-cyan-500',
    iconColor: 'bg-cyan-100 text-cyan-600'
  }
};

// Lokasi multiplier (bisa disesuaikan)
const LOCATION_MULTIPLIERS = {
  'jakarta': 1.2,
  'bandung': 1.0,
  'surabaya': 1.1,
  'yogyakarta': 0.95,
  'bali': 1.15,
  'lainnya': 1.0,
};

// --- Helper Functions ---
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

// Progress Payment Schedule
const getProgressPayments = (totalCost) => {
  return [
    { stage: 'Pondasi & Struktur Bawah', percentage: 15, amount: totalCost * 0.15 },
    { stage: 'Struktur Atas & Dinding', percentage: 25, amount: totalCost * 0.25 },
    { stage: 'Atap & Plafon', percentage: 15, amount: totalCost * 0.15 },
    { stage: 'Instalasi (Listrik, Air, AC)', percentage: 10, amount: totalCost * 0.10 },
    { stage: 'Finishing Interior', percentage: 20, amount: totalCost * 0.20 },
    { stage: 'Finishing Exterior & Landscaping', percentage: 10, amount: totalCost * 0.10 },
    { stage: 'Serah Terima', percentage: 5, amount: totalCost * 0.05 },
  ];
};

// Tips berdasarkan input
const getTips = (inputs, quality, calculation) => {
  const tips = [];
  
  if (inputs.bedrooms > 0 && inputs.bathrooms === 0) {
    tips.push({
      icon: Bath,
      title: 'Pertimbangkan Kamar Mandi',
      text: `Dengan ${inputs.bedrooms} kamar tidur, disarankan minimal ${Math.ceil(inputs.bedrooms / 2)} kamar mandi untuk kenyamanan.`
    });
  }
  
  if (calculation.totalArea > 200) {
    tips.push({
      icon: Building2,
      title: 'Bangunan Besar',
      text: 'Untuk bangunan di atas 200m², pertimbangkan menggunakan konsultan arsitek untuk optimasi desain dan biaya.'
    });
  }
  
  if (quality === 'diamond' && calculation.totalCost > 2000000000) {
    tips.push({
      icon: DollarSign,
      title: 'Biaya Tinggi',
      text: 'Pertimbangkan untuk membagi proyek menjadi beberapa tahap jika budget terbatas.'
    });
  }
  
  if (inputs.garageArea === 0 && inputs.totalArea > 0) {
    tips.push({
      icon: Car,
      title: 'Tambah Garage',
      text: 'Pertimbangkan menambahkan area garage/carport minimal 15-20m² untuk kenyamanan.'
    });
  }
  
  if (calculation.remainingLandArea > 50) {
    tips.push({
      icon: Trees,
      title: 'Sisa Lahan Luas',
      text: 'Manfaatkan sisa lahan untuk taman, area rekreasi, atau investasi masa depan.'
    });
  }
  
  return tips;
};

// --- Sub-Components ---

const SpecModal = ({ isOpen, onClose, tierId }) => {
  if (!isOpen) return null;
  const specs = SPEC_DETAILS[tierId];
  const tier = QUALITY_TIERS[tierId];

  const categories = [
    { key: 'electrical', icon: Zap },
    { key: 'structure', icon: BrickWall },
    { key: 'wall', icon: Layers },
    { key: 'roof', icon: Umbrella },
    { key: 'plafond', icon: Wind },
    { key: 'flooring', icon: Layers },
    { key: 'sanitary', icon: Droplet },
    { key: 'plumbing', icon: Droplet },
    { key: 'paint', icon: PaintBucket },
    { key: 'door', icon: DoorOpen },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className={`p-6 border-b flex items-center justify-between ${tier.color}`}>
          <div>
            <h3 className="text-xl font-bold flex items-center gap-2">
              Spesifikasi {tier.label}
              <span className="text-sm font-normal opacity-80">{tier.subLabel}</span>
            </h3>
            <p className="text-sm opacity-90 mt-1">Detail material yang digunakan</p>
          </div>
          <button onClick={onClose} className="p-2 bg-white/50 hover:bg-white rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>
        
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {categories.map(({ key, icon: Icon }) => (
              <div key={key} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-blue-300 transition-colors">
                <div className="flex items-center gap-2 mb-3 text-slate-800 font-bold border-b border-slate-100 pb-2">
                  <Icon size={18} className="text-blue-500" />
                  {specs[key].title}
                </div>
                <ul className="space-y-1.5">
                  {specs[key].items.map((item, idx) => (
                    <li key={idx} className="text-sm text-slate-600 flex items-start gap-2">
                      <span className="mt-1.5 w-1 h-1 rounded-full bg-slate-400 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t bg-white flex justify-end">
          <button onClick={onClose} className="px-6 py-2 bg-slate-800 text-white rounded-lg font-medium hover:bg-slate-700 transition-colors">
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

const QualitySelector = ({ selected, onSelect, onShowSpecs }) => (
  <div className="space-y-4">
    <div className="flex items-center justify-between">
      <label className="block text-sm font-bold text-slate-700">
        Pilih Kelas Bangunan
      </label>
      <button 
        onClick={onShowSpecs}
        className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 hover:underline"
      >
        <Info size={14} />
        Lihat Detail Spek
      </button>
    </div>
    <div className="grid grid-cols-1 gap-4">
      {Object.values(QUALITY_TIERS).map((tier) => (
        <div key={tier.id} className="relative group">
          <button
            onClick={() => onSelect(tier.id)}
            className={`w-full relative p-5 rounded-2xl border-2 text-left transition-all duration-200 flex items-start gap-4
              ${selected === tier.id 
                ? `${tier.color} border-current shadow-md scale-[1.01]` 
                : 'bg-white border-slate-200 hover:border-slate-300 text-slate-600'
              }`}
          >
            <div className={`mt-1 w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0
              ${selected === tier.id ? 'border-current' : 'border-slate-300 bg-slate-50'}`}>
              {selected === tier.id && <div className="w-3 h-3 rounded-full bg-current" />}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-lg">{tier.label}</span>
                {selected === tier.id && <Check size={18} className="text-current" />}
              </div>
              <div className="text-sm font-medium opacity-90 mb-2">{tier.subLabel}</div>
              <div className="text-xs opacity-80 leading-relaxed">{tier.description}</div>
            </div>
          </button>
        </div>
      ))}
    </div>
  </div>
);

const InputField = ({ label, value, onChange, icon: Icon, placeholder, suffix, type = "number", min = 0 }) => (
  <div className="relative group">
    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">
      {label}
    </label>
    <div className="relative flex items-center">
      <div className="absolute left-3 text-slate-400 group-focus-within:text-blue-500 transition-colors">
        <Icon size={18} />
      </div>
      {type === "text" ? (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-10 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all outline-none font-medium text-slate-800"
        />
      ) : (
        <input
          type="number"
          min={min}
          value={value === 0 ? '' : value}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          placeholder={placeholder}
          className="w-full pl-10 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all outline-none font-medium text-slate-800"
        />
      )}
      {suffix && (
        <span className="absolute right-4 text-slate-400 text-sm font-medium bg-slate-50 pl-2">
          {suffix}
        </span>
      )}
    </div>
  </div>
);

const SelectField = ({ label, value, onChange, icon: Icon, options, placeholder }) => (
  <div className="relative group">
    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">
      {label}
    </label>
    <div className="relative flex items-center">
      <div className="absolute left-3 text-slate-400 z-10 pointer-events-none">
        <Icon size={18} />
      </div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all outline-none font-medium text-slate-800 appearance-none cursor-pointer"
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  </div>
);

// --- Main App Component ---
export default function App() {
  const [inputs, setInputs] = useState({
    landArea: 0,
    floor1Area: 0,
    floor2Area: 0,
    floor3Area: 0,
    bedrooms: 0,
    bathrooms: 0,
    garageArea: 0,
    fenceArea: 0,
    gardenArea: 0,
    location: 'lainnya',
    includeContingency: true,
    contingencyPercent: 10,
    includeAdditional: true,
  });
  const [quality, setQuality] = useState('gold');
  const [showSpecsModal, setShowSpecsModal] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [showProgress, setShowProgress] = useState(false);
  const [showTips, setShowTips] = useState(true);
  
  const resultRef = useRef(null);

  // Calculation Logic
  const multiplier = QUALITY_TIERS[quality].multiplier;
  const locationMultiplier = LOCATION_MULTIPLIERS[inputs.location] || 1.0;
  
  const floor1 = inputs.floor1Area;
  const floor2 = inputs.floor2Area;
  const floor3 = inputs.floor3Area;
  const remainingLandArea = Math.max(0, inputs.landArea - floor1);
  const totalArea = floor1 + floor2 + floor3;
  const exteriorArea = remainingLandArea; // Bisa ditambah garage, fence, garden

  const rate1 = BASE_RATE_LT1 * multiplier * locationMultiplier;
  const rate2 = BASE_RATE_LT2 * multiplier * locationMultiplier;
  const rate3 = BASE_RATE_LT3 * multiplier * locationMultiplier;
  const rateLandscape = BASE_RATE_LANDSCAPE * multiplier * locationMultiplier;

  const cost1 = floor1 * rate1;
  const cost2 = floor2 * rate2;
  const cost3 = floor3 * rate3;
  const costLandscape = exteriorArea * rateLandscape;
  
  // Biaya tambahan
  const additionalCosts = inputs.includeAdditional ? {
    survey: totalArea * ADDITIONAL_COSTS.survey,
    imb: totalArea * ADDITIONAL_COSTS.imb,
    konsultan: totalArea * ADDITIONAL_COSTS.konsultan,
  } : { survey: 0, imb: 0, konsultan: 0 };
  
  const totalAdditional = additionalCosts.survey + additionalCosts.imb + additionalCosts.konsultan;
  
  // Subtotal sebelum kontingensi
  const subtotal = cost1 + cost2 + cost3 + costLandscape + totalAdditional;
  
  // Kontingensi
  const contingency = inputs.includeContingency ? subtotal * (inputs.contingencyPercent / 100) : 0;
  
  // Total akhir
  const totalCost = subtotal + contingency;
  
  // Breakdown per kategori
  const breakdown = {
    struktur: subtotal * BREAKDOWN_PERCENTAGES.struktur,
    finishing: subtotal * BREAKDOWN_PERCENTAGES.finishing,
    instalasi: subtotal * BREAKDOWN_PERCENTAGES.instalasi,
    landscape: subtotal * BREAKDOWN_PERCENTAGES.landscape,
    overhead: subtotal * BREAKDOWN_PERCENTAGES.overhead,
  };
  
  const isLandValid = inputs.landArea > 0;
  const isBuildingValid = totalArea > 0;
  const isOverLimit = inputs.floor1Area > inputs.landArea;
  
  const progressPayments = getProgressPayments(totalCost);
  const tips = getTips(inputs, quality, { totalArea, totalCost, remainingLandArea });

  const handlePrint = () => {
    window.print();
  };

  const resetForm = () => {
    setInputs({ 
      landArea: 0, 
      floor1Area: 0, 
      floor2Area: 0, 
      floor3Area: 0,
      bedrooms: 0,
      bathrooms: 0,
      garageArea: 0,
      fenceArea: 0,
      gardenArea: 0,
      location: 'lainnya',
      includeContingency: true,
      contingencyPercent: 10,
      includeAdditional: true,
    });
    setQuality('gold');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-800 pb-12 selection:bg-blue-200">
      
      {/* Specs Modal */}
      <SpecModal 
        isOpen={showSpecsModal} 
        onClose={() => setShowSpecsModal(false)} 
        tierId={quality} 
      />

      {/* Header */}
      <div className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-20 print:hidden">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-blue-200 shadow-lg">
              <Calculator size={20} strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800 leading-none">EstiBangun</h1>
              <p className="text-xs text-slate-500 font-medium">Kalkulator Estimasi Rumah</p>
            </div>
          </div>
          <button 
            onClick={handlePrint}
            disabled={!isBuildingValid || isGeneratingPDF}
            className="hidden md:flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGeneratingPDF ? (
              <>
                <div className="w-3 h-3 border-2 border-slate-600 border-t-transparent rounded-full animate-spin"></div>
                Membuat PDF...
              </>
            ) : (
              <>
                <Printer size={16} />
                Unduh PDF
              </>
            )}
          </button>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 py-8">
        
        <div className="mb-8 text-center max-w-2xl mx-auto print:hidden">
          <h2 className="text-3xl font-bold text-slate-800 mb-3">Rencanakan Rumah Impian Anda</h2>
          <p className="text-slate-600">
            Hitung estimasi biaya pembangunan rumah lengkap dengan pagar, carport, rooftop, dan sisa lahan.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN */}
          <div className="lg:col-span-5 space-y-6 print:hidden">
            
            {/* Input Card */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <h3 className="flex items-center gap-2 font-bold text-lg text-slate-800 mb-6 border-b border-slate-100 pb-3">
                <Ruler className="text-blue-500" size={20} />
                Dimensi Lahan & Bangunan
              </h3>
              
              <div className="space-y-5">
                <InputField 
                  label="Luas Tanah Total" 
                  value={inputs.landArea} 
                  onChange={(val) => setInputs({...inputs, landArea: val})}
                  icon={Home}
                  placeholder="Contoh: 100"
                  suffix="m²"
                />
                
                <div className="space-y-4 pt-2">
                  <InputField 
                    label="Luas Lantai 1" 
                    value={inputs.floor1Area} 
                    onChange={(val) => setInputs({...inputs, floor1Area: val})}
                    icon={Ruler}
                    placeholder="0"
                    suffix="m²"
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <InputField 
                      label="Luas Lantai 2" 
                      value={inputs.floor2Area} 
                      onChange={(val) => setInputs({...inputs, floor2Area: val})}
                      icon={ArrowUpCircle}
                      placeholder="0"
                      suffix="m²"
                    />
                    <InputField 
                      label="Lt 3 / Rooftop" 
                      value={inputs.floor3Area} 
                      onChange={(val) => setInputs({...inputs, floor3Area: val})}
                      icon={ArrowUpCircle}
                      placeholder="0"
                      suffix="m²"
                    />
                  </div>
                </div>
                
                {/* Input Tambahan */}
                <div className="pt-4 border-t border-slate-100 space-y-4">
                  <h4 className="text-sm font-semibold text-slate-600 mb-3">Detail Tambahan</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <InputField 
                      label="Kamar Tidur" 
                      value={inputs.bedrooms} 
                      onChange={(val) => setInputs({...inputs, bedrooms: val})}
                      icon={Bed}
                      placeholder="0"
                      suffix="unit"
                    />
                    <InputField 
                      label="Kamar Mandi" 
                      value={inputs.bathrooms} 
                      onChange={(val) => setInputs({...inputs, bathrooms: val})}
                      icon={Bath}
                      placeholder="0"
                      suffix="unit"
                    />
                  </div>
                  
                  <InputField 
                    label="Luas Garage/Carport" 
                    value={inputs.garageArea} 
                    onChange={(val) => setInputs({...inputs, garageArea: val})}
                    icon={Car}
                    placeholder="0"
                    suffix="m²"
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <InputField 
                      label="Luas Pagar" 
                      value={inputs.fenceArea} 
                      onChange={(val) => setInputs({...inputs, fenceArea: val})}
                      icon={BrickWall}
                      placeholder="0"
                      suffix="m²"
                    />
                    <InputField 
                      label="Luas Taman" 
                      value={inputs.gardenArea} 
                      onChange={(val) => setInputs({...inputs, gardenArea: val})}
                      icon={Trees}
                      placeholder="0"
                      suffix="m²"
                    />
                  </div>
                  
                  <SelectField
                    label="Lokasi Proyek"
                    value={inputs.location}
                    onChange={(val) => setInputs({...inputs, location: val})}
                    icon={MapPin}
                    options={[
                      { label: 'Jakarta', value: 'jakarta' },
                      { label: 'Bandung', value: 'bandung' },
                      { label: 'Surabaya', value: 'surabaya' },
                      { label: 'Yogyakarta', value: 'yogyakarta' },
                      { label: 'Bali', value: 'bali' },
                      { label: 'Lainnya', value: 'lainnya' },
                    ]}
                    placeholder="Pilih lokasi"
                  />
                </div>
                
                {isLandValid && inputs.floor1Area > 0 && (
                  <div className={`p-3 rounded-lg text-sm border flex items-center justify-between ${remainingLandArea > 0 ? 'bg-green-50 text-green-700 border-green-200' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                    <span>Sisa Tanah (Exterior):</span>
                    <span className="font-bold">{remainingLandArea} m²</span>
                  </div>
                )}

                {isOverLimit && isLandValid && (
                  <div className="flex items-start gap-2 p-3 bg-amber-50 text-amber-700 text-sm rounded-lg border border-amber-200 animate-in fade-in slide-in-from-top-2">
                    <Info className="shrink-0 mt-0.5" size={16} />
                    <p>Luas Lantai 1 lebih besar dari Luas Tanah.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Quality Selector */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <QualitySelector 
                selected={quality} 
                onSelect={setQuality} 
                onShowSpecs={() => setShowSpecsModal(true)}
              />
            </div>

            {/* Biaya Tambahan & Kontingensi */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <h3 className="flex items-center gap-2 font-bold text-lg text-slate-800 mb-4 border-b border-slate-100 pb-3">
                <DollarSign className="text-blue-500" size={20} />
                Biaya Tambahan
              </h3>
              
              <div className="space-y-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={inputs.includeAdditional}
                    onChange={(e) => setInputs({...inputs, includeAdditional: e.target.checked})}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-slate-700">Sertakan Biaya Survey, IMB & Konsultan</span>
                </label>
                
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={inputs.includeContingency}
                    onChange={(e) => setInputs({...inputs, includeContingency: e.target.checked})}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-slate-700">Sertakan Kontingensi</span>
                </label>
                
                {inputs.includeContingency && (
                  <div className="pl-6 space-y-2">
                    <label className="text-xs font-semibold text-slate-600">Persentase Kontingensi</label>
                    <input
                      type="range"
                      min="5"
                      max="20"
                      value={inputs.contingencyPercent}
                      onChange={(e) => setInputs({...inputs, contingencyPercent: parseFloat(e.target.value)})}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>5%</span>
                      <span className="font-bold text-blue-600">{inputs.contingencyPercent}%</span>
                      <span>20%</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <button 
              onClick={() => {
                document.getElementById('result-section').scrollIntoView({ behavior: 'smooth' });
              }}
              className="w-full lg:hidden py-4 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-200 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              Lihat Estimasi <ArrowRight size={18}/>
            </button>

          </div>

          {/* RIGHT COLUMN */}
          <div id="result-section" className="lg:col-span-7" ref={resultRef}>
            
            {!isBuildingValid ? (
              <div className="h-full min-h-[400px] flex flex-col items-center justify-center bg-white rounded-2xl border-2 border-dashed border-slate-200 text-center p-8 print:hidden">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                  <Calculator className="text-slate-300" size={40} />
                </div>
                <h3 className="text-lg font-bold text-slate-600">Belum ada data</h3>
                <p className="text-slate-400 max-w-xs mx-auto mt-2">
                  Silakan masukkan luas bangunan di kolom sebelah kiri untuk melihat estimasi biaya.
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden print:shadow-none print:border-none">
                
                {/* Result Header */}
                <div className="bg-slate-900 text-white p-8 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
                  <div className="relative z-10">
                    <div className="text-slate-300 font-medium mb-1 flex items-center gap-2">
                      <Wallet size={18} />
                      Total Estimasi Biaya
                    </div>
                    <div className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 text-emerald-400">
                      {formatCurrency(totalCost)}
                    </div>
                    
                    <div className="flex flex-wrap gap-3">
                      <div className="bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-lg text-sm font-medium border border-white/10">
                        Total Bangunan: {totalArea} m²
                      </div>
                       <div className="bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-lg text-sm font-medium border border-white/10">
                        Sisa Lahan: {remainingLandArea} m²
                      </div>
                      <div className="bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-lg text-sm font-medium border border-white/10 flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${
                          quality === 'gold' ? 'bg-amber-400' : 'bg-cyan-400'
                        }`}></span>
                        {QUALITY_TIERS[quality].label}
                      </div>
                      {locationMultiplier !== 1.0 && (
                        <div className="bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-lg text-sm font-medium border border-white/10">
                          {Object.entries(LOCATION_MULTIPLIERS).find(([k]) => k === inputs.location)?.[0] || 'Lokasi'} ×{locationMultiplier.toFixed(2)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Breakdown */}
                <div className="p-8">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-bold text-slate-800 flex items-center gap-2">
                      <Info size={18} className="text-slate-400"/>
                      Rincian Perhitungan
                    </h4>
                    <button
                      onClick={() => setShowBreakdown(!showBreakdown)}
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                    >
                      {showBreakdown ? 'Sembunyikan' : 'Tampilkan'} Breakdown Kategori
                    </button>
                  </div>
                  
                  {/* Breakdown per Kategori */}
                  {showBreakdown && (
                    <div className="mb-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
                      <h5 className="font-semibold text-slate-700 mb-3 text-sm">Breakdown Per Kategori</h5>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                        <div>
                          <span className="text-slate-500">Struktur (30%):</span>
                          <div className="font-bold text-slate-800">{formatCurrency(breakdown.struktur)}</div>
                        </div>
                        <div>
                          <span className="text-slate-500">Finishing (25%):</span>
                          <div className="font-bold text-slate-800">{formatCurrency(breakdown.finishing)}</div>
                        </div>
                        <div>
                          <span className="text-slate-500">Instalasi (15%):</span>
                          <div className="font-bold text-slate-800">{formatCurrency(breakdown.instalasi)}</div>
                        </div>
                        <div>
                          <span className="text-slate-500">Landscape (10%):</span>
                          <div className="font-bold text-slate-800">{formatCurrency(breakdown.landscape)}</div>
                        </div>
                        <div>
                          <span className="text-slate-500">Overhead (20%):</span>
                          <div className="font-bold text-slate-800">{formatCurrency(breakdown.overhead)}</div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="border rounded-xl overflow-hidden mb-6">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-slate-50 text-slate-500 font-semibold border-b">
                        <tr>
                          <th className="px-4 py-3">Komponen</th>
                          <th className="px-4 py-3 text-right">Luas (m²)</th>
                          <th className="px-4 py-3 text-right">Harga/m²</th>
                          <th className="px-4 py-3 text-right">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        <tr className="hover:bg-slate-50/50">
                          <td className="px-4 py-3 font-medium text-slate-700">
                            Lantai 1
                            <div className="text-xs text-slate-400 font-normal mt-0.5">Base: {formatCurrency(BASE_RATE_LT1)} × {multiplier}{locationMultiplier !== 1.0 && ` × ${locationMultiplier.toFixed(2)}`}</div>
                          </td>
                          <td className="px-4 py-3 text-right text-slate-600">{floor1}</td>
                          <td className="px-4 py-3 text-right text-slate-600">{formatCurrency(rate1)}</td>
                          <td className="px-4 py-3 text-right font-bold text-slate-800">{formatCurrency(cost1)}</td>
                        </tr>

                        {floor2 > 0 && (
                          <tr className="hover:bg-slate-50/50">
                            <td className="px-4 py-3 font-medium text-slate-700">
                              Lantai 2
                              <div className="text-xs text-slate-400 font-normal mt-0.5">Base: {formatCurrency(BASE_RATE_LT2)} × {multiplier}</div>
                            </td>
                            <td className="px-4 py-3 text-right text-slate-600">{floor2}</td>
                            <td className="px-4 py-3 text-right text-slate-600">{formatCurrency(rate2)}</td>
                            <td className="px-4 py-3 text-right font-bold text-slate-800">{formatCurrency(cost2)}</td>
                          </tr>
                        )}

                        {floor3 > 0 && (
                          <tr className="hover:bg-slate-50/50">
                            <td className="px-4 py-3 font-medium text-slate-700">
                              Lantai 3 / Rooftop
                              <div className="text-xs text-slate-400 font-normal mt-0.5">Base: {formatCurrency(BASE_RATE_LT3)} × {multiplier}</div>
                            </td>
                            <td className="px-4 py-3 text-right text-slate-600">{floor3}</td>
                            <td className="px-4 py-3 text-right text-slate-600">{formatCurrency(rate3)}</td>
                            <td className="px-4 py-3 text-right font-bold text-slate-800">{formatCurrency(cost3)}</td>
                          </tr>
                        )}
                        
                        {remainingLandArea > 0 && (
                          <tr className="bg-green-50/50 hover:bg-green-50">
                            <td className="px-4 py-3 font-medium text-slate-700">
                              <div className="flex items-center gap-1.5">
                                <Trees size={14} className="text-green-600"/>
                                Eksterior / Sisa Lahan
                              </div>
                              <div className="text-xs text-slate-400 font-normal mt-0.5">
                                Pagar, kanopi, taman, cat luar
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right text-slate-600">{remainingLandArea}</td>
                            <td className="px-4 py-3 text-right text-slate-600">{formatCurrency(rateLandscape)}</td>
                            <td className="px-4 py-3 text-right font-bold text-slate-800">{formatCurrency(costLandscape)}</td>
                          </tr>
                        )}

                        {inputs.includeAdditional && totalAdditional > 0 && (
                          <>
                            <tr className="bg-blue-50/50 hover:bg-blue-50">
                              <td className="px-4 py-3 font-medium text-slate-700" colSpan={3}>
                                Biaya Survey, IMB & Konsultan
                              </td>
                              <td className="px-4 py-3 text-right font-bold text-slate-800">{formatCurrency(totalAdditional)}</td>
                            </tr>
                          </>
                        )}

                        <tr className="bg-slate-50 border-t-2 border-slate-200">
                          <td className="px-4 py-3 font-bold text-slate-800">Subtotal</td>
                          <td className="px-4 py-3 text-right font-bold text-slate-800">
                            LT: {inputs.landArea}
                          </td>
                          <td className="px-4 py-3 text-right">-</td>
                          <td className="px-4 py-3 text-right font-bold text-slate-800">{formatCurrency(subtotal)}</td>
                        </tr>

                        {inputs.includeContingency && contingency > 0 && (
                          <tr className="bg-amber-50/50 border-t border-amber-200">
                            <td className="px-4 py-3 font-medium text-slate-700">
                              Kontingensi ({inputs.contingencyPercent}%)
                              <div className="text-xs text-slate-400 font-normal mt-0.5">Cadangan untuk biaya tak terduga</div>
                            </td>
                            <td className="px-4 py-3 text-right" colSpan={2}>-</td>
                            <td className="px-4 py-3 text-right font-bold text-amber-700">{formatCurrency(contingency)}</td>
                          </tr>
                        )}

                        <tr className="bg-slate-900 text-white">
                          <td className="px-4 py-3 font-bold">Total Keseluruhan</td>
                          <td className="px-4 py-3 text-right" colSpan={2}>-</td>
                          <td className="px-4 py-3 text-right font-bold text-emerald-400 text-lg">{formatCurrency(totalCost)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Progress Payment */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-bold text-slate-800 flex items-center gap-2">
                        <TrendingUp size={18} className="text-slate-400"/>
                        Jadwal Progress Payment
                      </h4>
                      <button
                        onClick={() => setShowProgress(!showProgress)}
                        className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                      >
                        {showProgress ? 'Sembunyikan' : 'Tampilkan'} Detail
                      </button>
                    </div>
                    
                    {showProgress && (
                      <div className="border rounded-xl overflow-hidden">
                        <table className="w-full text-sm">
                          <thead className="bg-slate-50 text-slate-500 font-semibold border-b">
                            <tr>
                              <th className="px-4 py-3 text-left">Tahap</th>
                              <th className="px-4 py-3 text-right">Persentase</th>
                              <th className="px-4 py-3 text-right">Jumlah</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {progressPayments.map((payment, idx) => (
                              <tr key={idx} className="hover:bg-slate-50/50">
                                <td className="px-4 py-3 font-medium text-slate-700">{payment.stage}</td>
                                <td className="px-4 py-3 text-right text-slate-600">{payment.percentage}%</td>
                                <td className="px-4 py-3 text-right font-bold text-slate-800">{formatCurrency(payment.amount)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Tips & Saran */}
                  {showTips && tips.length > 0 && (
                    <div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-bold text-slate-800 flex items-center gap-2">
                          <Lightbulb size={18} className="text-blue-600"/>
                          Tips & Saran
                        </h4>
                        <button
                          onClick={() => setShowTips(false)}
                          className="text-xs text-blue-600 hover:text-blue-700"
                        >
                          <X size={14} />
                        </button>
                      </div>
                      <div className="space-y-3">
                        {tips.map((tip, idx) => (
                          <div key={idx} className="flex items-start gap-3 p-3 bg-white rounded-lg border border-blue-100">
                            <tip.icon size={20} className="text-blue-500 mt-0.5 shrink-0" />
                            <div>
                              <div className="font-semibold text-slate-800 text-sm mb-1">{tip.title}</div>
                              <div className="text-xs text-slate-600">{tip.text}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Summary & Buttons */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                     <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                        <h5 className="text-blue-800 font-bold mb-1 text-sm">Rata-rata (Build only)</h5>
                        <p className="text-2xl font-bold text-blue-600">
                          {formatCurrency((cost1 + cost2 + cost3) / totalArea)} <span className="text-sm font-normal text-blue-400">/m² bang.</span>
                        </p>
                     </div>
                     <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <h5 className="text-slate-800 font-bold mb-1 text-sm">Estimasi Waktu</h5>
                        <p className="text-slate-600 text-sm">
                          Estimasi pengerjaan sekitar <span className="font-bold text-slate-800">{Math.ceil(totalArea / 20)} - {Math.ceil(totalArea / 15)} bulan</span>.
                        </p>
                     </div>
                  </div>

                  <div className="mt-8 flex gap-3 print:hidden">
                    <button 
                      onClick={handlePrint}
                      disabled={isGeneratingPDF}
                      className="flex-1 py-3 px-4 bg-slate-800 text-white rounded-xl font-medium hover:bg-slate-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isGeneratingPDF ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Membuat PDF...
                        </>
                      ) : (
                        <>
                          <Printer size={18} />
                          Unduh PDF
                        </>
                      )}
                    </button>
                    <button 
                      onClick={resetForm}
                      className="py-3 px-6 bg-white border border-slate-300 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-colors"
                    >
                      Hitung Ulang
                    </button>
                  </div>

                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="max-w-5xl mx-auto px-4 py-6 text-center text-slate-400 text-sm print:hidden">
        <p>© {new Date().getFullYear()} EstiBangun Calculator. Dibuat untuk memudahkan perencanaan rumah Anda.</p>
      </footer>

      <style>{`
        @media print {
          body { background: white; }
          .print\\:hidden { display: none !important; }
          .print\\:shadow-none { box-shadow: none !important; }
          .print\\:border-none { border: none !important; }
        }
      `}</style>
    </div>
  );
}
