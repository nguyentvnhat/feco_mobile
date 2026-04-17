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
