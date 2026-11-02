export type Step = { content: string; status: 'pending' | 'in_progress' | 'completed' }
export type LastRun = { command: string; ok: boolean; at: number }
export type Tally = { ok: number; failed: number }
export type Mood = 'idle' | 'thinking' | 'reading' | 'typing' | 'running' | 'success' | 'fail'
export type View = 'steps' | 'summary'
export type Avatar = 'null' | 'blaze' | 'drip' | 'hoot' | 'byte' | 'nimbus'
export type Summary = {
  startedAt: number
  turns: number
  tools: number
  files: string[]
  workMs: number
}

declare module 'claude-code' {
  interface PluginState {
    'null': {
      steps: Step[]
      last: LastRun | null
      tally: Tally
      isHidden: boolean
      mood: Mood
      view: View
      summary: Summary
      avatar: Avatar
      activity: string
      celebrate: boolean
      partyAt: number
    }
  }
}
