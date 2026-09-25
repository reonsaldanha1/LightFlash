# Generating the Android APK for Lightflash

Because an `.apk` file is a compiled Android native binary requiring the Java Development Kit (JDK), Gradle, and the Android SDK (which are not bundled in a lightweight Node.js web container), here are the **3 easiest and fastest ways** to get your `.apk` and put it in your GitHub repository:

---

## ⚡ Option 1: 1-Click Instant APK Download (Recommended - Takes 30 Seconds)

Because **Lightflash** is fully configured with an offline Service Worker and a Web App Manifest (`/public/manifest.json`), you can generate an installable Android APK online in 1 click without installing any developer tools:

1. Open **[PWABuilder.com](https://www.pwabuilder.com)** (Microsoft's open-source PWA to Android packager).
2. Enter your public app URL:
   ```text
   https://ais-pre-3rnqu5hb5g6xstx2udywus-16007343735.asia-southeast1.run.app
   ```
3. Click **"Start"**.
4. In the Android section, click **"Package for Stores"** or **"Generate APK"**.
5. Click **Download APK**.
6. You will receive `Lightflash.apk`. You can now drag and drop it directly into your GitHub repository under **Releases** or inside a `/release` folder!

---

## 🤖 Option 2: Automatic GitHub Actions Build (Already Set Up in this Repo!)

This repository now includes an automated workflow at:
**`.github/workflows/build-apk.yml`**

Whenever you push your code to GitHub:
1. Push this repository to GitHub:
   ```bash
   git add .
   git commit -m "Add Lightflash app and APK workflow"
   git push origin main
   ```
2. In your GitHub repository, click on the **Actions** tab.
3. Select the **Build Android APK** workflow.
4. Once completed (approx. 2-3 minutes), scroll to the **Artifacts** section at the bottom of the page.
5. Click **`Lightflash-Tactical-APK`** to download your freshly compiled `.apk`!
6. You can attach this APK directly to your GitHub Releases.

---

## 💻 Option 3: Build Locally using Android Studio & Capacitor

If you have Android Studio installed on your computer:

1. Clone your repository:
   ```bash
   git clone <your-github-repo-url>
   cd <your-repo>
   ```
2. Install dependencies:
   ```bash
   npm install
   npm install @capacitor/core @capacitor/cli @capacitor/android
   ```
3. Build the web distribution:
   ```bash
   npm run build
   ```
4. Initialize the Android platform:
   ```bash
   npx cap add android
   npx cap sync android
   ```
5. Open the project in Android Studio:
   ```bash
   npx cap open android
   ```
6. In Android Studio, go to the top menu:
   **Build > Build Bundle(s) / APK(s) > Build APK(s)**
7. The APK will be generated at:
   `android/app/build/outputs/apk/debug/app-debug.apk`
