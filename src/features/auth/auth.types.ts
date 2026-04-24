export type LoginPayload = {
  login: string;
  password: string;
};

export type LoginResponse = {
  success: boolean;
  message: string;
  /** Sanctum token when login succeeds */
  token?: string;
  refreshToken?: string;
};

export type MeResponse = {
  success: boolean;
  message: string;
  data: {
    user: {
      id: number;
      name: string;
      email?: string | null;
      phone?: string | null;
    };
    agent?: {
      id: number;
      code?: string | null;
      business_name?: string | null;
      name?: string | null;
      logo_path?: string | null;
      full_address?: string | null;
      agent_type?: {
        id?: number | null;
        code?: string | null;
        name?: string | null;
      } | null;
      /** Tổng doanh thu (net) các đơn thuộc đại lý — định dạng tiền VN từ API */
      total_revenue?: string | null;
      /** Doanh thu tháng hiện tại (theo order_month / order_date) */
      month_revenue?: string | null;
      /** Tổng hoa hồng tháng hiện tại (commission_entries theo đơn trong tháng) */
      month_commission?: string | null;
      currency?: string | null;
      agent_commission_policy?: Array<{
        id: number;
        policy_name?: string | null;
        description?: string | null;
      }>;
    } | null;
  };
};
