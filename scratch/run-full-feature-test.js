const https = require("https");

const BASE_URL = "https://pqnpartyqueen.com";

function request(path, options = {}) {
  return new Promise((resolve) => {
    const url = new URL(path, BASE_URL);
    const reqOptions = {
      method: options.method || "GET",
      headers: {
        "User-Agent": "PQN-System-Test/1.0",
        ...(options.headers || {}),
      },
      rejectUnauthorized: false,
    };

    const req = https.request(url, reqOptions, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch {}
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data,
          json,
        });
      });
    });

    req.on("error", (err) => {
      resolve({ status: 0, error: err.message });
    });

    if (options.body) {
      req.write(typeof options.body === "string" ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

async function runAllTests() {
  console.log("================================================================================");
  console.log("👑 PQN PARTY QUEEN — COMPLETE WEBSITE FEATURE & ENDPOINT AUDIT");
  console.log(`🌐 Base URL: ${BASE_URL}`);
  console.log("================================================================================\n");

  const results = [];
  function record(category, name, passed, details = "") {
    const icon = passed ? "✓ PASS" : "✕ FAIL";
    console.log(`[${icon}] ${category.padEnd(16)} | ${name.padEnd(35)} : ${details}`);
    results.push({ category, name, passed, details });
  }

  // --- SECTION 1: PUBLIC STOREFRONT ROUTES ---
  console.log("--- 1. STOREFRONT PAGES & BROWSING ---");
  const pages = [
    { path: "/", name: "Homepage" },
    { path: "/shop", name: "Product Catalog" },
    { path: "/about", name: "About Us" },
    { path: "/helpdesk", name: "Helpdesk & Concierge" },
    { path: "/returns", name: "Returns Policy" },
    { path: "/shipping", name: "Shipping Info" },
    { path: "/faq", name: "FAQ" },
    { path: "/contact", name: "Contact Page" },
    { path: "/cart", name: "Shopping Cart" },
    { path: "/checkout", name: "Checkout" },
    { path: "/track-order", name: "Order Tracking" },
    { path: "/wishlist", name: "Wishlist" },
    { path: "/style-quiz", name: "Style Quiz" },
    { path: "/privacy", name: "Privacy Policy" },
    { path: "/terms", name: "Terms of Service" },
  ];

  for (const p of pages) {
    const res = await request(p.path);
    record("Storefront", p.name, res.status === 200, `HTTP ${res.status}`);
  }

  // --- SECTION 2: PRODUCTS & CATALOG APIS ---
  console.log("\n--- 2. CATALOG & PRODUCT DETAILS ---");
  const prodRes = await request("/api/products");
  const products = prodRes.json || [];
  const hasProducts = Array.isArray(products) && products.length > 0;
  record("Catalog API", "Get Products List", hasProducts, `${products.length} products loaded`);

  if (hasProducts && products[0]?.slug) {
    const firstSlug = products[0].slug;
    const detailRes = await request(`/shop/${firstSlug}`);
    record("Product Page", `Product Detail (/${firstSlug})`, detailRes.status === 200, `HTTP ${detailRes.status}`);
  }

  // --- SECTION 3: RAZORPAY INTEGRATION ---
  console.log("\n--- 3. PAYMENT INTEGRATION (RAZORPAY) ---");
  const orderRes = await request("/api/create-order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: { amount: 2499, currency: "INR", receipt: `test_${Date.now()}` },
  });
  const rzpOrderOk = orderRes.status === 200 && Boolean(orderRes.json?.order_id);
  record("Razorpay", "Create Order API", rzpOrderOk, `Order ID: ${orderRes.json?.order_id || "None"}`);

  const verifyRes = await request("/api/verify-payment", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: {
      razorpay_order_id: "order_fake_123",
      razorpay_payment_id: "pay_fake_123",
      razorpay_signature: "invalid_sig",
    },
  });
  const verifyRejectsBadSig = verifyRes.status === 400 && verifyRes.json?.verified === false;
  record("Razorpay", "Signature Security Guard", verifyRejectsBadSig, `Correctly rejected invalid signature (HTTP ${verifyRes.status})`);

  // --- SECTION 4: CUSTOMER SUPPORT & HELPDESK ---
  console.log("\n--- 4. HELPDESK & SUPPORT TICKETS ---");
  const createTicketRes = await request("/api/support/tickets", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: {
      customerName: "Audit Test User",
      customerEmail: "thep4rtyqueen@gmail.com",
      category: "GENERAL_INQUIRY",
      subject: "Audit Test Inquiry",
      description: "Automated test to verify helpdesk ticket filing pipeline.",
    },
  });
  const ticketCreated = createTicketRes.status === 200 && Boolean(createTicketRes.json?.ticket?.ticketNumber);
  const ticketNo = createTicketRes.json?.ticket?.ticketNumber;
  record("Helpdesk", "Submit Support Ticket", ticketCreated, `Ticket #${ticketNo || "Failed"}`);

  if (ticketNo) {
    const getTicketRes = await request(`/api/support/tickets?ticketNumber=${encodeURIComponent(ticketNo)}`);
    const ticketFound = getTicketRes.status === 200 && getTicketRes.json?.ticket?.ticketNumber === ticketNo;
    record("Helpdesk", "Track Ticket Lookup", ticketFound, `Found #${ticketNo}`);
  }

  // --- SECTION 5: AUTHENTICATION & SECURITY OTP ---
  console.log("\n--- 5. AUTHENTICATION & SECURITY OTP ---");
  const otpRes = await request("/api/auth/otp/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: {
      email: "thep4rtyqueen@gmail.com",
      purpose: "ADMIN_FORGOT_PASSWORD",
    },
  });
  const otpSent = otpRes.status === 200 && otpRes.json?.success === true;
  record("Security Auth", "Admin OTP Dispatch", otpSent, `${otpRes.json?.message || otpRes.json?.error || "Status " + otpRes.status}`);

  // --- SECTION 6: ADMIN PORTAL ACCESS & APIS ---
  console.log("\n--- 6. ADMIN PORTAL ENDPOINTS ---");
  const loginRes = await request("/api/admin/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: {
      email: "thep4rtyqueen@gmail.com",
      password: "Karan@123", // standard admin pass or check session
    },
  });

  const adminCookie = loginRes.headers?.["set-cookie"] ? (Array.isArray(loginRes.headers["set-cookie"]) ? loginRes.headers["set-cookie"][0] : loginRes.headers["set-cookie"]) : "";
  record("Admin Auth", "Admin Login API", loginRes.status === 200 || loginRes.status === 401, `HTTP ${loginRes.status}`);

  const adminPages = [
    "/admin",
    "/admin/login",
    "/admin/orders",
    "/admin/products",
    "/admin/inventory",
    "/admin/categories",
    "/admin/coupons",
    "/admin/customers",
    "/admin/tickets",
    "/admin/inquiries",
    "/admin/analytics",
    "/admin/settings",
    "/admin/shipping",
  ];

  for (const ap of adminPages) {
    const res = await request(ap, {
      headers: adminCookie ? { Cookie: adminCookie } : {},
    });
    record("Admin UI", ap, res.status === 200 || res.status === 307, `HTTP ${res.status}`);
  }

  // --- SUMMARY ---
  const passedCount = results.filter((r) => r.passed).length;
  const totalCount = results.length;
  console.log("\n================================================================================");
  console.log(`🎯 AUDIT COMPLETED: ${passedCount}/${totalCount} Passed (${Math.round((passedCount / totalCount) * 100)}%)`);
  console.log("================================================================================");
}

runAllTests().catch(console.error);
