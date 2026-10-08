import { Badge } from "@/components/ui/badge";
import {
  Clock,
  Layers,
  Map,
  Wallet,
  Trash2,
  HelpCircle,
  MessageCircle,
} from "lucide-react";
import { normalizeLeadStatusValue } from "@/data/data";

const statusMap = {
  "No Respon": {
    icon: <Clock className="w-3 h-3 mr-1" />,
    className: "bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-300",
  },
  Pitching: {
    icon: <Layers className="w-3 h-3 mr-1" />,
    className:
      "bg-indigo-100 text-indigo-700 hover:bg-indigo-200 border-indigo-300",
  },
  Wilayah: {
    icon: <Map className="w-3 h-3 mr-1" />,
    className:
      "bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border-yellow-300",
  },
  Budget: {
    icon: <Wallet className="w-3 h-3 mr-1" />,
    className: "bg-pink-100 text-pink-700 hover:bg-pink-200 border-pink-300",
  },
  "On Discussion": {
    icon: <MessageCircle className="w-3 h-3 mr-1" />,
    className:
      "bg-violet-100 text-violet-700 hover:bg-violet-200 border-violet-300",
  },
  Gajelas: {
    icon: <Trash2 className="w-3 h-3 mr-1" />,
    className: "bg-red-100 text-red-700 hover:bg-red-200 border-red-300",
  },
};

export const LeadStatusBadge = ({ status }) => {
  const normalizedStatus = normalizeLeadStatusValue(status);
  const config = statusMap[normalizedStatus] || {
    icon: <HelpCircle className="w-3 h-3 mr-1" />,
    className: "bg-muted text-muted-foreground border-border",
  };

  return (
    <Badge
      variant="outline"
      className={`px-2 py-0.5 text-xs font-medium ${config.className}`}
    >
      {config.icon}
      {normalizedStatus || status}
    </Badge>
  );
};
