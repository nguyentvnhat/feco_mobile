export type LoginPayload = {
  login: string;
  password: string;
};

export type LoginResponse = {
  success: boolean;
  message: string;
  /** Sanctum token when login succeeds */
  token?: string;
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
      business_name?: string | null;
      name?: string | null;
    } | null;
  };
};
