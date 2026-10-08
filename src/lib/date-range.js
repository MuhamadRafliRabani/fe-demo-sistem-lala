export function useDateRange(type) {
  const now = new Date();

  const clean = (date) => {
    date.setHours(0, 0, 0, 0);
    return date;
  };

  switch (type) {
    case "today":
      // TEST: Maju 1 hari dari hari ini
      const tomorrow = new Date(now);
      // tomorrow.setDate(now.getDate() + 3);
      return {
        start: clean(new Date(tomorrow)),
        end: clean(new Date(tomorrow)),
      };

    case "yesterday":
      return {
        start: clean(new Date(now.setDate(now.getDate() - 1))),
        end: clean(new Date(now)),
      };

    case "next_3_days":
      // Ambil rentang 3 hari ke depan dari hari ini

      return {
        start: clean(new Date(now.setDate(now.getDate() + 3))),
        end: clean(new Date(now)),
      };

    case "this_week": {
      const start = new Date(now);
      const end = new Date(now);

      const day = now.getDay(); // 0 = Minggu, 1 Senin
      start.setDate(now.getDate() - day + 1); // Mulai Senin
      end.setDate(start.getDate() + 6);

      return { start: clean(start), end: clean(end) };
    }
    case "last_7_days": {
      const end = new Date(now); // Hari ini
      const start = new Date(now);

      // Mundur 6 hari ke belakang + hari ini = 7 hari
      start.setDate(end.getDate() - 6);

      return {
        start: clean(start),
        end: clean(end),
      };
    }

    // TAMBAHKAN ATAU UBAH INI
    case "last_30_days": {
      const end = new Date(now); // Hari ini (sesuai request)
      const start = new Date(now);

      // Mundur 29 hari ke belakang + hari ini = 30 hari
      start.setDate(end.getDate() - 29);

      return {
        start: clean(start),
        end: clean(end),
      };
    }

    // Case "this_month" yang lama mengambil sampai akhir bulan kalender
    // Jadi kita tidak pakai "this_month" jika ingin "end date"-nya hari ini.
    case "this_month":
      return {
        start: clean(new Date(now.getFullYear(), now.getMonth(), 1)),
        end: clean(new Date(now.getFullYear(), now.getMonth() + 1, 0)),
      };

    case "last_month":
      return {
        start: clean(new Date(now.getFullYear(), now.getMonth() - 1, 1)),
        end: clean(new Date(now.getFullYear(), now.getMonth(), 0)),
      };

    case "last_3_months":
      return {
        start: clean(new Date(now.getFullYear(), now.getMonth() - 3, 1)),
        end: clean(new Date(now.getFullYear(), now.getMonth(), 0)),
      };

    case "this_year":
      return {
        start: clean(new Date(now.getFullYear(), 0, 1)), // 1 Jan
        end: clean(new Date(now.getFullYear(), 11, 31)), // 31 Des
      };

    case "last_12_months": {
      const end = new Date(now); // hari ini
      const start = new Date(now);

      start.setFullYear(end.getFullYear() - 1);

      return {
        start: clean(start),
        end: clean(end),
      };
    }

    case "last_2_years_to_this_year_end": {
      // Mulai dari 1 Januari tahun lalu sampai 31 Desember tahun ini
      // Contoh: sekarang 2026, artinya dari 2025-01-01 sampai 2026-12-31
      const year = now.getFullYear();
      const start = new Date(year - 1, 0, 1); // 1 Jan previous year
      const end = new Date(year, 11, 31); // 31 Dec this year
      return {
        start: clean(start),
        end: clean(end),
      };
    }

    case "next_30_days": {
      const start = new Date(now); // Hari ini
      const end = new Date(now);

      // Maju 30 hari ke depan dari hari ini
      end.setDate(start.getDate() + 30);

      return {
        start: clean(start),
        end: clean(end),
      };
    }

    default:
      // Support custom duration: { days: 30 }, { months: 3 }
      if (typeof type === "object") {
        const start = new Date(now);
        const end = new Date(now);

        if (type.days) {
          start.setDate(now.getDate() - type.days);
        }

        if (type.months) {
          start.setMonth(now.getMonth() - type.months);
        }

        return { start: clean(start), end: clean(end) };
      }

      throw new Error("Invalid date-range type");
  }
}
