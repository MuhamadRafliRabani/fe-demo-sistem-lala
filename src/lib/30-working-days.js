import { isWorkingDay } from "./is-working-day";

export const addWorkingDays = (start, days) => {
  const date = new Date(start);
  let count = 0;

  while (count < days) {
    date.setDate(date.getDate() + 1);

    if (isWorkingDay(date)) {
      count++;
    }
  }

  return date;
};
