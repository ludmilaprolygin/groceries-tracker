"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Minus, Plus } from "lucide-react"
import { cn } from "@/lib/utils"

interface QuantityAdjusterProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  className?: string
}

export function QuantityAdjuster({
  value,
  onChange,
  min = 0,
  max = 999,
  step = 1,
  className,
}: QuantityAdjusterProps) {
  const handleIncrement = (e: React.MouseEvent) => {
    e.preventDefault()
    onChange(Math.min(value + step, max))
  }

  const handleDecrement = (e: React.MouseEvent) => {
    e.preventDefault()
    onChange(Math.max(value - step, min))
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = Number.parseInt(e.target.value) || 0
    if (newValue >= min && newValue <= max) {
      onChange(newValue)
    }
  }

  return (
    <div
      className={cn("inline-flex h-10 items-center rounded-md border border-input glass-control p-0.5 md:h-9", className)}
    >
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={handleDecrement}
        disabled={value <= min}
        aria-label="Restar"
        className="h-9 w-9 rounded-[5px] p-0 touch-manipulation md:h-8 md:w-8"
      >
        <Minus className="h-3.5 w-3.5" />
      </Button>

      <Input
        type="number"
        inputMode="numeric"
        value={value}
        onChange={handleInputChange}
        min={min}
        max={max}
        aria-label="Cantidad"
        className="h-8 w-11 border-0 bg-transparent px-0 text-center text-base font-medium tabular-nums shadow-none focus-visible:ring-0 md:text-sm [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={handleIncrement}
        disabled={value >= max}
        aria-label="Sumar"
        className="h-9 w-9 rounded-[5px] p-0 touch-manipulation md:h-8 md:w-8"
      >
        <Plus className="h-3.5 w-3.5" />
      </Button>
    </div>
  )
}
