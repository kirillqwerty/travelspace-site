import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useSiteData } from "@/lib/useSiteData";
import {
  runAfterInteractionOrLoadDelay,
  runAfterInteractionOrTimeout,
} from "@/lib/deferredLoad";

function analyticsId(settings, key, pattern) {
  const value = String(settings?.[key] || settings?.analytics?.[key] || "").trim();
  return pattern.test(value) ? value : "";
}

export default function MarketingScripts() {
  const { settings } = useSiteData();
  const [loadCoreAnalytics, setLoadCoreAnalytics] = useState(false);
  const [loadDeferredPixels, setLoadDeferredPixels] = useState(false);

  useEffect(() => {
    return runAfterInteractionOrLoadDelay(() => setLoadCoreAnalytics(true));
  }, []);

  useEffect(() => {
    return runAfterInteractionOrTimeout(() => setLoadDeferredPixels(true));
  }, []);

  if (!settings) return null;

  const gtmId = analyticsId(settings, "gtm_id", /^GTM-[A-Z0-9]+$/i);
  const gaId = analyticsId(
    settings,
    "google_analytics_id",
    /^(G-[A-Z0-9]+|UA-\d+-\d+)$/i,
  );
  const metrikaId = analyticsId(settings, "yandex_metrika_id", /^\d{1,20}$/);
  const facebookPixelId =
    analyticsId(settings, "facebook_pixel_id", /^\d{1,32}$/) ||
    analyticsId(settings, "meta_pixel_id", /^\d{1,32}$/);
  const tiktokPixelId = analyticsId(
    settings,
    "tiktok_pixel_id",
    /^[A-Z0-9]{5,64}$/i,
  );

  return (
    <Helmet>
      <script>{`
        window.__TRAVELSPACE_MARKETING_SETTINGS_READY = true;
        window.__TRAVELSPACE_GTM_CONFIGURED = ${JSON.stringify(Boolean(gtmId))};
        window.__TRAVELSPACE_GA_CONFIGURED = ${JSON.stringify(Boolean(gaId))};
        window.__TRAVELSPACE_YANDEX_METRIKA_CONFIGURED = ${JSON.stringify(Boolean(metrikaId))};
        window.__TRAVELSPACE_META_PIXEL_CONFIGURED = ${JSON.stringify(Boolean(facebookPixelId))};
        window.__TRAVELSPACE_TIKTOK_PIXEL_CONFIGURED = ${JSON.stringify(Boolean(tiktokPixelId))};
        window.dispatchEvent(new Event('marketing-scripts-ready'));
      `}</script>

      {loadCoreAnalytics && gtmId && (
        <script>{`
          (function(w,d,s,l,i){
            w[l]=w[l]||[];
            if (w.__TRAVELSPACE_LOAD_GTM) {
              w.__TRAVELSPACE_LOAD_GTM();
              return;
            }
            if (w.__TRAVELSPACE_GTM_INITIALIZED) return;
            w.__TRAVELSPACE_GTM_INITIALIZED = true;
            w[l].push({'gtm.start': new Date().getTime(), event:'gtm.js'});
            var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';
            j.async=true;
            j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;
            f.parentNode.insertBefore(j,f);
            w.dispatchEvent(new Event('gtm-ready'));
          })(window,document,'script','dataLayer',${JSON.stringify(gtmId)});
        `}</script>
      )}

      {loadCoreAnalytics && !gtmId && gaId && (
        <script
          async
          src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
        />
      )}
      {loadCoreAnalytics && !gtmId && gaId && (
        <script>{`
          (function(w) {
            w.dataLayer = w.dataLayer || [];
            w.gtag = w.gtag || function(){ w.dataLayer.push(arguments); };
            if (w.__TRAVELSPACE_GA_INITIALIZED) return;
            w.__TRAVELSPACE_GA_INITIALIZED = true;
            w.gtag('js', new Date());
            w.gtag('config', ${JSON.stringify(gaId)}, { send_page_view: false });
            w.dispatchEvent(new Event('ga-ready'));
          })(window);
        `}</script>
      )}

      {loadCoreAnalytics && metrikaId && (
        <script>{`
          (function() {
            window.__YANDEX_METRIKA_ID = ${JSON.stringify(Number(metrikaId) || metrikaId)};
            if (window.__TRAVELSPACE_YANDEX_METRIKA_INITIALIZED) return;
            window.__TRAVELSPACE_YANDEX_METRIKA_INITIALIZED = true;
            (function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
            m[i].l=1*new Date();
            for (var j = 0; j < document.scripts.length; j++) { if (document.scripts[j].src === r) { return; } }
            k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
            (window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");
            ym(window.__YANDEX_METRIKA_ID, "init", { clickmap:true, trackLinks:true, accurateTrackBounce:true, webvisor:true });
            (window.__TRAVELSPACE_PENDING_YANDEX_EVENTS || []).splice(0).forEach(function(item) {
              ym(window.__YANDEX_METRIKA_ID, "reachGoal", item.eventName, item.payload || {});
            });
            window.dispatchEvent(new Event('yandex-metrika-ready'));
          })();
        `}</script>
      )}

      {loadDeferredPixels && facebookPixelId && (
        <script>{`
          (function() {
            !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
            n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}
            (window, document,'script','https://connect.facebook.net/en_US/fbevents.js');

            if (!window.__TRAVELSPACE_META_PIXEL_INITIALIZED) {
              fbq('init', ${JSON.stringify(facebookPixelId)});
              window.__TRAVELSPACE_META_PIXEL_INITIALIZED = true;
            }

            if (!window.__TRAVELSPACE_META_PIXEL_PAGEVIEW_SENT && window.location.pathname !== '/thanks') {
              fbq('track', 'PageView');
              window.__TRAVELSPACE_META_PIXEL_PAGEVIEW_SENT = true;
            }

            window.dispatchEvent(new Event('meta-pixel-ready'));
          })();
        `}</script>
      )}

      {loadDeferredPixels && tiktokPixelId && (
        <script>{`
          (function() {
            if (!window.__TRAVELSPACE_TIKTOK_PIXEL_INITIALIZED) {
              !function (w, d, t) {
                w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};
                for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);
                ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};
                ttq.load(${JSON.stringify(tiktokPixelId)});
              }(window, document, 'ttq');
              window.__TRAVELSPACE_TIKTOK_PIXEL_INITIALIZED = true;
            }

            if (!window.__TRAVELSPACE_TIKTOK_PAGEVIEW_SENT && window.location.pathname !== '/thanks') {
              window.ttq.page();
              window.__TRAVELSPACE_TIKTOK_PAGEVIEW_SENT = true;
            }

            window.dispatchEvent(new Event('tiktok-pixel-ready'));
          })();
        `}</script>
      )}
    </Helmet>
  );
}
