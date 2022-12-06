import { Button, Tooltip } from '@unlock-protocol/ui'
import { useActor } from '@xstate/react'
import { ReactNode, useEffect, useState } from 'react'
import { useAuth } from '~/contexts/AuthenticationContext'
import { useAuthenticate } from '~/hooks/useAuthenticate'
import { addressMinify, minifyEmail } from '~/utils/strings'
import { CheckoutService } from './main/checkoutMachine'
import { ConnectService } from './Connect/connectMachine'
interface SignedInProps {
  onDisconnect?: () => void
  isUnlockAccount: boolean
  email?: string
  account?: string
}

export function SignedIn({
  onDisconnect,
  isUnlockAccount,
  email,
  account,
}: SignedInProps) {
  let userText: string
  let signOutText: string

  if (isUnlockAccount && email) {
    userText = `User: ${minifyEmail(email)}`
    signOutText = 'Sign out'
  } else {
    userText = `Wallet: ${addressMinify(account!)}`
    signOutText = 'Disconnect'
  }

  return (
    <div className="flex items-center justify-between text-sm">
      <p> {userText}</p>
      <Tooltip
        delay={50}
        side="top"
        tip={`${
          isUnlockAccount ? 'Signing out' : 'Disconnecting'
        } will reset the flow`}
      >
        {onDisconnect && (
          <button
            className="font-medium text-gray-600 hover:text-black"
            onClick={onDisconnect}
            type="button"
          >
            {signOutText}
          </button>
        )}
      </Tooltip>
    </div>
  )
}

interface SignedOutProps {
  authenticateWithProvider(
    provider: 'METAMASK' | 'UNLOCK' | 'WALLET_CONNECT' | 'COINBASE'
  ): Promise<void>
  onUnlockAccount(): void
  isLoading?: boolean
  injectedProvider: any
}

export function SignedOut({
  authenticateWithProvider,
  isLoading,
  injectedProvider,
}: SignedOutProps) {
  const [, setIsDownloadWallet] = useState(false)
  console.log('isLoading', isLoading)
  const onInjectedHandler = () => {
    if (injectedProvider) {
      return authenticateWithProvider('METAMASK')
    }

    if (
      navigator.userAgent.match(/Android/i) ||
      navigator.userAgent.match(/iPhone/i)
    ) {
      return authenticateWithProvider('WALLET_CONNECT')
    }

    setIsDownloadWallet(true)
  }

  return (
    <div className="grid w-full">
      <Button
        disabled={isLoading}
        onClick={onInjectedHandler}
        className="hover:opacity-50 hover:bg-brand-ui-primary"
      >
        Connect Wallet
      </Button>
    </div>
  )
}

interface ConnectedCheckoutProps {
  injectedProvider?: unknown
  service: CheckoutService | ConnectService
  isLoading?: boolean
  children?: ReactNode
}

export function Connected({
  service,
  injectedProvider,
  isLoading,
  children,
}: ConnectedCheckoutProps) {
  const [state, send] = useActor(service)
  const { account, email, isUnlockAccount, deAuthenticate } = useAuth()
  const { authenticateWithProvider } = useAuthenticate({
    injectedProvider,
  })

  useEffect(() => {
    if (account) {
      send('DISCONNECT')
      deAuthenticate()
    }
  }, [account, send, deAuthenticate])

  const onDisconnect = () => {
    send('DISCONNECT')
    deAuthenticate()
  }
  return account ? (
    <div className="space-y-2">
      {children}
      <SignedIn
        account={account}
        email={email}
        isUnlockAccount={!!isUnlockAccount}
        onDisconnect={state.can('DISCONNECT') ? onDisconnect : undefined}
      />
    </div>
  ) : (
    <div>
      <SignedOut
        injectedProvider={injectedProvider}
        isLoading={isLoading}
        onUnlockAccount={() => {
          send('UNLOCK_ACCOUNT')
        }}
        authenticateWithProvider={authenticateWithProvider}
      />
    </div>
  )
}
