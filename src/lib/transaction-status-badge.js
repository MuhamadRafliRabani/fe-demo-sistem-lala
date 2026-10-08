import { Badge } from "@/components/ui/badge";

export function TransactionStatusBadge({ status }) {
  switch (status) {
    case "capture":
    case "settlement":
      return <Badge variant="success">{status}</Badge>;
    case "pending":
      return <Badge variant="secondary">{status}</Badge>;
    case "deny":
    case "cancel":
    case "expire":
      return <Badge variant="destructive">{status}</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}
