# 👑 PQN PARTY QUEEN — Windows Desktop Software User Manual

Welcome to the **PQN PARTY QUEEN Windows Desktop Edition**. This manual provides complete instructions for installing, running, navigating, testing, and managing the desktop software.

---

## 📥 1. Installation & Quick Launch

### Option A: Install via Setup Wizard (Recommended)
1. Locate the setup file in your project directory:
   ```
   release\PQN Party Queen-Setup-0.1.0.exe
   ```
2. Double-click the installer.
3. Follow the setup wizard to choose your installation directory (e.g. `C:\Program Files\PQN Party Queen`).
4. Check **Create Desktop Shortcut**.
5. Once completed, launch the application from your **Desktop** or **Start Menu**.

### Option B: Standalone Portable Launch (No Installation Required)
If you prefer running the software without going through an installation process:
1. Navigate to:
   ```
   release\win-unpacked\PQN Party Queen.exe
   ```
2. Double-click **`PQN Party Queen.exe`** to launch immediately.

---

## ⚡ 2. Startup & First Launch

When the application opens:
1. You will see a luxury dark branded loading screen:
   ```
   👑 PQN PARTY QUEEN
   Initializing Haute Couture Atelier...
   ```
2. The software automatically assigns an available local port (e.g., `127.0.0.1:34567`) and launches the background server.
3. Within 1-2 seconds, the full interactive storefront loads smoothly!

---

## 🔐 3. Access Credentials & Login

All credentials are pre-loaded and tested in the database:

### 👑 Super Administrator (Full Management Access)
- **Email:** `admin@pqnpartyqueen.com`
- **Password:** `Admin@12345`
- **How to Access:**
  - Press `Ctrl + A` anytime in the software, OR
  - Click **💼 Admin Suite → Admin Dashboard** from the top menu bar, OR
  - Navigate directly to `/admin/login`

### 👗 Store Manager / Couture Stylist
- **Email:** `manager@pqnpartyqueen.com`
- **Password:** `Manager@12345`
- **Permissions:** Product catalog management, stock updates, size guides, customer inquiries.

### 🛍️ Demo Customer Account
- **Email:** `customer@pqnpartyqueen.com`
- **Password:** `Customer@12345`
- **Name:** Priya Sharma
- **Pre-configured Bridal Profile:** Bust: 36", Waist: 30", Hips: 40", Height: 5'6"
- **Saved Shipping Address:** B-42, Vasant Vihar, Sector 8, New Delhi - 110057

---

## 🛍️ 4. Storefront & Customer Experience

### Browsing Collections
- Navigate via the header menu or top menu `Ctrl + B`:
  - **Bridal & Festive Lehengas:** Handcrafted zardozi, raw silk kalidars (*Noor-e-Zari*, *Gulbahar*).
  - **Luxury Suit Sets:** Heavy tilla anarkalis and scalloped shararas (*Shahi Pishwas*, *Kashmiri Sharara*).
  - **Heritage Sarees:** Pure Kanjeevaram gold zari and tissue organzas (*Virasat*, *Chandrika*).
  - **Indo-Western Gowns:** Reception trail gowns (*Midnight Azure*).
  - **Designer Cord Sets & Velvet Dupattas**.

### Shopping Bag & Checkout Testing
1. Select any product, choose your size (`S`, `M`, `L`, `XL`), and click **Add to Bag**.
2. Go to **Checkout** (`/checkout` or `Ctrl + H` → Bag).
3. Apply coupon code: **`PQN10`** for an instant 10% discount!
4. Choose **Cash on Delivery (COD)** for 1-click order placement without requiring payment gateway sandbox keys.
5. An invoice and order confirmation will be generated instantly with a unique order number (e.g. `PQN-2026-XXXX`).

---

## 💼 5. Admin Atelier Management Suite

Access the admin dashboard via `Ctrl + A` to manage the complete boutique:

### 1. Analytics & Sales Overview (`/admin/analytics`)
- Visual revenue charts, total orders, average order value, and top-selling garments.

### 2. Orders & Courier Dispatch (`/admin/orders`)
- View all pending, confirmed, shipped, and delivered orders.
- Open any order to inspect customer sizing, delivery address, and line items.
- Generate and preview PDF Invoices and Packing Slips with legal authorized signature.
- Test courier dispatch with **iThink Logistics, Blue Dart, and Delhivery** AWB generation.

### 3. Products & Stock Inventory (`/admin/products`)
- Create new garments with photos, runway video URLs, prices, and fabric compositions.
- Adjust inventory levels across sizes (XS to XXL).

### 4. Logistics & Tax Configuration (`/admin/settings`)
- Configure standard Indian GST rates (5%, 12%, 18%).
- Manage free shipping thresholds and delivery partners.

---

## ⌨️ 6. Keyboard Shortcuts Reference

| Shortcut | Action |
|---|---|
| `Ctrl + H` | Storefront Home |
| `Ctrl + B` | Browse Product Catalog |
| `Ctrl + A` | Open Admin Dashboard |
| `Ctrl + O` | Open Orders & Fulfillment |
| `Ctrl + P` | Open Products & Inventory Manager |
| `Ctrl + R` | Reload Current Screen |
| `Ctrl + Shift + R` | Force Reload (Bypass Cache) |
| `F11` | Toggle Full Screen Mode |
| `F12` | Toggle Developer Tools (Inspection & Console) |
| `Ctrl + Q` | Exit Software Gracefully |

---

## 🔄 7. Resetting or Updating Dummy Data

To reset or repopulate the dummy catalog, variants, and credentials at any time, run in terminal:

```powershell
npm run desktop:seed
```

---

## 🛠️ 8. Rebuilding the Windows Installer

Whenever you make custom modifications or want to produce a new installer build:

```powershell
# Full build: compiles Next.js standalone and creates Windows .exe installer
npm run desktop:build

# Quick pack: repackages existing build without Next.js recompilation
npm run desktop:pack
```
