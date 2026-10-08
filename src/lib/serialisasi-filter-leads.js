export const normalizeParams = (params) => {
  const out = { ...params };

  for (const key in out) {
    if (Array.isArray(out[key])) {
      out[key] = out[key].length ? out[key].join(",") : null;
    }
  }

  return out;
};
