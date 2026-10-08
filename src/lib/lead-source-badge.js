import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Megaphone,
  MapPin,
  Instagram,
  Users,
  Send,
  HelpCircle,
} from "lucide-react";

const colorPalettes = [
  "bg-red-100 text-red-700 hover:bg-red-200 border-red-200",
  "bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200",
  "bg-green-100 text-green-700 hover:bg-green-200 border-green-200",
  "bg-purple-100 text-purple-700 hover:bg-purple-200 border-purple-200",
  "bg-orange-100 text-orange-700 hover:bg-orange-200 border-orange-200",
  "bg-teal-100 text-teal-700 hover:bg-teal-200 border-teal-200",
  "bg-pink-100 text-pink-700 hover:bg-pink-200 border-pink-200",
  "bg-indigo-100 text-indigo-700 hover:bg-indigo-200 border-indigo-200",
];

const getSourceIcon = (source) => {
  switch (source) {
    case "Ads":
      return <Megaphone className="w-3 h-3 mr-1" />;
    case "Direct":
      return <Send className="w-3 h-3 mr-1" />;
    case "On Site":
      return <MapPin className="w-3 h-3 mr-1" />;
    case "DM IG":
      return <Instagram className="w-3 h-3 mr-1" />;
    case "Referensi":
      return <Users className="w-3 h-3 mr-1" />;
    default:
      return <HelpCircle className="w-3 h-3 mr-1" />;
  }
};

export const LeadSourceBadge = ({ source }) => {
  const [randomColorClass] = useState(() => {
    const randomIndex = Math.floor(Math.random() * colorPalettes.length);
    return colorPalettes[randomIndex];
  });

  return (
    <Badge
      variant="outline"
      className={`px-2 py-0.5 text-xs font-medium border ${randomColorClass}`}
    >
      {getSourceIcon(source)}
      {source}
    </Badge>
  );
};
