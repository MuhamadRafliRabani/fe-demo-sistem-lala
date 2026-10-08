import { isWorkingDay } from "./is-working-day";

/**
 * Menghitung jumlah hari kerja antara start date dan end date
 * Exclude weekend (Sabtu & Minggu) dan hari libur nasional
 *
 * @param {Date|string} startDate - Tanggal mulai
 * @param {Date|string} endDate - Tanggal akhir
 * @returns {number} Jumlah hari kerja
 */
export const countWorkingDays = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);

  // Set waktu ke awal hari untuk perbandingan yang akurat
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  // Validasi
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return 0;
  }

  if (start > end) {
    return 0;
  }

  let count = 0;
  const current = new Date(start);

  // Iterate dari start sampai end (inclusive)
  while (current <= end) {
    if (isWorkingDay(current)) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }

  return count;
};

/**
 * Menambahkan sejumlah hari kerja ke sebuah tanggal mulai.
 * Menggunakan logika yang sama dengan countWorkingDays:
 * - Exclude weekend (Sabtu & Minggu) dan hari libur nasional
 * - Inclusive: tanggal mulai yang merupakan hari kerja dihitung sebagai hari pertama
 *
 * @param {Date|string} startDate - Tanggal mulai
 * @param {number} workingDaysToAdd - Jumlah hari kerja yang ingin ditambahkan
 * @returns {Date|null} Tanggal akhir setelah ditambahkan hari kerja, atau null jika input tidak valid
 */
export const addWorkingDays = (startDate, workingDaysToAdd) => {
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);

  if (isNaN(start.getTime()) || typeof workingDaysToAdd !== "number" || workingDaysToAdd <= 0) {
    return null;
  }

  let count = 0;
  const current = new Date(start);

  while (count < workingDaysToAdd) {
    if (isWorkingDay(current)) {
      count++;
      if (count === workingDaysToAdd) {
        break;
      }
    }
    current.setDate(current.getDate() + 1);
  }

  return current;
};

/**
 * Menghitung tanggal akhir berdasarkan durasi bulan atau tahun
 * Exclude weekend (Sabtu & Minggu) dan hari libur nasional
 *
 * @param {Date|string} startDate - Tanggal mulai
 * @param {number} duration - Jumlah durasi (bulan atau tahun)
 * @param {string} type - Tipe durasi: 'months' atau 'years'
 * @returns {Date|null} Tanggal akhir setelah ditambahkan durasi, atau null jika input tidak valid
 */
export const calculateEndDate = (startDate, duration, type) => {
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);

  if (isNaN(start.getTime()) || typeof duration !== "number" || duration <= 0) {
    return null;
  }

  const end = new Date(start);
  
  if (type === 'months') {
    end.setMonth(end.getMonth() + duration);
  } else if (type === 'years') {
    end.setFullYear(end.getFullYear() + duration);
  } else {
    return null;
  }

  // Kurangi satu hari karena kita ingin tanggal akhir sebelum tanggal dimulainya periode berikutnya
  end.setDate(end.getDate() - 1);

  return end;
};
