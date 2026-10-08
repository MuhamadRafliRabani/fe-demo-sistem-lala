export const getScheduleText = (rule) => {
  if (rule.repeat_type === "daily") return "Setiap Hari";

  if (rule.repeat_type === "weekly") {
    const daysMap = {
      1: "Sen",
      2: "Sel",
      3: "Rab",
      4: "Kam",
      5: "Jum",
      6: "Sab",
      7: "Min",
    };
    const daysArray = Array.isArray(rule.weekdays)
      ? rule.weekdays
      : String(rule.weekdays || "").split(",");
    const days = daysArray
      .map((day) => daysMap[Number(day)])
      .filter(Boolean)
      .join(", ");
    return `Mingguan (${days})`;
  }

  if (rule.repeat_type === "monthly") {
    const dates = Array.isArray(rule.month_days)
      ? rule.month_days
      : String(rule.month_days || "").split(",");
    return `Setiap Tanggal: ${dates.join(", ")}`;
  }

  if (rule.repeat_type === "specific_dates") return "Tanggal Spesifik";
  return rule.repeat_type;
};
