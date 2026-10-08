"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Select, SelectContent, SelectItem, SelectTrigger } from "./ui/select";
import { useEffect, useState } from "react";

// Fungsi untuk mendapatkan ikon berdasarkan nilai tema
// Kita menggunakan ikon penuh agar SelectTrigger hanya menampilkan ini
function ThemeIcon({ currentTheme }) {
  if (currentTheme === "light") {
    // Sun adalah ikon default untuk light
    return <Sun className="size-[1.2rem] transition-all" />;
  }
  if (currentTheme === "dark") {
    // Moon adalah ikon default untuk dark
    return <Moon className="size-[1.2rem] transition-all" />;
  }
  // Monitor untuk system
  return <Monitor className="size-[1.2rem] transition-all" />;
}

export function ModeToggle() {
  const { setTheme, theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Tampilkan ikon default atau placeholder saat loading
    return (
      <div className="flex size-9 items-center justify-center rounded-md border">
        <Monitor className="size-4" />
      </div>
    );
  }

  return (
    <Select
      value={theme}
      onValueChange={(val) => {
        setTheme(val);
      }}
    >
      {/* SelectTrigger:
        1. Hapus w-[180px] dan ganti dengan className yang mengatur ukuran tombol.
        2. Gunakan "p-2" dan "h-9 w-12" (lebar sedikit lebih besar untuk panah).
        3. className="w-fit" memastikan lebar menyesuaikan.
        4. SelectValue tidak digunakan karena kita menaruh ikon secara langsung.
        5. Kita menggunakan ikon bawaan di SelectTrigger:
           - Ikon tema kita taruh di luar SelectValue/SelectIcon (untuk posisi di kiri).
           - Panah bawaan Select tetap ada.
      */}
      <SelectTrigger
        ChevronDown={false}
        className="
          h-9 w-12 p-0 
          justify-start focus:ring-0
          [&>span]:w-fit 
          data-[state=open]:bg-accent 
        "
      >
        <div className="flex items-center justify-center w-full">
          {/* Ikon Tema Aktif (Moon/Sun/Monitor) */}
          <ThemeIcon currentTheme={theme} />
        </div>

        {/* Catatan: Secara default, SelectTrigger di shadcn/ui memiliki ikon panah (ChevronDown) 
            di bagian paling kanan. Dengan p-0 dan w-12, tata letaknya akan terpusat seperti gambar. 
            Jika panah hilang, Anda bisa menambahkannya secara manual, tetapi biasanya SelectTrigger 
            sudah menyertakannya.
        */}
      </SelectTrigger>

      <SelectContent side="top">
        <SelectItem value="light">
          <div className="flex items-center space-x-2">
            <Sun className="size-4" />
            <span>Light</span>
          </div>
        </SelectItem>
        <SelectItem value="dark">
          <div className="flex items-center space-x-2">
            <Moon className="size-4" />
            <span>Dark</span>
          </div>
        </SelectItem>
        {/* <SelectItem value="system">
          <div className="flex items-center space-x-2">
            <Monitor className="size-4" />
            <span>System</span>
          </div>
        </SelectItem> */}
      </SelectContent>
    </Select>
  );
}
