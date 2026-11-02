import { expect, test } from 'claude-code/testing'

test('/handoff local writes a summary without the model', async ($, on) => {
  const written: Record<string, string> = {}
  on('session.messages', () => ({ value: [
    { role: 'user', text: 'ضيف صفحة login', toolUses: [] },
    { role: 'assistant', text: 'تمام', toolUses: [{ tool: 'Edit', input: { file_path: '/p/app/login.tsx' } }, { tool: 'Bash', input: { command: 'npm test', description: 'Run tests' } }] },
  ] }) as never)
  on('session.root', () => ({ value: '/p' }) as never)
  on('fs.write', ($, e) => { written[(e as never as { path: string }).path] = (e as never as { text: string }).text; return { value: undefined } as never })
  on('model.complete', () => { throw new Error('model must not be called') })

  const r = (await $.command.run({ command: 'handoff', args: 'local' } as never)) as { text: string }
  expect(r.text).toContain('ضيف صفحة login')
  expect(r.text).toContain('/p/app/login.tsx')
  expect(r.text).toContain('Run tests')
  expect(Object.keys(written)).toContain('/p/.claude/handoffs/latest.md')
})
