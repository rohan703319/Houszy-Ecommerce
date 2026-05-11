export function getOrderStatusBadge(status: string) {
  switch (status?.toLowerCase()) {
    case "pending":
      return "bg-yellow-100 text-yellow-800";
    case "processing":
      return "bg-blue-100 text-blue-700";
    case "completed":
    case "delivered":
      return "bg-green-100 text-green-700";
    case "collected":
      return "bg-green-100 text-green-700";  
    case "cancelled":
    case "failed":
      return "bg-red-100 text-red-700";
    case "refunded":
      return "bg-purple-100 text-purple-700";
      case "shipped":
      return "bg-blue-100 text-blue-700";
     case "cancellationrequested":
      return "bg-orange-100 text-orange-700 border border-orange-200";  
    default:
      return "bg-gray-100 text-gray-700";
  }
}
export const getOrderStatusLabel = (
  status?: string,
  statusName?: string
) => {
  const normalized =
    statusName?.trim().toLowerCase() ||
    status?.trim().toLowerCase();

  switch (normalized) {
    case "cancellationrequested":
      return "Cancellation Requested";

    case "processing":
      return "Processing";

    case "pending":
      return "Pending";

    case "shipped":
      return "Shipped";

    case "delivered":
      return "Delivered";

    case "completed":
      return "Completed";

    case "cancelled":
      return "Cancelled";

    case "failed":
      return "Failed";

    case "refunded":
      return "Refunded";

    case "collected":
      return "Collected";

    default:
      return statusName || status || "Unknown";
  }
};
export const getCollectionStatusTextColor = (status?: string) => {
  if (!status) return "text-gray-800";

  const normalized = status.trim().toLowerCase();

  switch (normalized) {
    case "collected":
      return "text-green-600 font-semibold";

    case "ready":
    case "ready for collection":
      return "text-blue-600 font-medium";

    case "pending":
      return "text-yellow-600 font-medium";

    default:
      return "text-gray-800";
  }
};


