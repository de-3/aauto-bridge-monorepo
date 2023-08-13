'use client'

import { HStack, Container, Image, useColorMode } from '@chakra-ui/react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { FC } from 'react'

export const Header: FC<{}> = () => {
  const { colorMode } = useColorMode()
  return (
    <Container maxW="container.xl">
      <HStack w="full" justify="space-between" my={8}>
        <Image
          src={`/images/logo-${colorMode == 'light' ? 'black' : 'white'}.png`}
          alt="AAutoBridge"
          w={300}
          objectFit="cover"
          h={100}
        />
        <HStack>
          <ConnectButton />
        </HStack>
      </HStack>
    </Container>
  )
}
