import "@/App.css";
import "@/index.css";
import { lazy, Suspense, useEffect, useLayoutEffect, useState } from "react";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
  useParams,
} from "react-router-dom";
import { AuthProvider, useAuth } from "@/lib/auth.jsx";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import StickyMobileBar from "@/components/StickyMobileBar";
import CookieBanner from "@/components/CookieBanner";
import StaticPageFaq from "@/components/StaticPageFaq";
import CrmChat from "@/components/CrmChat";
import MarketingScripts from "@/components/MarketingScripts";
import PhoneClickAnalytics from "@/components/PhoneClickAnalytics";
import { initAttribution, trackPageView } from "@/lib/analytics";
import { isTourLandingSlug } from "@/lib/seoLandings";
import {
  completePageMount,
  getInitialSiteData,
} from "@/lib/pageBootstrap";
import { useSiteData } from "@/lib/useSiteData";
import { runAfterInteractionOrTimeout } from "@/lib/deferredLoad";

const Toaster = lazy(() =>
  import("@/components/ui/sonner").then((module) => ({
    default: module.Toaster,
  })),
);

const Home = lazy(() => import(/* webpackChunkName: "home" */ "@/pages/Home"));
const Catalog = lazy(() => import("@/pages/Catalog"));
const TourPage = lazy(() => import("@/pages/TourPage"));
const TourLanding = lazy(() => import("@/pages/TourLanding"));
const About = lazy(() => import("@/pages/About"));
const Contacts = lazy(() => import("@/pages/Contacts"));
const Faq = lazy(() => import("@/pages/Faq"));
const Promotions = lazy(() => import("@/pages/Promotions"));
const Reviews = lazy(() => import("@/pages/Reviews"));
const Thanks = lazy(() => import("@/pages/Thanks"));
const TravelLinks = lazy(() => import("@/pages/TravelLinks"));
const Blog = lazy(() => import("@/pages/Blog"));
const Article = lazy(() => import("@/pages/Article"));
const Agencies = lazy(() => import("@/pages/Agencies"));
const Payment = lazy(() => import("@/pages/Payment"));
const Legal = lazy(() => import("@/pages/Legal"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const AdminLogin = lazy(() => import("@/pages/admin/AdminLogin"));
const AdminLayout = lazy(() => import("@/pages/admin/AdminLayout"));
const AdminLeads = lazy(() => import("@/pages/admin/AdminLeads"));
const AdminCollection = lazy(() => import("@/pages/admin/AdminCollection"));
const AdminTourPdfProgram = lazy(() => import("@/pages/admin/AdminTourPdfProgram"));
const AdminSettings = lazy(() => import("@/pages/admin/AdminSettings"));
const AdminDashboard = lazy(() => import("@/pages/admin/AdminDashboard"));

function RouteFallback() {
  return (
    <div className="min-h-[45vh] grid place-items-center text-sm text-neutral-500">
      Загрузка…
    </div>
  );
}

function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (!hash) window.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname, hash]);

  return null;
}

function RouteAnalytics() {
  const location = useLocation();

  useEffect(() => {
    initAttribution();
    trackPageView({
      path: location.pathname + location.search,
      title: typeof document !== "undefined" ? document.title : undefined,
    });
  }, [location.pathname, location.search]);

  return null;
}

function DeferredToaster() {
  const [visible, setVisible] = useState(false);

  useEffect(
    () => runAfterInteractionOrTimeout(() => setVisible(true)),
    [],
  );

  if (!visible) return null;
  return (
    <Suspense fallback={null}>
      <Toaster richColors position="top-right" />
    </Suspense>
  );
}

function PublicLayout({ children }) {
  return (
    <div className="flex min-h-screen flex-col pb-16 lg:pb-0">
      <Header />
      <main className="flex-1">{children}<StaticPageFaq /></main>
      <Footer />
      <StickyMobileBar />
      <CookieBanner />
      <CrmChat />
    </div>
  );
}

function PublicPage({ children }) {
  const { pathname } = useLocation();
  useLayoutEffect(() => {
    const tour = pathname.match(/^\/tours\/([^/]+)\/?$/);
    const article = /^\/blog\/[^/]+\/?$/.test(pathname);
    // Detail pages release the server document only after their data is ready.
    if (
      !article &&
      (!tour || isTourLandingSlug(tour[1], getInitialSiteData()?.settings))
    ) {
      completePageMount();
    }
  }, [pathname]);
  return <PublicLayout>{children}</PublicLayout>;
}

function ProtectedAdmin({ children }) {
  const { user, loading } = useAuth();

  if (loading) return <RouteFallback />;
  if (!user) return <Navigate to="/admin/login" replace />;
  return children;
}

const DIRECTION_REDIRECTS = {
  dagestan: "/tours/dagestan",
  "georgia-kobuleti": "/tours/gruziya",
  "saint-petersburg": "/tours/sankt-peterburg",
  kareliya: "/tours/kareliya",
};

function DirectionRedirect() {
  const { slug = "" } = useParams();
  return <Navigate to={DIRECTION_REDIRECTS[slug] || "/tours"} replace />;
}

function TourSlugRoute() {
  const { slug = "" } = useParams();
  const { settings } = useSiteData();
  return isTourLandingSlug(slug, settings) ? (
    <TourLanding slug={slug} />
  ) : (
    <TourPage />
  );
}

export default function App() {
  useLayoutEffect(() => {
    document.getElementById("initial-load-cover")?.remove();
  }, []);

  return (
    <div>
        <BrowserRouter>
          <AuthProvider>
            <ScrollToTop />
            <RouteAnalytics />
            <MarketingScripts />
            <PhoneClickAnalytics />

            <Suspense fallback={<RouteFallback />}>
              <Routes>
            <Route path="/" element={<PublicPage><Home /></PublicPage>} />
            <Route path="/tours" element={<PublicPage><Catalog /></PublicPage>} />
            <Route path="/tours/:slug" element={<PublicPage><TourSlugRoute /></PublicPage>} />
            <Route path="/thanks" element={<PublicPage><Thanks /></PublicPage>} />
            <Route path="/links" element={<PublicPage><TravelLinks /></PublicPage>} />
            <Route path="/directions" element={<Navigate to="/tours" replace />} />
            <Route path="/directions/:slug" element={<DirectionRedirect />} />
            <Route path="/about" element={<PublicPage><About /></PublicPage>} />
            <Route path="/contacts" element={<PublicPage><Contacts /></PublicPage>} />
            <Route path="/faq" element={<PublicPage><Faq /></PublicPage>} />
            <Route path="/promotions" element={<PublicPage><Promotions /></PublicPage>} />
            <Route path="/reviews" element={<PublicPage><Reviews /></PublicPage>} />
            <Route path="/blog" element={<PublicPage><Blog /></PublicPage>} />
            <Route path="/blog/:slug" element={<PublicPage><Article /></PublicPage>} />
            <Route path="/agencies" element={<PublicPage><Agencies /></PublicPage>} />
            <Route path="/payment" element={<PublicPage><Payment /></PublicPage>} />
            <Route path="/legal" element={<PublicPage><Legal /></PublicPage>} />

            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<ProtectedAdmin><AdminLayout /></ProtectedAdmin>}>
              <Route index element={<AdminDashboard />} />
              <Route path="leads" element={<AdminLeads />} />
              <Route path="tours" element={<AdminCollection name="tours" />} />
              <Route path="tours/:tourId/pdf-program" element={<AdminTourPdfProgram />} />
              <Route path="directions" element={<Navigate to="/admin/tours" replace />} />
              <Route path="specialists" element={<AdminCollection name="specialists" />} />
              <Route path="reviews" element={<AdminCollection name="reviews" />} />
              <Route path="articles" element={<AdminCollection name="articles" />} />
              <Route path="promotions" element={<AdminCollection name="promotions" />} />
              <Route path="faq" element={<AdminCollection name="faq" />} />
              <Route path="settings" element={<AdminSettings />} />
            </Route>

            <Route path="*" element={<PublicPage><NotFound /></PublicPage>} />
              </Routes>
            </Suspense>
            <DeferredToaster />
          </AuthProvider>
        </BrowserRouter>
    </div>
  );
}
