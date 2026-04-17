export type OrderListCustomer = {
  customer_name?: string;
  customer_phone?: string;
};

export type OrderListItem = {
  id: number;
  order_no: string;
  order_date: string | null;
  order_status: string;
  order_label_status: string;
  net_amount: string;
  customer?: OrderListCustomer | null;
};

export type ListOrdersApiResponse = {
  success: boolean;
  message: string;
  data: {
    orders: OrderListItem[];
  };
};
