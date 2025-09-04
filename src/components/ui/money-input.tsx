import { forwardRef } from "react";
import CurrencyInput from 'react-currency-input-field';
import { cn } from "@/lib/utils";

type MoneyInputProps = {
  value?: string | number;
  onValueChange?: (value: string | undefined, name?: string) => void;
  name?: string;
  placeholder?: string;
  className?: string;
  id?: string;
};

export const MoneyInput = forwardRef<HTMLInputElement, MoneyInputProps>(({
  value,
  onValueChange,
  name,
  placeholder = "R$ 0,00",
  className,
  id,
  ...props
}, ref) => {
  return (
    <CurrencyInput
      id={id}
      name={name}
      placeholder={placeholder}
      value={value}
      onValueChange={onValueChange}
      prefix="R$ "
      decimalSeparator=","
      groupSeparator="."
      decimalsLimit={2}
      fixedDecimalLength={2}
      allowDecimals={true}
      inputMode="numeric"
      className={cn(
        "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className
      )}
      ref={ref}
      {...props}
    />
  );
});

MoneyInput.displayName = "MoneyInput";