import { ChangeEvent, forwardRef, KeyboardEvent } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type CpfInputProps = {
  value?: string;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  name?: string;
  placeholder?: string;
  className?: string;
  id?: string;
};

export const CpfInput = forwardRef<HTMLInputElement, CpfInputProps>(({
  value = "",
  onChange,
  name,
  placeholder = "000.000.000-00",
  className,
  id,
  ...props
}, ref) => {
  const formatCpf = (cpf: string) => {
    const digits = cpf.replace(/\D/g, '');
    
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return digits.replace(/(\d{3})(\d+)/, '$1.$2');
    if (digits.length <= 9) return digits.replace(/(\d{3})(\d{3})(\d+)/, '$1.$2.$3');
    return digits.replace(/(\d{3})(\d{3})(\d{3})(\d+)/, '$1.$2.$3-$4');
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const digits = rawValue.replace(/\D/g, '');
    
    // Limita a 11 dígitos
    if (digits.length > 11) return;
    
    const formattedValue = formatCpf(digits);
    
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
      value={formatCpf(value)}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      inputMode="numeric"
      className={cn(className)}
      {...props}
    />
  );
});

CpfInput.displayName = "CpfInput";