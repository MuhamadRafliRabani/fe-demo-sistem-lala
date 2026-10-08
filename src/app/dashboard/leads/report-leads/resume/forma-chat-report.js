const formatReportDate = (dateValue) => {
  if (!dateValue) return "-";

  const date =
    dateValue instanceof Date
      ? dateValue
      : new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

export const formatDailyReportMessage = (
  leads = [],
  startDate = new Date(),
  endDate = startDate,
) => {
  const formattedStartDate = formatReportDate(startDate);
  const formattedEndDate = formatReportDate(endDate);
  const reportDate =
    formattedStartDate === formattedEndDate
      ? formattedStartDate
      : `${formattedStartDate} - ${formattedEndDate}`;

  const normalizeStatus = (value) => {
    const raw = String(value ?? "").trim();
    if (!raw) return "";

    return raw
      .toLowerCase()
      .replace(/[_-]+/g, " ")
      .replace(/\s+/g, " ")
      .replace(/\bdiscusion\b/g, "discussion")
      .trim();
  };

  const toDisplayStatus = (value) => {
    const status = normalizeStatus(value);
    if (!status) return "No Response";
    if (status === "no respon") return "No Response";
    if (status === "on discussion") return "On Discussion";
    if (status === "wilayah") return "Wilayah";
    if (status === "budget") return "Budget";
    if (status === "deal") return "Deal";

    return String(value ?? "No Response").trim() || "No Response";
  };

  const safeValue = (value, fallback = "-") => {
    if (
      value === null ||
      value === undefined ||
      value === "" ||
      value === "-" ||
      value === "--"
    )
      return fallback;
    return String(value);
  };

  const readLeadValue = (lead, keys, fallback = "-") => {
    if (!lead || typeof lead !== "object") return fallback;

    for (const key of keys) {
      const value = lead[key];
      if (value !== null && value !== undefined && value !== "") {
        return value;
      }
    }

    return fallback;
  };

  const items = Array.isArray(leads) ? leads : [];
  const onDiscussion = items.filter(
    (lead) =>
      normalizeStatus(lead.status) === "on discussion" ||
      normalizeStatus(lead.status) === "on discusion",
  );
  const noResponse = items.filter(
    (lead) =>
      normalizeStatus(lead.status) === "no respon" ||
      normalizeStatus(lead.status) === "no response",
  );
  const deal = items.filter((lead) => normalizeStatus(lead.status) === "deal");
  const budget = items.filter(
    (lead) => normalizeStatus(lead.status) === "budget",
  );
  const wilayah = items.filter(
    (lead) => normalizeStatus(lead.status) === "wilayah",
  );

  const renderList = (list, title) => {
    if (!list.length) {
      return `Tidak ada leads dengan status ${title.toLowerCase()}.`;
    }

    return list
      .map((lead, index) => {
        const whatsapp = readLeadValue(lead, [
          "whatsapp_number",
          "phone",
          "contact",
          "contact_number",
        ]);
        const buildingArea = readLeadValue(lead, [
          "building_area",
          "luas_bangunan",
          "area",
          "buildingArea",
          "luasBangunan",
        ]);
        const notes = readLeadValue(lead, ["notes", "catatan", "note"]);
        const formattedArea =
          buildingArea === null ||
          buildingArea === "-" ||
          buildingArea === undefined ||
          buildingArea === "" ||
          buildingArea == 0
            ? "Belum diketahui"
            : `${Number(buildingArea).toLocaleString("id-ID", { maximumFractionDigits: 2 })} m²`;

        return `${index + 1}. Nama : ${safeValue(lead.name, "-")}
   Kontak : ${safeValue(whatsapp, "-")}
   Proyek : ${safeValue(lead.building_type, "-")}
   Kebutuhan : ${safeValue(lead.request_type, "Belum diketahui")}
   Lokasi : ${safeValue(lead.location, "Belum diketahui")}
   Luas : ${formattedArea}
   Catatan : ${safeValue(notes, "-")}
   Source : ${safeValue(lead.source, "-")}`;
      })
      .join("\n\n");
  };

  const sections = [
    { title: "ON DISCUSSION", items: onDiscussion },
    { title: "NO RESPONSE", items: noResponse },
    { title: "DEAL", items: deal },
    { title: "BUDGET", items: budget },
    { title: "WILAYAH", items: wilayah },
  ];

  const detailBlocks = sections
    .map(
      ({ title, items }) => `===============================
${title}
===============================

${renderList(items, title)}`,
    )
    .join("\n\n");

  return `REPORT LEADS
${reportDate}

RINGKASAN
No Response : ${noResponse.length}
On Discussion : ${onDiscussion.length}
Deal : ${deal.length}
Budget : ${budget.length}
Wilayah : ${wilayah.length}

${detailBlocks}`.trim();
};
