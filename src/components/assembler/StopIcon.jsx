import React from 'react'

function StopIcon({ color = 'currentColor', size = 24, ...props }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size} height={size}
      role="img"
      aria-label="Stop sign icon"
      {...props}
    >
      <mask id="stop-mask">
        {/* Octagon area (visible part) */}
        <polygon fill="white"
          points="7.07,2 16.93,2 22,7.07 22,16.93 16.93,22 7.07,22 2,16.93 2,7.07" />
        {/* Text area (cut out) */}
        <text x="12" y="12.3"
          fill="black"
          fontFamily="Arial, Helvetica, sans-serif"
          fontWeight="700"
          fontSize="7.2"
          textAnchor="middle"
          dominantBaseline="middle">STOP</text>
      </mask>

      {/* Octagon using mask */}
      <rect width="24" height="24" fill={color} mask="url(#stop-mask)" />
    </svg>
  )
}

export default StopIcon


