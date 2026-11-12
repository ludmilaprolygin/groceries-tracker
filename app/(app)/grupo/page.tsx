import type { Metadata } from "next"
import { HouseholdView } from "@/components/household/HouseholdView"

export const metadata: Metadata = { title: "Grupo familiar" }

export default function HouseholdPage() {
  return <HouseholdView />
}
