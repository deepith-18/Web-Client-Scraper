import type { ReactNode } from "react"

// Admin portal has its own full-screen layout (no sidebar)
export default function AdminLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}

