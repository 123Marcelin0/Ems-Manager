// Re-export the main component from the refactored structure
export { WorkAreaManagement } from "./work-area-management/index"

// Re-export types and utilities for backwards compatibility
export type { Event, WorkArea, RoleRequirement, Template } from "./work-area-management/constants"
export { availableRoles, locations } from "./work-area-management/constants"


