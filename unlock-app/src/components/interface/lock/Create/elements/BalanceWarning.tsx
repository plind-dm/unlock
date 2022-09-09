import { useEffect, useState } from 'react'
import { useAuth } from '~/contexts/AuthenticationContext'
import useAccount from '~/hooks/useAccount'
import { useConfig } from '~/utils/withConfig'

interface LinkProps {
  label: string
  link: string
  ref: string
}

const CALL_TO_ACTION_MAPPING: Record<number, LinkProps> = {
  1: {
    label: 'Purchase some Ether using ',
    link: 'https://www.coinbase.com/',
    ref: 'Coinbase',
  },
  100: {
    label: 'Transfer some Ethereum&apos;s DAI to the xDAI chain using ',
    link: 'https://omni.xdaichain.com/bridge',
    ref: 'the Omnibridge.',
  },
  137: {
    label: 'Transfer some Matic to the Polygon chain using ',
    link: 'https://wallet.matic.network/bridge',
    ref: 'the Bridge.',
  },
}

const CallToAction = ({ network }: { network: number }) => {
  const config = useConfig()
  const info = CALL_TO_ACTION_MAPPING[network]

  if (!info) return null

  const currency = config.networks[network!].baseCurrencySymbol
  const networkName = config.networks[network!].name
  return (
    <div className="p-2 text-red-700 bg-red-100 border-2 border-red-500 rounded-xl">
      <span>
        {` You currently do not have any ${currency} token to pay for gas to deploy
        on the ${networkName} network.`}
      </span>
      <>
        <span>{` ${info?.label}`}</span>
        <a
          className="underline"
          href={info.link}
          target="_blank"
          rel="noreferrer"
        >
          {info.ref}
        </a>
      </>
    </div>
  )
}
export const BalanceWarning = () => {
  const { account, network } = useAuth()
  const { getTokenBalance } = useAccount(account!, network!)

  const [balance, setBalance] = useState(-1)

  useEffect(() => {
    const getBalance = async () => {
      const _balance = await getTokenBalance('')
      setBalance(parseFloat(_balance))
    }
    getBalance()
  }, [account, getTokenBalance, network])

  if (balance !== 0) {
    return null
  }

  if (!network) return null

  return <CallToAction network={network} />
}