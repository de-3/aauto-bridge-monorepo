'use client'

import { CacheProvider } from '@chakra-ui/next-js'
import { ChakraProvider } from '@chakra-ui/react'
import { theme } from '../app/style'

import { useEffect, useState } from 'react'
import { WagmiConfig, configureChains, createConfig } from 'wagmi'
import { optimismGoerli, goerli, baseGoerli, zoraTestnet } from 'wagmi/chains'
import { alchemyProvider } from 'wagmi/providers/alchemy'
import { publicProvider } from 'wagmi/providers/public'
import { metaMaskWallet } from '@rainbow-me/rainbowkit/wallets'
import {
  RainbowKitProvider,
  connectorsForWallets,
} from '@rainbow-me/rainbowkit'

export function Providers({ children }: { children: React.ReactNode }) {
  const { chains, publicClient } = configureChains(
    [goerli, optimismGoerli, baseGoerli, zoraTestnet],
    [
      alchemyProvider({
        apiKey: 'zVuQiy1jllblGInrgT9Lwba2PKjUhtTO',
      }),
      publicProvider(),
    ],
  )

  const projectId = 'AAuto Bridge'

  const connectors = connectorsForWallets([
    {
      groupName: 'Recommended',
      wallets: [metaMaskWallet({ projectId, chains })],
    },
  ])

  const wagmiConfig = createConfig({
    autoConnect: true,
    connectors,
    publicClient,
  })

  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  return (
    <WagmiConfig config={wagmiConfig}>
      <RainbowKitProvider chains={chains}>
        <CacheProvider>
          <ChakraProvider theme={theme}>{mounted && children}</ChakraProvider>
        </CacheProvider>
      </RainbowKitProvider>
    </WagmiConfig>
  )
}
