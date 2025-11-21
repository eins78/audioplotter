declare module 'react-toggle' {
  import type { InputHTMLAttributes } from 'react'

  export interface ReactToggleProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
    checked?: boolean
    disabled?: boolean
    icons?: {
      checked?: React.ReactNode
      unchecked?: React.ReactNode
    } | false
    onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void
    className?: string
    id?: string
    name?: string
    value?: string
    'aria-labelledby'?: string
    'aria-label'?: string
  }

  export default class ReactToggle extends React.Component<ReactToggleProps> {}
}
