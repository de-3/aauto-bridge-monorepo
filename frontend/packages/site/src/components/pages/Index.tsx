'use client'

import { Card, CardBody, Container, Text } from '@chakra-ui/react'
import { FC, useState } from 'react'
import {
  InstallFlaskButton,
  ConnectButton,
  ReconnectButton,
  SendHelloButton,
  StoreSettingsButton,
} from '../Button'
import { shouldDisplayReconnectButton } from '@/utils/button'
import { MetamaskState } from '@/types/metamask'
import { connectSnap, getSnap, storeSettings } from '@/utils/snap'
import { useSendTransaction } from 'wagmi'
import { parseEther } from 'viem'

export const IndexPage: FC<{}> = () => {
  const [metamaskState, setMetamaskState] = useState<MetamaskState>({
    isFlask: false,
  })
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

  const { sendTransaction } = useSendTransaction({
    to: '0x5305f701cc749Acf1146E6DE47E10D094C20dbe9',
    value: BigInt(0),
  })

  const handleSendHelloClick = async () => {
    try {
      await sendTransaction()

      //   await sendHello()
    } catch (e) {
      console.error(e)
      setMetamaskState({
        ...metamaskState,
        error: e as Error,
      })
    }
  }

  const handleStoreSettings = async () => {
    try {
      await storeSettings(
        420,
        parseEther('0.8'),
        parseEther('0.7'),
        5,
        '0x32a490634ECc437Eb71d7667991E7C34E8fbFb68',
        process.env.NEXT_PUBLIC_PRIVATE_KEY ?? '',
      )
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
      <Text fontSize="xl">Welcome to AAutoBridge</Text>
      <Card>
        {metamaskState.error && (
          <Card>
            <CardBody>
              <Text color="red.500">
                <b>An error happened:</b> {metamaskState.error.message}
              </Text>
            </CardBody>
          </Card>
        )}
        {!metamaskState.isFlask && (
          <Card>
            <CardBody>
              <Text>
                Snaps is pre-release software only available in MetaMask Flask,
                a canary distribution for developers with access to upcoming
                features.
              </Text>
              <InstallFlaskButton />
            </CardBody>
          </Card>
        )}
        {!metamaskState.installedSnap && (
          <Card>
            <CardBody>
              <Text>
                Get started by connecting to and installing the example snap.
              </Text>
              <ConnectButton
                onClick={handleConnectClick}
                disabled={!metamaskState.isFlask}
              />
            </CardBody>
          </Card>
        )}
        {shouldDisplayReconnectButton(metamaskState.installedSnap) && (
          <Card>
            <CardBody>
              <Text>
                While connected to a local running snap this button will always
                be displayed in order to update the snap if a change is made.
              </Text>
              <ReconnectButton
                onClick={handleConnectClick}
                disabled={!metamaskState.installedSnap}
              />
            </CardBody>
          </Card>
        )}

        <Card>
          <CardBody>
            <Text>
              Display a custom message within a confirmation screen in MetaMask.
            </Text>
            <StoreSettingsButton
              onClick={handleStoreSettings}
              disabled={!metamaskState.installedSnap}
            />
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <Text>
              Display a custom message within a confirmation screen in MetaMask.
            </Text>
            <SendHelloButton
              onClick={handleSendHelloClick}
              disabled={!metamaskState.installedSnap}
            />
          </CardBody>
        </Card>
      </Card>
    </Container>
  )
}
