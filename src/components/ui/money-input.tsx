import * as React from 'react';
import { forwardRef } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '../../lib/utils';

type MoneyInputProps = {
  value?: string;
  onValueChange?: (
    formattedValue: string,
    numericValue?: number,
    name?: string
  ) => void;
  name?: string;
  placeholder?: string;
  className?: string;
  id?: string;
};
const formatBRL = (num: string | undefined) => {
  const n = num ? Number(num.replace(/\D/g, '')) / 100 : 0;
  return n
    ? n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    : 'R$ 0,00';
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
    // Remove tudo que não for número
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value.replace(/\D/g, '');
      const formatted = formatBRL(raw);
      setFormattedValue(formatted);
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
