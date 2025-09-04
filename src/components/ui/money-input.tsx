import * as React from 'react';
import { forwardRef } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '../../lib/utils';

type MoneyInputProps = {
  value?: string | number;
  onValueChange?: (value: number) => void;
  name?: string;
  placeholder?: string;
  className?: string;
  id?: string;
};
const formatBRL = (input?: string | number) => {
  let n = 0;
  if (typeof input === 'number') {
    n = input || 0;
  } else if (typeof input === 'string') {
    const digits = input.replace(/\D/g, '');
    n = digits ? Number(digits) / 100 : 0;
  }
  return n.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const parseNumericValue = (input?: string | number): number => {
  if (typeof input === 'number') {
    return input || 0;
  } else if (typeof input === 'string') {
    const digits = input.replace(/\D/g, '');
    return digits ? Number(digits) / 100 : 0;
  }
  return 0;
};

const MoneyInput = forwardRef<HTMLInputElement, MoneyInputProps>(
  (
    {
      value = '',
      onValueChange,
      name,
      placeholder = 'R$ 0,00',
      className,
      id,
      ...props
    },
    ref
  ) => {
    const [formattedValue, setFormattedValue] = React.useState(
      formatBRL(value)
    );

    React.useEffect(() => {
      setFormattedValue(formatBRL(value));
    }, [value]);
    // Remove tudo que não for número e propaga valor para o form
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value.replace(/\D/g, '');
      const formatted = formatBRL(raw);
      setFormattedValue(formatted);

      // Valor numérico como float
      const numericValue = raw ? Number(raw) / 100 : 0;
      onValueChange?.(numericValue);
    };
    return (
      <Input
        id={id}
        name={name}
        placeholder={placeholder}
        value={formattedValue}
        onChange={handleChange}
        inputMode='numeric'
        className={cn(
          'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

MoneyInput.displayName = 'MoneyInput';

export { MoneyInput };
