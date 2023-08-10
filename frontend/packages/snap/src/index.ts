import {
  OnRpcRequestHandler,
  OnTransactionHandler,
} from '@metamask/snaps-types'
import { copyable, divider, heading, panel, text } from '@metamask/snaps-ui'
import { ApiRequestParams, StoreSettingsRequestParams } from '../types/snapApi'
import { BigNumber, utils, Wallet, Contract, providers } from 'ethers'
import { PersistedData } from '../types/persistedData'
import {
  UserOperationBuilder,
  UserOperationMiddlewareFn,
  Constants,
} from 'userop'

const MANAGER_CONTRACT_ADDRESS = '0x2F096E3Cdd774AA4DF12Bc4c2128bc66EdF2F459'
const ALCHEMY_API_KEY = 'zVuQiy1jllblGInrgT9Lwba2PKjUhtTO'
const AAUTO_BRIDGE_ENDPOINT = 'https://localhost:3001'

const storeSettings = async (req: StoreSettingsRequestParams) => {
  const response = await snap.request({
    method: 'snap_dialog',
    params: {
      type: 'confirmation',
      content: panel([text('Store your settings'), text(JSON.stringify(req))]),
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

const noChargeContent = {
  content: panel([
    heading('AAuto Bridge'),
    text(
      'No automatic bridge will be performed this time as the balance is still sufficient 👌',
    ),
  ]),
}

const format = (value: BigNumber, fix?: number) => {
  if (!fix) {
    fix = 8
  }
  return parseFloat(utils.formatEther(value)).toFixed(fix)
}

export const onTransaction: OnTransactionHandler = async ({
  transaction,
  chainId,
}) => {
  console.log(transaction)

  const persistedData = (await snap.request({
    method: 'snap_manageState',
    params: { operation: 'get' },
  })) as PersistedData | null

  if (
    persistedData == null ||
    persistedData.chains.length == 0 ||
    !persistedData.baseChainId ||
    !persistedData.privateKey ||
    !transaction.value
  ) {
    return settingErrorContent
  }

  // TODO: Check timestamp

  const chainIdNum = parseInt(chainId.replace('eip155:', ''), 16)
  const chainIndex = persistedData.chains.findIndex(
    (c) => c.chainId == chainIdNum,
  )
  if (chainIndex == -1) {
    return settingErrorContent
  }
  const chain = persistedData.chains[chainIndex]

  const provider = new providers.Web3Provider(window.ethereum, chainIdNum)

  const balance = await provider.getBalance(transaction.from as string)
  const nextBalance = balance.sub(BigNumber.from(transaction.value))

  const charge = calcCharge(
    BigNumber.from(chain.maxAmount),
    BigNumber.from(chain.minAmount),
    nextBalance,
  )

  if (charge.eq(0)) {
    return noChargeContent
  }

  const wallet = new Wallet(persistedData.privateKey)
  const nonce = await provider.getTransactionCount(transaction.from as string)
  const signUserOperation: UserOperationMiddlewareFn = async (ctx) => {
    ctx.op.signature = await wallet.signMessage(ctx.getUserOpHash())
  }

  const abi = [
    'function execute(address to, uint256 chainId, uint256 nonce, uint256 charge)',
  ]
  const iface = new utils.Interface(abi)
  const calldata = iface.encodeFunctionData('execute', [
    transaction.from,
    chainIdNum,
    nonce,
    charge,
  ])

  const destinationChainProvider = new providers.AlchemyProvider(
    persistedData.baseChainId,
    ALCHEMY_API_KEY,
  )

  const manager = new Contract(
    MANAGER_CONTRACT_ADDRESS,
    abi,
    destinationChainProvider,
  )

  const estimatedGas = await manager.estimateGas.execute(
    transaction.from,
    chainIdNum,
    nonce,
    charge,
  )

  // TODO: Get deposit
  const deposit = utils.parseEther('10')

  const builder = new UserOperationBuilder()
    .useDefaults({ sender: MANAGER_CONTRACT_ADDRESS })
    .useMiddleware(signUserOperation)

  builder.setCallData(calldata)

  // Set nonce
  // NOTE: nonce(256) = [address(160)][0 padding(32)][sequence(64)]
  const addressInNum = BigNumber.from(persistedData.address)
  const entrypointAbi = ['function getNonce(address sender, uint192 key)']
  const entrypoint = new Contract(
    Constants.ERC4337.EntryPoint,
    entrypointAbi,
    destinationChainProvider,
  )
  const nonceRes = await entrypoint.callStatic.getNonce(
    MANAGER_CONTRACT_ADDRESS,
    addressInNum,
  )
  const entrypointNonce = addressInNum
    .shl(96)
    .add(BigNumber.from(nonceRes[0] ?? 0))
  builder.setNonce(entrypointNonce)

  const userOp = await builder.buildOp(Constants.ERC4337.EntryPoint, chainIdNum)
  console.log('userOp', userOp)

  let response: Response
  // Send userOp to server
  try {
    response = await fetch(`${AAUTO_BRIDGE_ENDPOINT}/api/uo`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userOp),
    })
  } catch (e) {
    // TODO: fix
    return noChargeContent
  }

  const chainData = await provider.getNetwork()
  const destinationChainData = await destinationChainProvider.getNetwork()

  const totalCost = charge.add(estimatedGas)

  const res: { txHash: string } = await response.json()
  const explorerURL = `https://etherscan.io/tx/${res.txHash}`

  return {
    content: panel([
      heading('🎉 Bridge process started 🎉'),
      text(
        'Since the balance was not sufficient, an automatic bridge was performed. It takes about a minute to complete the bridge.',
      ),
      divider(),
      heading(`${destinationChainData.name} deposit`),
      text(`**${format(deposit.sub(totalCost))} ETH**`),
      text(`(-${format(totalCost)} ETH)`),
      divider(),
      heading(`${chainData.name} balance`),
      text(`**${format(BigNumber.from(chain.maxAmount))} ETH**`),
      text(`(+${format(charge)} ETH)`),
      divider(),
      text(`Estimated gas fee: ${format(estimatedGas)} ETH`),
      text('Transaction'),
      copyable(explorerURL),
    ]),
  }
}
