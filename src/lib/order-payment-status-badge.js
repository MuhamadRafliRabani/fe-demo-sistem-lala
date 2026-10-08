import { Badge } from "@/components/ui/badge";

export function OrderPaymentStatusBadge({ status }) {
  switch (status) {
    case "unpaid":
      return <Badge variant="secondary">Unpaid</Badge>;
    case "paid":
      return <Badge variant="success">Paid</Badge>;
    case "expired":
      return <Badge variant="warning">Expired</Badge>;
    case "refunded":
      return <Badge variant="outline">Refunded</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}