export const safeParseDate = (value) => {
  if (!value) return null;

  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
};
