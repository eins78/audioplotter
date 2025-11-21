import React from 'react'
import RToggle from 'react-toggle'
import type { ReactToggleProps } from 'react-toggle'

interface ToggleIconProps {
  t?: string | boolean
}

export const ToggleIcon = ({ t = false }: ToggleIconProps) => (
  <span className="text-white font-sans-serif" style={{ top: '5px', fontWeight: 'bold', position: 'absolute' }}>
    {t}
  </span>
)

interface ToggleProps extends Omit<ReactToggleProps, 'icons'> {
  id: string
  labelTxt: string
  icons?: boolean | { checked: React.ReactNode; unchecked: React.ReactNode }
  className?: string
}

export const Toggle = ({ id, labelTxt, icons = true, className, ...inputProps }: ToggleProps) => {
  let resolvedIcons: ReactToggleProps['icons'] = false
  if (icons === true) {
    resolvedIcons = { checked: <ToggleIcon t={'I'} />, unchecked: <ToggleIcon t={'O'} /> }
  } else if (typeof icons === 'object') {
    resolvedIcons = icons
  }

  return (
    <div className={className}>
      <RToggle id={id} icons={resolvedIcons} {...inputProps} />
      <label className="form-check-label" htmlFor={id}>
        {labelTxt}
      </label>
    </div>
  )
}

interface CheckBoxProps extends Omit<ToggleProps, 'className'> {
  className?: string
  icons?: boolean | { checked: React.ReactNode; unchecked: React.ReactNode }
}

export default function CheckBox({ className = 'mb-2', icons = true, ...toggleProps }: CheckBoxProps) {
  return (
    <div className={className}>
      <Toggle icons={icons} {...toggleProps} />
    </div>
  )
}
