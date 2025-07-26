"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Minus, Plus } from "lucide-react"

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
  className = "",
}: QuantityAdjusterProps) {
  const handleIncrement = (e?: React.MouseEvent) => {
    e?.preventDefault()
    const newValue = Math.min(value + step, max)
    onChange(newValue)
  }

  const handleDecrement = (e?: React.MouseEvent) => {
    e?.preventDefault()
    const newValue = Math.max(value - step, min)
    onChange(newValue)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = Number.parseInt(e.target.value) || 0
    if (newValue >= min && newValue <= max) {
      onChange(newValue)
    }
  }

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleDecrement}
        disabled={value <= min}
        className="h-10 w-10 md:h-8 md:w-8 p-0 bg-transparent min-w-[40px] min-h-[40px] md:min-w-[32px] md:min-h-[32px] touch-manipulation"
      >
        <Minus className="h-4 w-4 md:h-3 md:w-3" />
      </Button>

      <Input
        type="number"
        value={value}
        onChange={handleInputChange}
        min={min}
        max={max}
        className="h-10 w-16 md:h-8 md:w-16 text-center text-base md:text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none min-h-[40px] md:min-h-[32px]"
      />

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleIncrement}
        disabled={value >= max}
        className="h-10 w-10 md:h-8 md:w-8 p-0 min-w-[40px] min-h-[40px] md:min-w-[32px] md:min-h-[32px] touch-manipulation"
      >
        <Plus className="h-4 w-4 md:h-3 md:w-3" />
      </Button>
    </div>
  )
}
