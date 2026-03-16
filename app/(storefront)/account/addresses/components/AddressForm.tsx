"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { isAxiosError } from "@/lib/axios";
import { userAddressApi } from "@/lib/api/user-address";
import type { RegionOption, UserAddress, UserAddressPayload } from "@/lib/api/types/user-address.types";

type AddressFormValues = {
  address_label: string;
  recipient_name: string;
  recipient_phone: string;
  province_id: string;
  city_id: string;
  district_id: string;
  subdistrict: string;
  address_detail: string;
  zip_code: string;
  location_note: string;
  is_default: boolean;
};

type SaveResult = {
  success: boolean;
  message?: string;
};

interface AddressFormProps {
  mode: "create" | "edit";
  initialAddress?: UserAddress | null;
  onSave: (payload: UserAddressPayload, addressId?: string) => Promise<SaveResult>;
  cancelHref?: string;
}

const getApiErrorMessage = (error: unknown): string => {
  if (!isAxiosError(error)) return "Terjadi kesalahan pada data wilayah.";
  const message = error.response?.data?.message;
  return typeof message === "string" && message.trim().length > 0
    ? message
    : "Gagal memuat data wilayah.";
};

const toDefaultValues = (address?: UserAddress | null): AddressFormValues => ({
  address_label: address?.address_label ?? address?.label ?? "Rumah",
  recipient_name: address?.recipient_name ?? "",
  recipient_phone: address?.recipient_phone ?? address?.phone_number ?? "",
  province_id: address?.province_id ?? "",
  city_id: address?.city_id ?? "",
  district_id: address?.district_id ?? "",
  subdistrict: address?.subdistrict ?? "",
  address_detail: address?.address_detail ?? address?.address_line ?? "",
  zip_code: address?.zip_code ?? "",
  location_note: address?.location_note ?? "",
  is_default: Boolean(address?.is_default ?? address?.is_main),
});

const toSeededRegionOptions = (address?: UserAddress | null): {
  provinces: RegionOption[];
  cities: RegionOption[];
  districts: RegionOption[];
  subdistricts: RegionOption[];
} => ({
  provinces:
    address?.province_id && address.province
      ? [
          {
            id: address.province_id,
            name: address.province,
          },
        ]
      : [],
  cities:
    address?.city_id && address.city
      ? [
          {
            id: address.city_id,
            name: address.city,
          },
        ]
      : [],
  districts:
    address?.district_id && address.district
      ? [
          {
            id: address.district_id,
            name: address.district,
          },
        ]
      : [],
  subdistricts:
    address?.subdistrict
      ? [
          {
            id: address.subdistrict,
            name: address.subdistrict,
            zip_code: address.zip_code,
            postal_code: address.zip_code,
          },
        ]
      : [],
});

export function AddressForm({ mode, initialAddress, onSave, cancelHref = "/account/addresses" }: AddressFormProps) {
  const [provinces, setProvinces] = useState<RegionOption[]>([]);
  const [cities, setCities] = useState<RegionOption[]>([]);
  const [districts, setDistricts] = useState<RegionOption[]>([]);
  const [subdistricts, setSubdistricts] = useState<RegionOption[]>([]);
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingSubdistricts, setLoadingSubdistricts] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    control,
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<AddressFormValues>({
    defaultValues: toDefaultValues(initialAddress),
  });

  const provinceId = watch("province_id");
  const cityId = watch("city_id");
  const districtId = watch("district_id");
  const subdistrictName = watch("subdistrict");

  const selectedCity = useMemo(() => cities.find((city) => city.id === cityId) ?? null, [cities, cityId]);
  const selectedSubdistrict = useMemo(
    () => subdistricts.find((subdistrict) => subdistrict.name === subdistrictName) ?? null,
    [subdistrictName, subdistricts]
  );

  useEffect(() => {
    reset(toDefaultValues(initialAddress));
    const seededOptions = toSeededRegionOptions(initialAddress);
    setProvinces(seededOptions.provinces);
    setCities(seededOptions.cities);
    setDistricts(seededOptions.districts);
    setSubdistricts(seededOptions.subdistricts);
    setFormError(null);
  }, [initialAddress, reset]);

  useEffect(() => {
    let aborted = false;
    const loadProvinces = async () => {
      setLoadingProvinces(true);
      try {
        const rows = await userAddressApi.getProvinces();
        if (!aborted) {
          setProvinces(rows);
          const activeProvinceId = getValues("province_id");
          if (activeProvinceId && rows.some((province) => province.id === activeProvinceId)) {
            setValue("province_id", activeProvinceId, {
              shouldDirty: false,
              shouldTouch: false,
              shouldValidate: false,
            });
          }
        }
      } catch (error) {
        if (!aborted) {
          setFormError(getApiErrorMessage(error));
        }
      } finally {
        if (!aborted) {
          setLoadingProvinces(false);
        }
      }
    };

    void loadProvinces();
    return () => {
      aborted = true;
    };
  }, [getValues, setValue]);

  useEffect(() => {
    if (!provinceId) {
      setCities([]);
      setDistricts([]);
      setSubdistricts([]);
      setValue("city_id", "");
      setValue("district_id", "");
      setValue("subdistrict", "");
      setValue("zip_code", "");
      return;
    }

    let aborted = false;
    const loadCities = async () => {
      setLoadingCities(true);
      try {
        const rows = await userAddressApi.getCities(provinceId);
        if (!aborted) {
          setCities(rows);
          const activeCityId = getValues("city_id");
          if (activeCityId && rows.some((city) => city.id === activeCityId)) {
            setValue("city_id", activeCityId, {
              shouldDirty: false,
              shouldTouch: false,
              shouldValidate: false,
            });
          } else {
            setValue("city_id", "");
            setValue("district_id", "");
            setValue("subdistrict", "");
            setValue("zip_code", "");
            setDistricts([]);
            setSubdistricts([]);
          }
        }
      } catch (error) {
        if (!aborted) {
          setFormError(getApiErrorMessage(error));
        }
      } finally {
        if (!aborted) {
          setLoadingCities(false);
        }
      }
    };

    void loadCities();
    return () => {
      aborted = true;
    };
  }, [getValues, provinceId, setValue]);

  useEffect(() => {
    if (!cityId) {
      setDistricts([]);
      setSubdistricts([]);
      setValue("district_id", "");
      setValue("subdistrict", "");
      setValue("zip_code", "");
      return;
    }

    let aborted = false;
    const loadDistricts = async () => {
      setLoadingDistricts(true);
      try {
        const rows = await userAddressApi.getDistricts(cityId);
        if (!aborted) {
          setDistricts(rows);
          const activeDistrictId = getValues("district_id");
          if (activeDistrictId && rows.some((district) => district.id === activeDistrictId)) {
            setValue("district_id", activeDistrictId, {
              shouldDirty: false,
              shouldTouch: false,
              shouldValidate: false,
            });
          } else {
            setValue("district_id", "");
            setValue("subdistrict", "");
            setValue("zip_code", "");
            setSubdistricts([]);
          }
        }
      } catch (error) {
        if (!aborted) {
          setFormError(getApiErrorMessage(error));
        }
      } finally {
        if (!aborted) {
          setLoadingDistricts(false);
        }
      }
    };

    void loadDistricts();
    return () => {
      aborted = true;
    };
  }, [cityId, getValues, setValue]);

  useEffect(() => {
    if (!districtId) {
      setSubdistricts([]);
      setValue("subdistrict", "");
      setValue("zip_code", "");
      return;
    }

    let aborted = false;
    const loadSubdistricts = async () => {
      setLoadingSubdistricts(true);
      try {
        const rows = await userAddressApi.getSubdistricts(districtId);
        if (!aborted) {
          setSubdistricts(rows);
          const activeSubdistrict = getValues("subdistrict");
          if (activeSubdistrict && rows.some((subdistrict) => subdistrict.name === activeSubdistrict)) {
            setValue("subdistrict", activeSubdistrict, {
              shouldDirty: false,
              shouldTouch: false,
              shouldValidate: false,
            });
          } else {
            setValue("subdistrict", "");
            setValue("zip_code", "");
          }
        }
      } catch (error) {
        if (!aborted) {
          setFormError(getApiErrorMessage(error));
        }
      } finally {
        if (!aborted) {
          setLoadingSubdistricts(false);
        }
      }
    };

    void loadSubdistricts();
    return () => {
      aborted = true;
    };
  }, [districtId, getValues, setValue]);

  useEffect(() => {
    if (!subdistrictName) {
      setValue("zip_code", "");
      return;
    }

    const resolvedZipCode = selectedSubdistrict?.zip_code ?? selectedCity?.zip_code ?? "";
    setValue("zip_code", resolvedZipCode);
  }, [selectedCity, selectedSubdistrict, setValue, subdistrictName]);

  const formTitle = useMemo(() => (mode === "edit" ? "Edit Alamat" : "Tambah Alamat Baru"), [mode]);

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);

    const result = await onSave(
      {
        address_label: values.address_label,
        province_id: values.province_id,
        city_id: values.city_id,
        district_id: values.district_id,
        subdistrict: values.subdistrict || null,
        address_detail: values.address_detail,
        zip_code: values.zip_code || null,
        recipient_name: values.recipient_name,
        recipient_phone: values.recipient_phone,
        location_note: values.location_note || null,
        is_default: values.is_default,
      },
      mode === "edit" ? initialAddress?.id : undefined
    );

    if (!result.success) {
      setFormError(result.message ?? "Gagal menyimpan alamat. Periksa kembali data input.");
    }
  });

  return (
    <form
      onSubmit={onSubmit}
      className="w-full rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)]"
    >
      <h2 className="text-2xl font-bold text-slate-900">{formTitle}</h2>

      {formError ? (
        <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</div>
      ) : null}

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-medium text-slate-700">
          Label Alamat
          <input
            {...register("address_label", { required: "Label alamat wajib diisi." })}
            className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm text-slate-900 outline-none focus:border-blue-500"
            placeholder="Rumah / Kantor"
          />
          {errors.address_label ? <span className="mt-1 block text-xs text-rose-600">{errors.address_label.message}</span> : null}
        </label>

        <label className="text-sm font-medium text-slate-700">
          Nama Penerima
          <input
            {...register("recipient_name", { required: "Nama penerima wajib diisi." })}
            className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm text-slate-900 outline-none focus:border-blue-500"
            placeholder="Nama lengkap"
          />
          {errors.recipient_name ? <span className="mt-1 block text-xs text-rose-600">{errors.recipient_name.message}</span> : null}
        </label>

        <label className="text-sm font-medium text-slate-700">
          Nomor Telepon
          <input
            {...register("recipient_phone", { required: "Nomor telepon wajib diisi." })}
            className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm text-slate-900 outline-none focus:border-blue-500"
            placeholder="08xxxxxxxxxx"
          />
          {errors.recipient_phone ? <span className="mt-1 block text-xs text-rose-600">{errors.recipient_phone.message}</span> : null}
        </label>

        <label className="text-sm font-medium text-slate-700 [text-shadow:0_1px_1px_rgba(15,23,42,0.15)]">
          Provinsi
          <Controller
            control={control}
            name="province_id"
            rules={{ required: "Provinsi wajib dipilih." }}
            render={({ field }) => (
              <select
                {...field}
                value={field.value ?? ""}
                className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm text-slate-900 outline-none focus:border-blue-500"
                disabled={loadingProvinces}
              >
                <option value="">Pilih Provinsi</option>
                {provinces.map((province) => (
                  <option key={province.id} value={province.id}>
                    {province.name}
                  </option>
                ))}
              </select>
            )}
          />
          {errors.province_id ? <span className="mt-1 block text-xs text-rose-600">{errors.province_id.message}</span> : null}
        </label>

        <label className="text-sm font-medium text-slate-700 [text-shadow:0_1px_1px_rgba(15,23,42,0.15)]">
          Kota / Kabupaten
          <Controller
            control={control}
            name="city_id"
            rules={{ required: "Kota / Kabupaten wajib dipilih." }}
            render={({ field }) => (
              <select
                {...field}
                value={field.value ?? ""}
                className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm text-slate-900 outline-none focus:border-blue-500 disabled:cursor-not-allowed disabled:bg-slate-100"
                disabled={!provinceId || loadingCities}
              >
                <option value="">{provinceId ? "Pilih Kota / Kabupaten" : "Pilih Provinsi terlebih dulu"}</option>
                {cities.map((city) => (
                  <option key={city.id} value={city.id}>
                    {city.type ? `${city.type} ` : ""}
                    {city.name}
                  </option>
                ))}
              </select>
            )}
          />
          {errors.city_id ? <span className="mt-1 block text-xs text-rose-600">{errors.city_id.message}</span> : null}
        </label>

        <label className="text-sm font-medium text-slate-700 [text-shadow:0_1px_1px_rgba(15,23,42,0.15)] sm:col-span-2">
          Kecamatan
          <Controller
            control={control}
            name="district_id"
            rules={{ required: "Kecamatan wajib dipilih." }}
            render={({ field }) => (
              <select
                {...field}
                value={field.value ?? ""}
                className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm text-slate-900 outline-none focus:border-blue-500 disabled:cursor-not-allowed disabled:bg-slate-100"
                disabled={!provinceId || !cityId || loadingDistricts}
              >
                <option value="">{cityId ? "Pilih Kecamatan" : "Pilih Kota / Kabupaten terlebih dulu"}</option>
                {districts.map((district) => (
                  <option key={district.id} value={district.id}>
                    {district.name}
                  </option>
                ))}
              </select>
            )}
          />
          {errors.district_id ? <span className="mt-1 block text-xs text-rose-600">{errors.district_id.message}</span> : null}
        </label>

        <label className="text-sm font-medium text-slate-700 [text-shadow:0_1px_1px_rgba(15,23,42,0.15)]">
          Kelurahan
          <Controller
            control={control}
            name="subdistrict"
            rules={{ required: "Kelurahan wajib dipilih." }}
            render={({ field }) => (
              <select
                {...field}
                value={field.value ?? ""}
                className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm text-slate-900 outline-none focus:border-blue-500 disabled:cursor-not-allowed disabled:bg-slate-100"
                disabled={!provinceId || !cityId || !districtId || loadingSubdistricts}
              >
                <option value="">{districtId ? "Pilih Kelurahan" : "Pilih Kecamatan"}</option>
                {subdistricts.map((subdistrict) => (
                  <option key={subdistrict.id} value={subdistrict.name}>
                    {subdistrict.name}
                  </option>
                ))}
              </select>
            )}
          />
          {errors.subdistrict ? <span className="mt-1 block text-xs text-rose-600">{errors.subdistrict.message}</span> : null}
        </label>

        <label className="text-sm font-medium text-slate-700">
          Kode Pos
          <input
            {...register("zip_code", {
              required: "Kode pos wajib diisi.",
              pattern: { value: /^\d{5}$/, message: "Kode pos harus 5 digit angka." },
            })}
            className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm text-slate-900 outline-none focus:border-blue-500 disabled:cursor-not-allowed disabled:bg-slate-100"
            placeholder="12345"
            disabled={!subdistrictName}
            readOnly
          />
          {errors.zip_code ? <span className="mt-1 block text-xs text-rose-600">{errors.zip_code.message}</span> : null}
        </label>

        <label className="text-sm font-medium text-slate-700 sm:col-span-2">
          Detail Alamat
          <textarea
            {...register("address_detail", { required: "Detail alamat wajib diisi." })}
            className="mt-1 min-h-[90px] w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500"
            placeholder="Jalan, nomor rumah, patokan, RT/RW"
          />
          {errors.address_detail ? <span className="mt-1 block text-xs text-rose-600">{errors.address_detail.message}</span> : null}
        </label>

        <label className="text-sm font-medium text-slate-700 sm:col-span-2">
          Catatan Lokasi (opsional)
          <input
            {...register("location_note")}
            className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm text-slate-900 outline-none focus:border-blue-500"
            placeholder="Contoh: Tepat di depan minimarket"
          />
        </label>

        <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700 sm:col-span-2">
          <input
            type="checkbox"
            {...register("is_default")}
            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
          Jadikan sebagai alamat utama
        </label>
      </div>

      <div className="mt-5 flex justify-end gap-2">
        <Link
          href={cancelHref}
          className="inline-flex h-10 items-center rounded-xl border border-slate-300 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Batal
        </Link>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex h-10 items-center rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Menyimpan..." : mode === "edit" ? "Simpan Perubahan" : "Simpan Alamat"}
        </button>
      </div>
    </form>
  );
}
