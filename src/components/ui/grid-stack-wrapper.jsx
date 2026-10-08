import { useEffect, useRef } from "react";
import { GridStack } from "gridstack";
import "gridstack/dist/gridstack.min.css";

const GridstackWrapper = ({ items, onLayoutChange }) => {
  const gridRef = useRef(null); // Menyimpan instance GridStack
  const containerRef = useRef(null); // Referensi ke elemen DOM kontainer

  useEffect(() => {
    // Guard clause: Pastikan kontainer ada
    if (!containerRef.current) return;

    // Inisialisasi GridStack
    // Opsi 'float: true' sering diinginkan untuk dashboard modern agar widget tidak otomatis naik ke atas (gravity)
    const grid = GridStack.init(
      {
        float: true,
        cellHeight: "100px", // Tinggi baris dasar
        minRow: 1,
        margin: 10,
        column: 12, // Standar 12 kolom
        disableOneColumnMode: false, // Izinkan mode 1 kolom untuk mobile
      },
      containerRef.current
    );

    gridRef.current = grid;

    // Event Listener untuk Sinkronisasi State
    // Gridstack menggunakan event native, bukan React synthetic events
    grid.on("change", (event, changeItems) => {
      // Penting: Jangan langsung update state React di sini secara sinkronus jika frekuensinya tinggi
      // Gunakan debounce atau simpan state sementara untuk di-save kemudian
      const currentLayout = grid.save(false); // false = hanya metadata layout, bukan konten HTML
      onLayoutChange(currentLayout);
    });

    // Event Listener untuk Resize Stop (Penting untuk Recharts)
    grid.on("gsresizestop", (event, element) => {
      // Logika untuk memaksa redraw grafik jika ResizeObserver gagal (jarang terjadi di browser modern tapi mungkin)
      // Biasanya Recharts menangani ini via ResizeObserver otomatis
    });

    // Cleanup function untuk menangani unmount (dan remount di Strict Mode)
    return () => {
      // destroy(false) menghapus fungsionalitas grid tapi mempertahankan DOM nodes
      // agar React bisa melakukan clean-up sendiri atau re-mount ulang
      if (gridRef.current) {
        gridRef.current.destroy(false);
        gridRef.current = null;
      }
    };
  }); // Dependency array kosong = run once on mount

  // Render widget sebagai div biasa. GridStack akan mengubahnya menjadi widget interaktif.
  return (
    <div className="grid-stack" ref={containerRef}>
      {items.map((item) => (
        <div
          key={item.id}
          className="grid-stack-item"
          gs-id={item.id}
          gs-x={item.x}
          gs-y={item.y}
          gs-w={item.w}
          gs-h={item.h}
        >
          <div className="grid-stack-item-content">
            {/* Konten Widget (Grafik Shadcn) dirender di sini */}
            {item.content}
          </div>
        </div>
      ))}
    </div>
  );
};
