import {
  OnRpcRequestHandler,
  OnTransactionHandler,
} from '@metamask/snaps-types'
import { heading, panel, text } from '@metamask/snaps-ui'
import { ApiRequestParams, StoreSettingsRequestParams } from '../types/snapApi'
import { BigNumber, utils, Wallet } from 'ethers'
import { PersistedData } from '../types/persistedData'

const storeSettings = async (req: StoreSettingsRequestParams) => {
  const response = await snap.request({
    method: 'snap_dialog',
    params: {
      type: 'confirmation',
      content: panel([text('Store your settings')]),
    },
  })
  if (!response) return false

  await snap.request({
    method: 'snap_manageState',
    params: {
      operation: 'update',
      newState: req,
    },
  })
}

const getBalance = async (
  address: string,
  chainId: number,
): Promise<BigNumber> => {
  // eslint-disable-next-line
  const response = await window.ethereum.request({
    method: 'eth_getBalance',
    id: chainId,
    params: [address],
  })

  return BigNumber.from(response)
}

const calcCharge = (
  maxAmount: BigNumber,
  minAmount: BigNumber,
  currentBalance: BigNumber,
): BigNumber => {
  if (currentBalance > minAmount) {
    return BigNumber.from(0)
  }

  return maxAmount.sub(currentBalance)
}

export const onRpcRequest: OnRpcRequestHandler = async ({
  origin,
  request,
}) => {
  console.log(origin)

  const requestParams = (request?.params as unknown) as ApiRequestParams
  switch (request.method) {
    case 'storeSettings':
      await storeSettings(requestParams)
      break
    default:
      throw new Error('Method not found.')
  }
}

const settingErrorContent = {
  content: panel([
    heading('AAuto Bridge'),
    text('Hmmm, it looks like the snap setup is not complete 🤔'),
  ]),
}

export const onTransaction: OnTransactionHandler = async ({
  transaction,
  chainId,
  transactionOrigin,
}) => {
  console.log(transaction, chainId, transactionOrigin)

  const persistedData = (await snap.request({
    method: 'snap_manageState',
    params: { operation: 'get' },
  })) as PersistedData | null
  if (
    persistedData == null ||
    persistedData.chains.length == 0 ||
    !persistedData.privateKey
  ) {
    return settingErrorContent
  }

  console.log(persistedData)

  const chainIdNum = parseInt(chainId.replace('eip155:', ''), 16)

  const chainIndex = persistedData.chains.findIndex(
    (c) => c.chainId == chainIdNum,
  )
  if (chainIndex == -1) {
    return settingErrorContent
  }
  const chain = persistedData.chains[chainIndex]

  const balance = await getBalance(transaction.from as string, chainIdNum)

  const charge = calcCharge(
    BigNumber.from(chain.maxAmount),
    BigNumber.from(chain.minAmount),
    balance,
  )

  // TODO: estimated gas

  const wallet = new Wallet(persistedData.privateKey)
  // TODO: sign tx
  // wallet.sendTransaction()

  return {
    content: panel([
      heading('My Transaction Insights'),
      text('Here are the insights:'),
      text(`Your current balance: ${utils.formatEther(balance)} ETH`),
      text(`Next charge amount: ${utils.formatEther(charge)} ETH`),
    ]),
  }
}
