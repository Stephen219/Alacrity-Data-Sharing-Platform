"use client"

import { useState, useEffect, useRef } from "react"



interface HealthCategoryInputProps {
  category: string;
  onCategoryChange: (value: string) => void;
}

export default function HealthCategoryInput({ category, onCategoryChange }: HealthCategoryInputProps) {
  const [isOpen, setIsOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const healthCategories = [
    { value: "Thyroid", label: "Thyroid Conditions" },
    { value: "HIV", label: "HIV/AIDS" },
    { value: "Smoking", label: "Smoking-Related Diseases" },
    { value: "Pancreatic Cancer", label: "Pancreatic Cancer" },
    { value: "Cancer", label: "Cancer" },
    { value: "Diabetes", label: "Diabetes Management" },
    { value: "Mental Health", label: "Mental Health" },
    { value: "Heart Disease", label: "Heart Disease" },
  ]

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleSelect = (value: string) => {
    onCategoryChange(value)
    setIsOpen(false)
  }

  return (
    <div className="relative">
      <input
        ref={inputRef}
        list="healthCategories"
        id="category"
        value={category}
        onChange={(e) => onCategoryChange(e.target.value)}
        onFocus={() => setIsOpen(true)}
        placeholder="Select or type a category"
        className="w-full px-3 py-2 border border-[#f97316] rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#f97316] focus:border-[#f97316] transition-colors dark:bg-gray-700 dark:text-white"
      />
      <datalist id="healthCategories">
        {healthCategories.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </datalist>
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto dark:bg-gray-800 dark:border-gray-700"
        >
          {healthCategories.map((option) => (
            <div
              key={option.value}
              onClick={() => handleSelect(option.value)}
              className="px-3 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <div className="font-medium">{option.value}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">{option.label}</div>
            </div>
          ))}
        </div>
      )}
      <div
        className="absolute right-3 top-2.5 cursor-pointer"
        onClick={() => {
          setIsOpen(!isOpen)
          if (!isOpen) inputRef.current?.focus()
        }}
      >
        <svg
          className="h-5 w-5 text-gray-400 pointer-events-none dark:text-gray-100"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </div>
    </div>
  )
}