'use client'

import { CacheProvider } from '@chakra-ui/next-js'
import { ChakraProvider } from '@chakra-ui/react'
import { theme } from '../app/style'

import { useEffect, useState } from 'react'

export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  return (
    <CacheProvider>
      <ChakraProvider theme={theme}>{mounted && children}</ChakraProvider>
    </CacheProvider>
  )
}
