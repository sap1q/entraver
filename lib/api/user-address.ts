import api from "@/lib/axios";
import type { UserAddress, UserAddressApiResponse } from "@/lib/api/types/user-address.types";

type UnknownRecord = Record<string, unknown>;

const asObject = (value: unknown): UnknownRecord =>
  value && typeof value === "object" ? (value as UnknownRecord) : {};

const asUserAddress = (value: unknown): UserAddress | null => {
  const row = asObject(value);
  const id = typeof row.id === "string" ? row.id : null;
  const recipientName = typeof row.recipient_name === "string" ? row.recipient_name : null;
  const addressLine = typeof row.address_line === "string" ? row.address_line : null;

  if (!id || !recipientName || !addressLine) return null;

  const city = typeof row.city === "string" ? row.city : null;
  const province = typeof row.province === "string" ? row.province : null;
  const postalCode = typeof row.postal_code === "string" ? row.postal_code : null;

  return {
    id,
    label: typeof row.label === "string" ? row.label : null,
    recipient_name: recipientName,
    phone_number: typeof row.phone_number === "string" ? row.phone_number : null,
    address_line: addressLine,
    city,
    province,
    postal_code: postalCode,
    full_address:
      typeof row.full_address === "string"
        ? row.full_address
        : [addressLine, city, province, postalCode].filter(Boolean).join(", "),
    is_main: Boolean(row.is_main),
    created_at: typeof row.created_at === "string" ? row.created_at : null,
    updated_at: typeof row.updated_at === "string" ? row.updated_at : null,
  };
};

const extractList = (payload: unknown): UserAddress[] => {
  const source = asObject(payload);
  const data = source.data;
  if (!Array.isArray(data)) return [];

  return data
    .map(asUserAddress)
    .filter((item): item is UserAddress => item !== null);
};

export const userAddressApi = {
  async getAll(): Promise<UserAddress[]> {
    const response = await api.get<UserAddressApiResponse<UserAddress[]>>("/user-addresses");
    return extractList(response.data);
  },

  async setMain(addressId: string): Promise<UserAddress> {
    const response = await api.patch<UserAddressApiResponse<UserAddress>>("/user-addresses/set-main", {
      address_id: addressId,
    });

    const mapped = asUserAddress(response.data.data);
    if (!mapped) {
      throw new Error("Respons alamat tidak valid.");
    }

    return mapped;
  },
};
