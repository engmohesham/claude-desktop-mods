import type { Avatar, Mood } from '../types'

type Pt = readonly [number, number]
type EyeStyle = 'small' | 'wide'
type Pet = {
  name: string
  body: () => string
  eyes: { l: Pt; r: Pt; color: string; style: EyeStyle; rest?: 'happy' }
}

const R = (x: number, y: number, w: number, h: number, c: string, cls = '') =>
  `<rect${cls ? ` class="${cls}"` : ''} x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}"/>`

const CSS = `
.hop{animation:hop 1s steps(1) infinite}
.fast{animation:hop .28s steps(1) infinite}
@keyframes hop{0%{transform:translateY(0)}50%{transform:translateY(-1px)}}
.sway{animation:sway 1.6s steps(1) infinite}
@keyframes sway{0%{transform:translateX(0)}25%{transform:translateX(-1px)}50%{transform:translateX(0)}75%{transform:translateX(1px)}}
.jump{animation:jump .8s steps(1) infinite}
@keyframes jump{0%{transform:translateY(0)}25%{transform:translateY(-3px)}50%{transform:translateY(-4px)}75%{transform:translateY(-1px)}}
.shake{animation:shake .3s steps(1) 8}
@keyframes shake{0%{transform:translateX(0)}33%{transform:translateX(-1px)}66%{transform:translateX(1px)}}
.eo{animation:eo 3.6s steps(1) infinite}
@keyframes eo{0%{opacity:1}93%{opacity:0}97%{opacity:1}}
.ec{opacity:0;animation:ec 3.6s steps(1) infinite}
@keyframes ec{0%{opacity:0}93%{opacity:1}97%{opacity:0}}
.fa{animation:fa .5s steps(1) infinite}
.fb{animation:fa .5s steps(1) infinite;animation-delay:-.25s}
@keyframes fa{0%{opacity:1}50%{opacity:0}}
.look{animation:look 1.6s steps(1) infinite}
@keyframes look{0%{transform:translateX(-1px)}50%{transform:translateX(1px)}}
.tw{animation:tw 1s steps(1) infinite}
@keyframes tw{0%{opacity:1}50%{opacity:.15}}
.rise{opacity:0;animation:rise 1.8s steps(6) infinite}
@keyframes rise{0%{opacity:0;transform:translateY(0)}15%{opacity:1}100%{opacity:0;transform:translateY(-8px)}}
.dot{opacity:.25;animation:dot 1.2s steps(1) infinite}
@keyframes dot{0%{opacity:.25}33%{opacity:1}66%{opacity:.25}}
.spin{transform-box:fill-box;transform-origin:center;animation:spin .8s steps(2) infinite}
@keyframes spin{to{transform:rotate(90deg)}}
.scan{animation:scan 1.6s steps(8) infinite}
@keyframes scan{from{transform:translateY(0)}to{transform:translateY(8px)}}
.drop{animation:drop 1.2s steps(4) infinite}
@keyframes drop{from{transform:translateY(0);opacity:1}to{transform:translateY(4px);opacity:0}}
.tapa{animation:tap1 .3s steps(1) infinite}
.tapb{animation:tap1 .3s steps(1) infinite;animation-delay:-.15s}
@keyframes tap1{0%{transform:translateY(0)}50%{transform:translateY(-1px)}}
.slowtap .tapa,.slowtap .tapb{animation-duration:.7s}
.glow{animation:glw 1.4s ease-in-out infinite}
@keyframes glw{0%,100%{opacity:.6}50%{opacity:1}}
.turn{transform-box:fill-box;transform-origin:0 50%;animation:turn .7s steps(5) both}
@keyframes turn{0%{transform:scaleX(.1)}60%{transform:scaleX(1.1)}100%{transform:scaleX(1)}}
.push{animation:push .9s steps(1) both}
@keyframes push{0%{opacity:1}99%{opacity:1}100%{opacity:0}}
.steam{opacity:0;animation:steam 1s steps(4) infinite}
@keyframes steam{0%{opacity:0;transform:translateY(0)}25%{opacity:1}100%{opacity:0;transform:translateY(-4px)}}
.rage{animation:rage .16s steps(1) infinite}
@keyframes rage{0%{transform:translateX(0)}33%{transform:translateX(-1px)}66%{transform:translateX(1px)}}
.fall{animation:fall 2s linear infinite}
@keyframes fall{from{transform:translateY(-4px)}to{transform:translateY(38px)}}
@media (prefers-reduced-motion:reduce){*{animation:none!important}.rise,.dot{opacity:1}.ec{opacity:0}}
`

const PATTERNS: Record<string, Record<EyeStyle, Pt[]>> = {
  open: { small: [[1, 0], [1, 1]], wide: [[0, 1], [1, 1], [2, 1], [1, 0]] },
  down: { small: [[1, 1], [1, 2]], wide: [[0, 2], [1, 2], [2, 2], [1, 1]] },
  aside: { small: [[2, 0], [2, 1]], wide: [[1, 0], [2, 0], [2, 1]] },
  happy: { small: [[0, 1], [1, 0], [2, 1]], wide: [[0, 1], [1, 0], [2, 1]] },
  closed: { small: [[0, 1], [1, 1], [2, 1]], wide: [[0, 1], [1, 1], [2, 1]] },
  x: { small: [[0, 0], [2, 0], [1, 1], [0, 2], [2, 2]], wide: [[0, 0], [2, 0], [1, 1], [0, 2], [2, 2]] },
}

const eyePixels = (pet: Pet, kind: keyof typeof PATTERNS, color: string) => {
  const { l, r, style } = pet.eyes
  const pts = PATTERNS[kind]?.[style] ?? []

  return [l, r].map(([ax, ay]) => pts.map(([dx, dy]) => R(ax + dx, ay + dy, 1, 1, color)).join('')).join('')
}

const eyes = (pet: Pet, mood: Mood) => {
  const color = mood === 'fail' ? '#EF4444' : pet.eyes.color

  if (mood === 'success') return eyePixels(pet, 'happy', mood === 'success' && pet.eyes.rest ? '#22C55E' : color)
  if (mood === 'fail') return eyePixels(pet, 'x', color)
  if (mood === 'thinking') return eyePixels(pet, 'aside', color)

  const kind = mood === 'typing' || mood === 'reading' ? 'down' : pet.eyes.rest ?? 'open'
  const open = eyePixels(pet, kind, color)
  const wrap = mood === 'reading' ? 'look' : ''

  return `<g class="${wrap}"><g class="eo">${open}</g><g class="ec">${eyePixels(pet, 'closed', color)}</g></g>`
}

const PETS: Record<Exclude<Avatar, 'null'>, Pet> = {
  blaze: {
    name: 'Blaze',
    eyes: { l: [5, 8], r: [9, 8], color: '#1E1B4B', style: 'small' },
    body: () => {
      const F1 = '#A855F7'
      const F2 = '#D946EF'
      const F3 = '#F5D0FE'
      const O = '#3B0764'
      const skin = '#FCD9BD'
      const a =
        R(7, 0, 1, 1, F3) + R(3, 2, 1, 1, F2) + R(11, 1, 1, 1, F2) + R(6, 1, 3, 1, F2) + R(4, 2, 8, 1, F2) +
        R(3, 3, 10, 3, F1) + R(6, 3, 2, 1, F3) + R(9, 4, 1, 1, F3)
      const b =
        R(8, 0, 1, 1, F3) + R(12, 2, 1, 1, F2) + R(4, 1, 1, 1, F2) + R(7, 1, 3, 1, F2) + R(4, 2, 8, 1, F2) +
        R(3, 3, 10, 3, F1) + R(8, 3, 2, 1, F3) + R(6, 4, 1, 1, F3)

      return (
        `<g class="fa">${a}</g><g class="fb">${b}</g>` +
        R(3, 6, 1, 6, O) + R(12, 6, 1, 6, O) + R(4, 12, 8, 1, O) + R(4, 6, 8, 6, skin) +
        R(4, 10, 1, 1, '#F9A8D4') + R(11, 10, 1, 1, '#F9A8D4') + R(7, 11, 2, 1, '#9D174D') +
        R(5, 13, 6, 3, '#7C3AED') + R(7, 14, 2, 1, F3) + R(4, 13, 1, 2, skin) + R(11, 13, 1, 2, skin) +
        R(6, 16, 1, 2, O) + R(9, 16, 1, 2, O)
      )
    },
  },
  drip: {
    name: 'Drip',
    eyes: { l: [5, 8], r: [9, 8], color: '#0C4A6E', style: 'small' },
    body: () => {
      const B1 = '#38BDF8'
      const B2 = '#0EA5E9'

      return (
        R(7, 1, 2, 1, B1) + R(6, 2, 4, 1, B1) + R(5, 3, 6, 1, B1) + R(4, 4, 8, 1, B1) + R(3, 5, 10, 8, B1) +
        R(4, 13, 8, 1, B1) + R(5, 14, 6, 1, B2) + R(11, 7, 1, 6, B2) + R(10, 13, 1, 1, B2) +
        R(5, 5, 1, 2, '#F0F9FF') + R(6, 4, 1, 1, '#F0F9FF') +
        R(4, 11, 1, 1, '#F9A8D4') + R(11, 11, 1, 1, '#F9A8D4') + R(7, 12, 2, 1, '#0C4A6E') +
        R(2, 9, 1, 2, B2) + R(13, 9, 1, 2, B2) + R(5, 15, 2, 1, '#0369A1') + R(9, 15, 2, 1, '#0369A1')
      )
    },
  },
  hoot: {
    name: 'Hoot',
    eyes: { l: [5, 7], r: [9, 7], color: '#1C1917', style: 'small' },
    body: () => {
      const Or = '#F97316'
      const Or2 = '#EA580C'
      const G = '#292524'

      return (
        R(3, 2, 2, 1, Or2) + R(11, 2, 2, 1, Or2) + R(3, 3, 10, 12, Or) + R(2, 5, 1, 8, Or) + R(13, 5, 1, 8, Or) +
        R(2, 8, 1, 4, Or2) + R(13, 8, 1, 4, Or2) + R(4, 5, 8, 6, '#FED7AA') +
        R(4, 6, 4, 4, G) + R(8, 6, 4, 4, G) + R(5, 7, 2, 2, '#FFF7ED') + R(9, 7, 2, 2, '#FFF7ED') +
        R(7, 10, 2, 1, '#FACC15') + R(6, 12, 4, 2, '#FDBA74') + R(7, 12, 1, 1, Or2) + R(8, 13, 1, 1, Or2) +
        R(5, 15, 2, 1, '#FB923C') + R(9, 15, 2, 1, '#FB923C')
      )
    },
  },
  byte: {
    name: 'Byte',
    eyes: { l: [5, 7], r: [9, 7], color: '#F8FAFC', style: 'small' },
    body: () => {
      const Gr = '#94A3B8'
      const Wt = '#F1F5F9'

      return (
        R(10, 0, 2, 2, '#60A5FA', 'tw') + R(10, 2, 1, 2, Gr) +
        R(2, 4, 12, 9, Gr) + R(3, 5, 10, 7, Wt) + R(4, 6, 8, 5, '#2563EB') +
        R(7, 13, 2, 1, Gr) + R(4, 14, 8, 3, Wt) + R(4, 14, 8, 1, Gr) + R(7, 15, 2, 1, '#2563EB') +
        R(3, 14, 1, 2, Gr) + R(12, 14, 1, 2, Gr) + R(5, 17, 2, 1, Gr) + R(9, 17, 2, 1, Gr)
      )
    },
  },
  nimbus: {
    name: 'Nimbus',
    eyes: { l: [4, 5], r: [9, 5], color: '#BFDBFE', style: 'wide' },
    body: () => {
      const C = '#60A5FA'
      const C2 = '#3B82F6'

      return (
        R(4, 0, 3, 1, C) + R(9, 0, 3, 1, C) + R(3, 1, 10, 1, C) + R(2, 2, 12, 1, C) + R(1, 3, 14, 7, C) +
        R(2, 10, 12, 1, C) + R(3, 4, 10, 5, '#1E3A8A') + R(7, 8, 2, 1, '#93C5FD') +
        R(5, 11, 6, 4, C2) + R(7, 12, 2, 1, '#BFDBFE') + R(4, 11, 1, 2, C2) + R(11, 11, 1, 2, C2) +
        R(5, 15, 2, 1, C2) + R(9, 15, 2, 1, C2)
      )
    },
  },
}


const NULL_EYES: Record<string, Pt[]> = {
  happy: [[1, 0], [2, 0], [0, 1], [3, 1]],
  closed: [[0, 1], [1, 1], [2, 1], [3, 1]],
  focus: [[1, 1], [2, 1], [0, 2], [3, 2]],
  up: [[2, 0], [3, 0], [2, 1], [3, 1]],
  wide: [[1, 0], [2, 0], [0, 1], [3, 1], [0, 2], [3, 2], [1, 3], [2, 3]],
  x: [[0, 0], [3, 0], [1, 1], [2, 1], [1, 2], [2, 2], [0, 3], [3, 3]],
  angryL: [[0, 0], [1, 0], [2, 1], [3, 1], [1, 2], [2, 2]],
  angryR: [[2, 0], [3, 0], [0, 1], [1, 1], [1, 2], [2, 2]],
}

const nullEyes = (kind: keyof typeof NULL_EYES, color = '#EF4444') =>
  [[6, 11], [12, 11]]
    .map(([ax = 0, ay = 0]) => (NULL_EYES[kind] ?? []).map(([dx, dy]) => R(ax + dx, ay + dy, 1, 1, color)).join(''))
    .join('')

const SIDE_EYES: Record<string, Pt[]> = {
  happy: [[0, 1], [1, 0], [2, 1]],
  closed: [[0, 1], [1, 1], [2, 1]],
  focus: [[1, 1], [2, 1], [1, 2], [2, 2]],
  up: [[1, 0], [2, 0], [2, 1]],
  wide: [[0, 0], [1, 0], [2, 0], [0, 1], [2, 1], [0, 2], [1, 2], [2, 2]],
  x: [[0, 0], [2, 0], [1, 1], [0, 2], [2, 2]],
}

const sideEyes = (kind: keyof typeof SIDE_EYES, color = '#EF4444') =>
  [[11, 11], [14, 11]]
    .map(([ax = 0, ay = 0]) => (SIDE_EYES[kind] ?? []).map(([dx, dy]) => R(ax + dx, ay + dy, 1, 1, color)).join(''))
    .join('')

const NULL_K = '#5B5B66'
const NULL_H = '#71717A'
const NULL_G = '#8B8B96'

const nullAntenna = () =>
  R(11, 4, 1, 3, NULL_H) + R(10, 3, 1, 1, NULL_H) + R(9, 1, 1, 2, NULL_H) + R(10, 0, 3, 1, NULL_H) + R(13, 1, 1, 1, NULL_H) +
  R(14, 1, 2, 2, '#71717A') + R(14, 1, 1, 1, '#D4D4D8', 'tw')

const nullFront = (mood: Mood) => {
  const K = NULL_K
  const head =
    nullAntenna() +
    R(3, 7, 16, 1, K) + R(2, 8, 1, 10, K) + R(19, 8, 1, 10, K) + R(3, 18, 16, 1, K) +
    R(3, 8, 16, 10, '#2E2E35') + R(3, 8, 16, 1, NULL_H) + R(3, 8, 1, 10, NULL_H) + R(5, 10, 12, 7, '#050505')
  const ok = mood === 'success'
  const face = ok
    ? nullEyes('happy') + R(6, 15, 1, 1, '#F472B6') + R(15, 15, 1, 1, '#F472B6') + R(10, 15, 2, 1, '#EF4444')
    : (NULL_EYES.angryL ?? []).map(([dx, dy]) => R(6 + dx, 11 + dy, 1, 1, '#EF4444')).join('') +
      (NULL_EYES.angryR ?? []).map(([dx, dy]) => R(12 + dx, 11 + dy, 1, 1, '#EF4444')).join('') +
      R(8, 16, 1, 1, '#EF4444') + R(9, 15, 1, 1, '#EF4444') + R(10, 16, 1, 1, '#EF4444') + R(11, 15, 1, 1, '#EF4444') +
      R(12, 16, 1, 1, '#EF4444') + R(13, 15, 1, 1, '#EF4444') +
      `<g class="steam">${R(0, 6, 2, 1, '#A1A1AA')}${R(1, 5, 1, 1, '#A1A1AA')}</g>` +
      `<g class="steam" style="animation-delay:.4s">${R(20, 6, 2, 1, '#A1A1AA')}${R(20, 5, 1, 1, '#A1A1AA')}</g>`
  const body =
    R(10, 19, 2, 1, K) + R(6, 20, 10, 6, K) + R(7, 21, 8, 4, '#4B4B55') +
    R(10, 21, 2, 1, NULL_G) + R(9, 22, 1, 1, NULL_G) + R(12, 22, 1, 1, NULL_G) + R(10, 23, 2, 1, NULL_G) + R(11, 22, 1, 1, NULL_G) +
    R(8, 26, 2, 1, K) + R(12, 26, 2, 1, K) + R(7, 27, 3, 1, K) + R(12, 27, 3, 1, K)
  const arms = ok
    ? R(5, 17, 1, 4, K) + R(4, 15, 1, 2, K) + R(16, 17, 1, 4, K) + R(17, 15, 1, 2, K) +
      R(3, 13, 2, 2, '#D4D4D8') + R(17, 13, 2, 2, '#D4D4D8')
    : R(5, 21, 1, 3, K) + R(16, 21, 1, 3, K) + R(5, 24, 1, 1, '#D4D4D8') + R(16, 24, 1, 1, '#D4D4D8')
  const mark = ok
    ? [[24, 18], [25, 19], [26, 18], [27, 17], [28, 16], [29, 15]]
    : [[24, 15], [25, 16], [26, 17], [27, 18], [28, 19], [29, 20], [29, 15], [28, 16], [27, 17], [26, 18], [25, 19], [24, 20]]
  const laptop =
    `<g class="turn">` +
    R(22, 13, 10, 9, '#71717A') + R(23, 14, 8, 7, ok ? '#14532D' : '#450A0A') +
    `<g class="${ok ? 'tw' : 'fa'}">${mark.map(([x = 0, y = 0]) => R(x, y, 1, 1, ok ? '#4ADE80' : '#F87171')).join('')}</g>` +
    R(22, 22, 10, 1, '#A1A1AA') + `</g>` +
    R(21, 23, 12, 2, '#A1A1AA') + R(22, 23, 10, 1, '#D4D4D8') +
    `<g class="push">${R(17, 21, 5, 1, K)}${R(21, 19, 2, 2, '#D4D4D8')}</g>`

  return head + face + body + arms + laptop
}

const nullSide = (mood: Mood) => {
  const K = NULL_K
  const head =
    nullAntenna() +
    R(3, 7, 16, 1, K) + R(2, 8, 1, 10, K) + R(19, 8, 1, 10, K) + R(3, 18, 16, 1, K) +
    R(3, 8, 6, 10, '#222228') + R(4, 10, 3, 1, '#3F3F46') + R(4, 12, 3, 1, '#3F3F46') + R(4, 14, 3, 1, '#3F3F46') +
    R(9, 8, 1, 10, K) + R(10, 8, 9, 10, '#2E2E35') + R(10, 8, 9, 1, NULL_H) + R(10, 10, 8, 7, '#050505')

  let face: string
  switch (mood) {
    case 'fail':
      face = sideEyes('x')
      break
    case 'thinking':
      face = sideEyes('up')
      break
    case 'running':
      face = sideEyes('wide')
      break
    case 'typing':
    case 'reading':
      face = `<g class="eo">${sideEyes('focus')}</g><g class="ec">${sideEyes('closed')}</g>`
      break
    default:
      face = `<g class="eo">${sideEyes('happy')}</g><g class="ec">${sideEyes('closed')}</g>`
  }

  const glow = mood === 'fail' ? '#EF4444' : '#22D3EE'
  const body =
    R(10, 19, 2, 1, K) + R(7, 20, 9, 6, K) + R(8, 21, 3, 4, '#38383F') + R(11, 21, 4, 4, '#4B4B55') +
    R(12, 22, 2, 2, NULL_G) +
    R(9, 26, 2, 1, K) + R(12, 26, 2, 1, K) + R(9, 27, 3, 1, K) + R(12, 27, 3, 1, K)
  const tapping = mood === 'typing' || mood === 'running' || mood === 'idle'
  const arms =
    R(15, 21, 5, 1, '#4B4B55') + R(15, 23, 6, 1, K) +
    R(20, 20, 2, 2, '#D4D4D8', tapping ? 'tapa' : '') + R(21, 22, 2, 2, '#E4E4E7', tapping ? 'tapb' : '')
  const laptop =
    `<g class="glow">${R(23, 14, 5, 9, glow).replace('/>', ' opacity=".16"/>')}${R(20, 12, 3, 8, glow).replace('/>', ' opacity=".08"/>')}</g>` +
    R(19, 24, 11, 2, '#A1A1AA') + R(19, 24, 9, 1, '#D4D4D8') +
    R(28, 20, 2, 4, '#71717A') + R(29, 16, 2, 4, '#71717A') + R(30, 12, 2, 4, '#71717A') +
    R(28, 20, 1, 4, glow) + R(29, 16, 1, 4, glow) + R(30, 12, 1, 4, glow)

  return head + face + body + laptop + arms
}

const renderNull = (mood: Mood) => (mood === 'success' || mood === 'fail' ? nullFront(mood) : nullSide(mood))

export const AVATARS: Avatar[] = ['null', ...(Object.keys(PETS) as Avatar[])]
export const petName = (a: Avatar) => (a === 'null' ? 'Null' : (PETS[a as Exclude<Avatar, 'null'>] ?? PETS.blaze).name)

const plus = (x: number, y: number, c: string, delay: number) =>
  `<g class="tw" style="animation-delay:${delay}s">${R(x, y - 1, 1, 3, c)}${R(x - 1, y, 3, 1, c)}</g>`

const effects = (mood: Mood) => {
  switch (mood) {
    case 'thinking':
      return (
        R(47, 9, 12, 1, '#EEF2FF') + R(46, 10, 14, 5, '#EEF2FF') + R(47, 15, 12, 1, '#EEF2FF') +
        R(45, 17, 2, 2, '#EEF2FF') + R(44, 20, 1, 1, '#EEF2FF') +
        `<g class="dot">${R(48, 11, 2, 2, '#7C3AED')}</g>` +
        `<g class="dot" style="animation-delay:.4s">${R(52, 11, 2, 2, '#7C3AED')}</g>` +
        `<g class="dot" style="animation-delay:.8s">${R(56, 11, 2, 2, '#7C3AED')}</g>`
      )
    case 'reading':
      return (
        R(3, 11, 11, 14, '#E0E7FF') + R(5, 13, 7, 1, '#818CF8') + R(5, 15, 6, 1, '#A78BFA') +
        R(5, 17, 7, 1, '#818CF8') + R(5, 19, 5, 1, '#A78BFA') + R(5, 21, 7, 1, '#818CF8') +
        R(3, 12, 11, 1, '#22D3EE', 'scan')
      )
    case 'typing':
      return (
        `<text class="rise" x="4" y="30" font-family="monospace" font-size="6" font-weight="700" fill="#22D3EE">01</text>` +
        `<text class="rise" style="animation-delay:.6s" x="46" y="28" font-family="monospace" font-size="6" font-weight="700" fill="#A78BFA">{}</text>` +
        `<text class="rise" style="animation-delay:1.2s" x="7" y="20" font-family="monospace" font-size="6" font-weight="700" fill="#60A5FA">&lt;/&gt;</text>` +
        `<text class="rise" style="animation-delay:1.5s" x="47" y="18" font-family="monospace" font-size="6" font-weight="700" fill="#F472B6">=&gt;</text>`
      )
    case 'running':
      return (
        R(2, 11, 14, 11, '#0B1020') + R(2, 11, 14, 1, '#818CF8') +
        `<text x="4" y="19" font-family="monospace" font-size="6" font-weight="700" fill="#22D3EE">&gt;</text>` +
        R(9, 15, 2, 4, '#22D3EE', 'fa') +
        `<g class="spin">${R(50, 11, 1, 7, '#A78BFA')}${R(47, 14, 7, 1, '#A78BFA')}${R(48, 12, 5, 5, '#A78BFA')}${R(50, 14, 1, 1, '#1E1B4B')}</g>`
      )
    case 'success':
      return (
        plus(6, 13, '#FDE047', 0) + plus(53, 12, '#C4B5FD', 0.3) + plus(8, 28, '#93C5FD', 0.6) + plus(52, 30, '#FDE047', 0.9)
      )
    case 'fail':
      return (
        `<g class="fa">${R(52, 12, 1, 3, '#F87171')}${R(52, 16, 1, 1, '#F87171')}</g>`
      )
    default:
      return plus(50, 14, '#C4B5FD', 0) + plus(8, 24, '#93C5FD', 0.5)
  }
}

const MOTION: Record<Mood, string> = {
  idle: 'hop',
  thinking: 'sway',
  reading: 'hop',
  typing: 'fast',
  running: 'fast',
  success: 'jump',
  fail: 'rage',
}

const badge = (text: string, cx: number) => {
  const label = text.toUpperCase()
  const w = label.length * 3.6 + 6
  const x = Math.round(cx - w / 2)

  return (
    R(x + 1, 0, w - 2, 1, '#4338CA') + R(x, 1, w, 6, '#312E81') + R(x + 1, 7, w - 2, 1, '#4338CA') +
    R(cx, 8, 1, 1, '#4338CA') +
    `<text x="${cx}" y="5.8" text-anchor="middle" font-family="monospace" font-size="5.6" font-weight="700" fill="#E0E7FF">${label
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')}</text>`
  )
}

const pet = (mood: Mood, avatar: Avatar) => {
  if (avatar === 'null') {
    const x = 12
    const slow = mood === 'idle' ? 'slowtap' : ''

    return `<g transform="translate(${x} 8)"><g class="${mood === 'typing' || mood === 'running' ? 'hop' : MOTION[mood]} ${slow}">${renderNull(mood)}</g></g>`
  }

  const p = PETS[avatar as Exclude<Avatar, 'null'>] ?? PETS.blaze

  return `<g transform="translate(19 10) scale(1.4)"><g class="${MOTION[mood]}">${p.body()}${eyes(p, mood)}</g></g>`
}

export const coderSvg = (mood: Mood, avatar: Avatar = 'null', label = '') =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 36" width="100" height="60" shape-rendering="crispEdges">
<style>${CSS}</style>
${effects(mood)}
${pet(mood, avatar)}
${label ? badge(label, 30) : ''}
</svg>`

const CONFETTI = ['#F472B6', '#FDE047', '#22D3EE', '#A78BFA', '#4ADE80', '#60A5FA']

export const celebrateSvg = (avatar: Avatar = 'null') => {
  const bits = Array.from({ length: 18 }, (_, i) => {
    const x = (i * 37) % 88
    const c = CONFETTI[i % CONFETTI.length] ?? '#fff'

    return `<g class="fall" style="animation-duration:${1.4 + (i % 4) * 0.35}s;animation-delay:-${(i * 0.23).toFixed(2)}s">${R(x, 0, i % 3 === 0 ? 2 : 1, 1, c)}</g>`
  }).join('')

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 90 36" width="150" height="60" shape-rendering="crispEdges">
<style>${CSS}</style>
${bits}
${plus(14, 14, '#FDE047', 0)}${plus(76, 12, '#C4B5FD', 0.3)}${plus(20, 28, '#93C5FD', 0.6)}${plus(70, 28, '#FDE047', 0.9)}
<g transform="translate(15 0)">${pet('success', avatar)}</g>
${badge('All done!', 45)}
</svg>`
}

export const progressSvg = (done: number, total: number) => {
  const w = 240
  const fill = total === 0 ? 0 : Math.max(8, Math.round((done / total) * w))

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} 8" width="${w}" height="8">
<style>.sh{animation:sh 2.2s linear infinite}@keyframes sh{from{transform:translateX(-60px)}to{transform:translateX(${w}px)}}@media (prefers-reduced-motion:reduce){.sh{display:none}}</style>
<defs>
  <linearGradient id="f" x1="0" x2="1"><stop offset="0" stop-color="#3B82F6"/><stop offset="1" stop-color="#A855F7"/></linearGradient>
  <linearGradient id="s" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".45"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
  <clipPath id="c"><rect width="${fill}" height="8" rx="4"/></clipPath>
</defs>
<rect width="${w}" height="8" rx="4" fill="#312E81" fill-opacity=".45"/>
<rect width="${fill}" height="8" rx="4" fill="url(#f)"/>
<g clip-path="url(#c)"><rect class="sh" width="60" height="8" fill="url(#s)"/></g>
</svg>`
}

export const headerSvg = () => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 16" width="60" height="16">
<defs><linearGradient id="t" x1="0" x2="1"><stop offset="0" stop-color="#3B82F6"/><stop offset=".55" stop-color="#6366F1"/><stop offset="1" stop-color="#A855F7"/></linearGradient></defs>
<circle cx="6" cy="8" r="5" fill="url(#t)"/><circle cx="6" cy="8" r="2" fill="#EEF2FF"/>
<text x="15" y="12.5" font-family="'Segoe UI', Inter, Arial, sans-serif" font-size="11.5" font-weight="800" letter-spacing="1.5" fill="url(#t)">NULL</text>
</svg>`
