export type InquiryCategory =
  | "SIZING_FIT"
  | "CUSTOM_DESIGN"
  | "BULK_BRIDAL"
  | "FABRIC_COLOR"
  | "DELIVERY_TIMELINE"
  | "GENERAL";

export type InquiryStatus = "NEW" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";

export type InquiryAttachment = {
  url: string;
  type: "image" | "video";
  name?: string;
};

export type ProductInquiry = {
  id: string;
  inquiryNumber: string;
  productId?: string;
  productName?: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  category: InquiryCategory;
  subject: string;
  message: string;
  attachments?: InquiryAttachment[];
  status: InquiryStatus;
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
};

let inquiriesStore: ProductInquiry[] = [
  {
    id: "inq-1",
    inquiryNumber: "INQ-72940",
    productId: "cmsomeadr0001cs00d5pzl4j5",
    productName: "Embroidered Party Wear Lehenga",
    customerName: "Radhika Mehra",
    customerEmail: "radhika.mehra@gmail.com",
    customerPhone: "9811223344",
    category: "CUSTOM_DESIGN",
    subject: "Custom Blouse Neckline & Deep Ruby Red Color Customization",
    message:
      "Hello! I adore this lehenga for my wedding sangeet. Can the blouse be customized with a sweetheart neckline and elbow-length sleeves instead of sleeveless? Also, is it possible to dye the fabric into a deeper ruby red tone?",
    attachments: [
      {
        url: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600",
        type: "image",
        name: "neckline_reference_sketch.jpg",
      },
    ],
    status: "NEW",
    adminNotes: "Senior master tailor confirmed neckline alteration is possible with 4 days extra dispatch time.",
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 1).toISOString(),
  },
  {
    id: "inq-2",
    inquiryNumber: "INQ-72935",
    productId: "cmsqmcamm00013w00vcqx9cpf",
    productName: "Elegant Embroidered Suit Set",
    customerName: "Meenakshi Sundaram",
    customerEmail: "meenakshi.s@outlook.com",
    customerPhone: "9876543210",
    category: "BULK_BRIDAL",
    subject: "Bulk Order of 6 Matching Sets for Bridesmaids",
    message:
      "We are ordering 6 pieces for our bridal entourage across sizes S, M, and XL. Do you offer custom sizing assistance and bridal group discount?",
    attachments: [],
    status: "IN_PROGRESS",
    adminNotes: "Sent WhatsApp proposal with 15% bridal party discount and measurement chart.",
    createdAt: new Date(Date.now() - 3600000 * 20).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 8).toISOString(),
  },
];

export function getAllInquiries(): ProductInquiry[] {
  return inquiriesStore;
}

export function getInquiryById(id: string): ProductInquiry | undefined {
  return inquiriesStore.find((i) => i.id === id);
}

export function getInquiriesByCustomer(email: string): ProductInquiry[] {
  const q = email.trim().toLowerCase();
  return inquiriesStore.filter((i) => i.customerEmail.toLowerCase() === q);
}

export function createInquiry(data: {
  productId?: string;
  productName?: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  category: InquiryCategory;
  subject: string;
  message: string;
  attachments?: InquiryAttachment[];
}): ProductInquiry {
  const randomNum = Math.floor(10000 + Math.random() * 90000);
  const inquiryNumber = `INQ-${randomNum}`;
  const now = new Date().toISOString();

  const newInquiry: ProductInquiry = {
    id: `inq-${Date.now()}`,
    inquiryNumber,
    productId: data.productId?.trim() || undefined,
    productName: data.productName?.trim() || undefined,
    customerName: data.customerName.trim(),
    customerEmail: data.customerEmail.trim(),
    customerPhone: data.customerPhone?.trim() || undefined,
    category: data.category,
    subject: data.subject.trim(),
    message: data.message.trim(),
    attachments: data.attachments || [],
    status: "NEW",
    createdAt: now,
    updatedAt: now,
  };

  inquiriesStore.unshift(newInquiry);
  return newInquiry;
}

export function updateInquiry(
  id: string,
  data: Partial<ProductInquiry>
): ProductInquiry | null {
  const idx = inquiriesStore.findIndex((i) => i.id === id);
  if (idx === -1) return null;

  inquiriesStore[idx] = {
    ...inquiriesStore[idx],
    ...data,
    updatedAt: new Date().toISOString(),
  };

  return inquiriesStore[idx];
}

export function deleteInquiry(id: string): boolean {
  const initialLength = inquiriesStore.length;
  inquiriesStore = inquiriesStore.filter((i) => i.id !== id);
  return inquiriesStore.length < initialLength;
}
