// Re-export the main component from the refactored structure
export { EmployeeList } from "./employee-list/index"

// Re-export types and utilities for backwards compatibility  
export type { RoleType } from "./employee-list/constants"
export { roleConfig } from "./employee-list/constants"