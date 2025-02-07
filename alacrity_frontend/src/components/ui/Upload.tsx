"use client"

import type React from "react"

interface UploadIconProps {
  size?: number
  animationDuration?: number
}

const UploadIcon: React.FC<UploadIconProps> = ({ size = 64, animationDuration = 1.5 }) => {
  return (
    <div style={{ width: size, height: size }} className="relative " role="img" aria-label="Animated upload icon">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="#f97316"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-full h-full animate-pulse"
      >
        <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
        <path d="M12 12v9" />
        <path d="m16 16-4-4-4 4" />
      </svg>
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="absolute bg-[#f97316] rounded-full opacity-0"
          style={{
            width: `${4 + Math.random() * 4}px`,
            height: `${4 + Math.random() * 4}px`,
            left: `${20 + Math.random() * 60}%`,
            animation: `moveUpload ${animationDuration}s ease-in-out ${i * 0.3}s infinite`,
          }}
        />
      ))}
      <style jsx>{`
        @keyframes moveUpload {
          0% {
            bottom: -10%;
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
          100% {
            bottom: 100%;
            opacity: 0;
          }
        }
      `}</style>
    </div>
  )
}

export default UploadIcon

