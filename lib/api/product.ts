import { isAxiosError } from "axios";
import api from "@/lib/axios";

export const deleteProduct = async (productId: string): Promise<void> => {
  try {
    await api.delete(`/v1/admin/products/${productId}`);
  } catch (error) {
    if (isAxiosError(error)) {
      const message =
        (typeof error.response?.data?.message === "string" && error.response.data.message) ||
        error.message ||
        "Gagal menghapus produk.";

      throw Object.assign(new Error(message), { status: error.response?.status });
    }

    throw error;
  }
};
