'use client';
import React, { useEffect, useState } from 'react';
import { ServerCrash, Cog, Server } from 'lucide-react';

function ServerCrash500() {
  const [mounted, setMounted] = useState(false);
  const [glitch, setGlitch] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    const glitchInterval = setInterval(() => {
      setGlitch(true);
      setTimeout(() => setGlitch(false), 200);
    }, 4000);

    return () => clearInterval(glitchInterval);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-orange-50 text-gray-900 p-4 overflow-hidden">
      <div className={`text-center transform ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'} transition-all duration-1000`}>
        <div className="relative">
      
          <div className="absolute inset-0 -z-10">
            <Cog 
              size={64} 
              className="absolute top-0 right-0 text-[#f97316] opacity-20 animate-[spin_8s_linear_infinite]"
            />
            <Cog 
              size={48} 
              className="absolute bottom-0 left-0 text-[#f97316] opacity-20 animate-[spin_8s_linear_infinite_reverse]"
            />
          </div>
          
        
          <div className={`relative mx-auto w-32 h-32 mb-6 ${glitch ? 'animate-[glitch_0.2s_ease-in-out]' : ''}`}>
            <div className="absolute inset-0 text-[#f97316] animate-pulse">
              <ServerCrash size={128} strokeWidth={1.5} />
            </div>
            <ServerCrash 
              size={128} 
              className={`relative z-10 text-[#f97316] ${glitch ? 'text-red-500' : ''}`} 
              strokeWidth={1.5} 
            />
          </div>
          <Server
            size={128} 
            className={`relative z-10 text-[#f97316] ${glitch ? 'text-red-500' : ''}`} 
            strokeWidth={1.5}
          />
          
      
          <div className={`relative ${glitch ? 'animate-[textGlitch_0.2s_ease-in-out]' : ''}`}>
            <h1 className={`text-8xl font-bold mb-4 text-[#f97316] ${mounted ? 'scale-100 opacity-100' : 'scale-50 opacity-0'} transition-all duration-1000 delay-200`}>
              <span className={`absolute -inset-1 text-red-500 opacity-30 ${glitch ? 'animate-[glitchOffset_0.2s_ease-in-out]' : ''}`}>
                500
              </span>
              500
            </h1>
          </div>
          
        
          <p className={`text-xl font-medium mb-4 text-gray-900 ${mounted ? 'opacity-100' : 'opacity-0'} transition-opacity duration-1000 delay-700`}>
            INTERNAL SERVER ERROR
          </p>
          <p className={`text-gray-600 mb-8 ${mounted ? 'opacity-100' : 'opacity-0'} transition-opacity duration-1000 delay-900`}>
            Our servers are having trouble processing your request
          </p>
          
     
          <button
       
        onClick={() => window.history.back()}

            
            className="relative inline-block px-8 py-3 bg-[#f97316] text-white rounded-lg overflow-hidden group hover:bg-orange-600 transition-colors"
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              Try Again
              <Cog className="w-4 h-4 animate-spin" />
            </span>
          </button>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes glitch {
          0%, 100% { transform: translate(0); }
          20% { transform: translate(-4px, 4px); }
          40% { transform: translate(4px, -4px); }
          60% { transform: translate(-4px, -4px); }
          80% { transform: translate(4px, 4px); }
        }

        @keyframes textGlitch {
          0%, 100% { clip-path: inset(0 0 0 0); }
          20% { clip-path: inset(20% 0 0 0); }
          40% { clip-path: inset(40% 0 60% 0); }
          60% { clip-path: inset(60% 0 40% 0); }
          80% { clip-path: inset(80% 0 20% 0); }
        }

        @keyframes glitchOffset {
          0%, 100% { transform: translate(0); }
          20% { transform: translate(2px, -2px); }
          40% { transform: translate(-2px, 2px); }
          60% { transform: translate(2px, 2px); }
          80% { transform: translate(-2px, -2px); }
        }
      `}</style>
    </div>
  );
}

export default ServerCrash500;