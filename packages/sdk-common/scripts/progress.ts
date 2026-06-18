import cliProgress from 'cli-progress'
import pc from 'picocolors'

import type { TScriptProgress } from './types'

const LABEL_WIDTH = 9
const BAR_SIZE = 28

const label = (text: string) => pc.dim(text.padEnd(LABEL_WIDTH))

const formatCountdown = (deadline: number): string => {
  const remaining = Math.max(0, deadline - Date.now())
  const text = `${Math.ceil(remaining / 1000)}s`
  if (remaining <= 5_000) return pc.bold(pc.red(text))
  if (remaining <= 10_000) return pc.yellow(text)
  return pc.green(text)
}

export const createScriptProgress = (
  labels: readonly string[],
  title: string,
  timeoutMs?: number
): TScriptProgress => {
  const total = labels.length
  const hasCountdown = timeoutMs !== undefined

  const multibar = new cliProgress.MultiBar({
    hideCursor: true,
    clearOnComplete: false,
    stopOnComplete: false,
    linewrap: false,
    noTTYOutput: true,
    notTTYSchedule: 10_000,
    barsize: BAR_SIZE,
    barCompleteChar: '█',
    barIncompleteChar: '░',
    format: ' {bar} '
  })

  multibar.create(1, 1, {}, { format: `  ${pc.cyan('◆')} ${pc.bold(title)}` })

  const progressBar = multibar.create(
    total,
    0,
    {},
    {
      format: `  ${pc.cyan('{bar}')}  ${pc.bold('{percentage}%')}  ${pc.dim('·')}  {value}/{total} chains`
    }
  )

  const nowBar = multibar.create(
    1,
    1,
    { current: '' },
    {
      format: `  ${pc.cyan('▶')} ${label('now')}{current}`
    }
  )

  const nextBar = multibar.create(
    1,
    1,
    { next: pc.dim('—') },
    {
      format: `    ${label('next')}{next}`
    }
  )

  const timeoutBar = hasCountdown
    ? multibar.create(
        1,
        1,
        { deadline: 0, done: false },
        {
          format: (_options, _params, payload) =>
            `    ${label('timeout')}${payload.done ? pc.dim('—') : formatCountdown(payload.deadline)}`
        }
      )
    : null

  let pos = -1
  let stopped = false

  const update = (current: string) => {
    pos += 1
    progressBar.update(pos)
    nowBar.update(1, { current: pc.bold(pc.cyan(current)) })
    nextBar.update(1, { next: pc.blue(labels[pos + 1] ?? '—') })
    timeoutBar?.update(1, { deadline: Date.now() + (timeoutMs ?? 0) })
  }

  const teardown = () => {
    if (stopped) return
    stopped = true
    process.off('SIGINT', onSignal)
    process.off('SIGTERM', onSignal)
    multibar.stop()
  }

  const onSignal = () => {
    teardown()
    process.exit(130)
  }

  process.once('SIGINT', onSignal)
  process.once('SIGTERM', onSignal)

  const stop = () => {
    if (stopped) return
    progressBar.update(total)
    nowBar.update(1, { current: pc.bold(pc.green('✓ done')) })
    nextBar.update(1, { next: pc.dim('—') })
    timeoutBar?.update(1, { done: true })
    teardown()
  }

  return { update, stop }
}
