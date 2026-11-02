import { expect, mock, test } from 'claude-code/testing'

const PROPS = { hasSurvey: false, isWorking: false } as never

for (const surface of ['terminal', 'desktop'] as const) {
  test(`shows failed command and next steps on ${surface}`, async ($, on) => {
    mock.clock(on, { now: 1000 })
    on('ui.render', ($, e) => h($.ui.resolve(e).Box, { key: 'engine' }) as never)
    on('ui.toast', () => ({ value: undefined }) as never)
    on('ui.status', () => ({ value: undefined }) as never)
    on('tool.call', ($, e) => ({ result: {} as never, isError: e.tool === 'Bash' }) as never)

    await $.tool.call({ tool: 'TodoWrite', todos: [
      { content: 'كتابة الـ API', status: 'completed', activeForm: 'x' },
      { content: 'تشغيل الاختبارات', status: 'in_progress', activeForm: 'x' },
    ] } as never)
    await $.tool.call({ tool: 'Bash', command: 'npm test', description: 'Run tests' } as never)

    const ui = await $.ui.mount({ plugin: 'null', surface, component: 'AbovePrompt', props: PROPS })
    expect(await ui.find({ text: '1/2 tasks done' })).toBeDefined()
    if (surface === 'desktop') expect(await ui.findAll({ type: 'Svg' })).toHaveLength(3)
    await ui.press({ key: 'tab' })
    expect(await ui.find({ text: 'turns' })).toBeDefined()

    await ui.press({ key: 'hide' })
    expect(await ui.find({ text: 'turns' })).toBeUndefined()
    expect(await ui.find({ key: 'engine' })).toBeDefined()
  })
}
