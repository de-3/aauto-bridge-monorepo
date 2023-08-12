'use client'

import { HStack, Text, Container } from '@chakra-ui/react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { FC } from 'react'

export const Header: FC<{}> = () => {
  return (
    <Container>
      <HStack w="full" justify="space-between">
        <Text>AAuto Bridge</Text>
        <HStack>
          <ConnectButton />
        </HStack>
      </HStack>
    </Container>
  )
}
