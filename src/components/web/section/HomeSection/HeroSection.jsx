"use client";
import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import img1 from "../../../../../public/images/hero_1.jpg";
import web1 from "../../../../../public/images/web1.png";
import web2 from "../../../../../public/images/web2.jpg";
import aiimage from "../../../../../public/images/AdobeStock_241732873_Preview.jpeg"
import { Brain, Sparkles, Bot, MessageSquare, Zap, Cpu, Home, DollarSign, Briefcase, HelpCircle } from "lucide-react";

const HeroSection = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [messageIndex, setMessageIndex] = useState(0);
  const messagesTimerRef = useRef(null);

  // Messages that will appear as chat bubbles
  const aiMessages = [
    { text: "Filter leads", position: "left-[-80px] top-[20%]", color: "from-[#3926A7] to-[#21EAF4]", rotate: "-3deg" },
    { text: "Follow up, scale with effortless", position: "right-[-180px] top-[30%]", color: "from-[#3926A7] to-[#21EAF4]", rotate: "2deg" },
    { text: "24/7 reply and handle your clients needs", position: "left-[-180px] bottom-[5%] ", color: "from-[#3926A7] to-[#21EAF4]", rotate: "-20deg" },
    { text: "Close more deals.", position: "right-[-100px] bottom-[20%]", color: "from-[#3926A7] to-[#21EAF4]", rotate: "4deg" },
  ];

  // Auto-rotate messages
  useEffect(() => {
    messagesTimerRef.current = setInterval(() => {
      setMessageIndex(prev => (prev + 1) % aiMessages.length);
    }, 3000);

    return () => {
      if (messagesTimerRef.current) clearInterval(messagesTimerRef.current);
    };
  }, []);

  // Auto-rotate slides - commented out as in your code
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
    }, 14000); // Change slide every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const slides = [
    {
      image: web2,
      content: (
        <div className="max-w-3xl relative">
          {/* AI Image with Animation */}
          <div className="absolute right-0 md:right-[-160px] top-0 md:top-0 w-80 h-80 md:w-[350px] md:h-[350px] lg:w-[400px] lg:h-[400px] translate-x-1/2">
            <motion.div 
              className="relative w-full h-full"
              animate={{ rotate: [0, 2, 0, -2, 0] }}
              transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
            >
              <div className="absolute inset-0 rounded-full overflow-hidden border-2 border-blue-400/50 shadow-lg shadow-blue-500/20">
                <Image
                  src={aiimage}
                  alt="AI Technology"
                  fill
                  className="object-cover"
                  priority
                />
                <div className="absolute inset-0 -gradient-to-br from-blue-900/30 to-purple-900/30"></div>
              </div>
              
              {/* AI Message Bubbles */}
              {aiMessages.map((message, idx) => (
                <motion.div
                  key={idx}
                  className={`absolute ${message.position} z-20`}
                  initial={{ opacity: 0, scale: 0.8, y: 20 }}
                  animate={{ 
                    opacity: messageIndex === idx ? 1 : 0,
                    scale: messageIndex === idx ? 1 : 0.8,
                    y: messageIndex === idx ? 0 : 20,
                    rotate: message.rotate || "0deg"
                  }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="relative">
                    <div className={`bg-gradient-to-r ${message.color} px-4 py-3 rounded-xl text-white font-medium shadow-lg max-w-[240px] backdrop-blur-sm border border-white/10`}>
                      <motion.span className="block">
                        {Array.from(message.text).map((char, charIdx) => (
                          <motion.span
                            key={charIdx}
                            initial={{ opacity: 0 }}
                            animate={{ 
                              opacity: messageIndex === idx ? 1 : 0 
                            }}
                            transition={{ 
                              duration: 0.05, 
                              delay: messageIndex === idx ? 0.5 + (0.03 * charIdx) : 0 
                            }}
                          >
                            {char}
                          </motion.span>
                        ))}
                      </motion.span>
                    </div>
                    
                    {/* Message Arrow/Pointer - Updated to look more realistic */}
                    <div 
                      className={`absolute ${
                        idx % 2 === 0 
                          ? 'right-[-8px] top-1/2 -translate-y-1/2 bg-gradient-to-r from-[#3926A7] to-[#21EAF4]' 
                          : 'left-[-8px] top-1/2 -translate-y-1/2 bg-gradient-to-l from-[#3926A7] to-[#21EAF4]'
                      } h-4 w-4 transform rotate-45 rounded-sm shadow-md`}
                    ></div>
                  </div>
                </motion.div>
              ))}
              
              {/* Improved Glowing Effect */}
              <motion.div 
                className="absolute -inset-4 rounded-full bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-cyan-500/20 blur-xl"
                animate={{ opacity: [0.4, 0.7, 0.4] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              />
            </motion.div>
          </div>
          
          {/* Main Content with AI Highlight */}
          <div className="relative z-10">
            <motion.h1 
              className="text-5xl md:text-6xl lg:text-7xl font-bold mb-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              Sell Smarter,
            </motion.h1>
            
            <motion.h2 
              className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              Close More Deals.
            </motion.h2>
            
            {/* AI Highlight Box */}
            <motion.div 
              className="relative my-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <div className="absolute -left-12 top-1/2 -translate-y-1/2">
                <div className="relative">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <Bot size={48} className="text-blue-400" />
                  </motion.div>
                  <div className="absolute top-1/2 left-full w-16 h-0.5 bg-gradient-to-r from-blue-400 to-transparent"></div>
                </div>
              </div>
              
              <div className="pl-10 py-4 bg-gradient-to-r from-blue-900/30 to-transparent rounded-lg border-l-2 border-blue-400">
                <p className="text-xl md:text-2xl font-semibold text-blue-300">
                  Lena AI: Your AI-powered real estate sales assistant.
                </p>
              </div>
            </motion.div>
            
            <motion.p 
              className="text-lg md:text-xl mb-8 opacity-90 relative"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.9 }}
            >
              <span className="relative">
                Lena AI is built to qualify leads instantly, engage prospects 24/7, and 
                boost conversions so you focus on closing, not chasing cold leads.
                <motion.span 
                  className="absolute -right-8 -top-4"
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
                >
                  <MessageSquare size={20} className="text-blue-400" />
                </motion.span>
              </span>
            </motion.p>
            
            <motion.button 
              className="bg-gradient-to-r from-[#3926A7] to-[#21EAF4] hover:opacity-90 px-8 py-4 rounded-md text-white font-medium transition-all hover:scale-105 shadow-lg flex items-center gap-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1.2 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span>Try Lenaai Now  </span>
              <motion.div
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              >
                <Zap size={20} />
              </motion.div>
            </motion.button>
          </div>
          
          {/* Floating Elements */}
          <div className="absolute -bottom-10 -right-10 text-blue-500">
            <div className="relative">
              <motion.div 
                className="w-24 h-24 rounded-full border border-blue-400/30 absolute"
                animate={{ scale: [1, 1.5, 1], opacity: [1, 0, 1] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.div 
                className="w-16 h-16 rounded-full border border-blue-400/50 absolute top-4 left-4"
                animate={{ scale: [1, 1.5, 1], opacity: [1, 0, 1] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              />
              <motion.div 
                className="w-8 h-8 rounded-full bg-blue-400/20 absolute top-8 left-8"
                animate={{ opacity: [0.2, 0.5, 0.2] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              />
            </div>
          </div>
        </div>
      ),
      layout: "left",
    },
    {
      image: web2,
      secondaryImage: web1,
      content: (
        <div className="max-w-2xl">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-4">
            Sell Smarter,
          </h1>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            Close More Deals.
          </h2>
          <p className="text-xl md:text-2xl font-semibold text-blue-300 mb-6">
            Lena AI: Your AI-powered real estate sales assistant.
          </p>
          <p className="text-lg md:text-xl mb-8">
            Lena AI is built to qualify leads instantly, engage prospects 24/7, and 
            boost conversions so you focus on closing, not chasing cold leads.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <button className="bg-gradient-to-r from-[#3926A7] to-[#21EAF4] hover:opacity-90 px-6 py-3 rounded-md text-white font-medium transition-all hover:scale-105 shadow-lg">
            Try Lenaai Now
            </button>
          </div>
        </div>
      ),
      layout: "left",
    },
  
  ];

  return (
    <section className="relative h-[700px] md:h-[800px] lg:h-[900px] w-full overflow-hidden">
      {/* Slides */}
      {slides.map((slide, index) => (
        <motion.div
          key={index}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ 
            opacity: currentSlide === index ? 1 : 0,
            zIndex: currentSlide === index ? 10 : 0
          }}
          transition={{ duration: 1 }}
        >
          {/* Image with overlay */}
          <div className="relative w-full h-full">
            <Image
              src={slide.image}
              alt="Hero background"
              fill
              className="object-cover w-full h-full"
              sizes="100vw"
              priority={index === 0}
            />
            {/* Deep blue overlay from Figma */}
            <div className="absolute inset-0 bg-[#030250] opacity-80"></div>
            
            {/* Secondary image (professional) if available */}
            {slide.secondaryImage && (
              <div className="absolute right-0 bottom-0 h-full w-2/5 z-10">
                <div className="relative h-full w-full">
                  <Image
                    src={slide.secondaryImage}
                    alt="Professional"
                    fill
                    sizes="40vw"
                    className="object-contain object-bottom"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="absolute inset-0 z-20">
            <div className="container mx-auto h-full px-6 md:px-12 flex">
              <div className={`${slide.secondaryImage ? 'w-full md:w-3/5' : 'w-full'} h-full flex flex-col justify-center text-white`}>
                {slide.content}
              </div>
            </div>
          </div>
        </motion.div>
      ))}

      {/* Slide indicators */}
      <div className="absolute bottom-8 left-0 right-0 z-30 flex justify-center gap-3">
        {slides.map((_, index) => (
          <motion.button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`h-3 rounded-full transition-all ${
              currentSlide === index ? "bg-blue-500 w-12" : "bg-white/50 hover:bg-white/80 w-3"
            }`}
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

     
    </section>
  );
};

export default HeroSection;