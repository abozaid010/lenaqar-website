"use client";

import CalendarModal from "@/components/ui/calendar-modal";
import { useI18n } from "@/context/translate-api";
import { motion } from "framer-motion";
import Image from "next/image";
import { useEffect, useState } from "react";

const HeroSection = () => {
  const { t } = useI18n();

  const [visibleMessages, setVisibleMessages] = useState([]);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  const messages = [
    t.heroSection.message1,
    t.heroSection.message2,
    t.heroSection.message3,
    t.heroSection.message4,
    t.heroSection.message5,
    t.heroSection.message6,
  ];

  useEffect(() => {
    setVisibleMessages([]);
    setCurrentMessageIndex(0);
  }, [t]);

  // Add new message every second until all messages are shown
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
    <div className="relative w-full h-[70vh] md:h-[80vh] flex items-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <Image
          src={"/images/web2.jpg"}
          alt={t.heroSection.backgroundAlt}
          fill
          objectFit="cover"
          priority={true}
        />

        <div className="absolute inset-0 bg-primary/80"></div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 container grid grid-cols-1 xl:grid-cols-2"
      >
        <motion.div
          className="md:col-span-1 space-y-4"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <motion.div
            className="px-2 font-semibold text-blue-300 my-4 py-2 w-fit text-lg bg-primary/50 rounded-lg border border-blue-400/20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
          >
            {t.heroSection.subtitle}
          </motion.div>

          <motion.h1
            className="text-3xl lg:text-5xl font-bold text-white leading-10 md:leading-16"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.8 }}
          >
            {t.heroSection.title1}

            <br />

            {t.heroSection.title2}
          </motion.h1>

          <motion.p
            className="text-sm md:text-base text-white max-w-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}
          >
            {t.heroSection.description}
          </motion.p>

          <CalendarModal
            buttonText={t.heroSection.ctaButton}
            style={
              "bg-gradient-to-r from-[#3926A7] to-[#21EAF4] hover:opacity-90 px-8 py-3 rounded-md text-white font-medium transition-all shadow-lg mt-4"
            }
          />
        </motion.div>

        <motion.div
          className="hidden xl:col-span-1 xl:flex justify-center md:justify-end relative"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
        >
          {/* Large blue circle background */}
          <motion.div
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-72 md:w-80 md:h-80 rounded-full bg-[#5EADF5]/40"
            animate={{
              scale: [1, 1.05, 1],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          {/* Square AI Image */}
          <motion.div
            className="absolute top-1/2   left-[55%] transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 md:w-96 md:h-96"
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
              className="object-contain"
              priority
            />
            {/* Enhanced overlay effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-tr from-blue-500/10 to-blue-600/10"
              animate={{
                opacity: [0.2, 0.3, 0.2],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            {/* Display messages with improved layout */}
            <div className="absolute top-0 left-[5%] w-[90%] h-full z-10">
              {visibleMessages.map((message, index) => (
                <AiMessageBubble
                  key={index}
                  message={message}
                  position={index % 8}
                  total={visibleMessages.length}
                  index={index}
                />
              ))}
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
};

// Improved message component with enhanced positioning for more messages
const AiMessageBubble = ({ message, position, total, index }) => {
  // Enhanced bubble style variations
  const getBubbleStyle = () => {
    const colorSchemes = [
      "bg-gradient-to-r from-[#3926A7]/40 to-[#21EAF4]/40 border border-blue-300/30",
      "bg-gradient-to-r from-[#4736B7]/40 to-[#31FAF4]/40 border border-blue-300/30",
      "bg-gradient-to-r from-[#2916A7]/40 to-[#11DAF4]/40 border border-blue-300/30",
      "bg-gradient-to-r from-[#4A36C7]/40 to-[#41FAF4]/40 border border-blue-300/30",
      "bg-gradient-to-r from-[#3926A7]/50 to-[#21EAF4]/50 border border-blue-300/40",
      "bg-gradient-to-r from-[#4736B7]/50 to-[#31FAF4]/50 border border-blue-300/40",
      "bg-gradient-to-r from-[#2916A7]/50 to-[#11DAF4]/50 border border-blue-300/40",
      "bg-gradient-to-r from-[#4A36C7]/50 to-[#41FAF4]/50 border border-blue-300/40",
    ];
    return colorSchemes[position % colorSchemes.length];
  };

  // Custom position calculations: 3 right, 3 left, 1 bottom
  const getPositionStyle = () => {
    // Fixed positions: 3 on right, 3 on left, 1 at bottom
    const positions = [
      // Right Side (3 positions)
      { top: "20%", right: "-100px", transform: "translateY(-50%)" }, // Top Right
      { top: "50%", right: "-100px", transform: "translateY(-50%)" }, // Middle Right
      { top: "80%", right: "-100px", transform: "translateY(-50%)" }, // Bottom Right

      // Left Side (3 positions)
      { top: "20%", left: "-100px", transform: "translateY(-50%)" }, // Top Left
      { top: "50%", left: "-100px", transform: "translateY(-50%)" }, // Middle Left
      { top: "80%", left: "-100px", transform: "translateY(-50%)" }, // Bottom Left

      // Bottom (1 position)
      { bottom: "-50px", left: "31%", transform: "translateX(-50%)" }, // Bottom Center
    ];

    return positions[position % positions.length];
  };

  const posStyle = getPositionStyle();

  // Custom entry animations for the updated layout
  const getEntryAnimation = () => {
    const animations = [
      // Right side animations (3)
      { x: 30, opacity: 0 }, // Top Right
      { x: 30, opacity: 0 }, // Middle Right
      { x: 30, opacity: 0 }, // Bottom Right

      // Left side animations (3)
      { x: -30, opacity: 0 }, // Top Left
      { x: -30, opacity: 0 }, // Middle Left
      { x: -30, opacity: 0 }, // Bottom Left

      // Bottom animation (1)
      { y: 30, opacity: 0 }, // Bottom Center
    ];

    return animations[position % animations.length];
  };

  return (
    <motion.div
      className="absolute z-20"
      style={{ ...posStyle }}
      initial={getEntryAnimation()}
      animate={{ x: 0, y: 0, opacity: 1 }}
      transition={{
        duration: 0.6,
        ease: "easeOut",
        delay: index * 0.1, // Staggered animation
      }}
    >
      <div
        className={`px-3 py-2 border rounded-lg shadow-lg font-medium text-sm md:text-base relative min-w-[140px] max-w-[200px] ${getBubbleStyle()} text-white`}
      >
        {message}
      </div>
    </motion.div>
  );
};

export default HeroSection;
