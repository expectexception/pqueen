import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Playfair_Display } from "next/font/google";
import "./globals.css";

// Force all pages to be server-rendered on demand — prevents HCDN from caching HTML with s-maxage
export const dynamic = "force-dynamic";
export const revalidate = 0;

import Header from "./components/Header";
import Footer from "./components/Footer";
import FloatingAiConcierge from "./components/FloatingAiConcierge";
import MaintenanceGuard from "./components/MaintenanceGuard";
import MetaPixel from "./components/MetaPixel";
import { CartProvider } from "./context/CartContext";
import { WishlistProvider } from "./context/WishlistContext";
import { ToastProvider } from "./context/ToastContext";
import { AuthProvider } from "./context/AuthContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://pqnpartyqueen.com"),
  title: {
    default: "PQN PARTY QUEEN | Luxury Indian & Party Fashion",
    template: "%s | PQN PARTY QUEEN",
  },
  description: "Discover curated designer ethnic wear, lehengas, suit sets, sarees, and haute couture dresses for your most cherished celebratory moments.",
  keywords: [
    "lehengas",
    "designer suits",
    "bridal sarees",
    "party queen",
    "luxury ethnic wear",
    "Indian wedding wear",
    "PQN",
    "haute couture India",
    "anarkali suits",
    "cocktail gowns",
  ],
  authors: [{ name: "PQN Party Queen Atelier" }],
  creator: "PQN Party Queen",
  publisher: "PQN Party Queen",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: [{ url: "/logopq.png", type: "image/png" }],
    apple: [{ url: "/logopq.png", type: "image/png" }],
    shortcut: "/logopq.png",
  },
  openGraph: {
    title: "PQN PARTY QUEEN | Luxury Indian & Party Fashion",
    description: "Handcrafted haute couture, lehengas, and designer silhouettes made for your special moments.",
    url: "https://pqnpartyqueen.com",
    siteName: "PQN Party Queen",
    locale: "en_IN",
    type: "website",
    images: [
      {
        url: "/logopq.png",
        width: 1200,
        height: 1200,
        alt: "PQN PARTY QUEEN Luxury Haute Couture",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "PQN PARTY QUEEN | Luxury Indian & Party Fashion",
    description: "Curated designer ethnic wear, lehengas, suit sets, and bridal couture.",
    images: ["/logopq.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export const viewport: Viewport = {
  themeColor: "#072818",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} h-full antialiased`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "PQN PARTY QUEEN",
              "url": "https://pqnpartyqueen.com",
              "logo": "https://pqnpartyqueen.com/logopq.png",
              "description": "Luxury Indian Haute Couture, Bridal Lehengas, Designer Sarees & Celebratory Suit Sets.",
              "contactPoint": {
                "@type": "ContactPoint",
                "telephone": "+91-9876543210",
                "contactType": "customer service",
                "areaServed": "IN",
                "availableLanguage": ["en", "hi"]
              },
              "sameAs": [
                "https://www.instagram.com/pqnpartyqueen",
                "https://www.facebook.com/pqnpartyqueen"
              ]
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "PQN PARTY QUEEN",
              "url": "https://pqnpartyqueen.com",
              "potentialAction": {
                "@type": "SearchAction",
                "target": "https://pqnpartyqueen.com/shop?q={search_term_string}",
                "query-input": "required name=search_term_string"
              }
            }),
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                function reloadOnChunkError(msg) {
                  if (msg && (msg.indexOf('Loading chunk') !== -1 || msg.indexOf('CSS_CHUNK_LOAD_FAILED') !== -1 || msg.indexOf('turbopack') !== -1 || msg.indexOf('ERR_ABORTED') !== -1)) {
                    if (!sessionStorage.getItem('chunk_err_reloaded')) {
                      sessionStorage.setItem('chunk_err_reloaded', 'true');
                      window.location.reload(true);
                    }
                  }
                }
                window.addEventListener('error', function(e) {
                  if (e && e.message) reloadOnChunkError(e.message);
                }, true);
                window.addEventListener('unhandledrejection', function(e) {
                  if (e && e.reason) reloadOnChunkError(String(e.reason));
                });
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-[#f6f8f6] text-[#152018] selection:bg-[#0d4428] selection:text-[#f5d77f]">

        <ToastProvider>
          <AuthProvider>
            <CartProvider>
              <WishlistProvider>
                <MetaPixel />
                <MaintenanceGuard>
                  <Header />
                  <div className="flex-1 w-full">{children}</div>
                  <Footer />
                  <FloatingAiConcierge />
                </MaintenanceGuard>
              </WishlistProvider>
            </CartProvider>
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}