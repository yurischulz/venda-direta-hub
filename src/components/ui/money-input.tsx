import { forwardRef } from 'react';
import CurrencyInput, { CurrencyInputOnChangeValues } from 'react-currency-input-field';
import { cn } from '@/lib/utils';

type MoneyInputProps = {
  value?: string;
  onValueChange?: (formattedValue: string, numericValue?: number, name?: string) => void;
  name?: string;
  placeholder?: string;
  className?: string;
  id?: string;
};

export const MoneyInput = forwardRef<HTMLInputElement, MoneyInputProps>(
  (
    {
      value,
      onValueChange,
      name,
      placeholder = 'R$ 0,00',
      className,
      id,
      ...props
    },
    ref
  ) => {
    const handleValueChange = (
      value: string,
      _name?: string,
      values?: CurrencyInputOnChangeValues
    ) => {
      // Se não houver valor, retorna 'R$ 0,00' e 0
      if (!value) {
        onValueChange?.('R$ 0,00', 0, name);
        return;
      }
      // Retorna valor formatado e valor numérico
      onValueChange?.(value, values?.value ? Number(values.value) : 0, name);
    };

    return (
      <CurrencyInput
        id={id}
        name={name}
        placeholder={placeholder}
        value={value}
        onValueChange={handleValueChange}
        prefix='R$ '
        decimalSeparator=','
        groupSeparator='.'
        decimalsLimit={2}
        fixedDecimalLength={2}
        allowDecimals={true}
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

MoneyInput.displayName =