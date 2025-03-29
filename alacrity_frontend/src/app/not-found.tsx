"use client"

import Link from "next/link"

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center  bg-white">
      <div className="w-full max-w-md px-4 py-8 text-center">
  
        <div className="mx-auto w-72 h-72 mb-6 relative">
          <svg viewBox="0 0 240 240" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        
            <circle cx="120" cy="120" r="100" fill="#FEF3C7" className="opacity-50" />
            <text x="70" y="60" fontSize="16" fill="#f97316" opacity="0.3" className="animate-fade-in-out">
              ?
            </text>
            <text x="180" y="90" fontSize="20" fill="#f97316" opacity="0.3" className="animate-fade-in-out-delay">
              ?
            </text>
            <text x="50" y="150" fontSize="24" fill="#f97316" opacity="0.3" className="animate-fade-in-out-delay-2">
              ?
            </text>
            <text x="160" y="170" fontSize="18" fill="#f97316" opacity="0.3" className="animate-fade-in-out-delay-3">
              ?
            </text>

        
            <path
              d="M60,180 Q90,160 120,180 Q150,200 180,180"
              stroke="#f97316"
              strokeWidth="2"
              strokeDasharray="5,5"
              fill="none"
              className="animate-draw-path"
            />
            <circle cx="60" cy="180" r="4" fill="#f97316" />
            <circle cx="180" cy="180" r="4" fill="#f97316" />
            <text x="185" y="175" fontSize="12" fill="#f97316">
              X
            </text>

            {/* Lost character */}
            <g className="animate-float">
              {/* Body */}
              <circle cx="120" cy="120" r="40" fill="#f97316" />

              {/* Eyes - animated to look around */}
              <g className="animate-look-around">
                <circle cx="105" cy="110" r="8" fill="white" />
                <circle cx="135" cy="110" r="8" fill="white" />
                <circle cx="107" cy="110" r="4" fill="#333" />
                <circle cx="137" cy="110" r="4" fill="#333" />
              </g>

         
              <path d="M110 135 Q120 130 130 135" stroke="white" strokeWidth="3" strokeLinecap="round" />

             
              <g className="animate-scratch-head">
                <path d="M150 100 Q160 90 165 100" stroke="#f97316" strokeWidth="6" strokeLinecap="round" fill="none" />
                <path d="M165 100 L170 95" stroke="#f97316" strokeWidth="4" strokeLinecap="round" />
                <path d="M165 100 L170 105" stroke="#f97316" strokeWidth="4" strokeLinecap="round" />
              </g>

           
              <path
                d="M90 100 Q88 110 90 115"
                stroke="#A5F3FC"
                strokeWidth="2"
                fill="#A5F3FC"
                className="animate-sweat-drop"
              />
            </g>

         
            <g className="animate-rotate-slightly">
              <circle cx="70" cy="90" r="15" fill="white" stroke="#f97316" strokeWidth="2" />
              <path d="M70 80 L70 100" stroke="#f97316" strokeWidth="2" />
              <path d="M60 90 L80 90" stroke="#f97316" strokeWidth="2" />
              <path d="M70 80 L75 85" stroke="#f97316" strokeWidth="1" />
              <path d="M70 80 L65 85" stroke="#f97316" strokeWidth="1" />
            </g>

            <path d="M40,200 C42,198 44,198 46,200" stroke="#f97316" strokeWidth="1" className="animate-footprint-1" />
            <path d="M60,200 C62,198 64,198 66,200" stroke="#f97316" strokeWidth="1" className="animate-footprint-2" />
            <path d="M80,200 C82,198 84,198 86,200" stroke="#f97316" strokeWidth="1" className="animate-footprint-3" />
            <path
              d="M100,200 C102,198 104,198 106,200"
              stroke="#f97316"
              strokeWidth="1"
              className="animate-footprint-4"
            />
          </svg>
        </div>

      
        <h1 className="text-7xl font-extrabold text-[#f97316] mb-2 animate-bounce-gentle">404</h1>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">We&apos;re Lost!</h2>
        <p className="text-gray-600 mb-8">Oops! The page you&apos;re looking for seems to have wandered off the map.</p>

        
        <Link
          href="/"
          className="inline-flex items-center justify-center px-6 py-3 text-base font-medium text-white bg-[#f97316] rounded-lg shadow-md hover:bg-[#ea580c] transition-colors duration-300 hover:scale-105 transform"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z"
              clipRule="evenodd"
            />
          </svg>
          Find Your Way Home
        </Link>
      </div>
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        
        @keyframes bounce-gentle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        
        @keyframes look-around {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-3px); }
          75% { transform: translateX(3px); }
        }
        
        @keyframes scratch-head {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(10deg); }
        }
        
        @keyframes sweat-drop {
          0% { opacity: 0; transform: translateY(-5px); }
          50% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(10px); }
        }
        
        @keyframes rotate-slightly {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-5deg); }
          75% { transform: rotate(5deg); }
        }
        
        @keyframes fade-in-out {
          0%, 100% { opacity: 0.1; }
          50% { opacity: 0.6; }
        }
        
        @keyframes fade-in-out-delay {
          0%, 100% { opacity: 0.1; }
          60% { opacity: 0.5; }
        }
        
        @keyframes fade-in-out-delay-2 {
          0%, 100% { opacity: 0.1; }
          70% { opacity: 0.4; }
        }
        
        @keyframes fade-in-out-delay-3 {
          0%, 100% { opacity: 0.1; }
          40% { opacity: 0.5; }
        }
        
        @keyframes draw-path {
          0% { stroke-dashoffset: 200; }
          100% { stroke-dashoffset: 0; }
        }
        
        @keyframes footprint-appear {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        
        .animate-float {
          animation: float 4s ease-in-out infinite;
        }
        
        .animate-bounce-gentle {
          animation: bounce-gentle 2s ease-in-out infinite;
        }
        
        .animate-look-around {
          animation: look-around 3s ease-in-out infinite;
        }
        
        .animate-scratch-head {
          animation: scratch-head 2s ease-in-out infinite;
          transform-origin: 150px 100px;
        }
        
        .animate-sweat-drop {
          animation: sweat-drop 3s ease-in-out infinite;
        }
        
        .animate-rotate-slightly {
          animation: rotate-slightly 4s ease-in-out infinite;
          transform-origin: 70px 90px;
        }
        
        .animate-fade-in-out {
          animation: fade-in-out 3s ease-in-out infinite;
        }
        
        .animate-fade-in-out-delay {
          animation: fade-in-out-delay 4s ease-in-out infinite;
        }
        
        .animate-fade-in-out-delay-2 {
          animation: fade-in-out-delay-2 5s ease-in-out infinite;
        }
        
        .animate-fade-in-out-delay-3 {
          animation: fade-in-out-delay-3 4.5s ease-in-out infinite;
        }
        
        .animate-draw-path {
          animation: draw-path 3s ease-in-out forwards;
        }
        
        .animate-footprint-1 {
          animation: footprint-appear 0.5s ease-in-out 0.2s forwards;
          opacity: 0;
        }
        
        .animate-footprint-2 {
          animation: footprint-appear 0.5s ease-in-out 0.7s forwards;
          opacity: 0;
        }
        
        .animate-footprint-3 {
          animation: footprint-appear 0.5s ease-in-out 1.2s forwards;
          opacity: 0;
        }
        
        .animate-footprint-4 {
          animation: footprint-appear 0.5s ease-in-out 1.7s forwards;
          opacity: 0;
        }
      `}</style>
    </div>
  )
}

