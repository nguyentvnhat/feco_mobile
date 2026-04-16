export type LoginPayload = {
  login: string;
  password: string;
};

export type LoginResponse = {
  success: boolean;
  message: string;
};
