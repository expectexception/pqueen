const { Client } = require("ssh2");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const conn = new Client();

const config = {
  host: process.env.SSH_HOST || "82.25.107.10",
  port: parseInt(process.env.SSH_PORT || "65002", 10),
  username: process.env.SSH_USER || "u375327955",
  password: process.env.SSH_PASS || "Part2Part@420",
  readyTimeout: 30000,
};

function runCommand(command) {
  return new Promise((resolve, reject) => {
    conn.exec(command, (err, stream) => {
      if (err) return reject(err);
      let stdout = "";
      let stderr = "";
      stream
        .on("close", (code, signal) => {
          resolve({ code, stdout, stderr });
        })
        .on("data", (data) => {
          stdout += data.toString();
        })
        .stderr.on("data", (data) => {
          stderr += data.toString();
        });
    });
  });
}

conn.on("ready", async () => {
  try {
    console.log("SSH Connection Successful!");

    const testCmd = `
      /opt/alt/alt-nodejs22/root/usr/bin/node -e '
        const access_token = "85fec8bccd7fafd40a9ed5d486080cb8";
        const secret_key = "6fae1c13bc110ed5b42cb84dc2b533c8";
        const base = "https://my.ithinklogistics.com/api_v3";

        async function run() {
          console.log("1. Checking Warehouse...");
          const wh = await fetch(base + "/warehouse/get.json", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "access-token": access_token,
              "secret-key": secret_key
            },
            body: JSON.stringify({ data: { access_token, secret_key } })
          }).then(r => r.json());
          console.log("Warehouse Result:", JSON.stringify(wh));

          console.log("\\n2. Checking Pincode Serviceability...");
          const pin = await fetch(base + "/pincode/check.json", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "access-token": access_token,
              "secret-key": secret_key
            },
            body: JSON.stringify({
              data: {
                access_token,
                secret_key,
                pincode: "110059",
                from_pincode: "110059",
                to_pincode: "400001"
              }
            })
          }).then(r => r.json());
          console.log("Pincode Result Status:", pin.status, "Keys:", Object.keys(pin.data || {}));

          console.log("\\n3. Testing Order Creation API...");
          const orderNum = "PQN-TEST-" + Date.now();
          const orderPayload = {
            data: {
              access_token,
              secret_key,
              pickup_address_id: "123718",
              s_type: "surface",
              shipments: [
                {
                  order: orderNum,
                  sub_order: orderNum,
                  order_date: new Date().toISOString().split("T")[0],
                  total_amount: "2999.00",
                  name: "Priyanka Sharma",
                  company_name: "",
                  add: "WZ 147 A D Block 2 Uttam Nagar",
                  add2: "Arya Samaj Road",
                  pin: "110059",
                  city: "New Delhi",
                  state: "Delhi",
                  country: "India",
                  phone: "9958907429",
                  alt_phone: "9958907429",
                  email: "concierge@pqnpartyqueen.com",
                  is_insurance: "0",
                  shipping_charges: "0",
                  giftwrap_charges: "0",
                  transaction_charges: "0",
                  total_discount: "0",
                  first_attemp_discount: "0",
                  other_charges: "0",
                  payment_mode: "Prepaid",
                  cod_amount: "0",
                  reseller_name: "",
                  eway_bill_number: "",
                  gst_number: "",
                  return_address_id: "123718",
                  is_billing_same_as_shipping: "YES",
                  logistic_id: "",
                  s_type: "surface",
                  shipment_length: "30",
                  shipment_width: "25",
                  shipment_height: "8",
                  shipment_weight: "0.8",
                  length: "30",
                  breadth: "25",
                  width: "25",
                  height: "8",
                  weight: "0.8",
                  products: [
                    {
                      product_name: "Luxury Velvet Ensemble",
                      product_sku: "PQN-TEST-SKU",
                      product_quantity: "1",
                      product_price: "2999.00",
                      product_tax_rate: "12",
                      product_hsn_code: "6204",
                      product_discount: "0",
                      length: "30",
                      width: "25",
                      breadth: "25",
                      height: "8",
                      weight: "0.8"
                    }
                  ]
                }
              ]
            }
          };

          const orderRes = await fetch(base + "/order/add.json", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "access-token": access_token,
              "secret-key": secret_key
            },
            body: JSON.stringify(orderPayload)
          }).then(r => r.json());
          console.log("Order Add Result:", JSON.stringify(orderRes, null, 2));
        }

        run().catch(e => console.error("Error in runner:", e));
      '
    `;

    const res = await runCommand(testCmd);
    console.log("Output:\n", res.stdout);
    if (res.stderr) console.error("Errors:\n", res.stderr);

  } catch (err) {
    console.error("Execution error:", err);
  } finally {
    conn.end();
  }
});

conn.on("error", (err) => {
  console.error("SSH Error:", err);
});

conn.connect(config);
