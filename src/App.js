import "@/App.css";
import "@/index.css";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import IntroScreen from "@/components/IntroScreen";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider, useAuth } from "@/lib/auth.jsx";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import StickyMobileBar from "@/components/StickyMobileBar";
import CookieBanner from "@/components/CookieBanner";
import MarketingScripts from "@/components/MarketingScripts";
import { initAttribution, trackPageView } from "@/lib/analytics";

import Home from "@/pages/Home";
import Catalog from "@/pages/Catalog";
import TourPage from "@/pages/TourPage";
import About from "@/pages/About";
import Contacts from "@/pages/Contacts";
import Faq from "@/pages/Faq";
import Promotions from "@/pages/Promotions";
import Reviews from "@/pages/Reviews";
import Thanks from "@/pages/Thanks";
import TravelLinks from "./pages/TravelLinks";
import Blog from "@/pages/Blog";
import Article from "@/pages/Article";
import Agencies from "@/pages/Agencies";
import Payment from "@/pages/Payment";
import Legal from "@/pages/Legal";
import NotFound from "@/pages/NotFound";

import AdminLogin from "@/pages/admin/AdminLogin";
import AdminLayout from "@/pages/admin/AdminLayout";
import AdminLeads from "@/pages/admin/AdminLeads";
import AdminCollection from "@/pages/admin/AdminCollection";
import AdminSettings from "@/pages/admin/AdminSettings";
import AdminDashboard from "@/pages/admin/AdminDashboard";

function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) return;

    window.scrollTo({ top: 0, behavior: "instant" });
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

function PublicLayout({ children }) {
  return (
    <div className="flex flex-col min-h-screen pb-16 lg:pb-0">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <StickyMobileBar />
      <CookieBanner />
    </div>
  );
}

function ProtectedAdmin({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center text-sm text-neutral-500">
        Загрузка…
      </div>
    );
  }

  if (!user) return <Navigate to="/admin/login" replace />;

  return children;
}

const DIRECTION_TO_TOUR = {
  dagestan: "dagestan-7-dney",
  "georgia-kobuleti": "gruziya-kobuleti-10-dney",
  "saint-petersburg": "saint-petersburg-5-dney",
  kareliya: "kareliya-5-dney",
};

function DirectionRedirect() {
  const { pathname } = useLocation();
  const slug = pathname.replace(/^\/directions\/?/, "").split("/")[0] || "";
  const target = DIRECTION_TO_TOUR[slug];

  return <Navigate to={target ? `/tours/${target}` : "/tours"} replace />;
}

export default function App() {
  const INTRO_DURATION = 1700;

  const [showIntro, setShowIntro] = useState(true);
  const [startHeroVideo, setStartHeroVideo] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowIntro(false);
      setStartHeroVideo(true);
    }, INTRO_DURATION);

    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <IntroScreen visible={showIntro} />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: showIntro ? 0 : 1 }}
        transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
      >
        <BrowserRouter>
          <AuthProvider>
            <ScrollToTop />
            <RouteAnalytics />
            <MarketingScripts />

            <Routes>
              <Route
                path="/"
                element={
                  <PublicLayout>
                    <Home startVideo={startHeroVideo} />
                  </PublicLayout>
                }
              />

              <Route
                path="/tours"
                element={
                  <PublicLayout>
                    <Catalog />
                  </PublicLayout>
                }
              />

              <Route
                path="/tours/:slug"
                element={
                  <PublicLayout>
                    <TourPage />
                  </PublicLayout>
                }
              />

              <Route
                path="/thanks"
                element={
                  <PublicLayout>
                    <Thanks />
                  </PublicLayout>
                }
              />

              <Route
                path="/links"
                element={
                  <PublicLayout>
                    <TravelLinks />
                  </PublicLayout>
                }
              />

              <Route
                path="/directions"
                element={<Navigate to="/tours" replace />}
              />

              <Route path="/directions/:slug" element={<DirectionRedirect />} />

              <Route
                path="/about"
                element={
                  <PublicLayout>
                    <About />
                  </PublicLayout>
                }
              />

              <Route
                path="/contacts"
                element={
                  <PublicLayout>
                    <Contacts />
                  </PublicLayout>
                }
              />

              <Route
                path="/faq"
                element={
                  <PublicLayout>
                    <Faq />
                  </PublicLayout>
                }
              />

              <Route
                path="/promotions"
                element={
                  <PublicLayout>
                    <Promotions />
                  </PublicLayout>
                }
              />

              <Route
                path="/reviews"
                element={
                  <PublicLayout>
                    <Reviews />
                  </PublicLayout>
                }
              />

              <Route
                path="/blog"
                element={
                  <PublicLayout>
                    <Blog />
                  </PublicLayout>
                }
              />

              <Route
                path="/blog/:slug"
                element={
                  <PublicLayout>
                    <Article />
                  </PublicLayout>
                }
              />

              <Route
                path="/agencies"
                element={
                  <PublicLayout>
                    <Agencies />
                  </PublicLayout>
                }
              />

              <Route
                path="/payment"
                element={
                  <PublicLayout>
                    <Payment />
                  </PublicLayout>
                }
              />

              <Route
                path="/legal"
                element={
                  <PublicLayout>
                    <Legal />
                  </PublicLayout>
                }
              />

              <Route path="/admin/login" element={<AdminLogin />} />

              <Route
                path="/admin"
                element={
                  <ProtectedAdmin>
                    <AdminLayout />
                  </ProtectedAdmin>
                }
              >
                <Route index element={<AdminDashboard />} />
                <Route path="leads" element={<AdminLeads />} />
                <Route
                  path="tours"
                  element={<AdminCollection name="tours" />}
                />

                <Route
                  path="directions"
                  element={<Navigate to="/admin/tours" replace />}
                />

                <Route
                  path="specialists"
                  element={<AdminCollection name="specialists" />}
                />

                <Route
                  path="reviews"
                  element={<AdminCollection name="reviews" />}
                />

                <Route
                  path="articles"
                  element={<AdminCollection name="articles" />}
                />

                <Route
                  path="promotions"
                  element={<AdminCollection name="promotions" />}
                />

                <Route path="faq" element={<AdminCollection name="faq" />} />
                <Route path="settings" element={<AdminSettings />} />
              </Route>

              <Route
                path="*"
                element={
                  <PublicLayout>
                    <NotFound />
                  </PublicLayout>
                }
              />
            </Routes>

            <Toaster richColors position="top-right" />
          </AuthProvider>
        </BrowserRouter>
      </motion.div>
    </>
  );
}
