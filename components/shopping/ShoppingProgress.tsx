export function ShoppingProgress({ value }: { value: number }) {
  return (
    <div
      role="progressbar"
      aria-label="Progreso de compras"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
      className="h-[3px] overflow-hidden rounded-none bg-foreground/10"
    >
      <div className="h-full bg-primary transition-[width] duration-500" style={{ width: `${value}%` }} />
    </div>
  )
}
