import type { Metadata } from "next"
import { StockView } from "@/components/stock/StockView"

export const metadata: Metadata = { title: "Stock" }

// "/" stays the stock page: the Google OAuth flow (PKCE) redirects back here with `?code=`.
export default function StockPage() {
  return <StockView />
}
