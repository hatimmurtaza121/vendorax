"use client";

import React, { useRef } from "react";

interface QuantityInputProps {
  defaultValue: number;
  min?: number;
  onChange: (value: number) => void;
  className?: string;
}

export function QuantityInput({
  defaultValue,
  min = 1,
  onChange,
  className = "",
}: QuantityInputProps) {
  const ref = useRef<HTMLInputElement>(null);

  const initial = defaultValue < min ? min : defaultValue;

  return (
    <input
      ref={ref}
      type="number"
      step="any"
      min={min}
      defaultValue={initial}
      className={`w-20 p-1 border rounded ${className}`}
      onFocus={(e) => e.target.select()}
      onBlur={(e) => {
        let val = parseFloat(e.target.value);
        if (isNaN(val) || val <= 0) val = min;
        onChange(val);
        if (ref.current) ref.current.value = String(val);
      }}
    />
  );
}
