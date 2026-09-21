# 👑 PQN PARTY QUEEN — COMPLETE DEPLOYMENT & MAINTENANCE MANUAL

Welcome to the official maintenance and deployment manual for the **PQN Party Queen** luxury e-commerce platform.

This manual explains how to edit your website, run it locally, test changes, and deploy live updates safely with **one single command** without touching your database or breaking any live features.

---

## 1. Where You Edit the Website

All source code is located on your computer at:
```text
C:\Users\DELL\Documents\pqnpartyqueen
```

### Which files to edit for different parts of the website:

| Website Area | File to Edit |
| :--- | :--- |
| **Homepage Hero Banner & Sliders** | `app/components/HeroSlider.tsx` |
| **Homepage Layout & Sections** | `app/page.tsx` |
| **Trending & Featured Products** | `app/components/TrendingProducts.tsx` |
| **Header, Logo & Navigation Menu** | `app/components/Header.tsx`, `app/components/Navbar.tsx` |
| **Footer & Social Links** | `app/components/Footer.tsx` |
| **Product Detail Pages** | `app/shop/[slug]/page.tsx` |
| **Product Reviews & Photo Gallery** | `app/components/ProductReviews.tsx` |
| **AI Virtual Try-On Modal** | `app/components/TryOnModal.tsx` |
| **Shopping Cart & Bag** | `app/cart/page.tsx`, `app/context/CartContext.tsx` |
| **Checkout & Payments Page** | `app/checkout/page.tsx` |
| **Member Login & OTP Gate** | `app/account/login/page.tsx`, `app/components/OtpInput.tsx` |
| **Customer Registration** | `app/account/register/page.tsx` |
| **Customer Account Profile** | `app/account/page.tsx` |
| **Admin Panel Dashboard** | `app/admin/page.tsx`, `app/admin/layout.tsx` |
| **Admin Product Management** | `app/admin/products/page.tsx`, `app/admin/products/new/page.tsx` |
| **Admin Orders & Fulfillment** | `app/admin/orders/page.tsx`, `app/admin/orders/[id]/page.tsx` |
| **Contact & Concierge Desk** | `app/contact/page.tsx` |
| **Global Theme, Colors & CSS** | `app/globals.css`, `app/layout.tsx` |
| **Database Schema** | `prisma/schema.prisma` |

---

## 2. How to Run the Website Locally on Your PC

To preview and test changes on your computer before deploying live:

1. Open PowerShell or Terminal in your project directory (`c:\Users\DELL\Documents\pqnpartyqueen`).
2. Run the development server:
   ```powershell
   npm run dev
   ```
3. Open your browser and go to:
   ```text
   http://localhost:3000
   ```
4. As you make edits in VS Code and save, your browser will update automatically (Hot Reloading).
5. When done testing, press `Ctrl + C` in the terminal to stop the local server.

---

## 3. How to Deploy with `npm run deploy` (The 1-Command Workflow)

Whenever you are ready to publish your updates live to [https://pqnpartyqueen.com](https://pqnpartyqueen.com):

### Run This Single Command:
```powershell
npm run deploy
# OR on Windows PowerShell if execution policies are restricted:
npm.cmd run deploy
```

### What Happens Automatically (in 20 Seconds):
1. **Pre-flight Build Check**: Compiles the project locally with Webpack (`npx next build --webpack`). If there are any syntax or TypeScript errors, **the deployment stops immediately**, preventing any broken code from reaching the live server.
2. **Standalone Packaging**: Packages the compiled standalone bundles, `.next/static`, `prisma/`, and `public/` assets into `pqn-live-bundle.tar.gz`.
3. **SSH Transfer**: Connects securely to Hostinger via SFTP and uploads the bundle.
4. **Remote Extraction**: Safely extracts the new files into `/home/u375327955/pqn-app/`.
5. **Prisma Type Sync**: Regenerates the Prisma database client types (`npx prisma generate`).
6. **Server Restart**: Gracefully stops the old process and starts the Node.js 22 server daemon on internal port `34849`.
7. **Cache Purge**: Purges the LiteSpeed reverse proxy cache so all visitors see the new changes instantly.
8. **Local Cleanup**: Automatically deletes temporary deployment files on your PC.

---

## 4. How to Check Whether Deployment Succeeded

When the deployment finishes, the terminal will display:
```text
================================================================================
🎉 DEPLOYMENT COMPLETED SUCCESSFULLY!
================================================================================
⏱️  Total Duration : 18.4 seconds
🌐 Live Website   : https://pqnpartyqueen.com
👑 Admin Portal   : https://pqnpartyqueen.com/admin/login
📋 Server Logs    : /home/u375327955/pqn-app/app.log
================================================================================
```

You can also run the built-in live feature auditor on your PC anytime:
```powershell
node scratch/run-full-feature-audit.js
```

---

## 5. How to View Live Server Logs (`app.log`)

If you want to view the live production console output, API request logs, or error traces:

1. Connect to Hostinger via SSH:
   ```powershell
   ssh -p 65002 u375327955@82.25.107.10
   ```
2. View the last 100 lines of the live log:
   ```bash
   tail -n 100 /home/u375327955/pqn-app/app.log
   ```
3. Or stream logs in real-time as users browse:
   ```bash
   tail -f /home/u375327955/pqn-app/app.log
   ```
   *(Press `Ctrl + C` to stop viewing)*.

---

## 6. How the Supabase Database Is Protected During Deployment

Your database is hosted on **Supabase Managed Cloud PostgreSQL** (`aws-0-ap-south-1.pooler.supabase.com`).

* The `npm run deploy` script **NEVER** runs `prisma migrate reset` or `db push --force-reset`.
* It **NEVER** deletes, truncates, or modifies existing database rows.
* All customer logins, passwords, orders, reviews, addresses, and catalog products remain 100% untouched and safe in the cloud.

---

## 7. Which Folders & Files You Must NEVER Edit

1. **`.next/`**: Machine-compiled code. It is overwritten every time you build.
2. **`node_modules/`**: Managed automatically by `npm`.
3. **`public_html/index.php` and `public_html/.htaccess`**: The reverse-proxy bridge on Hostinger. Do not modify or delete these files, as they route all live visitor traffic from `https://pqnpartyqueen.com` to the internal Next.js application server.
4. **`node_modules/@prisma/client`**: Auto-generated by Prisma.

---

## 8. How to Rollback If a Deployment Fails

If you made an unintended code change and deployed it:
1. Revert the file change on your PC (or use `git checkout`).
2. Run:
   ```powershell
   npm run deploy
   ```
Your previous working code will be recompiled and deployed live in under 20 seconds.

---

## 9. Environment Variables & Credentials

* **Local Environment File**: `C:\Users\DELL\Documents\pqnpartyqueen\.env`
* **Production Environment File**: `/home/u375327955/pqn-app/.env`
* **Template (No Secrets)**: `.env.example`

## 10. Hostinger Production Architecture Reference

| Setting | Value |
| :--- | :--- |
| **Domain** | `https://pqnpartyqueen.com` |
| **Server IP & SSH Port** | `82.25.107.10:65002` |
| **SSH User** | `u375327955` |
| **App Directory** | `/home/u375327955/pqn-app` |
| **Node Version** | Node.js 22 (`/opt/alt/alt-nodejs22/root/usr/bin/node`) |
| **Internal Port** | `34849` (Listening on `127.0.0.1:34849`) |
| **Web Root (Public)** | `/home/u375327955/domains/pqnpartyqueen.com/public_html` |
| **Reverse Proxy** | `public_html/index.php` (Forwarding web traffic to port 34849) |
| **Server Log Location** | `/home/u375327955/pqn-app/app.log` |
| **Database** | **Supabase Cloud PostgreSQL** (AWS Mumbai `ap-south-1`) |
