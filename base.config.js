// config/vite.base.ts
import pkg from './packages/ui/package.json'

export const baseDefine = {
  __UI_VERSION__: JSON.stringify(pkg.version),
}
