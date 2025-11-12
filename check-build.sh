#!/bin/bash
# Quick diagnostic script to check build configuration

echo "🔍 Checking Build Configuration..."
echo ""

# Check vite config
echo "1. Vite Config Base Path:"
grep "base:" vite.config.ts | head -1
echo ""

# Check if dist exists
if [ -d "dist" ]; then
    echo "2. ✅ dist/ folder exists"
    
    # Check index.html
    if [ -f "dist/index.html" ]; then
        echo "3. ✅ dist/index.html exists"
        echo ""
        echo "   Asset paths in built HTML:"
        grep -E "(href|src)=" dist/index.html | head -5
        echo ""
        
        # Check if paths start with /n8nBOT/
        if grep -q "/n8nBOT/" dist/index.html; then
            echo "   ✅ Paths correctly use /n8nBOT/ base path"
        else
            echo "   ⚠️  WARNING: Paths don't use /n8nBOT/ base path!"
        fi
    else
        echo "3. ❌ dist/index.html missing"
    fi
    
    # Check for CSS files
    echo ""
    echo "4. CSS Files:"
    if ls dist/assets/*.css 1> /dev/null 2>&1; then
        echo "   ✅ CSS files found:"
        ls -1 dist/assets/*.css | head -3
    else
        echo "   ❌ No CSS files found!"
    fi
    
    # Check for JS files
    echo ""
    echo "5. JavaScript Files:"
    if ls dist/assets/*.js 1> /dev/null 2>&1; then
        echo "   ✅ JS files found:"
        ls -1 dist/assets/*.js | head -3
    else
        echo "   ❌ No JS files found!"
    fi
else
    echo "2. ❌ dist/ folder missing - run 'npm run build' first"
fi

echo ""
echo "6. Environment Variables:"
if [ -f ".env" ]; then
    echo "   ✅ .env file exists"
    if grep -q "VITE_SUPABASE_URL" .env; then
        echo "   ✅ VITE_SUPABASE_URL is set"
    else
        echo "   ⚠️  VITE_SUPABASE_URL not found in .env"
    fi
else
    echo "   ⚠️  .env file not found (optional for local dev)"
fi

echo ""
echo "7. GitHub Pages Configuration:"
if [ -f "public/.nojekyll" ]; then
    echo "   ✅ .nojekyll file exists"
else
    echo "   ⚠️  .nojekyll file missing (may cause routing issues)"
fi

echo ""
echo "✅ Diagnostic complete!"
echo ""
echo "Next steps:"
echo "1. If paths are wrong, rebuild: npm run build"
echo "2. Check GitHub Actions for deployment status"
echo "3. Hard refresh browser (Ctrl+Shift+R)"
echo "4. Check browser console for errors (F12)"

