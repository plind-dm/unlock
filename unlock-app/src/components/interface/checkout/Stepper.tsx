import { RiCheckLine } from 'react-icons/ri'
import { Tooltip } from '@unlock-protocol/ui'
import { twMerge } from 'tailwind-merge'
import { ReactNode } from 'react'
import { IoIosRocket as RocketIcon } from 'react-icons/io'
import { CheckoutService } from './main/checkoutMachine'
import { UnlockAccountService } from './UnlockAccount/unlockAccountMachine'

interface IconProps {
  active?: boolean
}

export const Step = ({
  active,
  children = 1,
}: IconProps & { children?: ReactNode }) => {
  const stepIconClass = twMerge(
    `flex items-center justify-center font-medium border-gray-300 box-border border w-5 text-xs h-5 rounded-full cursor-default`,
    active && 'bg-ui-main-500 text-white border-none'
  )
  return <div className={stepIconClass}>{children}</div>
}

export const StepFinish = () => {
  const finishIconClass = twMerge(
    `font-medium box-border border p-0.5 w-5 text-xs h-5 rounded-full cursor-default bg-ui-main-500 text-white fill-white border-none`
  )
  return <RiCheckLine size={20} className={finishIconClass} />
}

export const StepFinished = ({ active }: IconProps) => {
  const finishedIconClass = twMerge(
    `font-medium box-border border w-5 p-0.5 text-xs h-5 rounded-full cursor-default`,
    active && 'bg-ui-main-500 text-white fill-white border-none'
  )
  return <RocketIcon size={20} className={finishedIconClass} />
}

interface StepButtonProps {
  children?: ReactNode
  onClick(): void | Promise<void>
  label?: string
}

export const StepButton = ({
  children = 1,
  onClick,
  label,
}: StepButtonProps) => {
  const stepIconClass = twMerge(
    `flex items-center justify-center font-medium border-gray-300 box-border border w-5 text-xs h-5 rounded-full hover:bg-gray-50`
  )
  return (
    <Tooltip side="top" delay={0} label={label} tip={label}>
      <button
        className={stepIconClass}
        onClick={(event) => {
          event.preventDefault()
          onClick()
        }}
        type="button"
      >
        {children}
      </button>
    </Tooltip>
  )
}

export const StepTitle = ({ children }: { children: ReactNode }) => {
  return (
    <h4 className="text-sm" style={{ marginLeft: 10 }}>
      {children}
    </h4>
  )
}

export interface StepItem {
  id: number
  name: string
  to?: string
  skip?: boolean
}

interface StepperProps {
  items?: StepItem[]
  position: number
  service: CheckoutService | UnlockAccountService
  disabled?: boolean
  locked?: boolean
}

// eslint-disable-next-line no-empty-pattern
export const Stepper = ({ locked }: StepperProps) => {
  return (
    <>
      {!locked ? (
        <div className="flex w-full p-2 pl-6 border-b">
          <StepFinish />
          <StepTitle>
            <span className="text-ui-main-500">
              {`Authentication successful!`}
            </span>
          </StepTitle>
        </div>
      ) : (
        <div className="flex justify-around w-full p-2 border-b">
          <div className="flex">
            <Step active>1</Step>
            <StepTitle>{`Connect your crypto wallet`}</StepTitle>
          </div>
          <div className="flex">
            <Step active>2</Step>
            <StepTitle>{`Verify locked $RDNT`}</StepTitle>
          </div>
        </div>
      )}
    </>
  )
}
