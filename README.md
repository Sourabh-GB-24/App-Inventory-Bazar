# FreshCart — Native iOS App (React Native + Expo, Built From Windows)

This is a complete **React Native (Expo)** project that compiles into a real, 100% offline **native iOS app** directly from your **Windows laptop**—no Mac required.

## Included Features
- **Home Dashboard:** Top **Pending** / **Closed** summary cards + single-column rectangular category blocks.
- **Category List Pages:** Add items with quantity steppers and units (`Kg`, `gm`, `Liters`, `numbers`, `box`, `packets`, plus custom units) and live **In stock** counts from Inventory.
- **Wish List Details:** Save **Price (`₹`)**, **Item Category**, and clickable **Product Link (`Link ↗`)**.
- **Inventory Section:** Track home stock with `Low / Out` and `In Stock` cards, steppers, and one-tap send-to-list.
- **Left Slide-Out Panel:** Navigation, auto-saving **Notepad**, and **App Settings** (Font Size, Theme Color, App Icon, Add/Remove Categories, Units).
- **100% Offline:** All data persists locally on your iPhone using `AsyncStorage`.

---

## Step 1: Prepare Your Windows Laptop (5 minutes)
1. Install **Node.js (LTS)** from `nodejs.org`.
2. Unzip `FreshCart_Expo_iOS.zip` to a folder (e.g., `C:\FreshCart_Expo_iOS`).
3. Open **PowerShell** or **Command Prompt** inside that folder and run:
   ```bash
   npm install
   ```

## Step 2: Instant Test on Your iPhone (Free, 1 Minute)
1. Install **Expo Go** from the iPhone App Store.
2. On your Windows laptop, run:
   ```bash
   npx expo start
   ```
3. Scan the QR code with your iPhone Camera to launch FreshCart natively in Expo Go.

## Step 3: Build a Real Installable `.ipa` File in the Cloud (No Mac Needed)
1. Create a free account at `expo.dev`.
2. In your project folder on Windows, run:
   ```bash
   npm install -g eas-cli
   eas login
   eas build -p ios --profile preview
   ```
3. Expo's cloud Macs will compile your native iOS `.ipa` binary and give you a download link.
4. **Install the `.ipa` on your iPhone from Windows:**
   - **Free Apple ID:** Download **Sideloadly** or **AltStore** on Windows, plug in your iPhone via USB, and install the `.ipa` (refresh over Wi-Fi once every 7 days).
   - **Apple Developer Account ($99/yr):** Upload to **TestFlight** or the **App Store** with `eas submit -p ios` for permanent installation with no 7-day refresh.
