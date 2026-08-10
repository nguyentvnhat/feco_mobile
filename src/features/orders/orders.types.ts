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

export type OrdersListMeta = {
  page: number;
  per_page: number;
  total: number;
  has_more: boolean;
};

export type ListOrdersApiResponse = {
  success: boolean;
  message: string;
  data: {
    orders: OrderListItem[];
    meta?: OrdersListMeta;
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

export type CommissionHistoryEntry = {
  id: number;
  order_id: number | null;
  order_no: string | null;
  amount: string;
  rate_percent?: number | null;
  basis_type?: string | null;
  basis_value?: string | null;
  settlement_status: string;
  settlement_status_label_vi?: string;
  created_at: string | null;
};

export type CommissionHistorySummary = {
  total_commission: string;
  pending_commission: string;
  approved_commission: string;
  paid_commission: string;
  entry_count: number;
};

export type CommissionHistoryApiResponse = {
  success: boolean;
  message: string;
  data: {
    period_month: string | null;
    summary: CommissionHistorySummary;
    entries: CommissionHistoryEntry[];
  };
};

/** @deprecated Use CommissionHistoryEntry — grouped-by-order shape removed from API */
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

export type OrderDetailAddress = {
  full_name?: string | null;
  phone?: string | null;
  address_line?: string | null;
  ward_name?: string | null;
  province_name?: string | null;
};

export type OrderDetailAppliedTier = {
  commission_policy_id: number;
  commission_policy_tier_id: number;
  tier_name?: string | null;
  tier_limit_label?: string | null;
  min_value?: string | number | null;
  max_value?: string | number | null;
  qty_from?: string | number;
  qty_to?: string | number;
  applied_qty?: string | number;
  reward_percent?: string | number;
  reward_amount_per_unit?: number | null;
  calculation_method?: string | null;
  basis_amount?: string | number;
  discount_amount?: string | number;
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
  vat_base?: string;
  vat_rate_percent?: number | null;
  vat_amount?: string;
  total_with_vat?: string;
  currency?: string;
  customer_name?: string | null;
  customer_phone?: string | null;
  customer_address?: string | null;
  customer_ward?: string | null;
  customer_city?: string | null;
  has_invoice_file?: boolean;
  has_delivery_receipt_paths?: boolean;
  pickup?: OrderDetailAddress | null;
  products: OrderDetailProduct[];
  applied_tiers?: OrderDetailAppliedTier[];
};

export type OrderDetailApiResponse = {
  success: boolean;
  message: string;
  data: OrderDetailData;
};

export type DestroyOrderApiResponse = {
  success: boolean;
  message: string;
  data: Record<string, never>;
};
