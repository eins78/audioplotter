import React from 'react'
import RToggle, { type ToggleProps } from 'react-toggle'

interface ToggleIconProps {
  t?: string | false
}

export const ToggleIcon = ({ t = false }: ToggleIconProps) => (
  <span className="text-white font-sans-serif" style={{ top: '5px', fontWeight: 'bold', position: 'absolute' }}>
    {t}
  </span>
)

interface ToggleComponentProps extends ToggleProps {
  labelTxt?: string
  icons?: boolean | { checked?: React.ReactNode; unchecked?: React.ReactNode }
}

export const Toggle = ({ id, labelTxt, icons = true, className, ...inputProps }: ToggleComponentProps) => {
  let toggleIcons = icons
  if (icons === true) {
    toggleIcons = { checked: <ToggleIcon t={'I'} />, unchecked: <ToggleIcon t={'O'} /> }
  }
  return (
    <div className={className}>
      <RToggle id={id} icons={toggleIcons} {...inputProps} />
      <label className="form-check-label" htmlFor={id}>
        {labelTxt}
      </label>
    </div>
  )
}

interface CheckBoxProps extends Omit<ToggleComponentProps, 'className'> {
  className?: string
}

export default function CheckBox({ className = 'mb-2', icons = true, ...toggleProps }: CheckBoxProps) {
  return (
    <div className={className}>
      <Toggle icons={icons} {...toggleProps} />
    </div>
  )
}
