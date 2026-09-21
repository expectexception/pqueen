/**
 * INDIAN LOGISTICS, GST COMPLIANCE & POSTAL SUITE
 * Standardized for Indian eCommerce, GST Tax Invoices & Automated Logistics Dispatch
 */

// 1. Official Indian GST State Codes (GSTR-1 compliant)
export const INDIAN_GST_STATES: Record<string, { code: string; name: string; zone: "North" | "South" | "West" | "East" | "NorthEast" | "Central" | "UT" }> = {
  "01": { code: "01", name: "Jammu and Kashmir", zone: "North" },
  "02": { code: "02", name: "Himachal Pradesh", zone: "North" },
  "03": { code: "03", name: "Punjab", zone: "North" },
  "04": { code: "04", name: "Chandigarh", zone: "North" },
  "05": { code: "05", name: "Uttarakhand", zone: "North" },
  "06": { code: "06", name: "Haryana", zone: "North" },
  "07": { code: "07", name: "Delhi", zone: "North" },
  "08": { code: "08", name: "Rajasthan", zone: "North" },
  "09": { code: "09", name: "Uttar Pradesh", zone: "North" },
  "10": { code: "10", name: "Bihar", zone: "East" },
  "11": { code: "11", name: "Sikkim", zone: "NorthEast" },
  "12": { code: "12", name: "Arunachal Pradesh", zone: "NorthEast" },
  "13": { code: "13", name: "Nagaland", zone: "NorthEast" },
  "14": { code: "14", name: "Manipur", zone: "NorthEast" },
  "15": { code: "15", name: "Mizoram", zone: "NorthEast" },
  "16": { code: "16", name: "Tripura", zone: "NorthEast" },
  "17": { code: "17", name: "Meghalaya", zone: "NorthEast" },
  "18": { code: "18", name: "Assam", zone: "NorthEast" },
  "19": { code: "19", name: "West Bengal", zone: "East" },
  "20": { code: "20", name: "Jharkhand", zone: "East" },
  "21": { code: "21", name: "Odisha", zone: "East" },
  "22": { code: "22", name: "Chhattisgarh", zone: "Central" },
  "23": { code: "23", name: "Madhya Pradesh", zone: "Central" },
  "24": { code: "24", name: "Gujarat", zone: "West" },
  "26": { code: "26", name: "Dadra and Nagar Haveli and Daman and Diu", zone: "West" },
  "27": { code: "27", name: "Maharashtra", zone: "West" },
  "29": { code: "29", name: "Karnataka", zone: "South" },
  "30": { code: "30", name: "Goa", zone: "West" },
  "31": { code: "31", name: "Lakshadweep", zone: "UT" },
  "32": { code: "32", name: "Kerala", zone: "South" },
  "33": { code: "33", name: "Tamil Nadu", zone: "South" },
  "34": { code: "34", name: "Puducherry", zone: "South" },
  "35": { code: "35", name: "Andaman and Nicobar Islands", zone: "UT" },
  "36": { code: "36", name: "Telangana", zone: "South" },
  "37": { code: "37", name: "Andhra Pradesh", zone: "South" },
  "38": { code: "38", name: "Ladakh", zone: "North" },
};

// Helper: Normalize state name to Indian GST state code & name
export function getGSTStateInfo(stateNameOrCode: string): { code: string; name: string } {
  if (!stateNameOrCode) return { code: "07", name: "Delhi" };
  const cleaned = stateNameOrCode.trim().toLowerCase();

  // Check direct 2-digit code
  if (INDIAN_GST_STATES[cleaned]) {
    return { code: INDIAN_GST_STATES[cleaned].code, name: INDIAN_GST_STATES[cleaned].name };
  }

  // Check state name match
  for (const [code, val] of Object.entries(INDIAN_GST_STATES)) {
    if (
      val.name.toLowerCase() === cleaned ||
      val.name.toLowerCase().includes(cleaned) ||
      cleaned.includes(val.name.toLowerCase())
    ) {
      return { code, name: val.name };
    }
  }

  // Common aliases
  if (cleaned.includes("delhi") || cleaned.includes("ncr") || cleaned.includes("new delhi")) return { code: "07", name: "Delhi" };
  if (cleaned.includes("mumbai") || cleaned.includes("bombay") || cleaned.includes("pune") || cleaned.includes("maharashtra")) return { code: "27", name: "Maharashtra" };
  if (cleaned.includes("bangalore") || cleaned.includes("bengaluru") || cleaned.includes("karnataka")) return { code: "29", name: "Karnataka" };
  if (cleaned.includes("gujarat") || cleaned.includes("ahmedabad") || cleaned.includes("surat")) return { code: "24", name: "Gujarat" };
  if (cleaned.includes("rajasthan") || cleaned.includes("jaipur") || cleaned.includes("jodhpur")) return { code: "08", name: "Rajasthan" };
  if (cleaned.includes("up") || cleaned.includes("uttar pradesh") || cleaned.includes("noida") || cleaned.includes("lucknow")) return { code: "09", name: "Uttar Pradesh" };
  if (cleaned.includes("haryana") || cleaned.includes("gurgaon") || cleaned.includes("gurugram")) return { code: "06", name: "Haryana" };
  if (cleaned.includes("tamil") || cleaned.includes("chennai")) return { code: "33", name: "Tamil Nadu" };
  if (cleaned.includes("hyderabad") || cleaned.includes("telangana")) return { code: "36", name: "Telangana" };
  if (cleaned.includes("kolkata") || cleaned.includes("west bengal") || cleaned.includes("bengal")) return { code: "19", name: "West Bengal" };

  return { code: "07", name: stateNameOrCode };
}

// 2. High-speed Offline Indian PIN code dictionary for top hubs & prefixes
export const PINCODE_MAP: Record<string, { city: string; state: string; stateCode: string; district?: string }> = {
  // Delhi NCR
  "110001": { city: "New Delhi", state: "Delhi", stateCode: "07", district: "Central Delhi" },
  "110002": { city: "New Delhi", state: "Delhi", stateCode: "07", district: "Central Delhi" },
  "110003": { city: "New Delhi", state: "Delhi", stateCode: "07", district: "South Delhi" },
  "110011": { city: "New Delhi", state: "Delhi", stateCode: "07", district: "Central Delhi" },
  "110019": { city: "New Delhi", state: "Delhi", stateCode: "07", district: "South Delhi" },
  "110020": { city: "New Delhi", state: "Delhi", stateCode: "07", district: "South Delhi" },
  "110024": { city: "New Delhi", state: "Delhi", stateCode: "07", district: "South Delhi" },
  "110048": { city: "New Delhi", state: "Delhi", stateCode: "07", district: "South Delhi" },
  "110054": { city: "Delhi", state: "Delhi", stateCode: "07", district: "North Delhi" },
  "110085": { city: "Delhi", state: "Delhi", stateCode: "07", district: "North West Delhi" },
  "122001": { city: "Gurugram", state: "Haryana", stateCode: "06", district: "Gurugram" },
  "122002": { city: "Gurugram", state: "Haryana", stateCode: "06", district: "Gurugram" },
  "121001": { city: "Faridabad", state: "Haryana", stateCode: "06", district: "Faridabad" },
  "201301": { city: "Noida", state: "Uttar Pradesh", stateCode: "09", district: "Gautam Buddha Nagar" },
  "201304": { city: "Noida", state: "Uttar Pradesh", stateCode: "09", district: "Gautam Buddha Nagar" },
  "201001": { city: "Ghaziabad", state: "Uttar Pradesh", stateCode: "09", district: "Ghaziabad" },

  // Maharashtra / Mumbai / Pune
  "400001": { city: "Mumbai", state: "Maharashtra", stateCode: "27", district: "Mumbai City" },
  "400020": { city: "Mumbai", state: "Maharashtra", stateCode: "27", district: "Mumbai City" },
  "400050": { city: "Bandra, Mumbai", state: "Maharashtra", stateCode: "27", district: "Mumbai Suburban" },
  "400053": { city: "Andheri West, Mumbai", state: "Maharashtra", stateCode: "27", district: "Mumbai Suburban" },
  "400076": { city: "Powai, Mumbai", state: "Maharashtra", stateCode: "27", district: "Mumbai Suburban" },
  "411001": { city: "Pune", state: "Maharashtra", stateCode: "27", district: "Pune" },
  "411006": { city: "Pune", state: "Maharashtra", stateCode: "27", district: "Pune" },
  "440001": { city: "Nagpur", state: "Maharashtra", stateCode: "27", district: "Nagpur" },

  // Karnataka / Bengaluru
  "560001": { city: "Bengaluru", state: "Karnataka", stateCode: "29", district: "Bengaluru Urban" },
  "560025": { city: "Bengaluru", state: "Karnataka", stateCode: "29", district: "Bengaluru Urban" },
  "560034": { city: "Koramangala, Bengaluru", state: "Karnataka", stateCode: "29", district: "Bengaluru Urban" },
  "560038": { city: "Indiranagar, Bengaluru", state: "Karnataka", stateCode: "29", district: "Bengaluru Urban" },
  "560066": { city: "Whitefield, Bengaluru", state: "Karnataka", stateCode: "29", district: "Bengaluru Urban" },
  "570001": { city: "Mysuru", state: "Karnataka", stateCode: "29", district: "Mysuru" },

  // Gujarat
  "380001": { city: "Ahmedabad", state: "Gujarat", stateCode: "24", district: "Ahmedabad" },
  "380015": { city: "Ahmedabad", state: "Gujarat", stateCode: "24", district: "Ahmedabad" },
  "395001": { city: "Surat", state: "Gujarat", stateCode: "24", district: "Surat" },
  "395007": { city: "Surat", state: "Gujarat", stateCode: "24", district: "Surat" },
  "390001": { city: "Vadodara", state: "Gujarat", stateCode: "24", district: "Vadodara" },
  "360001": { city: "Rajkot", state: "Gujarat", stateCode: "24", district: "Rajkot" },

  // Rajasthan
  "302001": { city: "Jaipur", state: "Rajasthan", stateCode: "08", district: "Jaipur" },
  "302015": { city: "Jaipur", state: "Rajasthan", stateCode: "08", district: "Jaipur" },
  "342001": { city: "Jodhpur", state: "Rajasthan", stateCode: "08", district: "Jodhpur" },
  "313001": { city: "Udaipur", state: "Rajasthan", stateCode: "08", district: "Udaipur" },

  // Telangana & Andhra Pradesh
  "500001": { city: "Hyderabad", state: "Telangana", stateCode: "36", district: "Hyderabad" },
  "500034": { city: "Banjara Hills, Hyderabad", state: "Telangana", stateCode: "36", district: "Hyderabad" },
  "500081": { city: "HITEC City, Hyderabad", state: "Telangana", stateCode: "36", district: "Hyderabad" },
  "530001": { city: "Visakhapatnam", state: "Andhra Pradesh", stateCode: "37", district: "Visakhapatnam" },
  "520001": { city: "Vijayawada", state: "Andhra Pradesh", stateCode: "37", district: "NTR" },

  // Tamil Nadu
  "600001": { city: "Chennai", state: "Tamil Nadu", stateCode: "33", district: "Chennai" },
  "600028": { city: "Chennai", state: "Tamil Nadu", stateCode: "33", district: "Chennai" },
  "641001": { city: "Coimbatore", state: "Tamil Nadu", stateCode: "33", district: "Coimbatore" },
  "625001": { city: "Madurai", state: "Tamil Nadu", stateCode: "33", district: "Madurai" },

  // West Bengal
  "700001": { city: "Kolkata", state: "West Bengal", stateCode: "19", district: "Kolkata" },
  "700016": { city: "Park Street, Kolkata", state: "West Bengal", stateCode: "19", district: "Kolkata" },
  "700091": { city: "Salt Lake, Kolkata", state: "West Bengal", stateCode: "19", district: "North 24 Parganas" },

  // Punjab, Chandigarh, UP
  "160001": { city: "Chandigarh", state: "Chandigarh", stateCode: "04", district: "Chandigarh" },
  "141001": { city: "Ludhiana", state: "Punjab", stateCode: "03", district: "Ludhiana" },
  "143001": { city: "Amritsar", state: "Punjab", stateCode: "03", district: "Amritsar" },
  "226001": { city: "Lucknow", state: "Uttar Pradesh", stateCode: "09", district: "Lucknow" },
  "208001": { city: "Kanpur", state: "Uttar Pradesh", stateCode: "09", district: "Kanpur Nagar" },
  "221001": { city: "Varanasi", state: "Uttar Pradesh", stateCode: "09", district: "Varanasi" },
  "282001": { city: "Agra", state: "Uttar Pradesh", stateCode: "09", district: "Agra" },

  // Madhya Pradesh, Bihar, Kerala
  "452001": { city: "Indore", state: "Madhya Pradesh", stateCode: "23", district: "Indore" },
  "462001": { city: "Bhopal", state: "Madhya Pradesh", stateCode: "23", district: "Bhopal" },
  "800001": { city: "Patna", state: "Bihar", stateCode: "10", district: "Patna" },
  "682001": { city: "Kochi", state: "Kerala", stateCode: "32", district: "Ernakulam" },
  "695001": { city: "Thiruvananthapuram", state: "Kerala", stateCode: "32", district: "Thiruvananthapuram" },
};

// Auto-resolve Indian PIN code with fast local map + India Post API fallback
export async function resolveIndianPincode(pincode: string): Promise<{ city: string; state: string; stateCode: string; district?: string } | null> {
  const pin = (pincode || "").trim();
  if (!/^[1-9][0-9]{5}$/.test(pin)) return null;

  // 1. Fast local cache lookup
  if (PINCODE_MAP[pin]) {
    return PINCODE_MAP[pin];
  }

  // 2. Prefix heuristics
  const prefix2 = pin.substring(0, 2);
  let guessedState = "Delhi";
  let guessedCode = "07";
  if (prefix2 === "11") { guessedState = "Delhi"; guessedCode = "07"; }
  else if (prefix2 === "12" || prefix2 === "13") { guessedState = "Haryana"; guessedCode = "06"; }
  else if (prefix2 === "14" || prefix2 === "15") { guessedState = "Punjab"; guessedCode = "03"; }
  else if (prefix2 === "16") { guessedState = "Chandigarh"; guessedCode = "04"; }
  else if (prefix2 === "17") { guessedState = "Himachal Pradesh"; guessedCode = "02"; }
  else if (prefix2 === "18" || prefix2 === "19") { guessedState = "Jammu & Kashmir"; guessedCode = "01"; }
  else if (prefix2.startsWith("2")) { guessedState = "Uttar Pradesh"; guessedCode = "09"; }
  else if (prefix2.startsWith("3")) {
    if (["30", "31", "32", "33", "34"].includes(prefix2)) { guessedState = "Rajasthan"; guessedCode = "08"; }
    else { guessedState = "Gujarat"; guessedCode = "24"; }
  }
  else if (prefix2.startsWith("4")) {
    if (["45", "46", "47", "48"].includes(prefix2)) { guessedState = "Madhya Pradesh"; guessedCode = "23"; }
    else if (prefix2 === "49") { guessedState = "Chhattisgarh"; guessedCode = "22"; }
    else { guessedState = "Maharashtra"; guessedCode = "27"; }
  }
  else if (prefix2.startsWith("5")) {
    if (["50", "51", "52", "53"].includes(prefix2)) { guessedState = "Telangana"; guessedCode = "36"; }
    else { guessedState = "Karnataka"; guessedCode = "29"; }
  }
  else if (prefix2.startsWith("6")) {
    if (["67", "68", "69"].includes(prefix2)) { guessedState = "Kerala"; guessedCode = "32"; }
    else { guessedState = "Tamil Nadu"; guessedCode = "33"; }
  }
  else if (prefix2.startsWith("7")) {
    if (["70", "71", "72", "73", "74"].includes(prefix2)) { guessedState = "West Bengal"; guessedCode = "19"; }
    else if (prefix2 === "75" || prefix2 === "76" || prefix2 === "77") { guessedState = "Odisha"; guessedCode = "21"; }
    else { guessedState = "Assam"; guessedCode = "18"; }
  }
  else if (prefix2.startsWith("8")) {
    if (["80", "81", "82", "84", "85"].includes(prefix2)) { guessedState = "Bihar"; guessedCode = "10"; }
    else { guessedState = "Jharkhand"; guessedCode = "20"; }
  }

  // 3. Online India Post API lookup with 2.5s timeout
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2500);
    const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`, { signal: controller.signal });
    clearTimeout(timer);

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data[0]?.Status === "Success" && data[0].PostOffice?.length > 0) {
        const po = data[0].PostOffice[0];
        const stateInfo = getGSTStateInfo(po.State);
        return {
          city: po.District || po.Name || guessedState,
          state: stateInfo.name,
          stateCode: stateInfo.code,
          district: po.District,
        };
      }
    }
  } catch {
    // Fallback to prefix heuristics
  }

  return {
    city: guessedState,
    state: guessedState,
    stateCode: guessedCode,
  };
}

// 3. Number to Indian Currency Words (Lakhs & Crores format)
export function numberToIndianWords(num: number): string {
  const n = Math.round(Number(num) || 0);
  if (n === 0) return "Zero Rupees Only";

  const a = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  function inWords(val: number): string {
    if (val < 20) return a[val];
    const digit = val % 10;
    return `${b[Math.floor(val / 10)]}${digit ? " " + a[digit] : ""}`;
  }

  let str = "";
  let remainder = n;

  // Crores (1,00,00,000)
  if (remainder >= 10000000) {
    const crore = Math.floor(remainder / 10000000);
    str += `${inWords(crore)} Crore `;
    remainder %= 10000000;
  }

  // Lakhs (1,00,000)
  if (remainder >= 100000) {
    const lakh = Math.floor(remainder / 100000);
    str += `${inWords(lakh)} Lakh `;
    remainder %= 100000;
  }

  // Thousands (1,000)
  if (remainder >= 1000) {
    const thousand = Math.floor(remainder / 1000);
    str += `${inWords(thousand)} Thousand `;
    remainder %= 1000;
  }

  // Hundreds (100)
  if (remainder >= 100) {
    const hundred = Math.floor(remainder / 100);
    str += `${inWords(hundred)} Hundred `;
    remainder %= 100;
  }

  if (remainder > 0) {
    if (str !== "") str += "and ";
    str += inWords(remainder);
  }

  return `Rupees ${str.trim()} Only`;
}

// 4. Automated AWB Tracking Generator for Indian Couriers
export function generateAutomatedAWB(courierName: string, orderNumber: string): { awb: string; carrier: string; trackingUrl: string; hubCode: string; estimatedDays: string } {
  const cleanOrder = (orderNumber || "").replace(/[^0-9]/g, "").slice(-4) || String(Math.floor(1000 + Math.random() * 9000));
  const randNum = Math.floor(100000 + Math.random() * 900000);
  const carrier = courierName || "Blue Dart Express";

  if (carrier.toLowerCase().includes("delhivery")) {
    const awb = `DLV${cleanOrder}${randNum}`;
    return {
      awb,
      carrier: "Delhivery Air Express",
      trackingUrl: `https://www.delhivery.com/track/package/${awb}`,
      hubCode: "DEL-NORTH-HUB02",
      estimatedDays: "2 - 3 Business Days",
    };
  }

  if (carrier.toLowerCase().includes("shiprocket")) {
    const awb = `SR${cleanOrder}${randNum}`;
    return {
      awb,
      carrier: "Shiprocket Smart Courier",
      trackingUrl: `https://shiprocket.co/tracking/${awb}`,
      hubCode: "SR-DEL-CENTRAL",
      estimatedDays: "2 - 4 Business Days",
    };
  }

  if (carrier.toLowerCase().includes("dtdc")) {
    const awb = `D${cleanOrder}${randNum}IN`;
    return {
      awb,
      carrier: "DTDC Prime Gold",
      trackingUrl: `https://www.dtdc.in/tracking/shipment-tracking.asp?awb=${awb}`,
      hubCode: "DTDC-DEL-HUB01",
      estimatedDays: "3 - 4 Business Days",
    };
  }

  // Default: Blue Dart
  const awb = `BD${cleanOrder}${randNum}IN`;
  return {
    awb,
    carrier: "Blue Dart Express",
    trackingUrl: `https://www.bluedart.com/tracking?awb=${awb}`,
    hubCode: "BLR-DEL-NDLS01",
    estimatedDays: "1 - 2 Business Days (Air Express)",
  };
}
