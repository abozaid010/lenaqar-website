#!/usr/bin/env node
/**
 * Memory Profiling Script
 * Run with: NODE_OPTIONS='--inspect' node scripts/profile-memory.js
 * Then open Chrome DevTools → Node.js icon → Memory tab
 */

const fs = require('fs');
const path = require('path');

// Log memory every 5 seconds
function logMemory(label) {
  const usage = process.memoryUsage();
  const mb = (bytes) => (bytes / 1024 / 1024).toFixed(1);

  console.log(`\n[${label}] ${new Date().toISOString()}`);
  console.log(`  RSS:        ${mb(usage.rss)} MB (Total memory used)`);
  console.log(`  Heap Used:  ${mb(usage.heapUsed)} MB (V8 actively using)`);
  console.log(`  Heap Total: ${mb(usage.heapTotal)} MB (V8 allocated)`);
  console.log(`  External:   ${mb(usage.external)} MB (C++ objects/Buffers)`);
  console.log(`  ArrayBuffers: ${mb(usage.arrayBuffers)} MB`);

  // GC pressure indicator
  const heapPressure = (usage.heapUsed / usage.heapTotal * 100).toFixed(1);
  console.log(`  Heap Pressure: ${heapPressure}%`);

  return usage;
}

// Force GC if available (run with --expose-gc)
function forceGC() {
  if (global.gc) {
    global.gc();
    console.log('  [Forced GC executed]');
  }
}

// Create heap snapshot file
function writeHeapSnapshot(label) {
  try {
    if (require('v8').writeHeapSnapshot) {
      const filename = `heap-${label}-${Date.now()}.heapsnapshot`;
      require('v8').writeHeapSnapshot(filename);
      console.log(`  [Heap snapshot written: ${filename}]`);
      return filename;
    }
  } catch (e) {
    console.log('  [Heap snapshots not available - run with --heapsnapshot-near-heap-limit flag]');
  }
  return null;
}

// Analyze bundle sizes
function analyzeBundle() {
  console.log('\n=== Bundle Size Analysis ===');
  const nextDir = path.join(__dirname, '..', '.next');

  if (!fs.existsSync(nextDir)) {
    console.log('.next directory not found - run build first');
    return;
  }

  // Find large chunks
  const chunks = [];
  function scanDir(dir, prefix = '') {
    if (!fs.existsSync(dir)) return;

    for (const entry of fs.readdirSync(dir)) {
      const fullPath = path.join(dir, entry);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        scanDir(fullPath, `${prefix}/${entry}`);
      } else if (entry.endsWith('.js') || entry.endsWith('.js.map')) {
        const sizeMB = stat.size / 1024 / 1024;
        if (sizeMB > 0.5) { // Only files > 500KB
          chunks.push({
            name: `${prefix}/${entry}`,
            size: sizeMB,
            path: fullPath
          });
        }
      }
    }
  }

  scanDir(nextDir);
  chunks.sort((a, b) => b.size - a.size);

  console.log(`\nTop 20 largest JS chunks:`);
  chunks.slice(0, 20).forEach((chunk, i) => {
    console.log(`  ${i + 1}. ${chunk.name}: ${chunk.size.toFixed(2)} MB`);
  });

  const totalSize = chunks.reduce((sum, c) => sum + c.size, 0);
  console.log(`\nTotal large chunks (>500KB): ${totalSize.toFixed(2)} MB`);
}

// Check for memory leaks in specific patterns
function checkLeakPatterns() {
  console.log('\n=== Memory Leak Pattern Check ===');

  // Read current memory
  const usage = process.memoryUsage();
  const heapUsedMB = usage.heapUsed / 1024 / 1024;

  // Thresholds based on typical Next.js dev server
  const WARN_THRESHOLD = 1500; // 1.5GB
  const CRITICAL_THRESHOLD = 3000; // 3GB

  if (heapUsedMB > CRITICAL_THRESHOLD) {
    console.log(`⚠️  CRITICAL: Heap at ${heapUsedMB.toFixed(0)}MB - near crash threshold`);
  } else if (heapUsedMB > WARN_THRESHOLD) {
    console.log(`⚠️  WARNING: Heap at ${heapUsedMB.toFixed(0)}MB - investigate`);
  } else {
    console.log(`✅ OK: Heap at ${heapUsedMB.toFixed(0)}MB`);
  }

  // Check for specific patterns that cause leaks
  const checks = [
    {
      name: 'Query cache retention',
      check: () => {
        // Check if react-query cache time is too high
        const providerPath = path.join(__dirname, '..', 'src/providers/query-client-provider.jsx');
        if (fs.existsSync(providerPath)) {
          const content = fs.readFileSync(providerPath, 'utf-8');
          const gcTimeMatch = content.match(/gcTime:\s*(\d+)/);
          if (gcTimeMatch) {
            const gcTimeMin = parseInt(gcTimeMatch[1]) / 1000 / 60;
            return gcTimeMin > 10 ? `⚠️  gcTime is ${gcTimeMin}min (high)` : `✅ gcTime is ${gcTimeMin}min`;
          }
        }
        return '❓ Could not check';
      }
    },
    {
      name: 'Node memory limit',
      check: () => {
        const limit = process.env.NODE_OPTIONS?.match(/max-old-space-size=(\d+)/)?.[1];
        return limit ? `✅ ${limit}MB limit set` : '⚠️  No limit set (default ~1.4GB)';
      }
    },
    {
      name: 'Turbopack enabled',
      check: () => {
        const pkgPath = path.join(__dirname, '..', 'package.json');
        if (fs.existsSync(pkgPath)) {
          const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
          const hasTurbo = pkg.scripts?.dev?.includes('turbopack');
          return hasTurbo ? '⚠️  Yes (can increase memory usage)' : '✅ No';
        }
        return '❓ Unknown';
      }
    }
  ];

  for (const { name, check } of checks) {
    console.log(`  ${name}: ${check()}`);
  }
}

// Main monitoring
async function main() {
  console.log('=== Next.js Memory Profiler ===\n');

  // Initial state
  logMemory('START');
  checkLeakPatterns();
  analyzeBundle();

  // Keep alive for inspection
  console.log('\n=== Monitoring (Ctrl+C to stop) ===');

  let iteration = 0;
  const interval = setInterval(() => {
    iteration++;
    const usage = logMemory(`T+${iteration * 5}s`);

    // Write heap snapshot if memory grows significantly
    if (usage.heapUsed > 2 * 1024 * 1024 * 1024) { // 2GB
      writeHeapSnapshot(`high-memory-${iteration}`);
    }

    // Auto-exit if we hit dangerous levels
    if (usage.heapUsed > 3.5 * 1024 * 1024 * 1024) { // 3.5GB
      console.log('\n⚠️  Memory approaching limit - forcing exit');
      writeHeapSnapshot('pre-crash');
      clearInterval(interval);
      process.exit(1);
    }
  }, 5000);

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n\n=== Final Memory State ===');
    logMemory('END');
    clearInterval(interval);
    process.exit(0);
  });
}

main().catch(console.error);
