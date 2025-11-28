# Vercel New Project Deploy - Step by Step

## 🗑️ Step 1: Delete Old Project (Optional)

যদি পুরানো project delete করতে চান:

1. Go to: https://vercel.com/dashboard
2. Select project: `mylink-bajsuuq47-sayemmotionart-jpgs-projects`
3. Settings → General → Scroll down
4. "Delete Project" click করুন
5. Confirm করুন

**Note:** Delete না করলেও নতুন project create করতে পারবেন।

---

## 🚀 Step 2: New Project Deploy

### Method 1: Vercel Dashboard (সহজ)

1. **Go to Vercel Dashboard:**
   - https://vercel.com/dashboard
   - Click "Add New..." → "Project"

2. **Import Git Repository:**
   - GitHub/GitLab/Bitbucket থেকে repository select করুন
   - অথবা "Import Git Repository" → Repository URL দিন

3. **Configure Project:**
   - **Project Name:** `mylink-frontend` (বা আপনার পছন্দমতো)
   - **Root Directory:** `web/frontend` ⚠️ **Important!**
   - **Framework Preset:** Next.js (auto-detect হবে)
   - **Build Command:** `npm run build` (default)
   - **Output Directory:** `.next` (default)
   - **Install Command:** `npm install` (default)

4. **Environment Variables:**
   - Add variable:
     - **Name:** `NEXT_PUBLIC_BACKEND_URL`
     - **Value:** `wss://mylink.slowrox.com/ws`
   - Click "Add"

5. **Deploy:**
   - Click "Deploy"
   - Wait for build to complete (2-3 minutes)

---

### Method 2: Vercel CLI (Advanced)

```powershell
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Navigate to frontend directory
cd web/frontend

# Deploy
vercel

# Follow prompts:
# - Set up and deploy? Yes
# - Which scope? (Your account)
# - Link to existing project? No
# - Project name? mylink-frontend
# - Directory? ./
# - Override settings? No

# Set environment variable
vercel env add NEXT_PUBLIC_BACKEND_URL
# Value: wss://mylink.slowrox.com/ws
# Environment: Production, Preview, Development (all)

# Deploy to production
vercel --prod
```

---

## ⚙️ Step 3: Important Settings

### Root Directory

**Critical:** Root directory set করতে হবে `web/frontend`

Vercel Dashboard → Project Settings → General:
- **Root Directory:** `web/frontend`

### Environment Variables

Vercel Dashboard → Project Settings → Environment Variables:
- `NEXT_PUBLIC_BACKEND_URL` = `wss://mylink.slowrox.com/ws`
- Apply to: Production, Preview, Development (all)

### Build Settings

Vercel Dashboard → Project Settings → General:
- **Build Command:** `npm run build`
- **Output Directory:** `.next`
- **Install Command:** `npm install`

---

## 📋 Step 4: Verify Deployment

### Check Build Logs

1. Vercel Dashboard → Deployments
2. Latest deployment click করুন
3. Build logs check করুন:
   - ✅ "Build successful"
   - ✅ No errors

### Test Frontend

1. **Open URL:** Vercel provided URL (e.g., `https://mylink-frontend.vercel.app`)
2. **Browser Console:** F12 → Check for errors
3. **Test Stream:**
   - ✅ "Connected to backend"
   - ✅ Stream দেখা যাবে
   - ✅ Camera indicator জ্বলবে

---

## 🔧 Step 5: Custom Domain (Optional)

যদি custom domain use করতে চান:

1. Vercel Dashboard → Project Settings → Domains
2. Add domain: `yourdomain.com`
3. DNS records add করুন (Vercel instructions follow করুন)

---

## 🐛 Troubleshooting

### Build Fails

**Error: "Cannot find module"**
- Root directory check করুন: `web/frontend`
- Dependencies check করুন: `package.json`

**Error: "Build command failed"**
- Build logs check করুন
- Local build test করুন: `npm run build`

### Environment Variable Not Working

- Variable name check করুন: `NEXT_PUBLIC_BACKEND_URL` (exact)
- All environments এ apply করুন (Production, Preview, Development)
- Redeploy করুন

### Stream Not Working

- Browser console check করুন (F12)
- Backend URL verify করুন
- Network tab check করুন (WebSocket connection)

---

## ✅ Quick Checklist

- [ ] Root Directory: `web/frontend`
- [ ] Environment Variable: `NEXT_PUBLIC_BACKEND_URL = wss://mylink.slowrox.com/ws`
- [ ] Build successful
- [ ] Frontend URL working
- [ ] Stream test successful

---

**Now:** Vercel Dashboard এ যান এবং নতুন project create করুন!


