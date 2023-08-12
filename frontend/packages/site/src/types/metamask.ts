import { Snap } from '@/types/snap'

export type MetamaskState = {
  isFlask: boolean
  installedSnap?: Snap
  error?: Error
}
