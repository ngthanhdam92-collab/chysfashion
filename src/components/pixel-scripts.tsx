"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { trackPageView } from "@/lib/pixel-events";

interface PixelScriptsProps {
  fbPixelId?: string;
  ttPixelId?: string;
}

export function PixelScripts({ fbPixelId, ttPixelId }: PixelScriptsProps) {
  const pathname = usePathname();

  // Fire PageView on every client-side navigation (after initial load)
  useEffect(() => {
    trackPageView();
  }, [pathname]);

  // Sanitize IDs: FB Pixel = digits only, TikTok Pixel = alphanumeric uppercase only
  const safeFb = /^\d{1,20}$/.test(fbPixelId ?? "") ? fbPixelId : undefined;
  const safeTt = /^[A-Z0-9]{1,30}$/.test((ttPixelId ?? "").toUpperCase())
    ? ttPixelId
    : undefined;

  if (!safeFb && !safeTt) return null;

  return (
    <>
      {safeFb && (
        <Script
          id="fb-pixel"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              !function(f,b,e,v,n,t,s){
                if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                n.queue=[];t=b.createElement(e);t.async=!0;
                t.src=v;s=b.getElementsByTagName(e)[0];
                s.parentNode.insertBefore(t,s)
              }(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
              fbq('init','${safeFb}');
              fbq('track','PageView');
            `,
          }}
        />
      )}

      {safeTt && (
        <Script
          id="tt-pixel"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              !function(w,d,t){
                w.TiktokAnalyticsObject=t;
                var ttq=w[t]=w[t]||[];
                ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"];
                ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};
                for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);
                ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e};
                ttq.load=function(e,n){
                  var r="https://analytics.tiktok.com/i18n/pixel/events.js",o=n&&n.partner;
                  ttq._i=ttq._i||{};ttq._i[e]=[];ttq._i[e]._u=r;
                  ttq._t=ttq._t||{};ttq._t[e]=+new Date;
                  ttq._o=ttq._o||{};ttq._o[e]=n||{};
                  var a=document.createElement("script");
                  a.type="text/javascript";a.async=!0;a.src=r+"?sdkid="+e+"&lib="+t;
                  var s=document.getElementsByTagName("script")[0];
                  s.parentNode.insertBefore(a,s)
                };
                ttq.load('${safeTt}');
                ttq.page();
              }(window,document,'ttq');
            `,
          }}
        />
      )}
    </>
  );
}
