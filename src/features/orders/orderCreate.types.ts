export type CreateMetadataProduct = {
  id: number;
  sku: string;
  name: string;
  sale_unit?: string;
  unit_price?: string | null;
  currency?: string | null;
};

export type CreateMetadataProvince = {
  code: string;
  label: string;
  name: string;
};

export type CreateMetadataWard = {
  province_code: string;
  code: string;
  label: string;
  name: string;
};

export type CreateOrderMetadataResponse = {
  success: boolean;
  message: string;
  data: {
    agent_profile_id?: number | null;
    products: CreateMetadataProduct[];
    provinces: CreateMetadataProvince[];
    wards: CreateMetadataWard[];
  };
};

export type StoreOrderPayload = {
  order_date: string;
  seller_user_id: number;
  agent_profile_id?: number | null;
  order_channel: 'direct_sale' | 'agent_order' | 'internal_sale';
  order_status: string;
  customer_name: string;
  customer_phone: string;
  customer_address?: string | null;
  customer_province_code: string;
  customer_district_code?: string | null;
  customer_district_name?: string | null;
  customer_ward_code: string;
  products: {
    product_id: number;
    quantity: number;
  }[];
};

export type StoreOrderApiResponse = {
  success: boolean;
  message: string;
  data: {
    id: number;
    order_no: string;
    [key: string]: unknown;
  };
};

export type PreviewOrderPayload = {
  order_channel: 'direct_sale' | 'agent_order' | 'internal_sale';
  products: { product_id: number; quantity: number }[];
};

export type PreviewOrderSummary = {
  subtotal_amount: string;
  discount_amount: string;
  net_amount: string;
  vat_base?: string;
  vat_rate_percent?: number;
  vat_amount?: string;
  total_with_vat?: string;
  currency?: string;
};

export type PreviewPolicyTier = {
  commission_policy_id?: number | null;
  commission_policy_tier_id?: number | null;
  tier_name?: string | null;
  min_value?: string | number | null;
  max_value?: string | number | null;
  reward_percent?: string | number | null;
  reward_amount?: string | number | null;
};

export type PreviewAppliedTier = {
  commission_policy_id: number;
  commission_policy_tier_id: number;
  tier_name?: string | null;
  tier_limit_label?: string | null;
  min_value?: string | number | null;
  max_value?: string | number | null;
  qty_from: string | number;
  qty_to: string | number;
  applied_qty: string | number;
  reward_percent: string | number;
  reward_amount_per_unit?: number | null;
  calculation_method?: string | null;
  basis_amount: string | number;
  discount_amount: string | number;
};

export type PreviewOrderApiResponse = {
  success: boolean;
  message: string;
  data?: {
    summary: PreviewOrderSummary;
    items?: unknown[];
    policy_tiers?: PreviewPolicyTier[];
    applied_tiers?: PreviewAppliedTier[];
    monthly_context?: unknown;
    policy?: unknown;
  };
};

export type CloneOrderTemplatePayload = {
  order_channel: 'direct_sale' | 'agent_order' | 'internal_sale';
  customer_name: string;
  customer_phone: string;
  customer_address?: string | null;
  customer_province_code: string;
  customer_ward_code: string;
  products: {
    product_id: number;
    quantity: number;
  }[];
};

export type CloneOrderTemplateApiResponse = {
  success: boolean;
  message: string;
  data: {
    source_order: {
      id: number;
      order_no: string;
    };
    clone_payload: CloneOrderTemplatePayload;
  };
};
