import {
  MessageCircle,
  Clock,
  Presentation,
  MapPin,
  Wallet,
  HelpCircle,
  Handshake,
  Megaphone,
  User,
  Map,
  Instagram,
  Users,
  Wrench,
  HardHat,
  Sofa,
  Ruler,
  Calculator,
  Home,
  Building2,
  Palmtree,
  BedDouble,
  Store,
  Blocks,
  Waves,
} from "lucide-react";

export const normalizeLeadStatusValue = (value) => {
  const raw = String(value ?? "").trim();

  if (!raw) return "";

  const normalized = raw
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\bdiscusion\b/gi, "discussion")
    .trim();

  return normalized
    .split(" ")
    .filter(Boolean)
    .map((part) => {
      if (part.length === 0) return part;
      return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
    })
    .join(" ");
};

export const statusLeads = [
  // {
  //   label: "Terbalas",
  //   value: "Terbalas",
  //   color: "#10B981",
  //   icon: MessageCircle,
  // },
  { label: "No Respon", value: "No Respon", color: "#F59E0B", icon: Clock }, // Amber
  // {
  //   label: "Pitching",
  //   value: "Pitching",
  //   color: "#F97316",
  //   icon: Presentation,
  // },
  // { label: "Potencial", value: "Potencial", color: "#F59E0B", icon: Handshake },
  { label: "Wilayah", value: "Wilayah", color: "#8B5CF6", icon: MapPin }, // Violet
  { label: "Budget", value: "Budget", color: "#6366F1", icon: Wallet }, // Indigo
  {
    label: "On Discussion",
    value: "On Discussion",
    color: "#8B5CF6",
    icon: MessageCircle,
  },
  // { label: "Gajelas", value: "Gajelas", color: "#64748B", icon: HelpCircle }, // Slate
  { label: "Deal", value: "Deal", color: "#22C55E", icon: Handshake }, // Green
];

export const sourceLeads = [
  { label: "Ads", value: "Ads", color: "#3B82F6", icon: Megaphone }, // Blue
  { label: "Direct", value: "Direct", color: "#10B981", icon: User }, // Emerald
  { label: "On Site", value: "On Site", color: "#EF4444", icon: Map }, // Red
  {
    label: "DM Instagram",
    value: "DM Instagram",
    color: "#EC4899",
    icon: Instagram,
  }, // Pink
  { label: "Referensi", value: "Referensi", color: "#A855F7", icon: Users }, // Purple
  { label: "Landing Page", value: "Landing Page", color: "#3B82F6", icon: Map }, // Blue
];

export const requestTypes = [
  { label: "Renovasi", value: "Renovasi", color: "#14B8A6", icon: Wrench }, // Teal
  {
    label: "Bangun Baru",
    value: "Bangun Baru",
    color: "#3B82F6",
    icon: HardHat,
  }, // Blue
  { label: "Interior", value: "Interior", color: "#D946EF", icon: Sofa }, // Fuchsia
  { label: "Design", value: "Design", color: "#475569", icon: Ruler }, // Darker Slate
  { label: "estimasi", value: "Estimasi", color: "#0EA5E9", icon: Calculator }, // Sky Blue
];

export const buildingTypes = [
  {
    label: "Rumah Tinggal",
    value: "Rumah Tinggal",
    color: "#EAB308",
    icon: Home,
  },
  { label: "Kantor", value: "Kantor", color: "#10B981", icon: Building2 },
  { label: "Villa", value: "Villa", color: "#06B6D4", icon: Palmtree },
  { label: "Kost", value: "Kost", color: "#6366F1", icon: BedDouble },
  {
    label: "Tempat Usaha",
    value: "Tempat Usaha",
    color: "#A855F7",
    icon: Store,
  },
  { label: "Tanah Kosong", value: "Tanah", color: "#8B5CF6", icon: Map },
  {
    label: "Prefabricated",
    value: "Prefabricated",
    color: "#14B8A6",
    icon: Blocks,
  },
  { label: "Pool", value: "Pool", color: "#0EA5E9", icon: Waves },
];

export const surveyTypes = [
  {
    label: "Yes",
    value: true,
  },
  {
    label: "No",
    value: false,
  },
];

// End options for lead filters

// Options for survey filters
export const statusSurvey = [
  { label: "Belum dimulai", value: "belum dimulai" },
  { label: "Sedang berlangsung", value: "sedang berlangsung" },
  { label: "Selesai", value: "selesai" },
];
// End options for survey filters

// Options for order filters
export const statusOrders = [
  { label: "Pending", value: "pending" },
  { label: "Waiting Payment", value: "waiting_payment" },
  { label: "Paid", value: "paid" },
  { label: "Failed", value: "failed" },
  { label: "Canceled", value: "canceled" },
];
// End options for order filters

// Options for user filters
export const statusUser = [
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
  { label: "Banned", value: "banned" },
];
// End options for user filters

// Options for Jenis Pembangunan filters
export const statusJenisPembangunan = [
  { label: "Sipil", value: "sipil" },
  { label: "Interior", value: "interior" },
];
// End options for Jenis Pembangunan filters

// Options for Jenis Pembangunan filters
export const statusDesigns = [
  {
    value: 1,
    code: "layout1",
    label: "LAYOUT 1",
    order_number: 1,
    is_designer_work: 1,
    cretime: "2025-12-14 11:47:33",
    creby: null,
  },
  {
    value: 2,
    code: "result_layout1",
    label: "RESULT LAYOUT 1",
    order_number: 2,
    is_designer_work: 0,
    cretime: "2025-12-14 13:40:38",
    creby: null,
  },
  {
    value: 3,
    code: "layout2",
    label: "LAYOUT 2",
    order_number: 3,
    is_designer_work: 1,
    revisi: true,
  },
  {
    value: 4,
    code: "result_layout2",
    label: "RESULT LAYOUT 2",
    order_number: 4,
    is_designer_work: 0,
    cretime: "2025-12-14 13:40:38",
    creby: null,
  },
  {
    value: 5,
    code: "3d1",
    label: "3D1",
    order_number: 5,
    is_designer_work: 1,
    cretime: "2025-12-14 13:40:38",
    creby: null,
  },
  {
    value: 6,
    code: "result_3d1",
    label: "RESULT 3D1",
    order_number: 6,
    is_designer_work: 0,
    cretime: "2025-12-14 13:40:38",
    revisi: true,
  },
  {
    value: 7,
    code: "3d2",
    label: "3D2",
    order_number: 7,
    is_designer_work: 1,
    cretime: "2025-12-14 13:40:38",
    creby: null,
  },
  {
    value: 8,
    code: "result_3d2",
    label: "RESULT 3D2",
    order_number: 8,
    is_designer_work: 0,
    cretime: "2025-12-14 13:40:38",
    creby: null,
  },
  {
    value: 9,
    code: "zoom_meeting",
    label: "ZOOM MEETING",
    order_number: 9,
    is_designer_work: 0,
    cretime: "2025-12-14 13:40:38",
    creby: null,
  },
  {
    value: 10,
    code: "townhall",
    label: "TOWNHALL",
    order_number: 10,
    is_designer_work: 0,
    cretime: "2025-12-14 13:40:38",
    creby: null,
  },
  {
    value: 11,
    code: "finalisasi",
    label: "FINALISASI",
    order_number: 11,
    is_designer_work: 1,
    cretime: "2025-12-14 13:40:38",
    creby: null,
  },
  {
    value: 12,
    code: "seleasi",
    label: "SELESAI",
    order_number: 12,
    is_designer_work: 0,
    cretime: "2025-12-14 13:40:38",
    creby: null,
  },
  {
    value: 13,
    code: "waiting_list",
    label: "WAITING LIST",
    order_number: 13,
    is_designer_work: 0,
    cretime: "2025-12-14 13:40:38",
    creby: null,
  },
];
// End options for Jenis Pembangunan filters

export const ROLE = {
  ADMIN: 1,
  MANAGER: 2,
  FINANCE: 3,
  MARKETING: 4,
  CONTENT_CREATOR: 5,
  DESIGNER: 6,
  ESTIMATOR: 7,
  DEVELOPER: 8,
  OPERATOR: 9,
  PROCUREMENT: 10,
  SUPERVISOR_LAPANGAN: 11,
};

export const STAGE_SCHEDULE_MAP = {
  // Layout
  layout1: ["layout_start", "layout_end"],
  result_layout1: ["layout_start", "layout_end"],
  layout2: ["layout_start", "layout_end"],
  result_layout2: ["layout_start", "layout_end"],

  // 3D Non Render
  "3d1": ["3d_non_render_start", "3d_non_render_end"],
  result_3d1: ["3d_non_render_start", "3d_non_render_end"],

  // 3D Render
  "3d2": ["3d_render_start", "3d_render_end"],
  result_3d2: ["3d_render_start", "3d_render_end"],

  // Townhall
  zoom_meeting: ["zoom_meeting_start", "zoom_meeting_end"],
  townhall: ["townhall_start", "townhall_end"],
};

export const INCOME = [
  { label: "0-5jt", value: "0-5jt", color: "#EB4C4C" },
  { label: "5-10jt", value: "5-10jt", color: "#FF7F11" },
  { label: "10-20jt", value: "10-20jt", color: "#6367FF" },
  { label: "20jt++", value: "20jt++", color: "#79AE6F" },
];
