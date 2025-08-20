#!/bin/bash

# Script to update production database with new ApiToken table

echo "🔄 Production Database Update Script"
echo "===================================="
echo ""

# Check if DATABASE_URL is provided
if [ -z "$1" ]; then
    echo "❌ Error: Database URL not provided"
    echo ""
    echo "Usage:"
    echo "  ./scripts/update-prod-db.sh \"postgresql://user:pass@host/db?sslmode=require\""
    echo ""
    echo "Get your database URL from:"
    echo "  1. Neon Dashboard: https://console.neon.tech"
    echo "  2. Or Vercel Dashboard: Environment Variables section"
    echo ""
    exit 1
fi

DATABASE_URL="$1"

echo "📋 Update Summary:"
echo "  - Add ApiToken table for API authentication"
echo "  - Create indexes for performance"
echo "  - Set up foreign key relationships"
echo ""

read -p "Continue with production database update? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Update cancelled"
    exit 1
fi

echo ""
echo "🚀 Starting update..."
echo ""

# Run the schema push
DATABASE_URL="$DATABASE_URL" npx prisma db push --skip-generate

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Production database updated successfully!"
    echo ""
    echo "Next steps:"
    echo "  1. Verify in your database dashboard"
    echo "  2. Test token creation in admin panel"
    echo "  3. Monitor for any errors"
else
    echo ""
    echo "❌ Update failed. Please check the error above."
    echo ""
    echo "Common issues:"
    echo "  - Invalid database URL"
    echo "  - Network connectivity"
    echo "  - Database permissions"
    exit 1
fi