import { expect, mock, test } from 'claude-code/testing'

test('celebration ends after 5 seconds', async ($, on) => {
  const clock = mock.clock(on, { now: 0 })
  on('ui.render', ($, e) => h($.ui.resolve(e).Box, { key: 'engine' }) as never)
  on('ui.toast', () => ({ value: undefined }) as never)
  on('ui.status', () => ({ value: undefined }) as never)
  on('prompt.suggest', () => ({ isShown: false }) as never)
  on('tool.call', () => ({ result: {} as never, isError: false }) as never)
  on('turn.complete', () => ({ text: '' }) as never)

  await $.tool.call({ tool: 'Bash', command: 'npm test', description: 'Run tests' } as never)
  await $.turn.complete({ answer: 'done', durationMs: 1000, isAborted: false, turnId: 't1', reason: 'end_turn', text: 'done' } as never)

  const ui = await $.ui.mount({ plugin: 'null', surface: 'desktop', component: 'AbovePrompt', props: { hasSurvey: false, isWorking: false } as never })
  expect(await ui.find({ text: 'All done' })).toBeDefined()

  await clock.advance(5100)
  expect(await ui.find({ text: 'All done' })).toBeUndefined()
  expect(await ui.find({ text: 'Ready' })).toBeDefined()
})
