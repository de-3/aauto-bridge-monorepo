'use client'

import { ComponentProps } from 'react'
import { Box, Button, Text, Image } from '@chakra-ui/react'
import { shouldDisplayReconnectButton } from '@/utils/button'
import { MetamaskState } from '@/types/metamask'

export const InstallFlaskButton = () => (
  <Button as="a" href="https://metamask.io/flask/" target="_blank">
    <Image src="/images/flask_fox.svg" alt="Flask" />
    <Text>Install MetaMask Flask</Text>
  </Button>
)

export const ConnectButton = (props: ComponentProps<typeof Button>) => {
  return (
    <Button {...props}>
      <Image src="/images/flask_fox.svg" alt="Flask" />
      <Text>Connect</Text>
    </Button>
  )
}

export const ReconnectButton = (props: ComponentProps<typeof Button>) => {
  return (
    <Button {...props}>
      <Image src="/images/flask_fox.svg" alt="Flask" />
      <Text>Reconnect</Text>
    </Button>
  )
}

export const SendHelloButton = (props: ComponentProps<typeof Button>) => {
  return <Button {...props}>Send message</Button>
}

export const HeaderButtons = ({
  state,
  onConnectClick,
}: {
  state: MetamaskState
  onConnectClick(): unknown
}) => {
  if (!state.isFlask && !state.installedSnap) {
    return <InstallFlaskButton />
  }

  if (!state.installedSnap) {
    return <ConnectButton onClick={onConnectClick} />
  }

  if (shouldDisplayReconnectButton(state.installedSnap)) {
    return <ReconnectButton onClick={onConnectClick} />
  }

  return (
    <Box>
      <Text>Connected</Text>
    </Box>
  )
}
