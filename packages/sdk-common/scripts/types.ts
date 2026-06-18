export type TScriptProgress = {
  update: (current: string) => void
  stop: () => void
}
