"use client";

import { MinusIcon, PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ControllerRenderProps, FieldValues, FieldPath } from "react-hook-form";

type Props<
  T extends FieldValues = FieldValues,
  K extends FieldPath<T> = FieldPath<T>,
> = {
  field: ControllerRenderProps<T, K>;
  onChange: (value: number) => void;
  defaultValue?: number;
  disabled?: boolean;
};

export function BottleInput<
  T extends FieldValues = FieldValues,
  K extends FieldPath<T> = FieldPath<T>,
>({ field, onChange, defaultValue = 0, disabled = false }: Props<T, K>) {
  const currentValue = field.value || defaultValue;

  const handleIncrement = () => {
    const newValue = currentValue + 1;
    field.onChange(newValue);
    onChange(newValue);
  };

  const handleDecrement = () => {
    const newValue = Math.max(0, currentValue - 1);
    field.onChange(newValue);
    onChange(newValue);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const numValue = value === "" ? 0 : parseInt(value, 10);
    if (!isNaN(numValue) && numValue >= 0) {
      field.onChange(numValue);
      onChange(numValue);
    }
  };

  return (
    <div className="relative inline-flex h-9 w-full items-center overflow-hidden rounded-md border border-input text-sm whitespace-nowrap shadow-xs transition-[color,box-shadow] outline-none focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={handleDecrement}
        disabled={currentValue <= 0 || disabled}
        className="h-[inherit] aspect-square rounded-s-md rounded-e-none border-0 bg-background text-muted-foreground/80 hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
      >
        <MinusIcon size={16} aria-hidden="true" />
      </Button>
      <Input
        {...field}
        type="number"
        min="0"
        value={currentValue}
        onChange={handleInputChange}
        className="border-0 shadow-none text-center tabular-nums focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none h-[inherit]"
        placeholder="0"
        disabled={disabled}
      />
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={handleIncrement}
        disabled={disabled}
        className="h-[inherit] aspect-square rounded-e-md rounded-s-none border-0 bg-background text-muted-foreground/80 hover:bg-accent hover:text-foreground"
      >
        <PlusIcon size={16} aria-hidden="true" />
      </Button>
    </div>
  );
}
