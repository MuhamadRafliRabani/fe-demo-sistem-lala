import qs from "qs";

export function buildQuery(params) {
  return qs.stringify(params, {
    arrayFormat: "comma",
    encode: false,
    skipNulls: true,
  });
}
