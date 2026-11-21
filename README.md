# FreshCart — 100% Offline iOS App (No Mac Needed)

This folder is a **zero-dependency offline Progressive Web App (PWA)**. Unlike a normal website bookmark, it includes a **Service Worker (`sw.js`)** and **Web App Manifest (`manifest.webmanifest`)** with zero external CDN links — so once you open it once on your iPhone, **the entire app and all your lists are cached on your phone and work 100% offline (even in Airplane Mode)**.

## 2-Minute Setup From Your Windows Laptop (Free)
1. Unzip this folder (`FreshCart_Offline_PWA`) on your Windows laptop.
2. Go to **[Netlify Drop](https://app.netlify.com/drop)** (free, no coding needed) and drag-and-drop the `FreshCart_Offline_PWA` folder onto the page.
   - *(Alternatively, you can upload the folder to GitHub Pages or Cloudflare Pages for free.)*
3. Netlify gives you a private `https://...netlify.app` link. Open that link **once** in **Safari** on your iPhone.
4. Tap **Share → Add to Home Screen → Add**.
5. Launch **FreshCart** from your Home Screen. You can turn on **Airplane Mode** right now to verify it opens and saves everything 100% offline!

## Want a Native App Store / `.ipa` Build From Windows Later?
Apple requires macOS/Xcode to compile native `.ipa` binaries locally, so on Windows you'd use a cloud builder like **Expo (EAS Build)** with React Native. Note that installing an `.ipa` on iPhone without a Mac still requires either a paid Apple Developer account ($99/yr for TestFlight) or a Windows sideloader like Sideloadly/AltStore (which expires every 7 days on a free Apple ID). That's why this Offline PWA is the cleanest free option on Windows — it never expires and works completely offline.
