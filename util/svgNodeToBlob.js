// from <https://stackoverflow.com/a/44320679>
export default function svgNodeToBlob(node) {
  const svgDocType = document.implementation.createDocumentType(
    'svg',
    '-//W3C//DTD SVG 1.1//EN',
    'http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd'
  )
  const svgDoc = document.implementation.createDocument('http://www.w3.org/2000/svg', 'svg', svgDocType)
  svgDoc.replaceChild(node.cloneNode(true), svgDoc.documentElement)
  const svgData = new XMLSerializer().serializeToString(svgDoc)
  const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf8' })
  return blob
}
