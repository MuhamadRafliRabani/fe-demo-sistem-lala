import { Badge } from "@/components/ui/badge";
import { Clock, HelpCircle, CheckCircle2, PlaneTakeoff } from "lucide-react";

const statusMap = {
  "belum dimulai": {
    icon: <Clock className="w-3 h-3 mr-1" />,
    className: "bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-300",
  },
  "sedang berlangsung": {
    icon: <PlaneTakeoff className="w-3 h-3 mr-1" />,
    className: "bg-sky-100 text-sky-700 hover:bg-sky-200 border-sky-300",
  },
  selesai: {
    icon: <CheckCircle2 className="w-3 h-3 mr-1" />,
    className:
      "bg-green-100 text-green-700 hover:bg-green-200 border-green-300",
  },
};

export const SurveyStatusBadge = ({ status }) => {
  const config = statusMap[status] || {
    icon: <HelpCircle className="w-3 h-3 mr-1" />,
    className: "bg-muted text-muted-foreground border-border",
  };

  return (
    <Badge
      variant="outline"
      className={`py-0.5 text-xs font-medium ${config.className}`}
    >
      {config.icon}
      {status}
    </Badge>
  );
};
