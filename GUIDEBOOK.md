# 👑 PQN PARTY QUEEN — COMPLETE BRAND & E-COMMERCE OPERATIONS GUIDEBOOK
### *Haute Couture & Luxury Indian Bridal Ensemble Management System*

---

## 📖 TABLE OF CONTENTS
1. [Brand Overview & Architecture](#1-brand-overview--architecture)
2. [Design System, Custom SVGs & Responsive Breakpoints](#2-design-system-custom-svgs--responsive-breakpoints)
3. [Product Catalog & Inventory Management](#3-product-catalog--inventory-management)
   - [Single Product Add & Edit](#single-product-add--edit)
   - [Bulk Catalog Upload (Excel / CSV)](#bulk-catalog-upload-excel--csv)
   - [Template Download & Formatting](#template-download--formatting)
4. [Dynamic Hero Banners & Visual Customization](#4-dynamic-hero-banners--visual-customization)
5. [Indian GST Tax Invoices & Order Dossiers](#5-indian-gst-tax-invoices--order-dossiers)
   - [Billed To vs. Delivered To Logic](#billed-to-vs-delivered-to-logic)
   - [Combined 3-in-1 Printable Dossier](#combined-3-in-1-printable-dossier)
6. [Enterprise Warehouse Management System (WMS / OMS)](#6-enterprise-warehouse-management-system-wms--oms)
   - [Smart Regional Hub Geo-Routing](#smart-regional-hub-geo-routing)
   - [Batch & Wave Picking Engine](#batch--wave-picking-engine)
   - [Barcode Scanner QC Packing Station](#barcode-scanner-qc-packing-station)
   - [Carrier Rate Shopping & Bulk Manifesting](#carrier-rate-shopping--bulk-manifesting)
7. [Automated Customer Tracking & Owner Alert Engine](#7-automated-customer-tracking--owner-alert-engine)
   - [Email Milestone Dispatch](#email-milestone-dispatch)
   - [Live Satellite Radar Tracking (`/track-order`)](#live-satellite-radar-tracking-track-order)
   - [7-Day Doorstep Return & Exchange QR Pass](#7-day-doorstep-return--exchange-qr-pass)
8. [Meta Pixel & Instagram Shopping Auto-Sync Feeds](#8-meta-pixel--instagram-shopping-auto-sync-feeds)

---

## 1. Brand Overview & Architecture
**PQN Party Queen** is an Indian Luxury Haute Couture atelier specializing in handcrafted bridal lehengas, Banarasi silk sarees, cocktail gowns, and regal anarkali sets.
* **Storefront URL**: `https://pqnpartyqueen.com` (or `http://localhost:3000`)
* **Admin Command Center**: `/admin` (Secure staff & owner dashboard)
* **Design Philosophy**: Deep Atelier Emerald (`#0d4428`), Royal Gold (`#c59b27`), Ivory Cream (`#f6f8f6`), and Serif Typography (`Playfair Display`).

---

## 2. Design System, Custom SVGs & Responsive Breakpoints

### 🎨 Custom SVG Iconography System
In adherence to luxury brand standards, **no classic emojis** are used in storefront or admin interfaces. All icons are rendered using crisp, vector SVG components from `@/app/components/Icons.tsx`:
* `DownloadCloudIcon` & `UploadCloudIcon`: File import and export
* `FileSpreadsheetIcon`: Excel & CSV catalog templates
* `ReceiptIcon` & `PrinterIcon`: GST Tax Invoices and printing
* `BarcodeScanIcon`: Warehouse garment tag verification
* `ScaleIcon`: Volumetric package weight calculation
* `RouteIcon`: Smart regional hub geo-routing
* `TruckIcon`: Carrier logistics & courier dispatch
* `WhatsAppIcon`: VIP styling & concierge support

### 📱 Responsive Screen Detection & Breakpoints
The platform automatically detects viewport dimensions and scales dynamically across all device categories:
| Breakpoint | Target Display | Adaptations |
|---|---|---|
| **> 1200px** | Large Desktops & 4K Displays | Maximum container width 1360px, multi-column grid layouts |
| **992px - 1199px** | Laptops & Small Desktops | Adjusted padding and fluid font sizes |
| **768px - 991px** | Tablets & iPads | Collapsible sidebar, horizontal scroll data tables |
| **481px - 767px** | Large Phablets & Mobile Landscape | Full-width single column cards, touch-optimized tap targets (44px min height) |
| **< 480px** | Mobile Devices (iPhone / Android) | Stacked metrics, safe-area bottom navigation, fluid hero typography |

---

## 3. Product Catalog & Inventory Management

### Single Product Add & Edit
1. Navigate to **[Admin ➔ Products](/admin/products)**.
2. Click **"Add Single Product"**.
3. Fill in product title, category, regular price, sale price, SKU, multiple gallery photos, and size variants with inventory counts.

### Bulk Catalog Upload (Excel / CSV)
To add dozens or hundreds of products at once:
1. Go to **[Admin ➔ Products](/admin/products)**.
2. Click **"Download Catalog Format (.csv)"** to save `pqn_products_catalog_format_template.csv`.
3. Open the file in **Microsoft Excel**, **Google Sheets**, or Apple Numbers.
4. Fill in your products following the columns:
   * `name`: Name of the ensemble
   * `category`: Category name (e.g. *Bridal Lehengas*, *Banarasi Sarees*, *Cocktail Gowns*)
   * `price`: Regular retail price (e.g. `45000`)
   * `salePrice`: Discounted price if applicable (e.g. `38500`)
   * `sku`: Unique inventory SKU (e.g. `PQN-LEH-001`)
   * `stock`: Total quantity in stock (e.g. `15`)
   * `sizes`: Comma-separated sizes (e.g. `XS,S,M,L,XL,Custom`)
   * `colors`: Comma-separated colors (e.g. `Crimson Red,Royal Gold`)
   * `fabric`: Fabric composition (e.g. `Pure Micro Velvet`)
   * `work`: Embroidery technique (e.g. `Hand Zardozi with Gold Dabka`)
   * `description`: Detailed product narrative
   * `imageUrls`: Comma-separated URLs to product photos
   * `status`: `ACTIVE` or `DRAFT`
5. Click **"Upload Catalog (Excel / CSV)"** in the Admin panel.
6. Drag and drop your completed file or paste raw CSV text.
7. Review the **Live Import Preview Table** and click **"🚀 Import & Publish Products"**. The system will automatically create categories, variants, and image records in bulk.

---

## 4. Dynamic Hero Banners & Visual Customization
1. Navigate to **[Admin ➔ Hero & Banners](/admin/banners)**.
2. Update the background image URL or upload new campaign banners.
3. Modify the headline, subtitle, and call-to-action button links.
4. Changes appear on the homepage immediately upon saving.

---

## 5. Indian GST Tax Invoices & Order Dossiers

### Billed To vs. Delivered To Logic
* Indian commerce laws require distinct separation between the **Billed To Entity** (with optional GSTIN for B2B input tax credit) and the **Delivered To Consignee Address**.
* The checkout page automatically auto-resolves 6-digit Indian PIN codes to State and City via `/api/pincode/[code]`.

### Combined 3-in-1 Printable Dossier
From **[Admin ➔ Orders](/admin/orders)** or any individual order page:
* Click **"Download Invoice + Packing Slip + Courier Label"** to generate a combined printable document:
  * **Page 1**: Indian GST Tax Invoice (Original for Recipient) with HSN codes, IGST/CGST/SGST tax breakdown, and Authorized Signatory stamp.
  * **Page 2**: Warehouse Packing Slip & Garment QC Checklist.
  * **Page 3**: Courier Shipping Label with barcode, weight declaration, and destination hub routing.

---

## 6. Enterprise Warehouse Management System (WMS / OMS)
Available under **[Admin ➔ Fulfillment & WMS](/admin/fulfillment)**:

### Smart Regional Hub Geo-Routing
Incoming orders are routed automatically to regional hubs by PIN code:
* `HUB-DEL-01`: Delhi Central Hub (North Zone)
* `HUB-BOM-02`: Mumbai Western Hub (West Zone)
* `HUB-BLR-03`: Bengaluru Southern Hub (South Zone)
* `HUB-CCU-04`: Kolkata Eastern Hub (East Zone)

### Batch & Wave Picking Engine
Combines pending orders into consolidated SKU picklists sorted by **Aisle ➔ Bay ➔ Bin** location to minimize warehouse walking time.

### Barcode Scanner QC Packing Station
Interactive tag scanner allows packing staff to scan garment tag barcodes (`BAR-PQN-...`), validating item SKUs and computing package volumetric weight (`L x W x H cm / 5000`).

### Carrier Rate Shopping & Bulk Manifesting
Compares live freight rates across **Blue Dart Express**, **Delhivery Surface**, **Shiprocket Priority**, and **DTDC Air**, allowing 1-click bulk AWB generation and carrier handover manifests.

---

## 7. Automated Customer Tracking & Owner Alert Engine

### Email Milestone Dispatch
The platform automatically sends HTML emails via Nodemailer SMTP:
1. **Order Confirmation & GST Receipt**: Sent to customer on checkout.
2. **Atelier Processing Update**: Sent when craftsmen start tailoring/QC.
3. **Courier Dispatch Notice**: Sent with Air Waybill (AWB #) and 1-click live transit link.
4. **Owner New Order Alert**: Instant notification sent to the store owner with customer details and total order value.

### Live Satellite Radar Tracking (`/track-order`)
Customers can visit `/track-order?order=PQN-7841` to view real-time transit milestones, carrier details, and WhatsApp support.

### 7-Day Doorstep Return & Exchange QR Pass
Customers can tap **"One-Tap Return QR Code"** to generate a digital return barcode for doorstep courier handover without needing a printer.

---

## 8. Meta Pixel & Instagram Shopping Auto-Sync Feeds

### Live Catalog Feed URLs:
* **Primary XML Feed**: `https://pqnpartyqueen.com/api/feeds/meta` (or `/api/feeds/facebook.xml`)
* **CSV Feed**: `https://pqnpartyqueen.com/api/feeds/catalog.csv`

### Setting Up Instagram Shopping:
1. Open **[Admin ➔ Settings ➔ Meta Pixel & Instagram Catalog](/admin/settings)**.
2. Copy the **Primary XML Feed URL**.
3. In **Meta Commerce Manager** (`business.facebook.com/commerce`):
   * Select **Catalog ➔ Data Sources ➔ Add Products ➔ Scheduled Data Feed**.
   * Paste the Feed URL and set the update schedule to **Hourly** or **Daily**.
4. All products uploaded to the website will automatically sync with your Instagram Shop and Facebook Catalog!

---

*Authored for PQN Party Queen Atelier Commerce Operations & Engineering Team.*
