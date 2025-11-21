declare module 'react-svg-path' {
  import type { SVGAttributes, ForwardRefExoticComponent, RefAttributes } from 'react'

  export interface SvgProps extends SVGAttributes<SVGSVGElement> {
    className?: string
    width?: number | string
    height?: number | string
    viewBox?: string
    children?: React.ReactNode
  }

  export interface PolylineProps extends SVGAttributes<SVGPolylineElement> {
    points: number[][] | string
    stroke?: string
    strokeWidth?: number
    fill?: string
    strokeLinecap?: 'butt' | 'round' | 'square'
  }

  export interface QuadProps extends SVGAttributes<SVGPathElement> {
    T: number[][]
    stroke?: string
    strokeWidth?: number
    fill?: string
    strokeLinecap?: 'butt' | 'round' | 'square'
  }

  export const Svg: ForwardRefExoticComponent<SvgProps & RefAttributes<SVGSVGElement>>
  export const Polyline: React.FC<PolylineProps>
  export const Quad: React.FC<QuadProps>
}
