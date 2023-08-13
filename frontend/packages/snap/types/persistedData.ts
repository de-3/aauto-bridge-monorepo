export type PersistedData = {
  chains: {
    chainId: number
    maxAmount: string
    minAmount: string
    latestTx?: {
      timestamp: number
      hash: string
      nonce: number
    }
  }[]
  baseChainId: number
  address: string
  privateKey: string
}
