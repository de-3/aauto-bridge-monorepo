export type PersistedData = {
  chains: {
    chainId: number
    maxAmount: string
    minAmount: string
    latestExec: number
  }[]
  baseChainId: number
  address: string
  privateKey: string
}
