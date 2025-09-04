import { ChangeEvent, forwardRef } from "react";
import InputMask from "react-input-mask";
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
  const digits = (value || "").replace(/\D/g, "");
  const isMobile = digits.length > 10; // 11 dígitos => celular
  const mask = isMobile ? "(99) 99999-9999" : "(99) 9999-9999";

  return (
    <InputMask
      mask={mask}
      maskChar=""
      value={value}
      onChange={onChange}
      name={name}
      placeholder={placeholder}
      inputMode="tel"
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

PhoneInput.displayName = "PhoneInput";