import React from 'react'
import RToggle from 'react-toggle'

export const ToggleIcon = ({ t = false }) => (
  <span className="text-white font-sans-serif" style={{ top: '5px', fontWeight: 'bold', position: 'absolute' }}>
    {t}
  </span>
)

export const Toggle = ({ id, labelTxt, icons = true, className, ...inputProps }) => {
  if (icons === true) {
    icons = { checked: <ToggleIcon t={'I'} />, unchecked: <ToggleIcon t={'O'} /> }
  }
  return (
    <div className={className}>
      <RToggle id={id} icons={icons} {...inputProps} />
      <label className="form-check-label" htmlFor={id}>
        {labelTxt}
      </label>
    </div>
  )
}

export default function CheckBox({ className = 'mb-2', icons = true, ...toggleProps }) {
  return (
    <div className={className}>
      <Toggle icons={icons} {...toggleProps} />
    </div>
  )
}
