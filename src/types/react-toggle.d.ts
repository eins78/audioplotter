declare module 'react-toggle' {
  import { ComponentType, ReactNode } from 'react'

  export interface ToggleProps {
    checked?: boolean
    defaultChecked?: boolean
    onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void
    onFocus?: (event: React.FocusEvent<HTMLInputElement>) => void
    onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void
    className?: string
    name?: string
    value?: string
    id?: string
    'aria-labelledby'?: string
    'aria-label'?: string
    disabled?: boolean
    icons?: {
      checked?: ReactNode
      unchecked?: ReactNode
    } | boolean
  }

  const Toggle: ComponentType<ToggleProps>
  export default Toggle
}

declare module 'react-toggle/style.css' {
  const content: { [className: string]: string }
  export default content
}
