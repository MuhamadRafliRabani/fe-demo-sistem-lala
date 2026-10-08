export const checkActiveColums = (columns, visibleCols) => {
  const activeColumns = columns.filter((col) => visibleCols[col.key]);

  return { activeColumns };
};
