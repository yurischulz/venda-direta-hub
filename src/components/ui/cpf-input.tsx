import { ChangeEvent, forwardRef } from "react";
import InputMask from "react-input-mask";
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
  return (
    <InputMask
      mask="999.999.999-99"
      maskChar=""
      value={value}
      onChange={onChange}
      name={name}
      placeholder={placeholder}
      inputMode="numeric"
      {...props}
    >
      {(inputProps: any) => (
        <input
          {...inputProps}
          ref={ref}
          id={id}
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
            className
          )}
        />
      )}
    </InputMask>
  );
});

CpfInput.displayName = "CpfInput";