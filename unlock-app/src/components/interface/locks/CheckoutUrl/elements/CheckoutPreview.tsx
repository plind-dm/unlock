import { Button } from '@unlock-protocol/ui'
import { useEffect, useState } from 'react'
import { Checkout } from '~/components/interface/checkout/alpha/Checkout'
import { selectProvider } from '~/hooks/useAuthenticate'
import { useCheckoutCommunication } from '~/hooks/useCheckoutCommunication'
import { PaywallConfig } from '~/unlockTypes'
import { useConfig } from '~/utils/withConfig'
import useClipboard from 'react-use-clipboard'
import { ToastHelper } from '~/components/helpers/toast.helper'

interface CheckoutPreviewProps {
  paywallConfig?: PaywallConfig
}

export const CheckoutPreview = ({ paywallConfig }: CheckoutPreviewProps) => {
  const [checkoutUrl, setCheckoutUrl] = useState('')
  const config = useConfig()
  // Fetch config from parent in iframe context
  const communication = useCheckoutCommunication()

  const injectedProvider =
    communication.providerAdapter || selectProvider(config)

  const checkoutRedirectURI = ''

  const hasLocks = Object.entries(paywallConfig?.locks ?? {})?.length > 0

  const URL_STRING = `http://localhost:3000/alpha/checkout?redirectUri=${checkoutRedirectURI}&paywallConfig=${encodeURIComponent(
    JSON.stringify(paywallConfig)
  )}`

  useEffect(() => {
    setCheckoutUrl(URL_STRING)
  }, [URL_STRING])

  const [_isCopied, setCopied] = useClipboard(checkoutUrl, {
    successDuration: 2000,
  })

  const buttonVariant = hasLocks ? 'primary' : 'outlined-primary'

  return (
    <div className="flex items-center justify-center w-full py-10 bg-gray-300 rounded-3xl">
      <div className="flex items-center justify-center w-full max-w-lg">
        {paywallConfig ? (
          <div className="flex flex-col items-center w-full gap-4">
            <Checkout
              injectedProvider={injectedProvider as any}
              communication={communication}
              paywallConfig={paywallConfig as any}
              redirectURI={
                checkoutRedirectURI ? new URL(checkoutRedirectURI) : undefined
              }
            />
            <div className="flex flex-col items-center gap-2">
              <span className="text-sm">
                {hasLocks
                  ? ' This checkout modal is ready for you to use.'
                  : 'A Lock is required in order to see the full preview.'}
              </span>
              <div className="flex gap-3">
                <Button
                  size="small"
                  variant={buttonVariant}
                  disabled={!hasLocks}
                  onClick={() => {
                    setCopied()
                    ToastHelper.success('URL copied')
                  }}
                >
                  Copy URL
                </Button>
                <Button
                  size="small"
                  variant={buttonVariant}
                  disabled={!hasLocks}
                >
                  Download JSON
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <span className="text-sm">preview</span>
        )}
      </div>
    </div>
  )
}