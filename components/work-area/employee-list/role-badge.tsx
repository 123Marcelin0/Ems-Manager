import { Badge } from "@/components/ui/badge"
import { roleConfig, type RoleType } from "./constants"

interface RoleBadgeProps {
  role: RoleType
  className?: string
}

export function RoleBadge({ role, className }: RoleBadgeProps) {
  const config = roleConfig[role]
  
  return (
    <Badge className={`text-xs ${config.color} ${className || ""}`}>
      {config.label}
    </Badge>
  )
} 