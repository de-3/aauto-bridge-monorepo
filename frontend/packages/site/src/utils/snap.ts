import { defaultSnapOrigin } from '@/config/snap'
import { GetSnapsResponse, Snap } from '@/types/snap'

/**
 * Get the installed snaps in MetaMask.
 *
 * @returns The snaps installed in MetaMask.
 */
export const getSnaps = async (): Promise<GetSnapsResponse> => {
  const req = await window.ethereum.request({
    method: 'wallet_getSnaps',
  })
  return req as unknown as GetSnapsResponse
}

/**
 * Connect a snap to MetaMask.
 *
 * @param snapId - The ID of the snap.
 * @param params - The params to pass with the snap to connect.
 */
export const connectSnap = async (
  snapId: string = defaultSnapOrigin,
  params: Record<'version' | string, unknown> = {},
) => {
  await window.ethereum.request({
    method: 'wallet_requestSnaps',
    params: {
      [snapId]: params,
    },
  })
}

/**
 * Get the snap from MetaMask.
 *
 * @param version - The version of the snap to install (optional).
 * @returns The snap object returned by the extension.
 */
export const getSnap = async (version?: string): Promise<Snap | undefined> => {
  try {
    const snaps = await getSnaps()

    return Object.values(snaps).find(
      (snap) =>
        snap.id === defaultSnapOrigin && (!version || snap.version === version),
    )
  } catch (e) {
    console.log('Failed to obtain installed snap', e)
    return undefined
  }
}

export const storeSettings = async (
  chainId: number,
  maxAmount: BigInt,
  minAmount: BigInt,
  baseChainId: number,
  address: string,
  privateKey: string,
) => {
  await window.ethereum.request({
    method: 'wallet_invokeSnap',
    params: {
      snapId: defaultSnapOrigin,
      request: {
        method: 'storeSettings',
        params: {
          chains: [
            {
              chainId,
              maxAmount: maxAmount.toString(),
              minAmount: minAmount.toString(),
            },
          ],
          baseChainId,
          address,
          privateKey,
        },
      },
    },
  })
}

export const isLocalSnap = (snapId: string) => snapId.startsWith('local:')
