import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { Avatar, LastRun, Mood, Step, Summary, Tally, View } from '../types'
import { AVATARS, celebrateSvg, coderSvg, headerSvg, petName, progressSvg } from './coder'
import { HANDOFF_SYSTEM, digest, localHandoff } from './handoff'

const steps = atom({ plugin: 'null', key: 'steps' } as const, [] as Step[])
const last = atom({ plugin: 'null', key: 'last' } as const, null as LastRun | null)
const tally = atom({ plugin: 'null', key: 'tally' } as const, { ok: 0, failed: 0 } as Tally)
const isHidden = atom({ plugin: 'null', key: 'isHidden' } as const, false)
const mood = atom({ plugin: 'null', key: 'mood' } as const, 'idle' as Mood)
const view = atom({ plugin: 'null', key: 'view' } as const, 'steps' as View)
const avatar = atom({ plugin: 'null', key: 'avatar' } as const, 'null' as Avatar)
const activity = atom({ plugin: 'null', key: 'activity' } as const, 'Ready')
const celebrate = atom({ plugin: 'null', key: 'celebrate' } as const, false)
const partyAt = atom({ plugin: 'null', key: 'partyAt' } as const, 0)
const summary = atom(
  { plugin: 'null', key: 'summary' } as const,
  { startedAt: 0, turns: 0, tools: 0, files: [], workMs: 0 } as Summary,
)

const BORDER = '#6366F1'
const ACCENT = '#818CF8'
const SOFT = '#A5B4FC'

const MOOD_LINE: Record<Mood, string> = {
  idle: 'Ready for the next mission 💙',
  thinking: 'Thinking it through… 🤔',
  reading: 'Reading the code… 📖',
  typing: 'Writing code… ⌨️',
  running: 'Running a command… ⚙️',
  success: 'All good, keep going! ✅',
  fail: "Something broke — we'll fix it 🔧",
}

const ON_FAIL = ["Don't worry, we'll fix it 🔧", 'A failure is just data 💡', 'Read the error calmly 🌊']

const COACH_PROMPT = `# Blue Coach
- إيجاز شديد: لا مقدمات ولا تلخيص في الآخر ولا شرح غير مطلوب. أقل tool calls وأقل قراءة ملفات.
- نتيجة أي أمر/اختبار: "✅ نجح" أو "❌ فشل: <السبب في سطر>" + الإصلاح.`

const pick = (list: readonly string[], seed: number) => list[Math.abs(seed) % list.length] ?? ''

const short = (text: string, max = 60) => {
  const line = (text.split('\n')[0] ?? '').trim()

  return line.length > max ? `${line.slice(0, max - 1)}…` : line
}

const clean = (text: string) => text.replace(/\*\*|__|`/g, '').trim()

const fileName = (path: string) => path.split('/').pop() ?? path

const minutes = (ms: number) => {
  const m = Math.round(ms / 60000)

  return m < 1 ? '<1m' : `${m}m`
}

type PlanArgs = { items?: Step[]; advance?: boolean; done?: number[]; start?: number }

const applyPlan = (current: Step[], args: PlanArgs): Step[] => {
  if (Array.isArray(args.items)) {
    return args.items.map(s => ({ content: String(s.content), status: s.status }))
  }

  let next = current.map(s => ({ ...s }))
  const set = (i: number, status: Step['status']) => {
    next = next.map((s, j) => (j === i ? { ...s, status } : s))
  }

  if (args.advance) {
    set(next.findIndex(s => s.status === 'in_progress'), 'completed')
    set(next.findIndex(s => s.status === 'pending'), 'in_progress')
  }

  for (const n of args.done ?? []) set(n - 1, 'completed')

  if (typeof args.start === 'number') {
    next = next.map(s => (s.status === 'in_progress' ? { ...s, status: 'pending' } : s))
    set(args.start - 1, 'in_progress')
  }

  return next
}

const TOOL_MOOD: Record<string, Mood> = {
  Edit: 'typing',
  Write: 'typing',
  MultiEdit: 'typing',
  NotebookEdit: 'typing',
  Read: 'reading',
  Grep: 'reading',
  Glob: 'reading',
  WebFetch: 'reading',
  WebSearch: 'reading',
  Bash: 'running',
}

const BASH_ACTIVITY: [RegExp, string][] = [
  [/\b(test|tests|jest|vitest|pytest|phpunit|mocha|playwright|cypress)\b/i, 'Testing...'],
  [/\b(lint|eslint|prettier|phpstan|pint)\b/i, 'Linting...'],
  [/\b(build|tsc|webpack|compile)\b/i, 'Building...'],
  [/\b(npm|pnpm|yarn|bun|pip|composer)\s+(i|install|add|require)\b/i, 'Installing...'],
  [/\bgit\b/, 'Git magic'],
  [/\b(curl|wget|httpie)\b/i, 'Calling API'],
  [/\bdocker\b/i, 'Docker stuff'],
  [/\b(mysql|psql|sqlite3|migrate|tinker)\b/i, 'DB work'],
  [/\b(serve|dev|start)\b/i, 'Starting app'],
  [/\b(kill|pkill)\b/, 'Stopping stuff'],
  [/^\s*(ls|find|cat|head|tail|wc|grep|tree)\b/, 'Looking around'],
]

const TOOL_ACTIVITY: Record<string, string> = {
  Read: 'Reading file',
  Grep: 'Searching code',
  Glob: 'Finding files',
  Edit: 'Editing code',
  MultiEdit: 'Editing code',
  Write: 'Writing file',
  NotebookEdit: 'Editing notebook',
  WebSearch: 'Googling...',
  WebFetch: 'Reading the web',
  Agent: 'Delegating...',
  Task: 'Delegating...',
  TodoWrite: 'Planning...',
  Skill: 'Using a skill',
  AskUserQuestion: 'Asking you',
  ToolSearch: 'Grabbing tools',
}

const activityFor = (tool: string, input: Record<string, unknown>) => {
  if (tool === 'Bash') {
    const cmd = String(input.command ?? '')

    return BASH_ACTIVITY.find(([re]) => re.test(cmd))?.[1] ?? 'Running cmd'
  }
  if (TOOL_ACTIVITY[tool]) return TOOL_ACTIVITY[tool]
  if (tool.endsWith('update_plan')) return 'Planning...'
  if (tool.endsWith('wrap_up')) return 'Wrapping up'
  if (/Browser|chrome/i.test(tool)) return 'Clicking UI'
  if (/supabase|sql/i.test(tool)) return 'DB work'
  if (tool.startsWith('mcp__')) return 'Using tools'

  return 'Working...'
}

const showStatus = async ($: EngineInterface) => {
  $.ui.status(undefined)
}

const passThrough = ($: EngineInterface, e: any, next: any) => next(e)

export const register: Register = on => {
  let seed = 0
  let turnFailed = false
  let turnTools = 0
  let partyTimer: { cancel: () => void } | null = null

  on('session.start', async ($, e, next) => {
    await $.command.register({ name: 'null', description: 'إظهار/إخفاء Null' })
    await $.command.register({
      name: 'handoff',
      description: 'ملخص كامل للسيشن لفتح سيشن جديدة (/handoff local = بدون توكنز)',
    })
    const now = await $.clock.now()
    await update($, summary, s => (s.startedAt ? s : { ...s, startedAt: now }))
    await update($, celebrate, () => false)

    return next(e)
  })

  on('command.run', { command: 'null' }, async $ => {
    await update($, isHidden, v => !v)
    const hidden = await read($, isHidden)

    return { text: hidden ? 'Null اتخفى (/null يرجّعه)' : 'Null رجع 👾' }
  })

  on('command.run', { command: 'handoff' }, async ($, e) => {
    const messages = await $.session.messages()
    const root = await $.session.root()
    const isLocal = e.args.trim() === 'local'
    let body = ''
    let how = 'local'

    if (!isLocal) {
      $.ui.toast('⏳ بجهّز ملخص السيشن…')
      const r = await $.model.complete({
        model: 'haiku',
        system: HANDOFF_SYSTEM,
        prompt: digest(messages),
        maxTokens: 1500,
      })
      if (r.isAnswered) {
        body = r.text.trim()
        how = 'haiku'
      }
    }

    if (!body) body = localHandoff(messages)

    const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-')
    const doc = `# Handoff — ${stamp}\n\n> Project: \`${root}\` · ${messages.length} messages · ${how}\n\n${body}\n`
    await $.fs.write(`${root}/.claude/handoffs/${stamp}.md`, doc)
    await $.fs.write(`${root}/.claude/handoffs/latest.md`, doc)

    return {
      text: `${body}\n\n📁 اتحفظ في .claude/handoffs/latest.md\n➜ في السيشن الجديدة اكتب: اقرأ .claude/handoffs/latest.md وكمّل`,
    }
  })

  on('prompt.compose', async ($, e, next) => {
    const out = await next(e)

    return { sections: [...out.sections, { id: 'null:coach', text: COACH_PROMPT, scope: 'session' as const }] }
  })

  on('prompt.submit', async ($, e, next) => {
    seed += 1
    turnFailed = false
    turnTools = 0
    await update($, mood, () => 'thinking')
    await update($, activity, () => 'Thinking...')
    await update($, celebrate, () => false)

    return next(e)
  })

  on('tool.call', async ($, e, next) => {
    turnTools += 1
    const pre = TOOL_MOOD[e.tool]
    await update($, mood, () => pre ?? 'thinking')
    await update($, activity, () => activityFor(e.tool, e as unknown as Record<string, unknown>))

    const ran = await next(e)

    if (ran.deny === undefined && !ran.isError && pre === 'typing' && 'file_path' in e && typeof e.file_path === 'string') {
      const name = fileName(e.file_path)
      await update($, summary, s => (s.files.includes(name) ? s : { ...s, files: [...s.files, name] }))
    }

    return ran
  }).catch(passThrough)

  on('tool.call', { tool: 'TodoWrite' }, async ($, e, next) => {
    const ran = await next(e)
    if (ran.deny === undefined && !ran.isError) {
      await update($, steps, () => e.todos.map(t => ({ content: t.content, status: t.status })))
    }

    return ran
  }).catch(passThrough)

  on('tool.call', { tool: 'mcp__ccd_turn__update_plan' }, async ($, e, next) => {
    const ran = await next(e)
    if (ran.deny === undefined && !ran.isError) {
      await update($, steps, current => applyPlan(current, e as unknown as PlanArgs))
    }

    return ran
  }).catch(passThrough)

  on('tool.call', { tool: 'mcp__ccd_turn__wrap_up' }, async ($, e, next) => {
    const ran = await next(e)
    if (ran.deny === undefined && !ran.isError) {
      await update($, steps, current => current.map(s => ({ ...s, status: 'completed' as const })))
    }

    return ran
  }).catch(passThrough)

  on('tool.call', { tool: 'Bash' }, async ($, e, next) => {
    const ran = await next(e)
    if (ran.deny !== undefined) return ran

    const ok = ran.isError !== true
    const command = short(e.description || e.command)
    if (!ok) turnFailed = true
    await update($, mood, () => (ok ? 'thinking' : 'fail'))
    await update($, activity, () => (ok ? 'Cmd OK · working' : 'Cmd failed'))
    await update($, last, () => ({ command, ok, at: Date.now() }))
    await update($, tally, t => (ok ? { ...t, ok: t.ok + 1 } : { ...t, failed: t.failed + 1 }))

    if (!ok) $.ui.toast(`❌ Failed: ${short(command, 40)} — ${pick(ON_FAIL, seed)}`)
    await showStatus($)

    return ran
  }).catch(passThrough)

  on('turn.complete', async ($, e, next) => {
    const list = await read($, steps)
    const allDone = list.length > 0 && list.every(x => x.status === 'completed')

    await update($, summary, s => ({
      ...s,
      turns: s.turns + 1,
      tools: s.tools + turnTools,
      workMs: s.workMs + (e.durationMs ?? 0),
    }))
    const party = !turnFailed && turnTools > 0 && !e.isAborted && (list.length === 0 || allDone)
    await update($, mood, () => (turnFailed ? 'fail' : turnTools > 0 ? 'success' : 'idle'))
    await update($, celebrate, () => party)
    const at = await $.clock.now()
    await update($, partyAt, () => at)
    partyTimer?.cancel()
    partyTimer = party
      ? $.clock.after(5000, () => {
          void update($, celebrate, () => false)
          void update($, mood, m => (m === 'success' ? 'idle' : m))
          void update($, activity, a => (a === 'All done!' ? 'Ready' : a))
        })
      : null
    await update($, activity, () => (party ? 'All done!' : turnFailed ? 'Needs a fix' : 'Ready'))

    if (allDone && turnTools > 0) $.ui.toast('🎉 All steps done! Great work 💙')

    return next(e)
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.props.hasSurvey || (await read($, isHidden))) return next(e)

    const list = await read($, steps)
    const t = await read($, tally)
    const rawMood = await read($, mood)
    const tab = await read($, view)
    const sum = await read($, summary)
    const now = await $.clock.now()
    const who = await read($, avatar)
    const doing = await read($, activity)
    const party = (await read($, celebrate)) && (await $.clock.now()) - (await read($, partyAt)) < 5500

    const ui = $.ui.resolve(e)
    const { Box, Button, Text } = ui
    const Svg = 'Svg' in ui ? ui.Svg : null

    const busy = rawMood === 'thinking' || rawMood === 'reading' || rawMood === 'typing' || rawMood === 'running'
    const shown: Mood = !e.props.isWorking && busy ? 'idle' : rawMood
    const label = !e.props.isWorking && busy ? 'Ready' : doing
    const done = list.filter(s => s.status === 'completed').length
    const upcoming = list.filter(s => s.status !== 'completed').slice(0, 3)

    const current = list.find(x => x.status === 'in_progress') ?? list.find(x => x.status === 'pending')
    const sep = <Text color={SOFT} dimColor>{' · '}</Text>

    const header = (
      <Box flexDirection="row" alignItems="center" gap={1}>
        <Box flexShrink={1} overflow="hidden">
          {Svg ? (
            <Svg key="title" source={headerSvg()} alt="Null" width={60} height={16} />
          ) : (
            <Text color={ACCENT} bold wrap="truncate">
              👾 NULL
            </Text>
          )}
        </Box>
      </Box>
    )

    const chip = (key: string, icon: string, text: string, tone: string, onPress: () => unknown, isClose = false) => (
      <Box
        key={`chip-${key}`}
        borderStyle="round"
        borderColor={tone}
        backgroundColor="#1E1B4B"
        paddingX={1}
        hover={{ borderColor: '#E0E7FF', backgroundColor: tone }}
      >
        <Button key={key} plain role={isClose ? 'dismiss' : undefined} label={text} onPress={onPress}>
          <Text color="#E0E7FF" bold hover={{ color: '#FFFFFF' }}>
            {icon} {text}
          </Text>
        </Button>
      </Box>
    )

    const controls = (
      <Box flexDirection="row" alignItems="center" gap={1} flexShrink={0}>
        {chip('tab', tab === 'summary' ? '🧭' : '📊', tab === 'summary' ? 'Steps' : 'Summary', BORDER, () =>
          update($, view, v => (v === 'summary' ? 'steps' : 'summary')),
        )}
        {chip('avatar', '🎨', 'Skin', '#8B5CF6', () =>
          update($, avatar, a => AVATARS[(AVATARS.indexOf(a) + 1) % AVATARS.length] ?? 'null'),
        )}
        {chip('hide', '✕', 'Hide', '#E11D48', () => update($, isHidden, () => true), true)}
      </Box>
    )

    const stepsView = (
      <Box flexDirection="column">
        <Text color={ACCENT} wrap="truncate">
          ⚡ {label}
          {current && e.props.isWorking ? ` · ${current.content}` : ''}
        </Text>
        <Box flexDirection="row" alignItems="center" gap={1}>
          <Text color={SOFT} wrap="truncate">
            {list.length > 0 ? `✔ ${done}/${list.length} tasks done` : 'No tasks yet'}
          </Text>
          {list.length > 0 && Svg ? (
            <Svg key="progress" source={progressSvg(done, list.length)} alt={`${done} of ${list.length}`} width={90} height={5} isInteractive />
          ) : null}
        </Box>
      </Box>
    )

    const summaryView = (
      <Box flexDirection="column">
        <Box flexDirection="row" flexWrap="wrap">
          <Text color={SOFT}>⏱️ {sum.startedAt ? minutes(now - sum.startedAt) : '—'} session</Text>
          {sep}
          <Text color={SOFT}>{minutes(sum.workMs)} working</Text>
          {sep}
          <Text color={SOFT}>💬 {sum.turns} turns</Text>
          {sep}
          <Text color={SOFT}>🛠️ {sum.tools} tools</Text>
          {sep}
          <Text color={SOFT}>⚙️ {t.ok + t.failed} cmds</Text>
          {list.length > 0 ? sep : null}
          {list.length > 0 ? (
            <Text color={SOFT}>
              ✔️ {done}/{list.length} steps
            </Text>
          ) : null}
        </Box>
        <Text color={SOFT} wrap="truncate">
          📝 {sum.files.length} files: {sum.files.length ? sum.files.slice(-6).join(', ') : 'none yet'}
        </Text>
      </Box>
    )

    if (party && !e.props.isWorking) {
      return (
        <Box flexDirection="row" alignItems="center" justifyContent="center" gap={2} borderStyle="round" borderColor="#22C55E" paddingX={1} overflow="hidden">
          {Svg ? <Svg key="party" source={celebrateSvg(who)} alt="All done" width={150} height={60} isInteractive /> : null}
          <Box flexDirection="column" flexShrink={1}>
            <Text color="green" bold wrap="truncate">
              🎉 All done — everything passed!
            </Text>
            <Text color={SOFT} wrap="truncate">
              {list.length > 0 ? `✅ ${done}/${list.length} steps · ` : ''}✅{t.ok} cmds · {petName(who)} is celebrating
            </Text>
          </Box>
          <Box flexDirection="column" gap={1} flexShrink={0}>
            {chip('unparty', '↩', 'Back', '#22C55E', () => update($, celebrate, () => false))}
            {chip('hide', '✕', 'Hide', '#E11D48', () => update($, isHidden, () => true), true)}
          </Box>
        </Box>
      )
    }

    return (
      <Box flexDirection="row" alignItems="center" gap={1} borderStyle="round" borderColor={BORDER} paddingX={1} overflow="hidden">
        {Svg ? <Svg key="coder" source={coderSvg(shown, who, label)} alt={label} width={120} height={72} isInteractive /> : null}
        <Box flexDirection="column" flexGrow={1} flexShrink={1}>
          {header}
          {tab === 'summary' ? summaryView : stepsView}
        </Box>
        {controls}
      </Box>
    )
  })
}
