"use client";
import { useEffect, useRef, useState } from "react";

export function UseElementSize() {
  const ref = useRef(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!ref.current) return;

    const observer = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const entry = entries[0];

      // Menggunakan requestAnimationFrame untuk performa animasi yang halus
      requestAnimationFrame(() => {
        setSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      });
    });

    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return { ref, width: size.width, height: size.height };
}
