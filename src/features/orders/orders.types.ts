export type OrderListCustomer = {
  customer_name?: string;
  customer_phone?: string;
};

export type OrderListProduct = {
  id: number;
  product_id: number | null;
  product_name: string;
  image_path: string | null;
  unit?: string | null;
  quantity: number;
  quantity_in_base_unit?: number;
  unit_price?: string;
  line_amount: string;
  currency?: string;
};

export type OrderListItem = {
  id: number;
  order_no: string;
  order_date: string | null;
  order_status: string;
  order_label_status: string;
  net_amount: string;
  currency?: string;
  has_invoice_file?: boolean;
  has_delivery_receipt_paths?: boolean;
  customer?: OrderListCustomer | null;
  products?: OrderListProduct[];
};

export type ListOrdersApiResponse = {
  success: boolean;
  message: string;
  data: {
    orders: OrderListItem[];
  };
};

export type OrderStatusItem = {
  value: string;
  label: string;
};

export type OrderStatusesApiResponse = {
  success: boolean;
  message: string;
  data: {
    statuses: OrderStatusItem[];
  };
};

export type CommissionItem = {
  id: number;
  entry_type: string;
  policy_code?: string | null;
  policy_name?: string | null;
  amount: string;
  rate_percent?: number | null;
  basis_type?: string | null;
  basis_value?: string | null;
  settlement_status: string;
  settlement_status_label_vi: string;
  currency?: string;
};

export type CommissionHistoryOrder = {
  id: number;
  order_no: string;
  order_date: string | null;
  order_status: string;
  order_label_status: string;
  net_amount: string;
  currency?: string;
  commissions: CommissionItem[];
};

export type CommissionHistoryApiResponse = {
  success: boolean;
  message: string;
  data: {
    orders: CommissionHistoryOrder[];
  };
};

export type OrderDetailProduct = {
  id: number;
  product_id: number | null;
  product_name: string;
  image_path: string | null;
  unit?: string | null;
  quantity: number;
  quantity_in_base_unit?: number;
  unit_price?: string;
  line_amount: string;
  currency?: string;
};

export type OrderDetailData = {
  id: number;
  order_no: string;
  order_date: string | null;
  order_status: string;
  order_label_status: string;
  subtotal_amount: string;
  discount_amount: string;
  net_amount: string;
  currency?: string;
  customer_name?: string | null;
  customer_phone?: string | null;
  customer_address?: string | null;
  customer_ward?: string | null;
  customer_city?: string | null;
  has_invoice_file?: boolean;
  has_delivery_receipt_paths?: boolean;
  products: OrderDetailProduct[];
};

export type OrderDetailApiResponse = {
  success: boolean;
  message: string;
  data: OrderDetailData;
};
