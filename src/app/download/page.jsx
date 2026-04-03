"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { Download, Smartphone, Star, ArrowRight } from "lucide-react";

// Constants
const COUNTDOWN_DURATION = 3;
const APP_STORE_URLS = {
  ios: "https://apps.apple.com/eg/app/lenaai-dashboard/id6745050088",
  android: "https://play.google.com/store/apps/details?id=net.lenaai.LenaAIDashboardApp",
  desktop: "https://lenaai.net"
};

const USER_AGENT_PATTERNS = {
  ios: /iPad|iPhone|iPod/,
  android: /android/i
};

export default function DownloadPage() {
  const [appLink, setAppLink] = useState("#");
  const [platform, setPlatform] = useState("unknown");
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(COUNTDOWN_DURATION);
  // Start with all images as false for fast initial load
  const [imagesLoaded, setImagesLoaded] = useState({
    logo: false,
    screen1: false,
    screen2: false
  });

  // Device detection
  useEffect(() => {
    const userAgent = navigator.userAgent || navigator.vendor;
    let detectedPlatform = "unknown";
    let detectedLink = APP_STORE_URLS.desktop;

    if (USER_AGENT_PATTERNS.ios.test(userAgent)) {
      detectedPlatform = "ios";
      detectedLink = APP_STORE_URLS.ios;
    } else if (USER_AGENT_PATTERNS.android.test(userAgent)) {
      detectedPlatform = "android";
      detectedLink = APP_STORE_URLS.android;
    } else {
      detectedPlatform = "desktop";
      detectedLink = APP_STORE_URLS.desktop;
    }

    setPlatform(detectedPlatform);
    setAppLink(detectedLink);

    // Auto-redirect for mobile users with proper cleanup
    if (detectedPlatform !== "desktop") {
      setIsRedirecting(true);
      let isMounted = true;
      
      const countdown = setInterval(() => {
        setRedirectCountdown((prev) => {
          if (prev <= 1 && isMounted) {
            clearInterval(countdown);
            // Use current state value instead of closure reference
            setAppLink(currentLink => {
              if (isMounted && currentLink !== "#") {
                window.location.href = currentLink;
              }
              return currentLink;
            });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        isMounted = false;
        clearInterval(countdown);
      };
    }
  }, []);

  // Google Analytics tracking
  const trackDownload = useCallback((platform, buttonType = 'primary') => {
    if (typeof gtag !== 'undefined') {
      gtag('event', 'download_click', {
        platform: platform,
        button_type: buttonType,
        source: new URLSearchParams(window.location.search).get('utm_source') || 'direct',
        campaign: new URLSearchParams(window.location.search).get('utm_campaign') || 'none',
        timestamp: new Date().toISOString()
      });
    }
  }, []);

  const trackPageLoad = useCallback(() => {
    if (typeof gtag !== 'undefined') {
      gtag('event', 'page_load', {
        page: 'download',
        platform: platform,
        source: new URLSearchParams(window.location.search).get('utm_source') || 'direct'
      });
    }
  }, [platform]);

  useEffect(() => {
    trackPageLoad();
  }, [platform]);

  // Image loading handlers with lazy loading support
  const handleImageLoad = useCallback((imageKey) => {
    setImagesLoaded(prev => ({ ...prev, [imageKey]: true }));
  }, []);

  const handleImageError = useCallback((imageKey) => {
    console.error(`${imageKey} image failed to load`);
    setImagesLoaded(prev => ({ ...prev, [imageKey]: false }));
  }, []);

  // Intersection observer for lazy loading screenshots
  const [screenshotVisible, setScreenshotVisible] = useState(false);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setScreenshotVisible(true);
            // Trigger screenshot loading when visible
            setImagesLoaded(prev => ({ 
              ...prev, 
              screen1: 'loading',
              screen2: 'loading'
            }));
            observer.disconnect();
          }
        });
      },
      { threshold: 0.1 }
    );

    const screenshotElement = document.getElementById('screenshots-section');
    if (screenshotElement) {
      observer.observe(screenshotElement);
    }

    return () => observer.disconnect();
  }, []);

  // Trigger logo loading after component mounts for better performance
  useEffect(() => {
    // Small delay to ensure page loads quickly, then load logo
    const logoTimer = setTimeout(() => {
      // Set logo to loading state to trigger the Image component
      setImagesLoaded(prev => ({ ...prev, logo: 'loading' }));
    }, 100);
    
    return () => clearTimeout(logoTimer);
  }, []);

  const handleDownloadClick = useCallback((buttonType = 'primary') => {
    trackDownload(platform, buttonType);
    if (platform !== "desktop") {
      window.location.href = appLink;
    } else {
      window.open(appLink, '_blank', 'noopener,noreferrer');
    }
  }, [platform, appLink]);

  const getStoreButtonText = useCallback(() => {
    switch (platform) {
      case "ios":
        return "Download on Apple App Store";
      case "android":
        return "Get it on Google Play Store";
      default:
        return "Download App";
    }
  }, [platform]);

  const storeIcon = useMemo(() => 
    <Download className="w-5 h-5" strokeWidth={1.5} />
  , []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-primary/90 text-primary-foreground flex flex-col items-center justify-center p-4">
      <motion.div
        className="w-full max-w-md flex flex-col items-center gap-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        {/* Logo */}
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, duration: 0.3 }}
        >
          {imagesLoaded.logo === 'loading' || imagesLoaded.logo === true ? (
            <Image
              src="/images/logo-5.png"
              alt="Lena AI"
              width={80}
              height={80}
              className="object-contain opacity-95"
              priority={false}
              loading="lazy"
              onLoad={() => handleImageLoad('logo')}
              onError={() => handleImageError('logo')}
            />
          ) : (
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-xl">LA</span>
            </div>
          )}
        </motion.div>

        {/* Hero Section */}
        <motion.div
          className="text-center space-y-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <h1 className="text-2xl font-bold tracking-tight text-white">
            All Primary Units In one Place Updated Daily.
          </h1>
          <p className="text-sm text-white/80 max-w-xs mx-auto">
            AI Agent help you to sell more and faster.
          </p>
        </motion.div>

        {/* Auto-redirect notice */}
        {isRedirecting && (
          <motion.div
            className="text-center space-y-2 p-3 bg-white/10 rounded-lg"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.3 }}
          >
            <p className="text-xs text-white/70">Redirecting you to download...</p>
            <p className="text-lg font-mono text-white">{redirectCountdown}</p>
          </motion.div>
        )}

        {/* Primary CTA */}
        <motion.div
          className="w-full"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.4 }}
        >
          <button
            onClick={() => handleDownloadClick('primary')}
            aria-label={`Download Lena AI app for ${platform}`}
            className="w-full flex items-center justify-center gap-3 py-4 px-6 rounded-xl bg-white text-primary font-semibold hover:bg-white/90 transition-all transform hover:scale-105 shadow-lg"
          >
            {storeIcon}
            {getStoreButtonText()}
            <ArrowRight className="w-4 h-4" strokeWidth={2} />
          </button>
        </motion.div>

        {/* Social Proof */}
        <motion.div
          className="text-center space-y-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.4 }}
        >
          <div className="flex items-center justify-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" strokeWidth={1} />
            ))}
          </div>
          <p className="text-sm text-white/80">Trusted by 10,000+ users</p>
          <p className="text-xs text-white/60">New version just released!</p>
        </motion.div>

        {/* App Screenshots */}
        <motion.div
          id="screenshots-section"
          className="w-full space-y-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.5 }}
        >
          <div className="grid grid-cols-2 gap-3">
            <div className="relative aspect-[9/19] rounded-xl overflow-hidden bg-white/10 border border-white/20">
              {screenshotVisible && (imagesLoaded.screen1 === 'loading' || imagesLoaded.screen1 === true) ? (
                <Image
                  src="/images/app_screen1.jpg"
                  alt="App screenshot 1"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 50vw, 200px"
                  priority={false}
                  loading="lazy"
                  onLoad={() => handleImageLoad('screen1')}
                  onError={() => handleImageError('screen1')}
                />
              ) : (
                <div className="w-full h-full bg-white/20 flex items-center justify-center">
                  <Smartphone className="w-8 h-8 text-white/50" />
                </div>
              )}
            </div>
            <div className="relative aspect-[9/19] rounded-xl overflow-hidden bg-white/10 border border-white/20">
              {screenshotVisible && (imagesLoaded.screen2 === 'loading' || imagesLoaded.screen2 === true) ? (
                <Image
                  src="/images/app_screen2.jpg"
                  alt="App screenshot 2"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 50vw, 200px"
                  priority={false}
                  loading="lazy"
                  onLoad={() => handleImageLoad('screen2')}
                  onError={() => handleImageError('screen2')}
                />
              ) : (
                <div className="w-full h-full bg-white/20 flex items-center justify-center">
                  <Smartphone className="w-8 h-8 text-white/50" />
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Backup download button */}
        {!isRedirecting && (
          <motion.div
            className="w-full pt-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.4 }}
          >
            <button
              onClick={() => handleDownloadClick('backup')}
              aria-label={`Download Lena AI app manually for ${platform}`}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg border border-white/30 bg-white/10 text-white text-sm font-medium hover:bg-white/20 transition-colors"
            >
              <Smartphone className="w-4 h-4" strokeWidth={1.5} />
              Download Manually
            </button>
          </motion.div>
        )}

        {/* Urgency element */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.4 }}
        >
          <p className="text-xs text-white/60 italic">
            Limited offer: Join early users and get premium features free
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
