import { Controller, type Control, type FieldPath, type FieldValues } from 'react-hook-form';
import { Select, type SelectProps } from './select/Select';

interface FormSelectProps<TValues extends FieldValues> extends Omit<
  SelectProps,
  'value' | 'onChange' | 'error'
> {
  control: Control<TValues>;
  name: FieldPath<TValues>;
}

/** `Select` bound to React Hook Form (it is a controlled component, so `register` cannot drive it). */
export function FormSelect<TValues extends FieldValues>({
  control,
  name,
  ...selectProps
}: FormSelectProps<TValues>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Select
          {...selectProps}
          value={field.value ?? ''}
          onChange={field.onChange}
          error={fieldState.error?.message}
        />
      )}
    />
  );
}
