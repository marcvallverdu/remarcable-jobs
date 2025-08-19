# 🚨 URGENT: Set Environment Variables in Vercel

## Your app is deployed but authentication won't work without these variables!

### Step 1: Go to Vercel Dashboard
https://vercel.com/dashboard → Select your project → Settings → Environment Variables

### Step 2: Add These Variables EXACTLY

Click "Add New" and create each of these:

#### 1. BETTER_AUTH_SECRET (MUST BE HEX FORMAT!)
**Key:** `BETTER_AUTH_SECRET`  
**Value:** `29ac0acf703475dc2ce12cbf908f7781e1d6038bfe5264afd2477eb80f22cbeb`  
**Environment:** Production ✓
**Important:** This MUST be a hex string (only 0-9 and a-f characters)

#### 2. BETTER_AUTH_URL  
**Key:** `BETTER_AUTH_URL`  
**Value:** `https://remarcablejobs.com`  
**Environment:** Production ✓

#### 3. NEXT_PUBLIC_APP_URL
**Key:** `NEXT_PUBLIC_APP_URL`  
**Value:** `https://remarcablejobs.com`  
**Environment:** Production ✓

#### 4. DATABASE_URL
**Key:** `DATABASE_URL`  
**Value:** `[Your Neon PostgreSQL connection string]`  
**Environment:** Production ✓

### Step 3: Redeploy
After adding all variables:
1. Go to Deployments tab
2. Click the three dots on the latest deployment
3. Select "Redeploy"
4. Or push any small change to trigger a new deployment

### Step 4: Test Login
Once redeployed, test at:
- https://remarcablejobs.com/login

### Login Credentials:
- **Email:** marc@remarcablevc.com
- **Password:** [The password you set when creating the admin user]

## Troubleshooting:

### If you still get errors:
1. Check Vercel Function Logs for the exact error
2. Ensure all 4 environment variables are set
3. Make sure there are no typos in variable names
4. Verify the DATABASE_URL is your new rotated password

### Current Error Explanation:
The error "hex string expected, got undefined" means BETTER_AUTH_SECRET is not set.
This is why authentication is failing.

---

Generated: 2025-08-19
Status: **ACTION REQUIRED**