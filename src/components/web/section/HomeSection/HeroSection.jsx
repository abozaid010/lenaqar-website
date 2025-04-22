"use client"
import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import im from "../../../../../public/images/web1.png"
import backgrounImg from "../../../../../public/images/web2.jpg"

import imageai from "../../../../../public/images/AdobeStock_241732873_Preview.jpeg"



const HeroSection = () => {
  // State for controlling slides
  const [currentSlide, setCurrentSlide] = useState(0);

  // State for controlling which message is displayed
  const [activeMessageIndex, setActiveMessageIndex] = useState(0);
  
  // Custom messages as requested - first message as opinions, right message with fewer words
  const messages = [
    
    "24/7 reply and handle your clients needs",
    "Filter leads",
    "Close More Deals",  // Shortened right-side message
    "follow up, scale with effortless"
  ];
  
  // Auto-advance slides every 15 seconds
  useEffect(() => {
    const slideTimer = setTimeout(() => {
      setCurrentSlide((prev) => (prev + 1) % 2);
    }, 20000);
    
    return () => clearTimeout(slideTimer);
  }, [currentSlide]);

  // Rotate through messages every 3 seconds
  useEffect(() => {
    const messageTimer = setTimeout(() => {
      setActiveMessageIndex((prev) => (prev + 1) % messages.length);
    }, 4000);
    
    return () => clearTimeout(messageTimer);
  }, [activeMessageIndex, messages.length]);


  return (
    <div className='relative h-[100vh] w-full flex items-center overflow-hidden'>
      {/* Background Image with Overlay */}
      <div className='absolute inset-0 z-0'>
        <Image
          src={backgrounImg}
          alt="Background"
          fill
          className="object-cover"
          priority
        />
        <div className='absolute inset-0 bg-[#030250] opacity-80'></div>
        

        {/* Enhanced animated particles in background */}

        <Particles />
      </div>
      
      <div className='w-[95%] mx-auto px-4 relative z-10'>
        <AnimatePresence mode="wait">
          {currentSlide === 0 ? (

            <motion.div 
              key="slide1"
              className='grid grid-cols-1 md:grid-cols-3 gap-8 items-center'
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              <motion.div 
                className='md:col-span-2 space-y-6'
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
              >
                <motion.h1 
                  className='text-4xl md:text-5xl lg:text-6xl font-bold text-white'
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.8 }}
                >
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-300">
                    Sell Smarter,
                  </span>
                  <br />
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-300 to-white">
                    Close More Deals.
                  </span>
                </motion.h1>
                
                <motion.p 
                  className='text-xl md:text-2xl font-semibold text-blue-300 my-6'
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4, duration: 0.8 }}
                >
                  Lena AI: Your AI-powered real estate sales assistant.
                </motion.p>
                
                <motion.p 
                  className='text-lg md:text-xl text-white'
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6, duration: 0.8 }}
                >
                  Lena AI is built to qualify leads instantly, engage prospects 24/7, and 
                  boost conversions so you focus on closing, not chasing cold leads.
                </motion.p>
                
                <motion.button 
                  className='bg-gradient-to-r from-[#3926A7] to-[#21EAF4] hover:opacity-90 px-8 py-4 rounded-md text-white font-medium transition-all hover:scale-105 shadow-lg mt-6'
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8, duration: 0.5 }}
                >
                  Try Lenaai Now
                </motion.button>
              </motion.div>
              
              <div className='md:col-span-1 flex justify-center md:justify-end'>
                <motion.div 
                  className='relative h-[400px] md:h-[450px] w-full max-w-[500px]'
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5, duration: 0.8 }}
                >

                  {/* Enhanced Circular AI Image with improved rotation effects */}

                  <motion.div 
                    className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 md:w-72 md:h-72 rounded-full overflow-hidden border-4 border-blue-400 shadow-lg shadow-blue-500/30"
                    animate={{ 
                      scale: [1, 1.03, 1],

                      rotate: [0, 3, 0, -3, 0]  // Enhanced rotation
                    }}
                    transition={{
                      duration: 4,  // Faster rotation

                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    <Image
                      src={im}
                      alt="AI Assistant"
                      fill
                      className="object-cover"
                      priority
                    />

                    {/* Improved pulsing overlay effect */}
                    <motion.div 
                      className="absolute inset-0 bg-gradient-to-tr from-blue-500/30 to-purple-600/30"
                      animate={{ 
                        opacity: [0.3, 0.6, 0.3],
                      }}
                      transition={{
                        duration: 2.5,

                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    />
                  </motion.div>
                  

                  {/* Enhanced animated outer ring */}
                  <motion.div 
                    className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 md:w-96 md:h-96 rounded-full border-2 border-blue-400/50"
                    animate={{ 
                      scale: [1, 1.08, 1],

                      rotate: [0, 360]
                    }}
                    transition={{
                      scale: {

                        duration: 3.5,

                        repeat: Infinity,
                        ease: "easeInOut"
                      },
                      rotate: {

                        duration: 18,

                        repeat: Infinity,
                        ease: "linear"
                      }
                    }}
                  />
                  

                  {/* Added second outer ring for enhanced appearance */}
                  <motion.div 
                    className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-88 h-88 md:w-104 md:h-104 rounded-full border border-blue-300/30"
                    animate={{ 
                      scale: [1, 1.06, 1],
                      rotate: [0, -180]
                    }}
                    transition={{
                      scale: {
                        duration: 5,
                        repeat: Infinity,
                        ease: "easeInOut"
                      },
                      rotate: {
                        duration: 25,
                        repeat: Infinity,
                        ease: "linear"
                      }
                    }}
                  />
                  
                  {/* Improved glowing circle effect */}
                  <motion.div 
                    className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-72 md:w-80 md:h-80 rounded-full bg-gradient-to-r from-blue-500/10 to-blue-600/10 blur-xl"
                    animate={{ 
                      scale: [1, 1.15, 1],
                      opacity: [0.6, 0.8, 0.6],
                    }}
                    transition={{
                      duration: 3.5,

                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />
                </motion.div>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="slide2"
              className='grid grid-cols-1 md:grid-cols-3 gap-8 items-center'
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              <motion.div 
                className='md:col-span-2 space-y-6'
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
              >
                <motion.h1 
                  className='text-4xl md:text-5xl lg:text-6xl font-bold text-white'
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.8 }}
                >
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-300">
                    Sell Smarter,
                  </span>
                  <br />
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-300 to-white">
                    Close More Deals.
                  </span>
                </motion.h1>
                
                <motion.p 
                  className='text-xl md:text-2xl font-semibold text-blue-300 my-6'
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4, duration: 0.8 }}
                >
                  Lena AI: Your AI-powered real estate sales assistant.
                </motion.p>
                
                <motion.p 
                  className='text-lg md:text-xl text-white'
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6, duration: 0.8 }}
                >
                  Lena AI is built to qualify leads instantly, engage prospects 24/7, and 
                  boost conversions so you focus on closing, not chasing cold leads.
                </motion.p>
                
                <motion.button 
                  className='bg-gradient-to-r from-[#3926A7] to-[#21EAF4] hover:opacity-90 px-8 py-4 rounded-md text-white font-medium transition-all hover:scale-105 shadow-lg mt-6'
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8, duration: 0.5 }}
                >
                  Try Lenaai Now
                </motion.button>
              </motion.div>
              
              <div className='md:col-span-1 flex justify-center md:justify-end'>
                <motion.div 
                  className='relative h-[400px] md:h-[450px] w-full max-w-[500px]'
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5, duration: 0.8 }}
                >

                  {/* Enhanced Circular AI Image with improved left-right rotation */}

                  <motion.div 
                    className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 md:w-72 md:h-72 rounded-full overflow-hidden border-4 border-blue-400 shadow-lg shadow-blue-500/30"
                    animate={{ 
                      scale: [1, 1.03, 1],

                      rotate: [0, -3, 0, 3, 0, -2, 0]  // More natural rotation

                    }}
                    transition={{
                      duration: 6,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >


                    <Image
                      src={imageai}
                      alt="AI Assistant"
                      fill
                      className="object-cover"
                      priority
                    />

                    {/* Enhanced pulsing overlay effect */}

                    <motion.div 
                      className="absolute inset-0 bg-gradient-to-tr from-blue-500/30 to-blue-600/30"
                      animate={{ 
                        opacity: [0.3, 0.5, 0.3],
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    />
                  </motion.div>
                  

                  {/* Enhanced animated outer ring */}

                  <motion.div 
                    className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 md:w-96 md:h-96 rounded-full border-2 border-blue-400/50"
                    animate={{ 
                      scale: [1, 1.05, 1],
                      rotate: [0, -360]
                    }}
                    transition={{
                      scale: {
                        duration: 4,
                        repeat: Infinity,
                        ease: "easeInOut"
                      },
                      rotate: {
                        duration: 20,
                        repeat: Infinity,
                        ease: "linear"
                      }
                    }}
                  />
                  

                  {/* Rotating message bubbles with enhanced realistic rotation */}
                  <AnimatePresence mode="wait">
                    <AiMessageBubble 
                      key={activeMessageIndex} 
                      message={messages[activeMessageIndex]} 
                      position={activeMessageIndex % 4} 
                    />
                  </AnimatePresence>
                  
                  {/* Enhanced glowing circle effect */}

                  <motion.div 
                    className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-72 md:w-80 md:h-80 rounded-full bg-gradient-to-r from-blue-500/10 to-blue-600/10 blur-xl"
                    animate={{ 
                      scale: [1, 1.1, 1],

                      opacity: [0.5, 0.8, 0.5],

                    }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}


// Enhanced message component with improved rotation for realism
const AiMessageBubble = ({ message, position }) => {
  // Different styles and positions based on position parameter
  // 0 = top, 1 = bottom, 2 = right, 3 = left
  
  // Style variations based on position and message content
  const isOpinionMessage = message.includes("believe");
  
  // Different background colors for different messages
  const getBubbleStyle = () => {
    if (isOpinionMessage) {
      return "bg-gradient-to-r from-purple-500 to-blue-600 text-white";
    } else {
      // Rotating colors for other messages
      const colorSchemes = [
        "bg-gradient-to-r from-[#3926A7] to-[#21EAF4]  text-white",
        "bg-gradient-to-r from-[#3926A7] to-[#21EAF4] text-white ",
        "bg-gradient-to-r from-[#3926A7] to-[#21EAF4]  text-white",
        "bg-gradient-to-r from-[#3926A7] to-[#21EAF4] text-white"
      ];
      return colorSchemes[position % colorSchemes.length];
    }
  };
  
  // Position calculations
  const getPositionStyle = () => {
    // All positions relative to the circle center
    switch (position) {
      case 0: // Top
        return {
          top: '-20px',
          left: '50%',
          transform: 'translateX(-50%) rotate(-2deg)', // Added slight rotation
          arrow: 'bottom'
        };
      case 1: // Bottom
        return {
          bottom: '-5px',
          left: '50%',
          transform: 'translateX(-50%) rotate(1deg)', // Added slight rotation
          arrow: 'top'
        };
      case 2: // Right - shortest message
        return {
          top: '50%',
          right: '-18px', // Reduced distance for shorter message
          transform: 'translateY(-50%) rotate(1.5deg)', // Added more rotation
          arrow: 'left'
        };
      case 3: // Left
        return {
          top: '50%',
          left: '-100px',
          transform: 'translateY(-50%) rotate(-2deg)', // Added more rotation
          arrow: 'right'
        };
      default:
        return {
          top: '-70px',
          left: '50%',
          transform: 'translateX(-50%)',
          arrow: 'bottom'
        };
    }
  };
  
  const posStyle = getPositionStyle();
  
  // Arrow styles based on position
  const getArrowStyle = () => {
    switch (posStyle.arrow) {
      case 'bottom':
        return "absolute -bottom-2 left-1/2 w-4 h-4 transform -translate-x-1/2 rotate-45";
      case 'top':
        return "absolute -top-2 left-1/2 w-4 h-4 transform -translate-x-1/2 rotate-45";
      case 'left':
        return "absolute top-1/2 -left-2 w-4 h-4 transform -translate-y-1/2 rotate-45";
      case 'right':
        return "absolute top-1/2 -right-2 w-4 h-4 transform -translate-y-1/2 rotate-45";
      default:
        return "absolute -bottom-2 left-1/2 w-4 h-4 transform -translate-x-1/2 rotate-45";
    }
  };
  
  // Enhanced entry animation direction based on position - more realistic
  const getEntryAnimation = () => {
    switch (position) {
      case 0: return { y: -20, opacity: 0, rotate: -3 }; // Added rotation
      case 1: return { y: 20, opacity: 0, rotate: 2 }; // Added rotation
      case 2: return { x: 20, opacity: 0, rotate: 3 }; // Added rotation
      case 3: return { x: -20, opacity: 0, rotate: -2 }; // Added rotation
      default: return { y: -20, opacity: 0 };
    }
  };
  
  // Calculate line connector position and style
  const getConnectorStyle = () => {
    switch (posStyle.arrow) {
      case 'bottom':
        return {
          className: "absolute top-full left-1/2 h-10 w-[2px] bg-gradient-to-b from-white to-transparent",
          style: { transformOrigin: 'top' },
          animate: { scaleY: 1 },
          initial: { scaleY: 0 }
        };
      case 'top':
        return {
          className: "absolute bottom-full left-1/2 h-10 w-[2px] bg-gradient-to-t from-white to-transparent",
          style: { transformOrigin: 'bottom' },
          animate: { scaleY: 1 },
          initial: { scaleY: 0 }
        };
      case 'left':
        return {
          className: "absolute right-full top-1/2 w-10 h-[2px] bg-gradient-to-l from-white to-transparent",
          style: { transformOrigin: 'right' },
          animate: { scaleX: 1 },
          initial: { scaleX: 0 }
        };
      case 'right':
        return {
          className: "absolute left-full top-1/2 w-10 h-[2px] bg-gradient-to-r from-white to-transparent",
          style: { transformOrigin: 'left' },
          animate: { scaleX: 1 },
          initial: { scaleX: 0 }
        };
      default:
        return {
          className: "absolute top-full left-1/2 h-10 w-[2px] bg-gradient-to-b from-white to-transparent",
          style: { transformOrigin: 'top' },
          animate: { scaleY: 1 },
          initial: { scaleY: 0 }
        };
    }
  };
  
  const connector = getConnectorStyle();
  const bubbleStyle = getBubbleStyle();
  const arrowStyle = getArrowStyle();

  
  return (
    <motion.div
      className="absolute z-20"
      style={{ 

        ...posStyle
      }}
      initial={getEntryAnimation()}
      animate={{ x: 0, y: 0, opacity: 1, rotate: position === 2 ? 1.5 : position === 3 ? -2 : position === 0 ? -2 : 1 }} // Added specific rotations
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{
        duration: 0.4,
        ease: "easeOut"
      }}
    >
      <div className={`px-4 py-3 rounded-lg shadow-lg font-medium text-sm md:text-base relative max-w-[240px] md:max-w-xs ${bubbleStyle}`}>
        {message}
        {/* Arrow pointing to the AI */}
        <div className={`${arrowStyle} ${bubbleStyle.includes('gradient') ? 'bg-blue-500' : bubbleStyle.split(' ')[0]}`} />
      </div>
      
      {/* Enhanced line connecting to center with subtle pulse */}
      <motion.div 
        className={connector.className}
        style={connector.style}
        initial={connector.initial}
        animate={{
          ...connector.animate,
          opacity: [0.8, 1, 0.8]
        }}
        transition={{
          delay: 0.2,
          duration: 0.3,
          opacity: {
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut"
          }

        }}
      />
    </motion.div>
  );
};


// Enhanced background particles effect
const Particles = () => {
  const particleCount = 25; // Added more particles

  const particles = Array.from({ length: particleCount });

  return (
    <>
      {particles.map((_, index) => {
        const size = Math.random() * 6 + 2;
        const initialX = Math.random() * 100;
        const initialY = Math.random() * 100;
        const duration = Math.random() * 15 + 10;
        const delay = Math.random() * 5;

        const opacity = Math.random() * 0.2 + 0.1; // Varied opacity

        
        return (
          <motion.div
            key={index}

            className="absolute rounded-full bg-blue-300"

            style={{
              width: size,
              height: size,
              left: `${initialX}%`,

              top: `${initialY}%`,
              opacity: opacity
            }}
            animate={{
              y: [0, -100, 0],
              x: [0, Math.random() * 60 - 30, 0], // Increased movement range
              opacity: [opacity, opacity * 2, opacity]

            }}
            transition={{
              duration,
              delay,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        );
      })}
    </>
  );
};

export default HeroSection