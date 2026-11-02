import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { SessionRow } from '../types'

const PANE = 'session-search'
const sessions = atom({ plugin: 'session-search', key: 'sessions' } as const, [], {
  shape: 'sessions-1',
})
const query = atom({ plugin: 'session-search', key: 'query' } as const, '')

// Worktree sessions live under <project>/.claude/worktrees/<name>; show the project.
function projectOf(cwd: string): string {
  const root = cwd.split('/.claude/worktrees/')[0] ?? cwd
  return root.split('/').filter(Boolean).pop() ?? cwd
}

function ago(iso: string): string {
  const min = Math.round((Date.now() - Date.parse(iso)) / 60000)
  if (min < 60) return `${min}د`
  if (min < 1440) return `${Math.round(min / 60)}س`
  return `${Math.round(min / 1440)}ي`
}

async function refresh($: EngineInterface) {
  const { text } = (await $.tool.call({
    tool: 'mcp__ccd_session_mgmt__list_sessions',
    limit: 200,
  })) as { text?: string }
  let raw: any[] = []
  try {
    raw = JSON.parse(text ?? '[]')
  } catch {
    return
  }
  const rows: SessionRow[] = raw.map(s => ({
    id: s.sessionId,
    title: s.title ?? '',
    project: projectOf(s.cwd ?? ''),
    cwd: s.cwd ?? '',
    link: s.link ?? '',
    isRunning: !!s.isRunning,
    lastActivityAt: s.lastActivityAt ?? '',
  }))
  await update($, sessions, () => rows)
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'sessions',
      description: 'Search sessions by project or folder name',
    })
    void $.ui.open({ id: PANE, title: 'بحث السيشنز' })
    void refresh($)
    $.clock.every(30000, () => void refresh($))

    return next(e)
  })

  on('command.run', { command: 'sessions' }, async $ => {
    await $.ui.open({ id: PANE, title: 'بحث السيشنز' })
    void refresh($)

    return { text: 'اتفتحت لوحة البحث.' }
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const el = $.ui.resolve(e)
    const { Box, Text, Link } = el
    const Input = 'Input' in el ? el.Input : undefined
    const q = (await read($, query)).trim().toLowerCase()
    const all = await read($, sessions)
    const hits = all
      .filter(
        s =>
          !q ||
          s.project.toLowerCase().includes(q) ||
          s.cwd.toLowerCase().includes(q) ||
          s.title.toLowerCase().includes(q),
      )
      .sort((a, b) => b.lastActivityAt.localeCompare(a.lastActivityAt))
    const room = Math.max(1, Math.floor(((e.viewport?.rows ?? 30) - 6) / 2))
    const working = hits.filter(s => s.isRunning).slice(0, room)
    const idle = hits.filter(s => !s.isRunning).slice(0, Math.max(0, room - working.length))

    return (
      <Box flexDirection="column">
        {Input && (
        <Input
          key="q"
          placeholder="اسم المشروع أو الفولدر..."
          autoFocus
          submitLabel="تحديث"
          onInput={(value: string) => void update($, query, () => value)}
          onSubmit={() => void refresh($)}
        />
        )}
        {hits.length === 0 && <Text dimColor>مفيش نتايج.</Text>}
        {[
          { key: 'working', title: '⚡ Working', color: '#22C55E', rows: working },
          { key: 'idle', title: '💤 Idle', color: '#A5B4FC', rows: idle },
        ].map(group =>
          group.rows.length === 0 ? null : (
            <Box key={group.key} flexDirection="column" marginTop={1}>
              <Text color={group.color} bold>
                {group.title} ({group.rows.length})
              </Text>
              {group.rows.map(s => (
                <Box key={s.id} flexDirection="column">
                  <Text>
                    {'  '}
                    <Link href={s.link}>{s.title || s.id}</Link>
                  </Text>
                  <Text dimColor>
                    {'    '}
                    {s.project} · {ago(s.lastActivityAt)}
                  </Text>
                </Box>
              ))}
            </Box>
          ),
        )}
      </Box>
    )
  })
}
