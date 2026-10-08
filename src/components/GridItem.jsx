"use client";

import { forwardRef } from "react";

// Menggunakan forwardRef agar Gridstack bisa mendeteksi elemen DOM jika diperlukan
export const GridItem = forwardRef(
  ({ id, x, y, w, h, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className="grid-stack-item "
        gs-id={id}
        gs-x={x}
        gs-y={y}
        gs-w={w}
        gs-h={h}
        {...props}
      >
        {/* 
        PENTING: 
        grid-stack-item-content adalah tempat konten Anda hidup.
        Kita beri class h-full w-full overflow-hidden agar isinya (Card)
        dipaksa mengikuti ukuran widget saat di-resize.
      */}
        <div className="grid-stack-item-content h-full w-full overflow-hidden p-1">
          {children}
        </div>
      </div>
    );
  }
);

GridItem.displayName = "GridItem";
