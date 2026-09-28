# Market Cart

A tiny grocery budget tracker. Snap a photo of each item, enter the price on the tag, and watch the total and the amount left. At the counter, pay exactly the total shown.

## Features
- Budget with live "left to spend" and progress bar (turns red when over)
- Bottom navigation: Cart, Regulars, History, Profile
- **Regulars:** star an item to save it, then add it to any cart in one tap
- **History:** calendar with daily spend, tap a day to see its trips, monthly total vs monthly budget
- **Profile:** name, budget per trip, monthly budget, stats, export or erase data
- Camera photo per item, price, quantity
- Running cart total, edit quantity, remove items
- Counter screen with exact amount to pay and itemised receipt
- Installable app (PWA) that works offline
- Saved in the browser (localStorage), no backend

## Run locally
Open `index.html` in a browser. On a phone, camera capture needs HTTPS (see below).

## Deploy on GitHub Pages
1. Create a new repository and upload all files: `index.html`, `style.css`, `app.js`, `manifest.json`, `sw.js`, the four `.png` icons and `README.md`.
2. Go to **Settings → Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**, select `main` and `/ (root)`, then Save.
4. Open the `https://<your-username>.github.io/<repo-name>/` link on your phone.

## Install on your phone
- **Android (Chrome):** open the site, tap the menu, then **Install app** (or **Add to Home screen**).
- **iPhone (Safari):** open the site, tap **Share**, then **Add to Home Screen**.

After the first visit the app opens offline. If you change any file, bump `CACHE` in `sw.js` (for example `market-cart-v2`) so phones pick up the update.

## License
MIT
