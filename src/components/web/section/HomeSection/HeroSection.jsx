"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import CalendarModal from "@/components/ui/calendar-modal";
import { useI18n } from "@/context/translate-api";

const HeroSection = () => {
  const { t } = useI18n();
  // State for tracking which messages have been shown
  const [visibleMessages, setVisibleMessages] = useState([]);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [imageError, setImageError] = useState(false);

  // Custom messages from translations
  const messages = [
    t.heroSection.message1,
    t.heroSection.message2,
    t.heroSection.message3,
    t.heroSection.message4,
  ];
  useEffect(() => {
    setVisibleMessages([]);
    setCurrentMessageIndex(0);
  }, [t]);
  // Add new message every 4 seconds until all messages are shown
  useEffect(() => {
    if (currentMessageIndex < messages.length) {
      const messageTimer = setTimeout(() => {
        setVisibleMessages((prev) => [...prev, messages[currentMessageIndex]]);
        setCurrentMessageIndex((prev) => prev + 1);
      }, 1000);

      return () => clearTimeout(messageTimer);
    }
  }, [currentMessageIndex, messages.length]);

  return (
    <div className="relative w-full h-screen flex items-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        {!imageError ? (
          <Image
            src={"/images/web2.jpg"}
            alt={t.heroSection.backgroundAlt}
            fill
            className="object-cover"
            priority
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="absolute inset-0 bg-[#030250]" />
        )}
        <div className="absolute inset-0 bg-[#030250] opacity-80"></div>

        {/* Enhanced animated particles in background */}
        <Particles />
      </div>

      <div className="max-w-[85%] w-full mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          key="slide2"
          className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            className="md:col-span-2 space-y-6"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.h1
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-white"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.8 }}
            >
              <span className="bg-clip-text text-white bg-gradient-to-r from-white to-blue-300">
                {t.heroSection.title1}
              </span>
              <br />
              
              <span className="bg-clip-text inline-block mt-5   text-white bg-gradient-to-r from-blue-300 to-white">
                {t.heroSection.title2}
              </span>
            </motion.h1>

            <motion.div
              className="text-xl md:text-3xl font-semibold text-blue-300 my-8 p-4 bg-blue-900/30 rounded-lg border border-blue-400/20 w-fit"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.8 }}
            >
              {t.heroSection.subtitle}
            </motion.div>

            <motion.p
              className="text-lg md:text-xl text-white"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.8 }}
            >
              {t.heroSection.description}
            </motion.p>

            <CalendarModal 
              buttonText={t.heroSection.ctaButton} 
              style={"bg-gradient-to-r from-[#3926A7] to-[#21EAF4] hover:opacity-90 px-8 py-3 rounded-md text-white font-medium transition-all shadow-lg mt-4"} 
            />
          </motion.div>

          <div className="md:col-span-1 flex justify-center md:justify-end">
            <motion.div
              className="relative h-80 md:h-96 w-full max-w-md"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, duration: 0.8 }}
            >
              {/* Square AI Image without rotating animations */}
              <motion.div
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 md:w-72 md:h-72 rounded-lg overflow-hidden border-4 border-blue-400 shadow-lg shadow-blue-500/30"
                animate={{
                  scale: [1, 1.03, 1],
                }}
                transition={{
                  duration: 6,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <Image
                  src={"/images/happy man.png"}
                  alt={t.heroSection.aiImageAlt}
                  fill
                  className="object-cover"
                  priority
                />
                {/* Enhanced overlay effect */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-tr from-blue-500/30 to-blue-600/30"
                  animate={{
                    opacity: [0.3, 0.5, 0.3],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              </motion.div>

              {/* Show all visible messages */}
              {visibleMessages.map((message, index) => (
                <AiMessageBubble
                  key={index}
                  message={message}
                  position={index % 4}
                />
              ))}
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

// Improved message component with better styling
const AiMessageBubble = ({ message, position }) => {
  // Different styles and positions based on position parameter
  // 0 = top, 1 = right, 2 = bottom, 3 = left

  // Style variations with improved appearance
  const getBubbleStyle = () => {
    const colorSchemes = [
      "bg-gradient-to-r from-[#3926A7] to-[#21EAF4] border border-blue-300/30",
      "bg-gradient-to-r from-[#4736B7] to-[#31FAF4] border border-blue-300/30",
      "bg-gradient-to-r from-[#2916A7] to-[#11DAF4] border border-blue-300/30",
      "bg-gradient-to-r from-[#4A36C7] to-[#41FAF4] border border-blue-300/30",
    ];
    return colorSchemes[position % colorSchemes.length];
  };

  // Position calculations with improved spacing
  const getPositionStyle = () => {
    // All positions relative to the square card
    switch (position) {
      case 0: // Top
        return {
          top: "-5px",
          left: "20%",
          transform: "translateX(-50%) ",
          arrow: "bottom",
        };
      case 1: // Right
        return {
          top: "40%",
          right: "-90px",
          transform: "translateY(-50%)",
          arrow: "left",
        };
      case 2: // Bottom
        return {
          bottom: "10px",
          left: "50%",
          transform: "translateX(-50%)",
          arrow: "top",
        };
      case 3: // Left
        return {
          top: "70%",
          left: "-140px",
          transform: "translateY(-50%)",
          arrow: "right",
        };
      default:
        return {
          top: "-80px",
          left: "50%",
          transform: "translateX(-50%)",
          arrow: "bottom",
        };
    }
  };

  const posStyle = getPositionStyle();

  // Arrow styles based on position
  const getArrowStyle = () => {
    const baseClass = "absolute w-4 h-4 bg-blue-500 ";

    switch (posStyle.arrow) {
      case "bottom":
        return `${baseClass} -bottom-2 left-1/2 transform -translate-x-1/2 rotate-45`;
      case "top":
        return `${baseClass} -top-2 left-1/2 transform -translate-x-1/2 rotate-45`;
      case "left":
        return `${baseClass} top-1/2 -left-2 transform -translate-y-1/2 rotate-45`;
      case "right":
        return `${baseClass} top-1/2 -right-2 transform -translate-y-1/2 rotate-45`;
      default:
        return `${baseClass} -bottom-2 left-1/2 transform -translate-x-1/2 rotate-45`;
    }
  };

  // Enhanced entry animation
  const getEntryAnimation = () => {
    switch (position) {
      case 0:
        return { y: -20, opacity: 0 };
      case 1:
        return { x: 20, opacity: 0 };
      case 2:
        return { y: 20, opacity: 0 };
      case 3:
        return { x: -20, opacity: 0 };
      default:
        return { y: -20, opacity: 0 };
    }
  };

  // Calculate line connector position and style
  const getConnectorStyle = () => {
    switch (posStyle.arrow) {
      case "bottom":
        return {
          className:
            "absolute top-full left-1/2 bg-gradient-to-b from-white to-transparent",
          style: { transformOrigin: "top" },
          animate: { scaleY: 1 },
          initial: { scaleY: 0 },
        };
      case "top":
        return {
          className: "absolute bottom-full left-1/2 ",
          style: { transformOrigin: "bottom" },
          animate: { scaleY: 1 },
          initial: { scaleY: 0 },
        };
      case "left":
        return {
          className: "absolute right-full ",
          style: { transformOrigin: "right" },
          animate: { scaleX: 1 },
          initial: { scaleX: 0 },
        };
      case "right":
        return {
          className: "absolute left-full ",
          style: { transformOrigin: "left" },
          animate: { scaleX: 1 },
          initial: { scaleX: 0 },
        };
      default:
        return {
          className: "absolute top-full left-1/2 ",
          style: { transformOrigin: "top" },
          animate: { scaleY: 1 },
          initial: { scaleY: 0 },
        };
    }
  };

  const connector = getConnectorStyle();
  const bubbleStyle = getBubbleStyle();
  const arrowStyle = getArrowStyle();

  return (
    <motion.div
      className="absolute z-20 "
      style={{ ...posStyle }}
      initial={getEntryAnimation()}
      animate={{ x: 0, y: 0, opacity: 1 }}
      transition={{
        duration: 0.6,
        ease: "easeOut",
      }}
    >
      <div
        className={`px-5 py-4 border rounded-lg shadow-lg font-medium text-sm md:text-base relative min-w-[200px] max-w-[450px] ${bubbleStyle} text-white`}
      >
        {message}
        {/* Arrow pointing to the AI */}
        <div className={arrowStyle} />
      </div>

      {/* Line connecting to center */}
      <motion.div
        className={connector.className}
        style={connector.style}
        initial={connector.initial}
        animate={{
          ...connector.animate,
          opacity: [0.8, 1, 0.8],
        }}
        transition={{
          delay: 0.2,
          duration: 0.3,
          opacity: {
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
          },
        }}
      />
    </motion.div>
  );
};

// Enhanced background particles effect
const Particles = () => {
  const particleCount = 25;
  const particles = Array.from({ length: particleCount });

  return (
    <>
      {particles.map((_, index) => {
        // Use fixed values for initial positions to avoid hydration issues
        const size = 4;
        const initialX = (index * 4) % 100;
        const initialY = (index * 3) % 100;
        const duration = 15;
        const delay = index * 0.2;
        const opacity = 0.15;

        return (
          <motion.div
            key={index}
            className="absolute rounded-full bg-blue-300"
            style={{
              width: size,
              height: size,
              left: `${initialX}%`,
              top: `${initialY}%`,
              opacity: opacity,
            }}
            animate={{
              y: [0, -100, 0],
              x: [0, 30, 0],
              opacity: [opacity, opacity * 2, opacity],
            }}
            transition={{
              duration,
              delay,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        );
      })}
    </>
  );
};

export default HeroSection;