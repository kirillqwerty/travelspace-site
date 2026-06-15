import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { api } from "@/lib/api";
import { hasMarketingConsent } from "@/lib/analytics";

function analyticsId(settings, key) {
  return settings?.[key] || settings?.analytics?.[key] || "";
}

export default function MarketingScripts() {
  const [settings, setSettings] = useState(null);
  const [allowed, setAllowed] = useState(hasMarketingConsent());

  useEffect(() => {
    api.get("/settings").then((r) => setSettings(r.data || {})).catch(() => setSettings({}));
  }, []);

  useEffect(() => {
    const update = () => setAllowed(hasMarketingConsent());
    window.addEventListener("cookie-consent-changed", update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener("cookie-consent-changed", update);
      window.removeEventListener("storage", update);
    };
  }, []);

  if (!settings || !allowed) return null;

  const gtmId = analyticsId(settings, "gtm_id");
  const gaId = analyticsId(settings, "google_analytics_id");
  const metrikaId = analyticsId(settings, "yandex_metrika_id");
  const facebookPixelId = analyticsId(settings, "facebook_pixel_id") || analyticsId(settings, "meta_pixel_id");
  const tiktokPixelId = analyticsId(settings, "tiktok_pixel_id");

  return (
    <Helmet>
      {gtmId && (
        <script>{`
          window.dataLayer = window.dataLayer || [];
          (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
          new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
          j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
          'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
          })(window,document,'script','dataLayer','${gtmId}');
        `}</script>
      )}

      {!gtmId && gaId && <script async src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} />}
      {!gtmId && gaId && (
        <script>{`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${gaId}', { send_page_view: false });
        `}</script>
      )}

      {metrikaId && (
        <script>{`
          window.__YANDEX_METRIKA_ID = ${JSON.stringify(Number(metrikaId) || metrikaId)};
          (function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
          m[i].l=1*new Date();
          for (var j = 0; j < document.scripts.length; j++) { if (document.scripts[j].src === r) { return; } }
          k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
          (window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");
          ym(window.__YANDEX_METRIKA_ID, "init", { clickmap:true, trackLinks:true, accurateTrackBounce:true, webvisor:true });
        `}</script>
      )}

      {facebookPixelId && (
        <script>{`
          !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
          n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}
          (window, document,'script','https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '${facebookPixelId}');
          fbq('track', 'PageView');
        `}</script>
      )}

      {tiktokPixelId && (
        <script>{`
          !function (w, d, t) {
            w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};
            for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);
            ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};
            ttq.load('${tiktokPixelId}');
            ttq.page();
          }(window, document, 'ttq');
        `}</script>
      )}
    </Helmet>
  );
}
