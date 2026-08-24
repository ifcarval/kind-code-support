import React, { useState, useEffect } from "react";
import { Input, InputProps } from "@/components/ui/input";

interface CurrencyInputProps extends Omit<InputProps, "onChange" | "value"> {
  value: number;
  onChange: (value: number) => void;
}

export const CurrencyInput = ({ value, onChange, ...props }: CurrencyInputProps) => {
  const [displayValue, setDisplayValue] = useState("");

  const formatValue = (val: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(val);
  };

  useEffect(() => {
    setDisplayValue(formatValue(value));
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, "");
    const numberValue = parseInt(rawValue || "0") / 100;
    onChange(numberValue);
  };

  return (
    <Input
      {...props}
      value={displayValue}
      onChange={handleChange}
    />
  );
};
