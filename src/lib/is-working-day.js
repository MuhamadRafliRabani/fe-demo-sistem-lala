import { HOLIDAYS } from "@/data/holydays";

export const isWorkingDay = (date) => {
  const day = date.getDay();
  const iso = date.toISOString().split("T")[0];

  if (day === 0 || day === 6) return false;
  if (HOLIDAYS.includes(iso)) return false;

  return true;
};
