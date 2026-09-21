import fs from "fs";
import path from "path";

export type ShowcaseCard = {
  id: string;
  slug: string;
  label: string;
  name: string;
  desc: string;
  ribbon: string;
  tag: string;
  emoji: string;
  image?: string | null;
  bgTone?: string;
  borderColor?: string;
  accentDot?: string;
  pattern?: "lattice" | "dots" | "lines" | "none";
  order?: number;
};

const DEFAULT_CARDS: ShowcaseCard[] = [
  {
    id: "showcase-lehengas",
    slug: "lehengas",
    label: "LEHENGAS",
    name: "Bridal & Party Lehengas",
    desc: "Intricate zari, sequin & gold threadwork",
    ribbon: "BRIDAL",
    tag: "MOST LOVED",
    emoji: "👑",
    image: null,
    bgTone: "#f5f9f6",
    borderColor: "#cce2d3",
    accentDot: "#0d4428",
    pattern: "lattice",
    order: 1,
  },
  {
    id: "showcase-suit-sets",
    slug: "suit-sets",
    label: "SUIT SETS",
    name: "Designer Suit Sets",
    desc: "Anarkalis, straight cuts & shararas",
    ribbon: "DESIGNER",
    tag: "NEW SEASON",
    emoji: "✨",
    image: null,
    bgTone: "#faf8f3",
    borderColor: "#e8dfcc",
    accentDot: "#c59b27",
    pattern: "dots",
    order: 2,
  },
  {
    id: "showcase-dresses",
    slug: "dresses",
    label: "DRESSES",
    name: "Couture Dresses",
    desc: "Evening gowns & contemporary fits",
    ribbon: "COUTURE",
    tag: "FEATURED",
    emoji: "🌙",
    image: null,
    bgTone: "#f5f9f6",
    borderColor: "#cce2d3",
    accentDot: "#0d4428",
    pattern: "lines",
    order: 3,
  },
  {
    id: "showcase-sarees",
    slug: "sarees",
    label: "SAREES",
    name: "Royal Sarees",
    desc: "Banarasi, organza & pre-draped luxury",
    ribbon: "ROYAL",
    tag: "HERITAGE",
    emoji: "🌺",
    image: null,
    bgTone: "#faf8f3",
    borderColor: "#e8dfcc",
    accentDot: "#c59b27",
    pattern: "lattice",
    order: 4,
  },
  {
    id: "showcase-kurtis",
    slug: "kurtis",
    label: "KURTIS",
    name: "Festive Kurtis",
    desc: "Everyday elegance & festive flair",
    ribbon: "FESTIVE",
    tag: "BESTSELLER",
    emoji: "🔥",
    image: null,
    bgTone: "#f5f9f6",
    borderColor: "#cce2d3",
    accentDot: "#0d4428",
    pattern: "dots",
    order: 5,
  },
  {
    id: "showcase-new-arrivals",
    slug: "new-arrivals",
    label: "NEW ARRIVALS",
    name: "New Season Arrivals",
    desc: "Fresh off the designer atelier",
    ribbon: "NEW IN",
    tag: "JUST IN",
    emoji: "💫",
    image: null,
    bgTone: "#faf8f3",
    borderColor: "#e8dfcc",
    accentDot: "#c59b27",
    pattern: "lines",
    order: 6,
  },
];

const DATA_FILE = path.join(process.cwd(), "data", "showcase-cards.json");

function loadStore(): ShowcaseCard[] {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn("[Showcase Store] Read fallback:", err);
  }
  return DEFAULT_CARDS;
}

function saveStore(cards: ShowcaseCard[]): void {
  try {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(cards, null, 2), "utf-8");
  } catch (err) {
    console.error("[Showcase Store] Save error:", err);
  }
}

let memoryStore: ShowcaseCard[] = loadStore();

export function getShowcaseCards(): ShowcaseCard[] {
  memoryStore = loadStore();
  return memoryStore.sort((a, b) => (a.order || 0) - (b.order || 0));
}

export function updateShowcaseCard(id: string, updates: Partial<ShowcaseCard>): ShowcaseCard | null {
  memoryStore = loadStore();
  const idx = memoryStore.findIndex((c) => c.id === id || c.slug === id);
  if (idx === -1) return null;

  memoryStore[idx] = {
    ...memoryStore[idx],
    ...updates,
    id: memoryStore[idx].id, // preserve id
  };

  saveStore(memoryStore);
  return memoryStore[idx];
}

export function createShowcaseCard(data: Omit<ShowcaseCard, "id">): ShowcaseCard {
  memoryStore = loadStore();
  const newCard: ShowcaseCard = {
    ...data,
    id: `showcase-${data.slug || Date.now()}`,
    order: data.order || memoryStore.length + 1,
  };
  memoryStore.push(newCard);
  saveStore(memoryStore);
  return newCard;
}

export function deleteShowcaseCard(id: string): boolean {
  memoryStore = loadStore();
  const initialLen = memoryStore.length;
  memoryStore = memoryStore.filter((c) => c.id !== id && c.slug !== id);
  if (memoryStore.length !== initialLen) {
    saveStore(memoryStore);
    return true;
  }
  return false;
}
