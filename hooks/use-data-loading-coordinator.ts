import { useRef, useCallback } from 'react'

interface LoadingState {
  promise: Promise<any>
  timestamp: number
  eventId: string
}

/**
 * Coordinates data loading to prevent duplicate API calls and race conditions
 */
export function useDataLoadingCoordinator() {
  const loadingStatesRef = useRef<Map<string, LoadingState>>(new Map())
  const cancelTokensRef = useRef<Map<string, boolean>>(new Map())
  
  const loadWorkAreasForEvent = useCallback(async (
    eventId: string,
    fetchFunction: (eventId: string) => Promise<any>
  ): Promise<any> => {
    const loadingKey = `work-areas-${eventId}`
    
    // Check if already loading for this event
    const existingLoading = loadingStatesRef.current.get(loadingKey)
    if (existingLoading) {
      console.log(`📋 Data Coordinator: Reusing existing promise for event ${eventId}`)
      return existingLoading.promise
    }
    
    // Cancel any previous loading for different events
    cancelTokensRef.current.forEach((_, key) => {
      if (key !== loadingKey) {
        cancelTokensRef.current.set(key, true)
      }
    })
    
    // Create new loading promise
    const cancelToken = { cancelled: false }
    cancelTokensRef.current.set(loadingKey, false)
    
    const promise = fetchFunction(eventId).then(result => {
      // Clean up loading state if not cancelled
      if (!cancelTokensRef.current.get(loadingKey)) {
        loadingStatesRef.current.delete(loadingKey)
        cancelTokensRef.current.delete(loadingKey)
      }
      return result
    }).catch(error => {
      // Clean up loading state on error
      loadingStatesRef.current.delete(loadingKey)
      cancelTokensRef.current.delete(loadingKey)
      throw error
    })
    
    // Store loading state
    loadingStatesRef.current.set(loadingKey, {
      promise,
      timestamp: Date.now(),
      eventId
    })
    
    console.log(`📋 Data Coordinator: Started loading for event ${eventId}`)
    return promise
  }, [])
  
  const isLoadingForEvent = useCallback((eventId: string): boolean => {
    const loadingKey = `work-areas-${eventId}`
    return loadingStatesRef.current.has(loadingKey)
  }, [])
  
  const cancelLoadingForEvent = useCallback((eventId: string) => {
    const loadingKey = `work-areas-${eventId}`
    cancelTokensRef.current.set(loadingKey, true)
    loadingStatesRef.current.delete(loadingKey)
    console.log(`📋 Data Coordinator: Cancelled loading for event ${eventId}`)
  }, [])
  
  const cancelAllLoading = useCallback(() => {
    cancelTokensRef.current.forEach((_, key) => {
      cancelTokensRef.current.set(key, true)
    })
    loadingStatesRef.current.clear()
    console.log('📋 Data Coordinator: Cancelled all loading operations')
  }, [])
  
  const isCancelled = useCallback((eventId: string): boolean => {
    const loadingKey = `work-areas-${eventId}`
    return cancelTokensRef.current.get(loadingKey) === true
  }, [])
  
  return {
    loadWorkAreasForEvent,
    isLoadingForEvent,
    cancelLoadingForEvent,
    cancelAllLoading,
    isCancelled
  }
}