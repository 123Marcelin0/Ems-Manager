// Client-side lifecycle service that uses browser APIs only
export class ClientLifecycleService {
  private checkInterval: number | null = null
  private isRunning = false

  start() {
    if (this.isRunning) return

    this.isRunning = true
    
    // Use browser's setInterval instead of Node.js
    this.checkInterval = window.setInterval(() => {
      this.performLifecycleCheck()
    }, 60000) // Check every minute

    console.log('🔄 Client lifecycle service started')
  }

  stop() {
    if (this.checkInterval) {
      window.clearInterval(this.checkInterval)
      this.checkInterval = null
    }
    this.isRunning = false
    console.log('⏹️ Client lifecycle service stopped')
  }

  private async performLifecycleCheck() {
    try {
      // Make API call to trigger server-side lifecycle checks
      await fetch('/api/lifecycle/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })
    } catch (error) {
      console.error('❌ Error in lifecycle check:', error)
    }
  }

  async triggerAdditionalRecruitment(eventId: string) {
    try {
      const response = await fetch('/api/lifecycle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          action: 'triggerAdditionalRecruitment',
          eventId 
        })
      })

      if (!response.ok) {
        throw new Error('Failed to trigger additional recruitment')
      }

      return await response.json()
    } catch (error) {
      console.error('❌ Error triggering additional recruitment:', error)
      throw error
    }
  }
}

export const clientLifecycleService = new ClientLifecycleService()