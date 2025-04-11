"use client"

import { useEffect, useState, useRef } from "react"
import { createPortal } from "react-dom"
import { ChevronLeft, ChevronRight, X } from "lucide-react"

export type Placement = "top" | "bottom" | "left" | "right"

interface TourTooltipProps {
  target: string
  content: string
  placement?: Placement
  currentStep: number
  totalSteps: number
  onNext: () => void
  onPrev: () => void
  onSkip: () => void
}

const TourTooltip = ({
  target,
  content,
  placement = "bottom",
  currentStep,
  totalSteps,
  onNext,
  onPrev,
  onSkip,
}: TourTooltipProps) => {
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const tooltipRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const calculatePosition = () => {
      const targetElement = document.querySelector(target)
      if (!targetElement || !tooltipRef.current) return

      const targetRect = targetElement.getBoundingClientRect()
      const tooltipRect = tooltipRef.current.getBoundingClientRect()

      let top = 0
      let left = 0

      switch (placement) {
        case "top":
          top = targetRect.top - tooltipRect.height - 10 + window.scrollY
          left = targetRect.left + targetRect.width / 2 - tooltipRect.width / 2 + window.scrollX
          break
        case "bottom":
          top = targetRect.bottom + 10 + window.scrollY
          left = targetRect.left + targetRect.width / 2 - tooltipRect.width / 2 + window.scrollX
          break
        case "left":
          top = targetRect.top + targetRect.height / 2 - tooltipRect.height / 2 + window.scrollY
          left = targetRect.left - tooltipRect.width - 10 + window.scrollX
          break
        case "right":
          top = targetRect.top + targetRect.height / 2 - tooltipRect.height / 2 + window.scrollY
          left = targetRect.right + 10 + window.scrollX
          break
      }

     
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight

      if (left < 10) left = 10
      if (left + tooltipRect.width > viewportWidth - 10) left = viewportWidth - tooltipRect.width - 10

      if (top < 10) top = 10
      if (top + tooltipRect.height > viewportHeight + window.scrollY - 10) {
        top = viewportHeight + window.scrollY - tooltipRect.height - 10
      }

      setPosition({ top, left })
    }

   
    calculatePosition()
    window.addEventListener("resize", calculatePosition)
    window.addEventListener("scroll", calculatePosition)

    
    const targetElement = document.querySelector(target) as HTMLElement
    if (targetElement) {
      targetElement.style.position = "relative"
      targetElement.style.zIndex = "50"
      targetElement.style.boxShadow = "0 0 0 4px rgba(249, 115, 22, 0.5)"
      targetElement.style.borderRadius = "4px"
    }

    return () => {
      window.removeEventListener("resize", calculatePosition)
      window.removeEventListener("scroll", calculatePosition)

      
      if (targetElement) {
        targetElement.style.position = ""
        targetElement.style.zIndex = ""
        targetElement.style.boxShadow = ""
        targetElement.style.borderRadius = ""
      }
    }
  }, [target, placement])

  
  const getArrowStyle = () => {
    switch (placement) {
      case "top":
        return {
          bottom: "-8px",
          left: "50%",
          transform: "translateX(-50%) rotate(45deg)",
          borderLeft: "none",
          borderTop: "none",
        }
      case "bottom":
        return {
          top: "-8px",
          left: "50%",
          transform: "translateX(-50%) rotate(45deg)",
          borderRight: "none",
          borderBottom: "none",
        }
      case "left":
        return {
          right: "-8px",
          top: "50%",
          transform: "translateY(-50%) rotate(45deg)",
          borderLeft: "none",
          borderBottom: "none",
        }
      case "right":
        return {
          left: "-8px",
          top: "50%",
          transform: "translateY(-50%) rotate(45deg)",
          borderRight: "none",
          borderTop: "none",
        }
    }
  }

  if (!mounted) return null

  return createPortal(
    <div
      ref={tooltipRef}
      className="fixed z-50 w-64 p-4 rounded-lg shadow-lg bg-white border border-orange-200"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
    >
      {/* Arrow */}
      <div className="absolute w-4 h-4 bg-white border border-orange-200" style={getArrowStyle()} />

      {/* Close button */}
      <button
        onClick={onSkip}
        className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
        aria-label="Close tour"
      >
        <X size={16} />
      </button>

      {/* Content */}
      <div className="mb-4 text-gray-700">{content}</div>

      {/* Progress and navigation */}
      <div className="flex items-center justify-between">
        <div className="text-xs text-gray-500">
          Step {currentStep} of {totalSteps}
        </div>
        <div className="flex space-x-2">
          {currentStep > 1 && (
            <button onClick={onPrev} className="p-1 rounded-full hover:bg-orange-100" aria-label="Previous step">
              <ChevronLeft size={18} className="text-orange-500" />
            </button>
          )}
          {currentStep < totalSteps ? (
            <button onClick={onNext} className="p-1 rounded-full hover:bg-orange-100" aria-label="Next step">
              <ChevronRight size={18} className="text-orange-500" />
            </button>
          ) : (
            <button onClick={onSkip} className="text-xs font-medium px-2 py-1 rounded bg-orange-500 text-white">
              Finish
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}

export default TourTooltip

