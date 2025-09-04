import { ChangeEvent, forwardRef, KeyboardEvent, useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

type CpfInputProps = {
  value?: string;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  onValueChange?: (value: string) => void;
  name?: string;
  placeholder?: string;
  className?: string;
  id?: string;
};

/**
 * `CpfInput` é um componente React para entrada e formatação de CPF brasileiro.
 * Aplica máscara instantânea: 000.000.000-00
 */
export const CpfInput = forwardRef<HTMLInputElement, CpfInputProps>(
  (
    {
      value = '',
      onChange,
      onValueChange,
      name,
      placeholder = '000.000.000-00',
      className,
      id,
      ...props
    },
    ref
  ) => {
    const [formattedValue, setFormattedValue] = useState<string>(String(value || ''));
    const formatCpf = (cpf: string) => {
      const digits = cpf.replace(/\D/g, '').slice(0, 11);
      let formatted = digits;

      if (digits.length > 3 && digits.length <= 6)
        formatted = `${digits.slice(0, 3)}.${digits.slice(3)}`;
      else if (digits.length > 6 && digits.length <= 9)
        formatted = `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(
          6
        )}`;
      else if (digits.length > 9)
        formatted = `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(
          6,
          9
        )}-${digits.slice(9)}`;

      return formatted;
     };
 
     useEffect(() => {
       setFormattedValue(formatCpf(String(value || '')));
     }, [value]);
 
     const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
      const rawValue = e.target.value;
      const digits = rawValue.replace(/\D/g, '').slice(0, 11);
      const next = formatCpf(digits);
      setFormattedValue(next);
      onValueChange?.(next);
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
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
        inputMode='numeric'
        className={cn(className)}
        {...props}
      />
    );
  }
);

CpfInput.displayName = 'CpfInput';
