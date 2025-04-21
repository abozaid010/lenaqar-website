"use client"
import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import im from "../../../../../public/images/web1.png"
import backgrounImg from "../../../../../public/images/web2.jpg"
import imageai from "../../../../../public/images/ai2.jpg"

const HeroSection = () => {
  // State for controlling slides
  const [currentSlide, setCurrentSlide] = useState(0);
  
  // Custom messages as requested - moved "I'm Lena AI" to be the first message
  const messages = [
    "I'm Lena AI, how can I help you?",
    "Filter leads",
    "24/7 reply and handle your clients needs",
    "Close more deals",
    "Follow up",
    "Scale with effortless"
  ];
  
  // Auto-advance slides every 15 seconds

  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentSlide((prev) => (prev + 1) % 2);
    }, 15000);
    
    return () => clearTimeout(timer);
  }, [currentSlide]);


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
        
        {/* Animated particles in background */}
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
                  {/* Circular AI Image with motion effects */}
                  <motion.div 
                    className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 md:w-72 md:h-72 rounded-full overflow-hidden border-4 border-blue-400 shadow-lg shadow-blue-500/30"
                    animate={{ 
                      scale: [1, 1.03, 1],
                      rotate: [0, 2, 0, -2, 0]
                    }}
                    transition={{
                      duration: 6,
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
                    {/* Pulsing overlay effect */}
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
                  
                  {/* Animated outer ring */}
                  <motion.div 
                    className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 md:w-96 md:h-96 rounded-full border-2 border-blue-400/50"
                    animate={{ 
                      scale: [1, 1.05, 1],
                      rotate: [0, 360]
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
                  
                  {/* No messages in first slide */}
                  
                  {/* Glowing circle effect */}
                  <motion.div 
                    className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-72 md:w-80 md:h-80 rounded-full bg-gradient-to-r from-blue-500/10 to-blue-600/10 blur-xl"
                    animate={{ 
                      scale: [1, 1.1, 1],
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
                  {/* Circular AI Image with motion effects */}
                  <motion.div 
                    className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 md:w-72 md:h-72 rounded-full overflow-hidden border-4 border-blue-400 shadow-lg shadow-blue-500/30"
                    animate={{ 
                      scale: [1, 1.03, 1],
                      rotate: [0, -2, 0, 2, 0]
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
                    {/* Pulsing overlay effect */}
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
                  
                  {/* Animated outer ring */}
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
                  
                  {/* Messages - only appear in second slide with the AI image */}
                  {messages.map((message, index) => (
                    <AiMessageBubble 
                      key={index} 
                      message={message} 
                      index={index} 
                      total={messages.length}
                    />
                  ))}
                  
                  {/* Glowing circle effect */}
                  <motion.div 
                    className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-72 md:w-80 md:h-80 rounded-full bg-gradient-to-r from-blue-500/10 to-blue-600/10 blur-xl"
                    animate={{ 
                      scale: [1, 1.1, 1],
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

// Renamed and improved message component with better spacing
const AiMessageBubble = ({ message, index, total }) => {
  // Increased spacing between messages
  const verticalOffset = index * 70 - (total * 35);
  
  // Horizontal position - all on left side
  const horizontalOffset = -220;
  
  // Special styling for the "I'm Lena AI" message
  const isLenaMessage = message.includes("I'm Lena AI");
  let bubbleClass = "bg-white text-blue-800 px-4 py-2 rounded-lg shadow-lg font-medium text-sm relative";
  
  if (isLenaMessage) {
    bubbleClass = "bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-3 rounded-lg shadow-lg font-medium text-sm relative";
  }
  
  return (
    <motion.div
      className="absolute z-20"
      style={{ 
        top: '50%',
        left: '50%',
        y: verticalOffset,
        x: horizontalOffset,
      }}
      initial={{ opacity: 0, x: horizontalOffset - 50 }}
      animate={{ 
        opacity: 1, 
        x: horizontalOffset,
      }}
      transition={{
        delay: isLenaMessage ? 0.5 : index * 0.8,
        duration: 0.5
      }}
    >
      <div className={bubbleClass}>
        {message}
        {/* Arrow pointing to the AI */}
        <div className="absolute top-1/2 right-0 w-3 h-3 bg-white transform translate-x-1/2 rotate-45 -translate-y-1/2" />
      </div>
      
      {/* Line connecting to center */}
      <motion.div 
        className="absolute top-1/2 left-full h-[2px] bg-gradient-to-r from-white to-transparent"
        style={{ 
          width: '70px',
          transformOrigin: 'left',
        }}
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{
          delay: isLenaMessage ? 0.8 : index * 0.8 + 0.3,
          duration: 0.3
        }}
      />
    </motion.div>
  );
};

// Background particles effect
const Particles = () => {
  const particleCount = 20;
  const particles = Array.from({ length: particleCount });

  return (
    <>
      {particles.map((_, index) => {
        const size = Math.random() * 6 + 2;
        const initialX = Math.random() * 100;
        const initialY = Math.random() * 100;
        const duration = Math.random() * 15 + 10;
        const delay = Math.random() * 5;
        
        return (
          <motion.div
            key={index}
            className="absolute rounded-full bg-blue-300 opacity-20"
            style={{
              width: size,
              height: size,
              left: `${initialX}%`,
              top: `${initialY}%`
            }}
            animate={{
              y: [0, -100, 0],
              x: [0, Math.random() * 50 - 25, 0],
              opacity: [0.1, 0.4, 0.1]
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