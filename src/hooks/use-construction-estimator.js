import { useMemo } from "react";

// Constants
export const BASE_RATE_LT1 = 6000000; // 6 Juta
export const BASE_RATE_LT2 = 6500000; // 6.5 Juta
export const BASE_RATE_LT3 = 7000000; // 7 Juta (Logistik lebih sulit/tinggi)
export const BASE_RATE_LANDSCAPE = 3000000; // 3 Juta (Untuk sisa lahan: Pagar, Kanopi, dll)

export const QUALITY_TIERS = {
  gold: {
    id: "gold",
    label: "Gold Class",
    subLabel: "(Spesifikasi Medium)",
    multiplier: 1,
    description: "Pilihan cerdas dengan keseimbangan harga dan kualitas material tahan lama.",
    color: "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 ring-amber-500",
  },
  diamond: {
    id: "diamond",
    label: "Diamond Class",
    subLabel: "(Spesifikasi Premium)",
    multiplier: 1.5,
    description: "Kemewahan maksimal dengan material high-end, sanitari premium, dan finishing sempurna.",
    color: "bg-cyan-50 dark:bg-cyan-950/30 border-cyan-200 dark:border-cyan-800 text-cyan-700 dark:text-cyan-300 ring-cyan-500",
  },
};

// Data Spesifikasi Detail
// Data Spesifikasi Detail berdasarkan update Paket Rumah Langit dari Excel
// Gold: Rumah Standard
// Diamond: Rumah Luxury

export const SPEC_DETAILS = {
  gold: {
    atap: {
      penutup_atap: ["Fumira", "Alderon Twinwall"],
      rangka_atap: ["Baja Ringan 0.75 mm Truss"],
      rangka_kanopi: ["Holo Galvanis 4x4 & 6x4 Tebal 1.2 mm"],
      penutup_kanopi: ["Alderon RS", "Solarflat 3 mm"],
      talang: ["Talang Kotak Alderon"],
    },
    plafon: {
      rangka_plafon: ["Holo Almunium 4x4 & 4x2 cm"],
      penutup_plafon: ["Gypsum Aplus", "Gypsum Aplus Water Resistant", "Plafon PVC Shunda Plafon 30 cm", "Plafon Akustik", "WPC kisi kisi hw", "Shadowline"],
    },
    lantai: {
      Keramik: ["Milan", "Platinum", "Asia Tiles"],
      Granite: ["DBS", "Sandimas", "Valentino Gress"],
      SPC: ["Champion SPC"],
    },
    decking: {
      Granite_Tile: ["Vicenzia 30x15 cm", "Durafloor 30x15 cm"],
    },
    sanitary: {
      sink: ["Oki 60x45 cm"],
      kran_sink: ["Onda V Tul Flexy Tanam"],
      kran_taman: ["Onda A081 T", "Onda Kran Cabang K-Tul 1/2"],
      shower: ["Onda SB 21", "Onda RS Renew"],
      jet_washer: ["Washer WS 88TS", "Washer WS 168TS"],
      Closet: ["Toto 420 J", "Oulu C633"],
      Wastafel: ["DBS Munich", "Icepol ICN CT 1153"],
      Kran_Wastafel: ["Onda Y 327 GKU 1/2 Inch", "Onda Y 21 WH 12", "Onda Afur PW 101"],
      floordrain: ["Onda FLS 20"],
      plumbing: ["Pipa Air Bersih Rucika AW 1/2, 3/4, 1 Inch", "Pipa Air Kotor Rucika D 3,4 Inch"],
    },
    cat: {
      cat: [
        "Cat Dasar Interior Catylac",
        "Cat Dasar Exterior Catylac",
        "Cat Interior Dulux Catylac",
        "Cat Exterior Catylac",
        "Cat Dasar Interior Jotun Easy Primer",
        "Cat Dasar Exterior Jotun Tough Shied",
        "Cat Interior Jotun Easy Wipe",
        "Cat Exterior Jotun Tough Shield",
        "Cat Dasar Interior Nippon 5200",
        "Cat Dasar Interior & Exterior Nippon 5400",
        "Cat Interior Nippon Vinilex",
        "Cat Exterior Nippon Vinilex",
        "Cat Plafon / Ceiling Dulux Pentalite Ceiling",
        "Cat Waterproofing Exterior Aquaproof",
      ],
    },
    pintu: {
      daun_pintu: ["Pintu Gg Lite", "Pintu Multiplek Hpl Custom", "Pintu Kamar Mandi Eden Joice", "Pintu Kamar Mandi Pvc Zojiruji", "Pintu Kaca Sliding/Lipat 220x240 Cm"],
    },
    jendela: {
      item: ["Jendela Alumunium Custom 120x120", "Jendela Bouvenlight 60x40 cm"],
    },
    aksesoris: {
      pintu: ["Handle Paloma LRP 8161", "Engsel Paloma"],
    },
    listrik: {
      stop_kontak_saklar_lampu: [
        "Stop Kontak Panasonic",
        "Saklar Panasonic",
        "Antena Panasonic",
        "Ac Bpanasonic",
        "Stop Kontak Outdoor Brocco",
        "Lampu Spot Lukisan 360 Derajat",
        "Lampu Ceiling Halogen Double Fitting 24 Watt",
        "Lampu Spot Outbow",
        "Bohlam Hannocs 9, 12, 18, 24 Watt",
        "Downlight Fitting Philips 3 Inch",
        "Downlight Panel Hannocs",
        "Led Stripe Miyalux",
        "Spot Light Rel",
        "Spot Light In Lite Tancap Taman 3 Watt",
        "Exhaust Fan Maspion 7 Mv-16ex",
      ],
    },
  },
  diamond: {
    atap: {
      penutup_atap: ["Genteng Keramik Kanmuri", "Bitumen"],
      rangka_atap: ["Baja Ringan 0.75 mm Taso"],
      rangka_kanopi: ["Holo Galvanis 10x5 & 6x4 1.6 mm"],
      penutup_kanopi: ["Alderon Twin Wall", "Tempered Glass 8-10 mm"],
      talang: ["Talang Custom Bending", "Talang Safira", "Kanopi Lovera"],
    },
    plafon: {
      rangka_plafon: ["Holo Almunium 4x4 & 4x2 cm"],
      penutup_plafon: [
        "Gypsum Jaya Board",
        "Gypsum Jaya Board Water Resistant",
        "Plafon WPC Duma 100 SW 50 100",
        "Conwood Ceiling B",
        "Campion Wall Ceiling Cladding 10 cm",
        "Duma Coh 50x50 Kisi Kisi",
        "Plafon WPC Roshan Kisi Kisi",
        "List Plafon Gold Mirror L",
      ],
    },
    lantai: {
      Keramik: ["Athena", "Roman Tiles", "Habitat", "Aiga"],
      Granite: ["Roman Granite", "Niro Granite", "Granito", "Indogress", "Wisma Sehati"],
      SPC: ["Taco Spc", "Marvel Spc", "You.Ra Spc", "Vinyl Taco"],
    },
    decking: {
      Granite_Tile: ["Conwood Decking", "Decking WPC", "Decking Bengkirai"],
    },
    sanitary: {
      sink: ["Inobe 82x45 cm"],
      kran_sink: ["Brezio Fcbz8151", "Paloma Fcp 9262"],
      kran_taman: ["Onda A081 T", "Onda Kran Cabang K-Tul 1/2"],
      shower: ["Toto Hot/Cool Tx401sbv11", "Toto Hot/Cool Tx493srs", "Wasser Exclusive Ess-P150", "Aether Valpra Ceiling Shower Set"],
      jet_washer: ["Toto Thx20mcrb", "Paloma Tsp 310"],
      Closet: ["Toto Cw635pj/635jp1", "Toto 420 J", "Europe Enchanting E015", "Ice Closet Wallmount Ic E Wm 3970"],
      Wastafel: ["Toto Lw950cj", "Kohler K-20413t-0"],
      Kran_Wastafel: ["Toto Tx109lrs", "Toto Tx123lesv4n", "Toto T6jv6 Afur Wastafel"],
      Kran_bathub: ["Kran Shower Standing Bathtub Europe Enchanting E1585", "Onda Bathtub Mixer Bath-Sus Grey", "Toto Tx432sd", "Afur Bathtub"],
      floordrain: ["Wasser Hs 6060", "Wasser Hsa 6436", "Toto Tx1eb"],
      bathub: ["Bathtub Terazzo", "Bathtub Marble Standing"],
      shower_glass: ["Showerglass Mati 80x200 10 Mm Tempered", "Showerglass Swing Custom 10 Mm Tempered"],
      plumbing: ["Pipa Air Bersih Rucika Aw 1/2, 3/4, 1 Inch", "Pipa Air Kotor Rucika D 3, 4 Inch", "Pipa Air Panas Westpex"],
    },
    cat: {
      cat: [
        "Cat Dasar Interior Jotun Majestic Primer",
        "Cat Dasar Exterior Jotashield",
        "Cat Interior Jotun Majestic",
        "Cat Jotun Jotashield Extreme",
        "Cat Dasar Interior & Exterior Mowilex Precoat",
        "Cat Interior Mowilex Acrylic Emulsion",
        "Cat Exterior Mowilex Weathercoat",
        "Cat Dasar Interior Dulux Alkali Resisting",
        "Cat Dasar Exterior Dulux Weathershield",
        "Cat Interior Dulux Easy Clean",
        "Cat Exterior Dulux Weathershield",
        "Cat Plafon / Ceiling Dulux Pentalite Ceiling",
        "Cat Waterproofing Exterior Aquaproof",
      ],
    },
    pintu: {
      pintu: ["Pintu Utama Kayu Jati Premium 120x240", "Pintu Multiplek Hpl Custom", "Pintu Baja Maxgard", "Pintu Kamar Mandi Nexdoor", "Pintu Kaca Sliding/Lipat Upvc 300x240 Cm"],
    },
    jendela: {
      item: ["Jendela Kayu Kamper", "Jendela Kaca + UPVC Custom", "Jendela Bouvenlight UPVC 60x40 cm"],
    },
    aksesoris: {
      pintu: ["Smartlock Paloma DLP 3121", "Handle Pintu Utama PHP 3116", "Handle Paloma LRP 8161", "Engsel Paloma"],
    },
    listrik: {
      stop_kontak_saklar_lampu: [
        "Stop Kontak Nero",
        "Saklar Nero",
        "Antena Nero",
        "Stop Kontak Ac Nero",
        "Stop Kontak Outdoor Brocco",
        "Downlight Panel Philips",
        "Bohlam Philips",
        "Led Stripe Inlite",
        "Spot Light Philips",
        "Spot Light Hitam Philips Sl260 Rd 075 7.5w",
        "Spot Light Outdoor Philips Tancap Bgp 150 6w",
        "Spot Ceiling",
        "Led Ceiling Grille Light",
        "Downlight Fitting Philips 3 Inch",
        "Exhaust Fan Kdk 20tgq2",
      ],
    },
  },
};
/**
 * Custom hook untuk menghitung estimasi biaya konstruksi
 */
export function useConstructionEstimator(inputs, quality) {
  return useMemo(() => {
    const multiplier = QUALITY_TIERS[quality]?.multiplier || 1;

    // Calculate Areas
    const floor1 = inputs.floor1Area || 0;
    const floor2 = inputs.floor2Area || 0;
    const floor3 = inputs.floor3Area || 0;

    // Sisa tanah = Luas Tanah - Luas Lantai 1 (Ground Floor)
    const remainingLandArea = Math.max(0, (inputs.landArea || 0) - floor1);
    const totalArea = floor1 + floor2 + floor3;

    // Rate calculations based on quality
    const rate1 = BASE_RATE_LT1 * multiplier;
    const rate2 = BASE_RATE_LT2 * multiplier;
    const rate3 = BASE_RATE_LT3 * multiplier;
    const rateLandscape = BASE_RATE_LANDSCAPE * multiplier;

    // Cost Calculations
    const cost1 = floor1 * rate1;
    const cost2 = floor2 * rate2;
    const cost3 = floor3 * rate3;
    const costLandscape = remainingLandArea * rateLandscape;

    const totalCost = cost1 + cost2 + cost3 + costLandscape;

    // Validation
    const isLandValid = (inputs.landArea || 0) > 0;
    const isBuildingValid = totalArea > 0;
    const isOverLimit = floor1 > (inputs.landArea || 0);

    // Average cost per m² (build only)
    const avgCostPerM2 = totalArea > 0 ? (cost1 + cost2 + cost3) / totalArea : 0;

    // Estimated time (months)
    const estimatedMonthsMin = totalArea > 0 ? Math.ceil(totalArea / 20) : 0;
    const estimatedMonthsMax = totalArea > 0 ? Math.ceil(totalArea / 15) : 0;

    return {
      // Areas
      floor1,
      floor2,
      floor3,
      remainingLandArea,
      totalArea,

      // Rates
      rate1,
      rate2,
      rate3,
      rateLandscape,

      // Costs
      cost1,
      cost2,
      cost3,
      costLandscape,
      totalCost,

      // Validation
      isLandValid,
      isBuildingValid,
      isOverLimit,

      // Additional calculations
      avgCostPerM2,
      estimatedMonthsMin,
      estimatedMonthsMax,
    };
  }, [inputs, quality]);
}
