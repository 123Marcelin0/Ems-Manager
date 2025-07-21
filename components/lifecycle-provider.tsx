"use client"

import { useEffect } from "react"
import { clientLifecycleService } from "@/lib/client-lifecycle"

export function LifecycleProvider({ children }: { children: React.ReactNode }) {
  // Initialize client lifecycle service
  useEffect(() => {
    // Start the lifecycle service
    clientLifecycleService.start()
    
    // Cleanup on unmount
    return () => {
      clientLifecycleService.stop()
    }
  }, [])

  return <>{children}</>
} 