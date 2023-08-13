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
  IUserOperation,
} from 'userop'

const MANAGER_CONTRACT_ADDRESS = '0x65f46d46f0F632FA966A652748F0F6C4b9716411'
const ALCHEMY_API_KEY = 'zVuQiy1jllblGInrgT9Lwba2PKjUhtTO'
const AAUTO_BRIDGE_ENDPOINT = 'https://localhost:3001'
const ANTI_DUPLICATION_INTERVAL_MINUTES = 10

const storeSettings = async (req: StoreSettingsRequestParams) => {
  const response = await snap.request({
    method: 'snap_dialog',
    params: {
      type: 'confirmation',
      content: panel([
        text('Store your settings'),
        text(JSON.stringify({ ...req, privateKey: undefined })),
      ]),
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

const retrieveSettings = async () => {
  const persistedData = (await snap.request({
    method: 'snap_manageState',
    params: { operation: 'get' },
  })) as PersistedData | null
  return persistedData
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
    case 'retrieveSettings':
      return await retrieveSettings()
    default:
      throw new Error('Method not found.')
  }
}

const postUserOpToServer = async (userOp: IUserOperation) => {
  const response = await fetch(`${AAUTO_BRIDGE_ENDPOINT}/api/uo`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userOp),
  })
  return response
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

const notEnoughDepositContent = {
  content: panel([
    heading('AAuto Bridge'),
    text('Automatic bridge could not be started due to lack of deposit 😭'),
  ]),
}

const somethingWrongErrorContent = (message: string) => ({
  content: panel([
    heading('AAuto Bridge'),
    text('Hmmm, something wrong 🤔'),
    copyable(message),
  ]),
})

const showLatestTxContent = (hash: string) => ({
  content: panel([
    heading('AAuto Bridge'),
    text(
      'Skip execution because no time has elapsed since the previous auto bridge ⏭︎',
    ),
    divider(),
    text('Latest tx:'),
    copyable(`https://goerli.etherscan.io/tx/${hash}`),
  ]),
})

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

  // Retrieve persisted data
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

  const chainIdNum = parseInt(chainId.replace('eip155:', ''), 16)
  const chainIndex = persistedData.chains.findIndex(
    (c) => c.chainId == chainIdNum,
  )
  if (chainIndex == -1) {
    return settingErrorContent
  }
  const chain = persistedData.chains[chainIndex]

  // ============Check condition============
  // Check timestamp
  if (!!chain.latestTx) {
    const now = new Date()
    const latest = new Date(chain.latestTx.timestamp)
    const diffTime = now.getTime() - latest.getTime()
    const diffSecond = Math.floor(diffTime / 1000)
    if (diffSecond < ANTI_DUPLICATION_INTERVAL_MINUTES * 60) {
      return showLatestTxContent(chain.latestTx.hash)
    }
  }

  const provider = new providers.Web3Provider(window.ethereum, chainIdNum)
  const nonce = await provider.getTransactionCount(transaction.from as string)

  // Check nonce
  if (!!chain.latestTx && chain.latestTx.nonce >= nonce) {
    return showLatestTxContent(chain.latestTx.hash)
  }

  // Calc and check charge
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

  // ============Fetch destination chain data============

  const abi = [
    'function execute(address to, uint256 chainId, uint256 nonce, uint256 charge, uint256 callGasLimit)',
    'function depositBalances(address owner) view returns (uint256 amount)',
  ]
  const iface = new utils.Interface(abi)
  const destinationChainProvider = new providers.AlchemyProvider(
    persistedData.baseChainId,
    ALCHEMY_API_KEY,
  )
  const manager = new Contract(
    MANAGER_CONTRACT_ADDRESS,
    abi,
    destinationChainProvider,
  )

  // TODO: fix
  const estimatedGas = BigNumber.from(0)

  // Get deposit
  const depositRaw = await manager.depositBalances(transaction.from as string)
  const deposit = BigNumber.from(depositRaw)

  // Check enough deposit
  if (deposit.add(estimatedGas).lt(charge)) {
    return notEnoughDepositContent
  }

  // Def sign middleware
  const wallet = new Wallet(persistedData.privateKey)
  const signUserOperation: UserOperationMiddlewareFn = async (ctx) => {
    const hash = ctx.getUserOpHash()
    const arrayifySig = await wallet.signMessage(utils.arrayify(hash))
    ctx.op.signature = arrayifySig
  }

  // ============Fetch destination chain data============
  // Make builder
  const builder = new UserOperationBuilder()
    .useDefaults({ sender: MANAGER_CONTRACT_ADDRESS })
    .useMiddleware(signUserOperation)

  // Set fee
  const fee = await destinationChainProvider.getFeeData()
  builder.setMaxFeePerGas(fee.maxFeePerGas ?? 0)
  builder.setMaxPriorityFeePerGas(fee.maxPriorityFeePerGas ?? 0)

  // Set gas limit
  const callGasLimit = '0xA5797'
  builder.setCallGasLimit(callGasLimit)
  builder.setVerificationGasLimit('0x30D40')
  builder.setPreVerificationGas('0xC350')

  // Set calldata
  const calldata = iface.encodeFunctionData('execute', [
    transaction.from,
    chainIdNum,
    nonce,
    charge,
    callGasLimit,
  ])
  builder.setCallData(calldata)

  // Set nonce
  const addressInNum = BigNumber.from(persistedData.address)

  const entrypointAbi = [
    'function getNonce(address sender, uint192 key) view returns (uint256 nonce)',
  ]
  const entrypoint = new Contract(
    Constants.ERC4337.EntryPoint,
    entrypointAbi,
    destinationChainProvider,
  )
  const entrypointNonce = await entrypoint.getNonce(
    MANAGER_CONTRACT_ADDRESS,
    addressInNum,
  )

  builder.setNonce(entrypointNonce)

  const chainData = await provider.getNetwork()
  const destinationChainData = await destinationChainProvider.getNetwork()

  const userOp = await builder.buildOp(
    Constants.ERC4337.EntryPoint,
    destinationChainData.chainId,
  )
  console.log('userOp', JSON.stringify(userOp))

  // Send userOp to server
  const totalCost = charge.add(estimatedGas)

  try {
    const res = await postUserOpToServer(userOp)
    const resJson = await res.json()
    if (!res.ok) {
      return somethingWrongErrorContent(resJson.error)
    }

    const txHash = resJson.txHash

    const explorerURL = `https://goerli.etherscan.io/tx/${txHash}`

    // Update latest tx of persisted data
    const copy = [...persistedData.chains]
    const unixTimestamp = Math.floor(new Date().getTime() / 1000)
    copy.splice(chainIndex, 1, {
      ...chain,
      latestTx: {
        timestamp: unixTimestamp,
        hash: txHash,
        nonce: nonce,
      },
    })
    await snap.request({
      method: 'snap_manageState',
      params: {
        operation: 'update',
        newState: {
          ...persistedData,
          chains: copy,
        },
      },
    })

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
  } catch (e) {
    return somethingWrongErrorContent(e.message)
  }
}
