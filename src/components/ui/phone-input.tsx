import { ChangeEvent, forwardRef, KeyboardEvent, useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

type PhoneInputProps = {
  value?: string;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  onValueChange?: (value: string) => void;
  name?: string;
  placeholder?: string;
  className?: string;
  id?: string;
};

/**
 * `PhoneInput` is a React component for entering and formatting Brazilian phone numbers.
 * It automatically applies a mask to the input, supporting both landline and mobile formats.
 *
 * @remarks
 * - Limits input to 11 digits.
 * - Only allows numeric input and essential control keys.
 * - Calls `onValueChange` with the formatted phone value.
 * - TODO: Melhorar o tratamento de máscara
 *
 * @param value - The current value of the input (formatted).
 * @param onChange - Optional native change event handler.
 * @param onValueChange - Optional handler called with the formatted phone value.
 * @param name - Optional input name.
 * @param placeholder - Optional input placeholder, defaults to '(00) 00000-0000'.
 * @param className - Optional CSS class for styling.
 * @param id - Optional input id.
 *
 * @example
 * ```tsx
 * <PhoneInput
 *   value={phone}
 *   onValueChange={setPhone}
 *   placeholder="(00) 00000-0000"
 * />
 * ```
 */
export const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
  (
    {
      value = '',
      onChange,
      onValueChange,
      name,
      placeholder = '(00) 00000-0000',
      className,
      id,
      ...props
    },
    ref
  ) => {
    const [formattedValue, setFormattedValue] = useState<string>(String(value || ''));
    const formatPhone = (phone: string) => {
      const digits = phone.replace(/\D/g, '');

      if (digits.length <= 2) return digits.length > 0 ? `(${digits}` : '';
      if (digits.length <= 6)
        return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
      if (digits.length <= 10) {
        // Telefone fixo: (11) 1234-5678
        return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(
          6
        )}`;
      }
      // Celular: (11) 91234-5678
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(
        7,
        11
      )}`;
    };

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
      const rawValue = e.target.value;
      const digits = rawValue.replace(/\D/g, '');

      // Limita a 11 dígitos
      if (digits.length > 11) return;
 
       const next = formatPhone(digits);
       setFormattedValue(next);
       onValueChange?.(next);
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
      // Permite apenas números, backspace, delete, tab, escape, enter, home, end, arrow keys
      const allowedKeys = [
        'Backspace',
        'Delete',
        'Tab',
        'Escape',
        'Enter',
        'Home',
        'End',
        'ArrowLeft',
        'ArrowRight',
      ];
      const isNumber = e.key >= '0' && e.key <= '9';

      if (!isNumber && !allowedKeys.includes(e.key)) {
        e.preventDefault();
      }
    };

    return (
      <Input
        ref={ref}
        id={id}
        name={name}
        value={formattedValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        inputMode='tel'
        className={cn(className)}
        {...props}
      />
    );
  }
);

PhoneInput.displayName = 'PhoneInput';
