'use client'

import {
  Button,
  Card,
  CardBody,
  Container,
  HStack,
  InputGroup,
  InputRightAddon,
  NumberInput,
  NumberInputField,
  Select,
  Text,
  VStack,
} from '@chakra-ui/react'
import { ChangeEvent, FC, useEffect, useState } from 'react'
import {
  InstallFlaskButton,
  ConnectButton,
  ReconnectButton,
  SendHelloButton,
  StoreSettingsButton,
} from '../Button'
import { shouldDisplayReconnectButton } from '@/utils/button'
import { MetamaskState } from '@/types/metamask'
import {
  PersistedData,
  connectSnap,
  getSnap,
  retrieveSettings,
  storeSettings,
} from '@/utils/snap'
import {
  useAccount,
  useContractRead,
  useContractWrite,
  useSendTransaction,
} from 'wagmi'
import { formatEther, parseEther } from 'viem'
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts'
import { accountManagerABI } from '@/utils/abi'
import { baseGoerli, optimismGoerli, zoraTestnet } from '@wagmi/chains'
import detectEthereumProvider from '@metamask/detect-provider'

export const IndexPage: FC<{}> = () => {
  const [metamaskState, setMetamaskState] = useState<MetamaskState>({
    isFlask: false,
  })

  useEffect(() => {
    console.log('test')
    ;(async () => {
      const provider = await detectEthereumProvider()
      if (provider == null) {
        return
      }
      const isFlask = // @ts-ignore
        (await provider.request({ method: 'web3_clientVersion' }))?.includes(
          'flask',
        )

      setMetamaskState({
        ...metamaskState,
        isFlask,
      })
    })()
  }, [])

  const [userOpAddress, setUserOpAddress] = useState<`0x${string}`>()
  const [selectedNetwork, setSelectedNetwork] = useState<number>()

  const [maxEth, setMaxEth] = useState<number>()
  const [minEth, setMinEth] = useState<number>()
  const [depositEth, setDepositEth] = useState<number>()
  const [persistedData, setPersistedData] = useState<PersistedData>()
  const [chainIndex, setChainIndex] = useState<number>()

  useEffect(() => {
    if (!!metamaskState.installedSnap) {
      return
    }

    ;(async () => {
      const res = await retrieveSettings()
      if (!res) {
        return
      }
      setPersistedData(res)
      setUserOpAddress(res.address as `0x${string}`)
    })()
  }, [metamaskState.installedSnap])

  const handleConnectClick = async () => {
    try {
      await connectSnap()
      const installedSnap = await getSnap()

      setMetamaskState({
        ...metamaskState,
        installedSnap,
      })
    } catch (e) {
      console.error(e)
      setMetamaskState({
        ...metamaskState,
        error: e as Error,
      })
    }
  }

  useEffect(() => {
    console.log('test2')
    if (!!persistedData?.chains) {
      const chainIndex = persistedData.chains.findIndex(
        (c) => c.chainId == selectedNetwork,
      )
      if (chainIndex != -1) {
        setChainIndex(chainIndex)
      } else {
        setChainIndex(undefined)
      }
    }
  }, [selectedNetwork, persistedData?.chains])

  const handleNetworkSelect = (e: ChangeEvent<HTMLSelectElement>) => {
    setSelectedNetwork(parseInt(e.target.value))
  }

  const handleStoreSettings = async () => {
    if (!maxEth || !minEth || !selectedNetwork) {
      throw new Error('not set max or min or network')
    }

    let privateKey: `0x${string}`
    let address: `0x${string}`
    if (!!persistedData?.privateKey && !!persistedData.address) {
      privateKey = persistedData.privateKey as `0x${string}`
      address = persistedData.address as `0x${string}`
    } else {
      privateKey = generatePrivateKey()
      const account = privateKeyToAccount(privateKey)
      address = account.address
    }
    setUserOpAddress(address)

    let chains
    if (!!persistedData?.chains) {
      const chainIndex = persistedData.chains.findIndex(
        (c) => c.chainId == selectedNetwork,
      )
      const copy = [...persistedData.chains]
      if (chainIndex != -1) {
        setChainIndex(chainIndex)
        copy.splice(chainIndex, 1, {
          chainId: selectedNetwork,
          maxAmount: parseEther(maxEth.toString()).toString(),
          minAmount: parseEther(minEth.toString()).toString(),
        })
      } else {
        copy.push({
          chainId: selectedNetwork,
          maxAmount: parseEther(maxEth.toString()).toString(),
          minAmount: parseEther(minEth.toString()).toString(),
        })
      }

      chains = copy
    } else {
      chains = [
        {
          chainId: selectedNetwork,
          maxAmount: parseEther(maxEth.toString()).toString(),
          minAmount: parseEther(minEth.toString()).toString(),
        },
      ]
    }

    try {
      await storeSettings({ chains, baseChainId: 5, address, privateKey })

      const res = await retrieveSettings()
      if (!res) {
        return
      }
      setPersistedData(res)
    } catch (e) {
      console.error(e)
      setMetamaskState({
        ...metamaskState,
        error: e as Error,
      })
    }
  }

  const contractAddress =
    (process.env
      .NEXT_PUBLIC_ACCOUNT_MANAGER_CONTRACT_ADDRESS as `0x${string}`) ?? '0x'

  const { write: initialize } = useContractWrite({
    address: contractAddress,
    abi: accountManagerABI,
    functionName: 'initialize',
    value: parseEther(depositEth?.toString() ?? '0'),
  })

  const { write: deposit } = useContractWrite({
    address: contractAddress,
    abi: accountManagerABI,
    functionName: 'deposit',
    value: parseEther(depositEth?.toString() ?? '0'),
  })

  const { address } = useAccount()
  const { data: depositedBalance } = useContractRead({
    address: !!address ? contractAddress : undefined,
    abi: accountManagerABI,
    functionName: 'depositBalances',
    args: [address ?? '0x'],
  })

  const { data: storedUserOpAddress } = useContractRead({
    address: !!address ? contractAddress : undefined,
    abi: accountManagerABI,
    functionName: 'userOpAddresses',
    args: [address ?? '0x'],
  })

  const zero = '0x0000000000000000000000000000000000000000'

  const handleDeposit = async () => {
    if (!userOpAddress) {
      throw new Error('not set userOpAddress')
    }

    if (!!storedUserOpAddress && storedUserOpAddress != zero) {
      await deposit()
    } else {
      await initialize({
        args: [userOpAddress],
      })
    }
  }

  const handleChangeMax = (valueAsString: string, valueAsNumber: number) => {
    if (valueAsString == '') {
      return
    }
    setMaxEth(valueAsNumber)
  }

  const handleChangeMin = (valueAsString: string, valueAsNumber: number) => {
    if (valueAsString == '') {
      return
    }
    setMinEth(valueAsNumber)
  }

  const handleChangeDeposit = (
    valueAsString: string,
    valueAsNumber: number,
  ) => {
    if (valueAsString == '') {
      return
    }
    setDepositEth(valueAsNumber)
  }

  const { sendTransaction } = useSendTransaction({
    to: address ?? '0x',
    value: BigInt(0),
  })

  const handleSendHelloClick = async () => {
    try {
      await sendTransaction()
    } catch (e) {
      console.error(e)
      setMetamaskState({
        ...metamaskState,
        error: e as Error,
      })
    }
  }

  return (
    <Container>
      <VStack spacing={6}>
        <Text fontSize="xl">Welcome to AAutoBridge</Text>
        {metamaskState.error && (
          <Card w="full">
            <CardBody>
              <VStack alignItems="start">
                <Text color="red.500">
                  <b>An error happened:</b> {metamaskState.error.message}
                </Text>
              </VStack>
            </CardBody>
          </Card>
        )}
        {!metamaskState.isFlask && (
          <Card w="full">
            <CardBody>
              <VStack alignItems="start">
                <Text>
                  Snaps is pre-release software only available in MetaMask
                  Flask, a canary distribution for developers with access to
                  upcoming features.
                </Text>
                <InstallFlaskButton />
              </VStack>
            </CardBody>
          </Card>
        )}
        {!metamaskState.installedSnap && (
          <Card w="full">
            <CardBody>
              <VStack alignItems="start">
                <Text>
                  Get started by connecting to and installing the snap.
                </Text>
                <ConnectButton
                  onClick={handleConnectClick}
                  isDisabled={!metamaskState.isFlask}
                />
              </VStack>
            </CardBody>
          </Card>
        )}
        {shouldDisplayReconnectButton(metamaskState.installedSnap) && (
          <Card w="full">
            <CardBody>
              <VStack alignItems="start">
                <Text>
                  While connected to the snap this button will always be
                  displayed in order to update the snap if a change is made.
                </Text>
                <ReconnectButton
                  onClick={handleConnectClick}
                  isDisabled={!metamaskState.installedSnap}
                />
              </VStack>
            </CardBody>
          </Card>
        )}

        <Card w="full">
          <CardBody>
            <VStack>
              <Text>
                Configure the L2 settings for the bridge destination, which will
                be automatically bridged to keep the Wallet balance between the
                Max and Min values.
              </Text>

              <Select
                placeholder="Select network"
                onChange={handleNetworkSelect}
                value={selectedNetwork}
              >
                <option value={optimismGoerli.id}>Optimism</option>
                <option value={baseGoerli.id}>Base</option>
                <option value={zoraTestnet.id}>Zora</option>
              </Select>

              <VStack w="full" alignItems="start">
                {/* Max */}
                <InputGroup w="full">
                  <NumberInput min={0} w="full" onChange={handleChangeMax}>
                    <NumberInputField placeholder="Max" />
                  </NumberInput>
                  <InputRightAddon>
                    <Text>ETH</Text>
                  </InputRightAddon>
                </InputGroup>

                {/* Min */}
                <InputGroup w="full">
                  <NumberInput min={0} w="full" onChange={handleChangeMin}>
                    <NumberInputField placeholder="Min" />
                  </NumberInput>
                  <InputRightAddon>
                    <Text>ETH</Text>
                  </InputRightAddon>
                </InputGroup>

                {chainIndex != undefined && !!persistedData && (
                  <HStack>
                    <Text fontSize="xs">
                      {`Max: ${formatEther(
                        BigInt(persistedData.chains[chainIndex].maxAmount),
                      )} ETH`}
                    </Text>
                    <Text fontSize="xs">
                      {`Max: ${formatEther(
                        BigInt(persistedData.chains[chainIndex].minAmount),
                      )} ETH`}
                    </Text>
                  </HStack>
                )}
                <StoreSettingsButton
                  onClick={handleStoreSettings}
                  isDisabled={!metamaskState.installedSnap}
                />
              </VStack>
            </VStack>
          </CardBody>
        </Card>

        <Card w="full">
          <CardBody>
            <VStack w="full" alignItems="start">
              <Text>
                The funds to be bridged are deposited in the contract on L1. The
                deposited funds can be withdrawn at any time.
              </Text>

              <InputGroup w="full">
                <NumberInput min={0} w="full" onChange={handleChangeDeposit}>
                  <NumberInputField placeholder="Deposit" />
                </NumberInput>
                <InputRightAddon>
                  <Text>ETH</Text>
                </InputRightAddon>
              </InputGroup>
              <HStack>
                {!!depositedBalance && (
                  <Text fontSize="xs">{`Deposited balance: ${formatEther(
                    depositedBalance,
                  )} ETH`}</Text>
                )}

                {!!userOpAddress && (
                  <Text fontSize="xs">{`UserOp address: ${
                    !!storedUserOpAddress && storedUserOpAddress != zero
                      ? storedUserOpAddress.slice(0, 6)
                      : userOpAddress.slice(0, 6)
                  }`}</Text>
                )}
              </HStack>

              <Button
                onClick={handleDeposit}
                isDisabled={!userOpAddress || !depositEth}
              >
                {!!storedUserOpAddress && storedUserOpAddress != zero
                  ? 'Deposit'
                  : 'Initialize'}
              </Button>
            </VStack>
          </CardBody>
        </Card>

        <Card w="full">
          <CardBody>
            <Text>
              Let&apos;s switch to the L2 chain that has been configured and
              execute a test transaction
            </Text>
            <SendHelloButton
              onClick={handleSendHelloClick}
              disabled={!metamaskState.installedSnap}
            />
          </CardBody>
        </Card>
      </VStack>
    </Container>
  )
}
