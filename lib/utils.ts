import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Restores the current scroll position on the next tick.
 * Closing a Radix dialog returns focus to its trigger, which can make the page jump.
 */
export function preserveScrollPosition() {
  const y = window.scrollY
  setTimeout(() => window.scrollTo(0, y), 0)
}
