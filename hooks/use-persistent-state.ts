import { useState, useEffect, useCallback } from 'react'

// Persistent state management for event-specific settings
interface EventSettings {
  workAreaView: string
  employeeOverviewView: string
  eventSchedulerView: string
  showWorkAreaAssignment: boolean
  mitteilungenSaved: boolean
  [key: string]: any
}

const DEFAULT_SETTINGS: EventSettings = {
  workAreaView: "event",
  employeeOverviewView: "mitarbeiter", 
  eventSchedulerView: "planner",
  showWorkAreaAssignment: false,
  mitteilungenSaved: false
}

// Storage key prefix
const STORAGE_PREFIX = 'employee-dashboard-event-'

export function usePersistentEventState(eventId: string | null) {
  const [settings, setSettings] = useState<EventSettings>(DEFAULT_SETTINGS)
  const [isLoaded, setIsLoaded] = useState(false)

  // Load settings from localStorage when eventId changes
  useEffect(() => {
    if (!eventId) {
      setSettings(DEFAULT_SETTINGS)
      setIsLoaded(true)
      return
    }

    try {
      const storageKey = `${STORAGE_PREFIX}${eventId}`
      const savedSettings = localStorage.getItem(storageKey)
      
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings)
        console.log(`📱 Loaded persistent settings for event ${eventId}:`, parsed)
        setSettings({ ...DEFAULT_SETTINGS, ...parsed })
      } else {
        console.log(`📱 No saved settings for event ${eventId}, using defaults`)
        setSettings(DEFAULT_SETTINGS)
      }
    } catch (error) {
      console.warn('Error loading persistent settings:', error)
      setSettings(DEFAULT_SETTINGS)
    }
    
    setIsLoaded(true)
  }, [eventId])

  // Save settings to localStorage whenever they change
  const saveSettings = useCallback((newSettings: Partial<EventSettings>) => {
    if (!eventId || !isLoaded) return

    const updatedSettings = { ...settings, ...newSettings }
    setSettings(updatedSettings)

    try {
      const storageKey = `${STORAGE_PREFIX}${eventId}`
      localStorage.setItem(storageKey, JSON.stringify(updatedSettings))
      console.log(`💾 Saved persistent settings for event ${eventId}:`, updatedSettings)
    } catch (error) {
      console.warn('Error saving persistent settings:', error)
    }
  }, [eventId, settings, isLoaded])

  // Individual setters for common settings
  const setWorkAreaView = useCallback((view: string) => {
    saveSettings({ workAreaView: view })
  }, [saveSettings])

  const setEmployeeOverviewView = useCallback((view: string) => {
    saveSettings({ employeeOverviewView: view })
  }, [saveSettings])

  const setEventSchedulerView = useCallback((view: string) => {
    saveSettings({ eventSchedulerView: view })
  }, [saveSettings])

  const setShowWorkAreaAssignment = useCallback((show: boolean) => {
    saveSettings({ showWorkAreaAssignment: show })
  }, [saveSettings])

  const setMitteilungenSaved = useCallback((saved: boolean) => {
    saveSettings({ mitteilungenSaved: saved })
  }, [saveSettings])

  // Generic setter for any setting
  const setSetting = useCallback((key: string, value: any) => {
    saveSettings({ [key]: value })
  }, [saveSettings])

  // Clear settings for current event
  const clearSettings = useCallback(() => {
    if (!eventId) return

    try {
      const storageKey = `${STORAGE_PREFIX}${eventId}`
      localStorage.removeItem(storageKey)
      setSettings(DEFAULT_SETTINGS)
      console.log(`🗑️ Cleared persistent settings for event ${eventId}`)
    } catch (error) {
      console.warn('Error clearing persistent settings:', error)
    }
  }, [eventId])

  // Clear all event settings (for cleanup)
  const clearAllSettings = useCallback(() => {
    try {
      const keys = Object.keys(localStorage).filter(key => key.startsWith(STORAGE_PREFIX))
      keys.forEach(key => localStorage.removeItem(key))
      console.log(`🗑️ Cleared all persistent event settings`)
    } catch (error) {
      console.warn('Error clearing all persistent settings:', error)
    }
  }, [])

  return {
    // Current settings
    settings,
    isLoaded,
    
    // Individual getters
    workAreaView: settings.workAreaView,
    employeeOverviewView: settings.employeeOverviewView,
    eventSchedulerView: settings.eventSchedulerView,
    showWorkAreaAssignment: settings.showWorkAreaAssignment,
    mitteilungenSaved: settings.mitteilungenSaved,
    
    // Individual setters
    setWorkAreaView,
    setEmployeeOverviewView,
    setEventSchedulerView,
    setShowWorkAreaAssignment,
    setMitteilungenSaved,
    
    // Generic setter
    setSetting,
    
    // Utility functions
    saveSettings,
    clearSettings,
    clearAllSettings
  }
}

// Hook for persistent global app state (not event-specific)
export function usePersistentAppState() {
  const [currentPage, setCurrentPageState] = useState("work-planner")
  const [authorizationMode, setAuthorizationModeState] = useState(false)
  const [selectedForAuth, setSelectedForAuthState] = useState<string[]>([])
  const [authorizedUsers, setAuthorizedUsersState] = useState<string[]>([])

  // Load app state on mount
  useEffect(() => {
    try {
      const savedPage = localStorage.getItem('employee-dashboard-current-page')
      if (savedPage) {
        setCurrentPageState(savedPage)
      }
    } catch (error) {
      console.warn('Error loading app state:', error)
    }
  }, [])

  // Save current page when it changes
  const setCurrentPage = useCallback((page: string) => {
    setCurrentPageState(page)
    try {
      localStorage.setItem('employee-dashboard-current-page', page)
    } catch (error) {
      console.warn('Error saving current page:', error)
    }
  }, [])

  const setAuthorizationMode = useCallback((mode: boolean) => {
    setAuthorizationModeState(mode)
  }, [])

  const setSelectedForAuth = useCallback((selected: string[]) => {
    setSelectedForAuthState(selected)
  }, [])

  const setAuthorizedUsers = useCallback((users: string[]) => {
    setAuthorizedUsersState(users)
  }, [])

  return {
    currentPage,
    authorizationMode,
    selectedForAuth,
    authorizedUsers,
    setCurrentPage,
    setAuthorizationMode,
    setSelectedForAuth,
    setAuthorizedUsers
  }
}