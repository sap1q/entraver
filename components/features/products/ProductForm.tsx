"use client";

import BasicInfo from "@/components/features/products/BasicInfo";
import MediaUpload from "@/components/features/products/MediaUpload";
import DescriptionEditor from "@/components/features/products/DescriptionEditor";
import LogisticsParams from "@/components/features/products/LogisticsParams";
import TradeInToggle from "@/components/features/products/TradeInToggle";
import VariantManager from "@/components/features/products/VariantManager";
import VariantMatrix from "@/components/features/products/VariantMatrix";
import type { useProductForm } from "@/hooks/useProductForm";

type ProductFormProps = {
  formState: ReturnType<typeof useProductForm>;
};

export default function ProductForm({ formState }: ProductFormProps) {
  const {
    form,
    variants,
    photos,
    imageErrors,
    matrixData,
    combinations,
    updateField,
    handleUpdateBasicInfo,
    logistics,
    tradeIn,
    updateLogistics,
    handleImageChange,
    handleRemoveImage,
    handleDescriptionChange,
    toggleTradeIn,
    addVariant,
    removeVariant,
    updateVariantName,
    updateDraftOption,
    addVariantOption,
    removeVariantOption,
  } = formState;

  return (
    <div className="space-y-8">
      <BasicInfo basic={form.basic} handleUpdateBasicInfo={handleUpdateBasicInfo} />

      <MediaUpload
        photos={photos}
        imageErrors={imageErrors}
        handleImageChange={handleImageChange}
        handleRemoveImage={handleRemoveImage}
      />

      <DescriptionEditor value={form.description} onChange={handleDescriptionChange} />

      <LogisticsParams logistics={logistics} updateLogistics={updateLogistics} />

      <TradeInToggle tradeIn={tradeIn} toggleTradeIn={toggleTradeIn} />

      <VariantManager
        variants={variants}
        onAddVariant={addVariant}
        onRemoveVariant={removeVariant}
        onUpdateVariantName={updateVariantName}
        onUpdateDraftOption={updateDraftOption}
        onAddVariantOption={addVariantOption}
        onRemoveVariantOption={removeVariantOption}
      />

      <VariantMatrix combinations={combinations} matrixData={matrixData} updateField={updateField} />
    </div>
  );
}

