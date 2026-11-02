export type SessionRow = {
  id: string
  title: string
  project: string
  cwd: string
  link: string
  isRunning: boolean
  lastActivityAt: string
}

declare module 'claude-code' {
  interface PluginState {
    'session-search': { sessions: Shaped<SessionRow[]>; query: string }
  }
}
