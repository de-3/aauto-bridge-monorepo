export type PersistedData = {
  chains: {
    chainId: number
    maxAmount: string
    minAmount: string
  }[]
  privateKey: string
}
