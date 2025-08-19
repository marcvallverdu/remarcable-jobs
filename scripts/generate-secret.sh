#!/bin/bash

echo "🔐 Generating secure hex secret for Better Auth..."
echo ""
echo "Your new secret (copy this to Vercel):"
echo "======================================="
openssl rand -hex 32
echo "======================================="
echo ""
echo "To use this secret:"
echo "1. Copy the hex string above"
echo "2. Go to Vercel Dashboard → Settings → Environment Variables"
echo "3. Set BETTER_AUTH_SECRET to this value"
echo "4. Redeploy your application"
echo ""
echo "⚠️  IMPORTANT: This must be a hex string (only 0-9 and a-f characters)"