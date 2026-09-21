const https = require("https");

const BASE_URL = "https://pqnpartyqueen.com";

function fetchUrl(endpoint, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint, BASE_URL);
    const reqOptions = {
      method: options.method || "GET",
      headers: {
        "User-Agent": "PQN-Auditor/1.0",
        ...(options.headers || {}),
      },
      rejectUnauthorized: false,
    };

    const req = https.request(url, reqOptions, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: data,
        });
      });
    });

    req.on("error", (err) => reject(err));

    if (options.body) {
      req.write(typeof options.body === "string" ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

async function checkThree() {
  // 1. Products API
  const prod = await fetchUrl("/api/products");
  console.log("1. /api/products status:", prod.status, "Body preview:\n", prod.body.slice(0, 200));

  // 2. Admin Login to get cookie
  const loginRes = await fetchUrl("/api/admin/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: { email: "P4RTYqueen@gmail.com", password: "Karan@123" },
  });
  const cookie = loginRes.headers["set-cookie"]?.[0] || "";

  // 3. Admin Stats API
  const stats = await fetchUrl("/api/admin/stats", {
    headers: { Cookie: cookie },
  });
  console.log("\n2. /api/admin/stats status:", stats.status, "Body preview:\n", stats.body.slice(0, 200));

  // 4. Coupon Validate API
  const coupon = await fetchUrl("/api/coupons/validate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: { code: "PQN10", cartTotal: 50000 },
  });
  console.log("\n3. /api/coupons/validate status:", coupon.status, "Body preview:\n", coupon.body.slice(0, 200));
}

checkThree().catch(console.error);
