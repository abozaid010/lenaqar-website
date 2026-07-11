// Device detection utility functions with TypeScript support
// These can be extracted to a separate utils file in production

export type Platform = 'ios' | 'android' | 'desktop';

export interface DeviceInfo {
  platform: Platform;
  appStoreUrl: string;
}

export interface TestCase {
  name: string;
  userAgent: string | null;
  expected: DeviceInfo;
}

export const USER_AGENT_PATTERNS = {
  ios: /iPad|iPhone|iPod/,
  android: /android/i
} as const;

export const APP_STORE_URLS = {
  ios: "https://apps.apple.com/eg/app/lenaai-dashboard/id6745050088",
  android: "https://play.google.com/store/apps/details?id=net.lenaai.LenaAIDashboardApp",
  desktop: "https://lenaai.net"
} as const;

/**
 * Detects the platform based on user agent string
 * @param userAgent - The user agent string
 * @returns The detected platform
 */
export function detectPlatform(userAgent?: string | null): Platform {
  if (!userAgent) return 'desktop';
  
  if (USER_AGENT_PATTERNS.ios.test(userAgent)) {
    return 'ios';
  } else if (USER_AGENT_PATTERNS.android.test(userAgent)) {
    return 'android';
  } else {
    return 'desktop';
  }
}

/**
 * Gets the appropriate app store URL for a platform
 * @param platform - The platform
 * @returns The corresponding app store URL
 */
export function getAppStoreUrl(platform: Platform): string {
  return APP_STORE_URLS[platform];
}

/**
 * Complete device detection function
 * @param userAgent - The user agent string
 * @returns Object containing platform and app store URL
 */
export function getDeviceInfo(userAgent?: string | null): DeviceInfo {
  const platform = detectPlatform(userAgent);
  const appStoreUrl = getAppStoreUrl(platform);
  
  return {
    platform,
    appStoreUrl
  };
}

// Test cases for device detection
export const testCases: TestCase[] = [
  {
    name: 'iPhone',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
    expected: { platform: 'ios', appStoreUrl: APP_STORE_URLS.ios }
  },
  {
    name: 'iPad',
    userAgent: 'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
    expected: { platform: 'ios', appStoreUrl: APP_STORE_URLS.ios }
  },
  {
    name: 'iPod',
    userAgent: 'Mozilla/5.0 (iPod touch; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
    expected: { platform: 'ios', appStoreUrl: APP_STORE_URLS.ios }
  },
  {
    name: 'Android',
    userAgent: 'Mozilla/5.0 (Linux; Android 10; SM-G975F) AppleWebKit/537.36',
    expected: { platform: 'android', appStoreUrl: APP_STORE_URLS.android }
  },
  {
    name: 'Chrome Desktop',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    expected: { platform: 'desktop', appStoreUrl: APP_STORE_URLS.desktop }
  },
  {
    name: 'Safari Desktop',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15',
    expected: { platform: 'desktop', appStoreUrl: APP_STORE_URLS.desktop }
  },
  {
    name: 'Empty User Agent',
    userAgent: '',
    expected: { platform: 'desktop', appStoreUrl: APP_STORE_URLS.desktop }
  },
  {
    name: 'Null User Agent',
    userAgent: null,
    expected: { platform: 'desktop', appStoreUrl: APP_STORE_URLS.desktop }
  },
  {
    name: 'Unknown Device',
    userAgent: 'SomeRandomDevice/1.0',
    expected: { platform: 'desktop', appStoreUrl: APP_STORE_URLS.desktop }
  }
];

// Test result interface
export interface TestResult {
  passed: number;
  failed: number;
  total: number;
}

// Simple test runner function
export function runTests(): TestResult {
  let passed = 0;
  let failed = 0;
  
  testCases.forEach((testCase) => {
    const result = getDeviceInfo(testCase.userAgent);
    const passedTest = JSON.stringify(result) === JSON.stringify(testCase.expected);
    
    if (passedTest) {
      passed++;
    } else {
      failed++;
    }
  });
  
  return { passed, failed, total: testCases.length };
}
