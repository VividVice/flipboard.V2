#!/bin/bash
# Cleanup script for removing generated test/build artifacts
# Safe to run - only removes files that are regenerated automatically

set -e

echo "🧹 Cleaning up Flipboard V2 project..."

# Navigate to project root
cd "$(dirname "$0")"

echo ""
echo "📦 Cleaning Backend artifacts..."
cd backend
rm -rf .coverage htmlcov coverage.xml 2>/dev/null || true
find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
find . -type f -name "*.pyc" -delete 2>/dev/null || true
find . -type d -name "*.egg-info" -exec rm -rf {} + 2>/dev/null || true
echo "   ✓ Backend cleaned (.coverage, htmlcov, __pycache__, *.pyc)"

cd ..

echo ""
echo "🎨 Cleaning Frontend artifacts..."
cd frontend
rm -rf coverage playwright-report test-results dist 2>/dev/null || true
rm -f .eslintcache 2>/dev/null || true
echo "   ✓ Frontend cleaned (coverage, playwright-report, test-results, dist)"

cd ..

echo ""
echo "🗑️  Cleaning OS files..."
find . -name ".DS_Store" -delete 2>/dev/null || true
echo "   ✓ Removed .DS_Store files"

echo ""
echo "✨ Cleanup complete!"
echo ""
echo "ℹ️  These files will be regenerated when you run tests or builds:"
echo "   - Backend: pytest creates .coverage, htmlcov, coverage.xml"
echo "   - Frontend: vitest creates coverage/, playwright creates reports"
echo ""
echo "🚀 Your repository is now clean and ready to commit!"
