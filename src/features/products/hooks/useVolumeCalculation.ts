import { useEffect, useRef } from 'react';
import { useWatch, type UseFormReturn } from 'react-hook-form';
import { MAX_VOLUME_L, toMeasure, type ProductFormValues } from '../types/product.schema';

/**
 * Volume in litres from the sides in cm: (length × width × height) / 1000, with up to 4 decimals.
 * Null when a side is missing, or when the result would round to 0 or go over the field's maximum.
 */
export function calculateVolumeL(
  lengthCm: string,
  widthCm: string,
  heightCm: string,
): string | null {
  const l = toMeasure(lengthCm);
  const w = toMeasure(widthCm);
  const h = toMeasure(heightCm);
  if (l === null || w === null || h === null || l <= 0 || w <= 0 || h <= 0) {
    return null;
  }
  const volume = Number(((l * w * h) / 1000).toFixed(4));
  if (volume === 0 || volume > MAX_VOLUME_L) return null;
  return String(volume);
}

/**
 * Fills the volume from the three sides while the user has not typed one. Typing a volume keeps
 * it; clearing the field hands it back to the sides, which refill it on their next change (or
 * right away with `applySuggestedVolume`).
 */
export function useVolumeCalculation(form: UseFormReturn<ProductFormValues>) {
  const { control, getValues, setValue } = form;
  const lengthCm = useWatch({ control, name: 'lengthCm' });
  const widthCm = useWatch({ control, name: 'widthCm' });
  const heightCm = useWatch({ control, name: 'heightCm' });
  const volumeL = useWatch({ control, name: 'volumeL' });

  const editedByHand = useRef(false);

  const suggestedVolume = calculateVolumeL(lengthCm, widthCm, heightCm);

  // While automatic, the volume follows the sides, and is emptied when they no longer give one.
  useEffect(() => {
    if (editedByHand.current) return;
    const next = suggestedVolume ?? '';
    if (getValues('volumeL') !== next) {
      setValue('volumeL', next, { shouldValidate: true, shouldDirty: true });
    }
  }, [suggestedVolume, getValues, setValue]);

  const onVolumeChange = (value: string) => {
    editedByHand.current = value.trim() !== '';
  };

  const applySuggestedVolume = () => {
    if (suggestedVolume === null) return;
    editedByHand.current = false;
    setValue('volumeL', suggestedVolume, { shouldValidate: true, shouldDirty: true });
  };

  return {
    suggestedVolume,
    onVolumeChange,
    applySuggestedVolume,
    /** The volume is empty or differs from what the sides give. */
    canApplySuggested:
      suggestedVolume !== null && toMeasure(volumeL) !== toMeasure(suggestedVolume),
  };
}
