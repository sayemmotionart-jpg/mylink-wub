# Browser Autoplay Policy Fix ✅

## 🔍 Problem

Browser console এ error:
```
NotAllowedError: play() failed because the user didn't interact with the document first
```

**কারণ:** Browser autoplay policy - user interaction ছাড়া audio/video automatically play করতে দেয় না।

---

## ✅ Solution Applied

### 1. User Interaction Detection ✅

- `userInteractedRef` state যোগ করা হয়েছে
- `click`, `touchstart`, `keydown` events listen করা হচ্ছে
- একবার user interaction হলে autoplay enabled হয়

### 2. Pending Play Queue ✅

- `pendingPlayRef` যোগ করা হয়েছে
- User interaction এর আগে stream আসলে pending রাখা হয়
- User interaction এর পর automatically play করার চেষ্টা করা হয়

### 3. Click-to-Play Message ✅

- Stream ready কিন্তু user interaction না থাকলে
- "Click anywhere to start stream" message দেখাবে
- User click করলে immediately play হবে

---

## 🚀 How It Works

1. **Page Load:**
   - User interaction detect করার জন্য event listeners add হয়
   - Stream ready হলে play করার চেষ্টা করা হয়

2. **If User Hasn't Interacted:**
   - Stream ready হলে "Click anywhere to start stream" message দেখাবে
   - User click করলে play হবে

3. **If User Has Interacted:**
   - Stream ready হলে automatically play হবে
   - No message, seamless experience

---

## 📋 Changes Made

### `web/frontend/app/page.tsx`

1. **User interaction detection:**
   ```typescript
   const userInteractedRef = useRef<boolean>(false)
   const pendingPlayRef = useRef<{video: boolean, audio: boolean}>({video: false, audio: false})
   ```

2. **Event listeners for user interaction:**
   ```typescript
   useEffect(() => {
       const enableAutoplay = () => {
           userInteractedRef.current = true
           // Try to play pending streams
       }
       document.addEventListener('click', enableAutoplay, { once: true })
       // ... touchstart, keydown
   }, [])
   ```

3. **Conditional play() call:**
   ```typescript
   if (userInteractedRef.current) {
       await videoRef.current!.play()
   } else {
       // Show click-to-play message
   }
   ```

---

## 🧪 Testing

### Test 1: User Interaction Before Stream

1. Page load করুন
2. Page এ anywhere click করুন (বা key press করুন)
3. Stream আসলে automatically play হবে ✅

### Test 2: Stream Before User Interaction

1. Page load করুন (no interaction)
2. Stream আসলে "Click anywhere to start stream" message দেখাবে
3. Message এ click করুন
4. Stream play হবে ✅

---

## 🚀 Deploy

```bash
cd web/frontend
git add app/page.tsx
git commit -m "Fix browser autoplay policy - user interaction detection"
git push
```

Vercel automatically deploy করবে।

---

## ✅ Expected Results

- ✅ No more "NotAllowedError" in console
- ✅ Stream automatically plays after user interaction
- ✅ "Click anywhere to start stream" message if needed
- ✅ Seamless experience after first interaction

---

**Now:** Deploy করুন এবং test করুন!


