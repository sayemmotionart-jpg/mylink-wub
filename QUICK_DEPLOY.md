# Quick Vercel Deploy Guide

## 🚀 Fastest Way to Deploy

### Step 1: Vercel Dashboard

1. Go to: https://vercel.com/dashboard
2. Click "Add New..." → "Project"

### Step 2: Import Repository

- GitHub/GitLab/Bitbucket থেকে repository select করুন
- অথবা Git URL paste করুন

### Step 3: Configure (Important!)

**Root Directory:** `web/frontend` ⚠️ **Must set this!**

**Environment Variables:**
- Name: `NEXT_PUBLIC_BACKEND_URL`
- Value: `wss://mylink.slowrox.com/ws`
- Apply to: All (Production, Preview, Development)

### Step 4: Deploy

- Click "Deploy"
- Wait 2-3 minutes

### Step 5: Test

- Open Vercel URL
- Frontend refresh করুন
- Stream test করুন

---

## ⚠️ Critical Settings

1. **Root Directory:** `web/frontend` (not root!)
2. **Environment Variable:** `NEXT_PUBLIC_BACKEND_URL = wss://mylink.slowrox.com/ws`
3. **Framework:** Next.js (auto-detect)

---

## ✅ After Deploy

1. Vercel URL open করুন
2. Browser console check করুন (F12)
3. Stream test করুন

---

**Ready to deploy!** Vercel Dashboard এ যান এবং project create করুন।


