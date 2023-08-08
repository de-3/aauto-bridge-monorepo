import { Snap } from '@/types/snap'
import { isLocalSnap } from './snap'

export const shouldDisplayReconnectButton = (installedSnap?: Snap) =>
  installedSnap && isLocalSnap(installedSnap?.id)
