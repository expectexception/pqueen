"use client";

import React, { useEffect, useState } from "react";
import Script from "next/script";
import { usePathname } from "next/navigation";
import { DEFAULT_PIXEL_ID } from "@/lib/meta-pixel";

export default function MetaPixel() {
  const pathname = usePathname();
  const [pixelId, setPixelId] = useState<string>(DEFAULT_PIXEL_ID);
  const [enabled, setEnabled] = useState<boolean>(true);

  // Fetch configured pixel ID from store settings
  useEffect(() => {
    async function fetchConfig() {
      try {
        const res = await fetch("/api/settings/public");
        if (res.ok) {
          const data = await res.json();
          if (data.settings?.metaPixelId) {
            setPixelId(data.settings.metaPixelId);
          }
          if (typeof data.settings?.metaPixelEnabled === "boolean") {
            setEnabled(data.settings.metaPixelEnabled);
          }
        }
      } catch (err) {
        // Use default
      }
    }
    fetchConfig();
  }, []);

  // Track PageView on route change
  useEffect(() => {
    if (!enabled || !pixelId) return;

    if (typeof window !== "undefined" && typeof window.fbq === "function") {
      window.fbq("track", "PageView");
    }
  }, [pathname, enabled, pixelId]);

  if (!enabled || !pixelId) return null;

  return (
    <>
      <Script
        id="meta-pixel-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${pixelId}');
            fbq('track', 'PageView');
          `,
        }}
      />
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
          alt="Meta Pixel"
        />
      </noscript>
    </>
  );
}
