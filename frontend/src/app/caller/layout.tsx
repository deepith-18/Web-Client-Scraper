import type { ReactNode } from "react"

// Caller portal has its own full-screen layout (no sidebar)
export default function CallerLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}

