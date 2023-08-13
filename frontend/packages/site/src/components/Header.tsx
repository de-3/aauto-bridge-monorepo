'use client'

import { HStack, Text, Container } from '@chakra-ui/react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { FC } from 'react'

export const Header: FC<{}> = () => {
  return (
    <Container maxW="container.xl">
      <HStack w="full" justify="space-between" my={8}>
        <Text>AAuto Bridge</Text>
        <HStack>
          <ConnectButton />
        </HStack>
      </HStack>
    </Container>
  )
}
