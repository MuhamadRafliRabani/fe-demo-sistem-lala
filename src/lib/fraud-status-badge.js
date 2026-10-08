import { Badge } from "@/components/ui/badge";

export function FraudStatusBadge({ status }) {
  switch (status) {
    case "accept":
      return <Badge variant="success">{status}</Badge>;
    case "challenge":
      return <Badge variant="warning">{status}</Badge>;
    case "deny":
      return <Badge variant="destructive">{status}</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}
