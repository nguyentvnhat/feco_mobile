export type CreateMetadataProduct = {
  id: number;
  sku: string;
  name: string;
  base_unit: string;
  unit_price?: string | null;
  list_price?: string | number | null;
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
