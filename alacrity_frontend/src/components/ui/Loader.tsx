"use client"

import type React from "react"

const LoadingSpinner: React.FC = () => {
  return (
    <div className="w-[calc(3*30px+26px)] h-[calc(2*30px+26px)] p-0 mx-auto my-[10px] xl:p-2 relative">
      {[...Array(5)].map((_, index) => (
        <div
          key={index}
          className="inline-block bg-primary rounded-[2px] w-[26px] h-[26px] absolute p-0 m-0 text-[6pt] text-black"
          style={{
            animation: `square${index + 1} 2.4s 0.2s ease-in-out infinite, 
                        squarefadein 0.4s ${0.1 * (index + 1)}s ease-out both`,
            left: `calc(${Math.floor(index / 2)} * 30px)`,
            top: `calc(${index % 2} * 30px)`,
          }}
        />
      ))}
      <style jsx>{`
        @keyframes square1 {
          0%, 8.33%, 100% { left: calc(0 * 30px); top: calc(0 * 30px); }
          8.33%, 100% { top: calc(1 * 30px); }
        }
        @keyframes square2 {
          0% { left: calc(0 * 30px); top: calc(1 * 30px); }
          8.33% { top: calc(2 * 30px); }
          16.67% { left: calc(1 * 30px); top: calc(2 * 30px); }
          25%, 83.33% { left: calc(1 * 30px); top: calc(1 * 30px); }
          91.67% { left: calc(1 * 30px); top: calc(0 * 30px); }
          100% { left: calc(0 * 30px); top: calc(0 * 30px); }
        }
        @keyframes square3 {
          0%, 100% { left: calc(1 * 30px); top: calc(1 * 30px); }
          25% { top: calc(0 * 30px); }
          33.33% { left: calc(2 * 30px); top: calc(0 * 30px); }
          41.67%, 66.67% { left: calc(2 * 30px); top: calc(1 * 30px); }
          75% { left: calc(2 * 30px); top: calc(2 * 30px); }
          83.33% { left: calc(1 * 30px); top: calc(2 * 30px); }
        }
        @keyframes square4 {
          0%, 33.33% { left: calc(2 * 30px); top: calc(1 * 30px); }
          41.67% { top: calc(2 * 30px); }
          50% { left: calc(3 * 30px); top: calc(2 * 30px); }
          58.33%, 100% { left: calc(3 * 30px); top: calc(1 * 30px); }
        }
        @keyframes square5 {
          0%, 50% { left: calc(3 * 30px); top: calc(1 * 30px); }
          58.33% { top: calc(0 * 30px); }
          66.67% { left: calc(2 * 30px); top: calc(0 * 30px); }
          75%, 100% { left: calc(2 * 30px); top: calc(1 * 30px); }
        }
        @keyframes squarefadein {
          0% { transform: scale(0.75); opacity: 0; }
          100% { transform: scale(1.0); opacity: 1; }
        }
      `}</style>
    </div>
  )
}

export default LoadingSpinner

