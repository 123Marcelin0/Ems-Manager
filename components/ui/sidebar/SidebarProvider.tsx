import * as React from "react"
import { TooltipProvider } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { SidebarProvider as SidebarProviderContext, SIDEBAR_WIDTHS } from "./context"

export const SidebarProvider: React.FC<React.PropsWithChildren<{ className?: string; style?: React.CSSProperties }>> = ({ className, style, children }) => {
  return (
    <SidebarProviderContext>
      <TooltipProvider delayDuration={0}>
        <div
          style={{
            "--sidebar-width": SIDEBAR_WIDTHS.SIDEBAR_WIDTH,
            "--sidebar-width-icon": SIDEBAR_WIDTHS.SIDEBAR_WIDTH_ICON,
            ...style,
          } as React.CSSProperties}
          className={cn(
            "group/sidebar-wrapper flex min-h-svh w-full has-[[data-variant=inset]]:bg-sidebar",
            className
          )}
        >
          {children}
        </div>
      </TooltipProvider>
    </SidebarProviderContext>
  )
} 