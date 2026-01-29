#!/bin/bash
#
# LinkedIn Refresh - Quick CLI Script
# ====================================
#
# Usage:
#   ./refresh.sh                    # Refresh competitor profiles (default)
#   ./refresh.sh competitor         # Refresh competitor profiles
#   ./refresh.sh inspiration        # Refresh inspiration profiles
#   ./refresh.sh own                # Refresh your own profiles
#   ./refresh.sh all                # Refresh all profiles
#   ./refresh.sh ids 1,2,3          # Refresh specific profile IDs
#

set -e

cd "$(dirname "$0")"

# Load environment variables
if [ -f .env.local ]; then
    export $(grep -v '^#' .env.local | xargs)
fi

# Parse arguments
TYPE="${1:-competitor}"
IDS="${2:-}"

echo "🔄 LinkedIn Refresh Script"
echo "=========================="
echo ""

# Check if dev server is running
if ! lsof -i :3000 | grep -q LISTEN; then
    echo "⚠️  Dev server not running. Starting..."
    npm run dev &
    sleep 5
    echo "✅ Dev server started"
    echo ""
fi

# Build the arguments
ARGS=""
case "$TYPE" in
    "all")
        ARGS="--all"
        echo "📋 Refreshing ALL profiles..."
        ;;
    "ids")
        if [ -z "$IDS" ]; then
            echo "❌ Error: --ids requires comma-separated IDs"
            exit 1
        fi
        ARGS="--ids $IDS"
        echo "📋 Refreshing profiles: $IDS..."
        ;;
    *)
        ARGS="--type $TYPE"
        echo "📋 Refreshing $TYPE profiles..."
        ;;
esac

echo ""

# Run the TypeScript refresh script
npx ts-node scripts/refresh.ts $ARGS

echo ""
echo "✨ Refresh complete!"
