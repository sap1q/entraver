export type UserAddress = {
  id: string;
  label: string | null;
  recipient_name: string;
  phone_number: string | null;
  address_line: string;
  city: string | null;
  province: string | null;
  postal_code: string | null;
  full_address: string;
  is_main: boolean;
  created_at: string | null;
  updated_at: string | null;
};

export type UserAddressApiResponse<T> = {
  success: boolean;
  message?: string;
  data: T;
  count?: number;
};

