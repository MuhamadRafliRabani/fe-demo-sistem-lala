export function toTitleCase(str, mode = "capitalize") {
  const input = str === null || str === undefined ? "" : String(str);
  if (!input.trim()) return "";

  const normalizedMode = String(mode || "capitalize").toLowerCase();
  const normalized = input.replace(/[ \t]+/g, " ").trim();

  const toSentenceCase = (s) => {
    const lower = s.toLowerCase();
    const i = lower.search(/[a-zA-ZÀ-ÿ]/);
    if (i === -1) return lower;
    return lower.slice(0, i) + lower.charAt(i).toUpperCase() + lower.slice(i + 1);
  };

  switch (normalizedMode) {
    case "uppercase":
      return normalized.toUpperCase();

    case "lowercase":
      return normalized.toLowerCase();

    case "sentencecase":
      return toSentenceCase(normalized);

    case "capitalize":
    default:
      const exceptions = [
        "and",
        "or",
        "the",
        "a",
        "an",
        "in",
        "on",
        "at",
        "to",
        "for",
        "dan",
        "di",
        "ke",
        "dari",
      ];

      const exceptionSet = new Set(exceptions);

      const capWord = (word) => {
        if (!word) return word;
        const parts = word.split("-");
        const cappedParts = parts.map((part) => {
          if (!part) return part;
          return part.charAt(0).toUpperCase() + part.slice(1);
        });
        return cappedParts.join("-");
      };

      return normalized
        .toLowerCase()
        .split(" ")
        .map((word, index) => {
          if (exceptionSet.has(word) && index !== 0) {
            return word;
          }
          return capWord(word);
        })
        .join(" ");
  }
}
