import { Badge } from "@/components/ui/badge";

export function OrderStatusBadge({ status }) {
  switch (status) {
    case "pending":
      return <Badge variant="secondary">Pending</Badge>;
    case "waiting_payment":
      return <Badge variant="warning">Waiting Payment</Badge>;
    case "paid":
      return <Badge variant="success">Paid</Badge>;
    case "failed":
      return <Badge variant="destructive">Failed</Badge>;
    case "canceled":
      return <Badge variant="outline">Canceled</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}
