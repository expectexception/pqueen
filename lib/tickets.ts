export type TicketCategory =
  | "RETURN_REFUND"
  | "SIZE_EXCHANGE"
  | "DAMAGED_DEFECTIVE"
  | "SHIPPING_DELAY"
  | "QUALITY_CONCERN"
  | "GENERAL_INQUIRY";

export type TicketStatus =
  | "OPEN"
  | "UNDER_REVIEW"
  | "REFUND_APPROVED"
  | "REFUND_PROCESSED"
  | "EXCHANGE_SHIPPED"
  | "RESOLVED"
  | "CLOSED";

export type TicketPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export type MediaAttachment = {
  url: string;
  type: "image" | "video";
  name?: string;
};

export type SupportTicket = {
  id: string;
  ticketNumber: string;
  orderNumber?: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  category: TicketCategory;
  subject: string;
  description: string;
  attachments?: MediaAttachment[];
  status: TicketStatus;
  priority: TicketPriority;
  refundAmount?: number;
  refundMethod?: "ORIGINAL_PAYMENT" | "STORE_CREDIT" | "BANK_TRANSFER";
  refundTransactionId?: string;
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
};

// Seed tickets for demonstration
let ticketsStore: SupportTicket[] = [
  {
    id: "tkt-1",
    ticketNumber: "TKT-84920",
    orderNumber: "PQN-1787253960998",
    customerName: "karan kkk",
    customerEmail: "karan.klwt@gmail.com",
    customerPhone: "9220350565",
    category: "SIZE_EXCHANGE",
    subject: "Size exchange request for Embroidered Party Wear Lehenga",
    description: "The Lehenga ordered in size S fits a bit snug at the waist. I would love to exchange it for size M in the same color.",
    attachments: [
      {
        url: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600",
        type: "image",
        name: "waist_fitting_photo.jpg",
      },
    ],
    status: "UNDER_REVIEW",
    priority: "MEDIUM",
    adminNotes: "Customer contacted via WhatsApp concierge. Checked warehouse for Size M availability.",
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: "tkt-2",
    ticketNumber: "TKT-84915",
    orderNumber: "PQN-1787252219460",
    customerName: "Karan shashi",
    customerEmail: "karan.shashi@example.com",
    customerPhone: "9220350565",
    category: "RETURN_REFUND",
    subject: "Return & Full Refund for Elegant Embroidered Suit Set",
    description: "Color shade slightly differs from my event theme. The tags are intact in original luxury packaging.",
    attachments: [
      {
        url: "https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=600",
        type: "image",
        name: "product_unboxing.jpg",
      },
    ],
    status: "REFUND_APPROVED",
    priority: "HIGH",
    refundAmount: 1899,
    refundMethod: "BANK_TRANSFER",
    adminNotes: "Return pickup scheduled via BlueDart courier. Refund approved upon arrival.",
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 6).toISOString(),
  },
];

export function getAllTickets(): SupportTicket[] {
  return ticketsStore;
}

export function getTicketById(id: string): SupportTicket | undefined {
  return ticketsStore.find((t) => t.id === id);
}

export function getTicketsByCustomer(email: string): SupportTicket[] {
  const q = email.trim().toLowerCase();
  return ticketsStore.filter((t) => t.customerEmail.toLowerCase() === q);
}

export function createTicket(data: {
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  orderNumber?: string;
  category: TicketCategory;
  subject: string;
  description: string;
  attachments?: MediaAttachment[];
  priority?: TicketPriority;
}): SupportTicket {
  const randomNum = Math.floor(10000 + Math.random() * 90000);
  const ticketNumber = `TKT-${randomNum}`;
  const now = new Date().toISOString();

  const newTicket: SupportTicket = {
    id: `tkt-${Date.now()}`,
    ticketNumber,
    orderNumber: data.orderNumber?.trim() || undefined,
    customerName: data.customerName.trim(),
    customerEmail: data.customerEmail.trim(),
    customerPhone: data.customerPhone?.trim() || undefined,
    category: data.category,
    subject: data.subject.trim(),
    description: data.description.trim(),
    attachments: data.attachments || [],
    status: "OPEN",
    priority: data.priority || "MEDIUM",
    createdAt: now,
    updatedAt: now,
  };

  ticketsStore.unshift(newTicket);
  return newTicket;
}

export function updateTicket(
  id: string,
  data: Partial<SupportTicket>
): SupportTicket | null {
  const idx = ticketsStore.findIndex((t) => t.id === id);
  if (idx === -1) return null;

  ticketsStore[idx] = {
    ...ticketsStore[idx],
    ...data,
    updatedAt: new Date().toISOString(),
  };

  return ticketsStore[idx];
}
