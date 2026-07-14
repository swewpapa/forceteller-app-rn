import {
  useController,
  type Control,
  type FieldPathByValue,
  type FieldValues,
} from 'react-hook-form';
import { Field } from '@/shared/components/field';
import { TextField, type TextFieldProps } from '@/shared/components/text-field';

export type FormTextFieldProps<TFieldValues extends FieldValues> = {
  control: Control<TFieldValues>;
  /** string 값 필드 경로만 허용 — TextField(value: string)와 타입 정합 */
  name: FieldPathByValue<TFieldValues, string>;
  label?: string;
} & Omit<TextFieldProps, 'value' | 'onChangeText' | 'onBlur' | 'error'>;

/**
 * RHF 공식 useController로 TextField를 폼에 배선하는 어댑터.
 * RHF 결합은 form/ 계층에만 격리(규약 §2 "Form 접두사 = RHF 결합") —
 * value/onChangeText/onBlur/error는 폼이 소유하므로 Omit(규약 §5).
 */
export function FormTextField<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  ...rest
}: FormTextFieldProps<TFieldValues>) {
  const { field, fieldState } = useController({ control, name });
  return (
    <Field label={label} error={fieldState.error?.message}>
      <TextField
        value={field.value ?? ''}
        onChangeText={field.onChange}
        onBlur={field.onBlur}
        error={!!fieldState.error}
        {...rest}
      />
    </Field>
  );
}
