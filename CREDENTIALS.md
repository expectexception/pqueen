# 👑 PQN PARTY QUEEN — Desktop & Demo Credentials Reference

This document lists all default accounts, roles, access levels, and credentials pre-loaded into the **PQN Party Queen** software.

---

## 🔐 1. Administrative Accounts

### Super Administrator (Full Atelier Access)
- **Role:** Master Admin (Access to Analytics, Catalog, Orders, Courier API settings, Staff Management)
- **Email:** `admin@pqnpartyqueen.com`
- **Password:** `Admin@12345`
- **Portal URL:** `http://127.0.0.1:34567/admin/login` (or select *Admin Suite → Admin Dashboard* from the desktop top menu)

### Alternative Master Administrator
- **Email:** `thep4rtyqueen@gmail.com`
- **Password:** `Admin@12345`

### Store Manager / Catalog Stylist
- **Role:** Store Manager (Product updates, Stock adjustments, Inquiries)
- **Email:** `manager@pqnpartyqueen.com`
- **Password:** `Manager@12345`

---

## 🛍️ 2. Customer Test Account

### Demo Shopper (Pre-configured Sizing & Address)
- **Email:** `customer@pqnpartyqueen.com`
- **Password:** `Customer@12345`
- **Name:** Priya Sharma
- **Phone:** `+91 98765 12345`
- **Pre-configured Bridal Profile:**
  - Bust: 36 inches
  - Waist: 30 inches
  - Hips: 40 inches
  - Height: 5'6"
- **Saved Address:** B-42, Vasant Vihar, Sector 8, New Delhi - 110057

---

## 💳 3. Checkout & Payment Testing

- **Cash on Delivery (COD):** Fully enabled with ₹0 extra fee for testing instant order creation.
- **Razorpay Test Mode:** Can be tested in test mode with Razorpay sandbox cards.
- **Voucher / Promo Code:** Use code **`PQN10`** during checkout for a 10% discount.

---

## 🔄 4. How to Reset or Re-seed Data

To re-seed or refresh dummy catalog items, variants, and credentials at any time, run:

```powershell
npm run desktop:seed
```
