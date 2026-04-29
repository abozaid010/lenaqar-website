#!/bin/bash
# Memory Diagnostic Script
# Run: chmod +x scripts/diagnose-memory.sh && ./scripts/diagnose-memory.sh

echo "=== Next.js Memory Diagnostics ==="
echo ""

# Check 1: Current memory usage
echo "1. Current Node processes:"
ps aux | grep -E "(next|node)" | grep -v grep | awk '{print $2, $4, $6, $11}' | while read pid pmem rss cmd; do
  rss_mb=$((rss / 1024))
  echo "   PID $pid: ${pmem}% CPU memory, ${rss_mb}MB RSS - $cmd"
done

echo ""
echo "2. System memory:"
vm_stat | head -6

echo ""
echo "3. Node.js version:"
node --version

echo ""
echo "4. Current NODE_OPTIONS:"
echo "   ${NODE_OPTIONS:-'(not set)'}"

echo ""
echo "5. Package.json dev script:"
grep -A2 '"dev":' package.json | head -3

echo ""
echo "6. Checking for large files in .next:"
if [ -d ".next" ]; then
  find .next -name "*.js" -size +1M -exec ls -lh {} \; 2>/dev/null | head -10
else
  echo "   .next directory not found"
fi

echo ""
echo "7. Checking src for heavy patterns:"
echo "   Files >500 lines:"
find src -name "*.jsx" -o -name "*.js" | xargs wc -l 2>/dev/null | sort -rn | head -10

echo ""
echo "8. Locale files size:"
ls -lh public/locales/*.js 2>/dev/null || echo "   No locale files found"

echo ""
echo "=== Quick Fixes to Try ==="
echo ""
echo "A. Run WITHOUT turbopack (uses webpack instead):"
echo "   npm run dev -- --no-turbopack"
echo ""
echo "B. Increase Node memory limit:"
echo "   NODE_OPTIONS='--max-old-space-size=6144' npm run dev"
echo ""
echo "C. Clear caches and restart:"
echo "   rm -rf .next node_modules/.cache"
echo "   npm run dev"
echo ""
echo "D. Run with heap profiling (for analysis):"
echo "   NODE_OPTIONS='--inspect --max-old-space-size=4096' npm run dev"
echo "   # Then open chrome://inspect → Memory tab"
