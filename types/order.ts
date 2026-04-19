export interface CheckoutCustomer {
  fullName: string;
  phone: string;
  deliveryAddress: string;
}

export interface CheckoutRequestItem {
  slug: string;
  quantity: number;
}

export interface StoredOrderItem {
  slug: string;
  title: string;
  price: number | null;
  category: string;
  subcategory: string;
  quantity: number;
}

export type OrderEmailDeliveryStatus = "sent" | "skipped" | "failed";

export interface StoredOrder {
  id: string;
  createdAt: string;
  customer: CheckoutCustomer;
  items: StoredOrderItem[];
  totalQuantity: number;
  status: "new";
  emailDeliveryStatus: OrderEmailDeliveryStatus;
  emailDeliveryMessage?: string;
}
