declare module 'react-svg-path' {
  import { ComponentType, SVGProps } from 'react'

  export interface PathBuilder {
    moveTo(x: number, y: number): PathBuilder
    lineTo(x: number, y: number): PathBuilder
    curveTo(x1: number, y1: number, x2: number, y2: number, x: number, y: number): PathBuilder
    smoothCurveTo(x2: number, y2: number, x: number, y: number): PathBuilder
    quadraticCurveTo(x1: number, y1: number, x: number, y: number): PathBuilder
    smoothQuadraticCurveTo(x: number, y: number): PathBuilder
    arc(rx: number, ry: number, xAxisRotation: number, largeArc: boolean, sweep: boolean, x: number, y: number): PathBuilder
    close(): PathBuilder
    toComponent(): ComponentType<SVGProps<SVGPathElement>>
  }

  export const Svg: ComponentType<SVGProps<SVGSVGElement> & { width?: number; height?: number; children?: React.ReactNode }>
  export const Path: ComponentType<SVGProps<SVGPathElement> & { d?: string | PathBuilder }>
  export const Rect: ComponentType<SVGProps<SVGRectElement>>
  export const Circle: ComponentType<SVGProps<SVGCircleElement>>
  export const Ellipse: ComponentType<SVGProps<SVGEllipseElement>>
  export const Line: ComponentType<SVGProps<SVGLineElement>>
  export const Polyline: ComponentType<Omit<SVGProps<SVGPolylineElement>, 'points'> & { points?: string | number[][] }>
  export const Polygon: ComponentType<Omit<SVGProps<SVGPolygonElement>, 'points'> & { points?: string | number[][] }>
  export const Text: ComponentType<SVGProps<SVGTextElement>>
  export const G: ComponentType<SVGProps<SVGGElement>>

  export function path(): PathBuilder
}
