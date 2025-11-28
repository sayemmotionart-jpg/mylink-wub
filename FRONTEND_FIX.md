# Frontend Fix - viewer_id Mismatch

## 🔍 Problem Found

Frontend এ **viewer_id mismatch** problem ছিল:

- WebSocket connect: `viewer-${Date.now()}` (e.g., `viewer-1234567890`)
- Answer send: `viewer-${Date.now()}` (e.g., `viewer-1234567891`) ❌ **Different!**
- ICE candidate: `viewer-${Date.now()}` (e.g., `viewer-1234567892`) ❌ **Different!**

**এর ফলে:** Sender-এ peer connection match হচ্ছিল না, answer receive হচ্ছিল না।

## ✅ Fix Applied

1. **`clientIdRef` added** - Consistent viewer_id রাখার জন্য
2. **All messages use same viewer_id** - Answer এবং ICE candidate এ same ID

### Changes:

```typescript
// Before:
const clientId = `viewer-${Date.now()}` // Different each time
sender_id: `viewer-${Date.now()}` // Different!

// After:
const clientIdRef = useRef<string>(`viewer-${Date.now()}`) // Consistent
sender_id: clientIdRef.current // Same ID everywhere
```

---

## 🚀 Deploy to Vercel

### Step 1: Commit and Push

```bash
cd web/frontend
git add .
git commit -m "Fix viewer_id mismatch in WebRTC connection"
git push
```

### Step 2: Vercel Auto-Deploy

Vercel automatically deploy করবে, অথবা manually:

1. Vercel Dashboard → Your Project
2. Deployments → Latest → Redeploy

### Step 3: Verify

Frontend refresh করুন এবং test করুন:
- ✅ Stream দেখা যাবে
- ✅ Camera indicator জ্বলবে
- ✅ Audio কাজ করবে

---

## ✅ Expected Flow (After Fix)

1. Frontend connects → `viewer-1234567890`
2. Backend sends "viewer-connected" → Sender receives
3. Sender creates offer → `target: viewer-1234567890`
4. Frontend receives offer → Creates answer
5. Frontend sends answer → `sender_id: viewer-1234567890` ✅ **Same ID!**
6. Sender receives answer → Matches peer connection ✅
7. WebRTC connection established → Stream starts ✅

---

## 🧪 Test After Deploy

1. Frontend refresh করুন (F5)
2. Browser console check করুন (F12) - errors আছে কিনা
3. Sender log check করুন - "Set remote description" message আসবে
4. Stream check করুন - Video/Audio দেখা যাবে

---

**Now:** Frontend deploy করুন Vercel-এ এবং test করুন!


