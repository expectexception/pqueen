# 👑 PQN PARTY QUEEN — Haute Couture & Luxury Indian Fashion

> **Luxury Indian Couture, Bridal Ateliers & Modern Boutique Management Platform**  
> Operable as a **Next.js Web Application** and a **Standalone Windows Desktop Software (`.exe`)**.

---

## 🌟 Platform Highlights

- **Atelier Storefront:** Handcrafted bridal lehengas, Banarasi tissue sarees, heavy embroidered anarkali suit sets, reception gowns, and couture coordinates.
- **Bespoke Sizing & Bridal Profile:** Custom measurements (Bust, Waist, Hips, Height) captured at checkout for bridal couture alterations.
- **Admin Management Suite:** Real-time analytics, order dispatch, stock inventory, courier aggregator integration (iThink Logistics, Blue Dart, Delhivery), tax configuration, and PDF invoice generation.
- **Windows Desktop Application (`.exe`):** Packaged via **Electron** and **Next.js Standalone**, allowing full local execution with native menus, offline resilience, and installer packaging.

---

## 📦 Windows Desktop Software (.exe)

The desktop edition packages the entire Next.js full-stack platform into a standalone Windows installer and portable application.

### 🚀 Generated Installers in `release/`:
- **Setup Wizard:** `release/PQN Party Queen-Setup-0.1.0.exe` (Interactive NSIS installer with desktop & start menu shortcuts)
- **Portable App:** `release/win-unpacked/PQN Party Queen.exe` (Instant zero-install executable)

### ⌨️ Desktop Terminal Commands:
```powershell
# Reset and populate dummy couture catalog, orders, and credentials
npm run desktop:seed

# Launch the Electron desktop shell in development
npm run desktop:dev

# Build standalone Next.js bundle and package final Windows .exe installer
npm run desktop:build

# Quick-pack existing build into .exe without recompiling Next.js
npm run desktop:pack
```

---

## 🔐 Default Credentials Reference

Pre-loaded into the database for immediate testing and evaluation:

| Role | Email | Password | Access Level |
|---|---|---|---|
| **Super Admin** | `admin@pqnpartyqueen.com` | `Admin@12345` | Full Atelier, Analytics, Courier & Settings |
| **Master Admin** | `thep4rtyqueen@gmail.com` | `Admin@12345` | Primary Owner Account |
| **Store Manager** | `manager@pqnpartyqueen.com` | `Manager@12345` | Product & Stock Catalog Management |
| **Demo Customer** | `customer@pqnpartyqueen.com` | `Customer@12345` | Pre-saved bridal sizing & New Delhi address |

> 📖 **For complete details, see [`CREDENTIALS.md`](CREDENTIALS.md).**

---

## 🏛️ Architecture & Documentation

- **[`ARCHITECTURE.md`](ARCHITECTURE.md)**: Full architecture guide covering process lifecycle, Next.js standalone execution, Electron IPC, data persistence, and build pipeline.
- **[`DESKTOP_USER_MANUAL.md`](DESKTOP_USER_MANUAL.md)**: Step-by-step user guide for installing, launching, and managing the Windows desktop software.
- **[`CREDENTIALS.md`](CREDENTIALS.md)**: Pre-loaded account credentials and testing instructions.

---

## 🌐 Web Development

```bash
# Run web development server
npm run dev

# Compile production build
npm run build

# Start production server
npm run start
```
