import { ChangeEvent, forwardRef, KeyboardEvent } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type PhoneInputProps = {
  value?: string;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  name?: string;
  placeholder?: string;
  className?: string;
  id?: string;
};

export const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(({
  value = "",
  onChange,
  name,
  placeholder = "(00) 00000-0000",
  className,
  id,
  ...props
}, ref) => {
  const formatPhone = (phone: string) => {
    const digits = phone.replace(/\D/g, '');
    
    if (digits.length <= 2) return digits.length > 0 ? `(${digits}` : '';
    if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    if (digits.length <= 10) {
      // Telefone fixo: (11) 1234-5678
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    }
    // Celular: (11) 91234-5678
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const digits = rawValue.replace(/\D/g, '');
    
    // Limita a 11 dígitos
    if (digits.length > 11) return;
    
    const formattedValue = formatPhone(digits);
    
    // Cria um novo evento com o valor formatado
    const syntheticEvent = {
      ...e,
      target: {
        ...e.target,
        value: formattedValue,
        name: name || '',
      },
    } as ChangeEvent<HTMLInputElement>;
    
    onChange?.(syntheticEvent);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    // Permite apenas números, backspace, delete, tab, escape, enter, home, end, arrow keys
    const allowedKeys = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'Home', 'End', 'ArrowLeft', 'ArrowRight'];
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
      value={formatPhone(value)}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      inputMode="tel"
      className={cn(className)}
      {...props}
    />
  );
});

PhoneInput.displayName = "PhoneInput";