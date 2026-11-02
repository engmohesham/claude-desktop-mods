type Message = {
  role: 'user' | 'assistant'
  text: string
  toolUses: { tool: string; input: Record<string, unknown> }[]
}

const cut = (text: string, max: number) => {
  const t = text.trim()

  return t.length > max ? `${t.slice(0, max)}…` : t
}

const isNoise = (text: string) => /^<(system-reminder|local-command|command-name|task-notification)/.test(text.trim())

const filesOf = (messages: Message[]) => {
  const files = new Set<string>()
  for (const m of messages) {
    for (const u of m.toolUses) {
      const path = u.input.file_path
      if (/^(Edit|Write|MultiEdit|NotebookEdit)$/.test(u.tool) && typeof path === 'string') files.add(path)
    }
  }

  return [...files]
}

const commandsOf = (messages: Message[]) =>
  messages.flatMap(m =>
    m.toolUses
      .filter(u => u.tool === 'Bash')
      .map(u => cut(String(u.input.description || u.input.command || ''), 100)),
  )

export const digest = (messages: Message[], budget = 60000) => {
  const lines = messages
    .filter(m => m.text.trim() && !isNoise(m.text))
    .map(m => {
      if (m.role === 'user') return `USER: ${cut(m.text, 1500)}`
      const tools = m.toolUses.map(u => u.tool).join(', ')

      return `CLAUDE: ${cut(m.text, 700)}${tools ? `\n  [tools: ${tools}]` : ''}`
    })

  const [first = '', ...rest] = lines
  let out = rest.join('\n')
  if (out.length > budget) out = `…\n${out.slice(out.length - budget)}`

  return `${first}\n${out}\n\nFILES TOUCHED: ${filesOf(messages).join(', ') || 'none'}`
}

export const HANDOFF_SYSTEM = `You write handoff notes so a NEW Claude Code session can continue work without the old chat.
Write in Egyptian Arabic; keep code, file paths, commands and technical terms in English.
Be dense and factual. No intro, no outro. Use exactly these markdown sections:
## الهدف
## اللي اتعمل
## قرارات مهمة
## الملفات المهمة
## الحالة الحالية
## الخطوات الجاية
## أوامر مفيدة
Omit a section only if it is truly empty. Max ~400 words.`

export const localHandoff = (messages: Message[]) => {
  const asks = messages
    .filter(m => m.role === 'user' && m.text.trim() && !isNoise(m.text))
    .map(m => `- ${cut(m.text.replace(/\s+/g, ' '), 200)}`)
  const files = filesOf(messages).map(f => `- \`${f}\``)
  const cmds = commandsOf(messages).slice(-15).map(c => `- ${c}`)
  const lastAnswer = [...messages].reverse().find(m => m.role === 'assistant' && m.text.trim())

  return [
    '## طلبات المستخدم',
    asks.join('\n') || '- —',
    '## الملفات اللي اتعدّلت',
    files.join('\n') || '- —',
    '## آخر الأوامر',
    cmds.join('\n') || '- —',
    '## آخر رد',
    cut(lastAnswer?.text ?? '—', 1500),
  ].join('\n\n')
}
