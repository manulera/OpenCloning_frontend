import React from 'react'
import mermaid from 'mermaid'

function Mermaid({ string }) {
  const mermaidRef = React.useRef(null)
  const [svgContent, setSvgContent] = React.useState('')

  React.useEffect(() => {
    if (!mermaidRef.current || !string) {
      setSvgContent('')
      return
    }

    // Clear previous content
    mermaidRef.current.innerHTML = ''

    // Generate unique ID for this render
    const id = `mermaid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    // Render mermaid diagram
    mermaid.render(id, string)
      .then(({ svg }) => {
        if (mermaidRef.current) {
          mermaidRef.current.innerHTML = svg
        }
      })
      .catch((error) => {
        // eslint-disable-next-line no-console
        console.error('Mermaid rendering error:', error)
        if (mermaidRef.current) {
          mermaidRef.current.innerHTML = '<p>Error rendering diagram</p>'
        }
      })

    // Cleanup function
    return () => {
      if (mermaidRef.current) {
        mermaidRef.current.innerHTML = ''
      }
    }
  }, [string])

  return (
    <div ref={mermaidRef} style={{ display: 'flex', justifyContent: 'center' }}>
    </div>
  )
}

export default Mermaid
