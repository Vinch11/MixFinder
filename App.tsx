import { useState, Suspense, lazy } from "react";
import { Loader2 } from "lucide-react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { InitialLoader } from "@/components/animations";
import { ScrollToTop } from "@/components/ScrollToTop";
import { AuthProvider } from "@/hooks/useAuth";
import { EditModeProvider } from "@/hooks/useEditMode";
import { EditModeToggle, SiteEditorPanel } from "@/components/editable";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { PWAUpdateRoot } from "@/components/PWAUpdatePrompt";
import { InstallPromptBanner } from "@/components/InstallPromptBanner";
import { NotificationBigView } from "@/components/NotificationBigView";
import { useThemeOverride } from "@/hooks/useSiteContent";

// Public pages
import Index from "./pages/Index";
import CoachingIndividuel from "./pages/CoachingIndividuel";
import CoachingCollectif from "./pages/CoachingCollectif";
// Lazy: pulls in recharts for the deck-style charts, kept out of every
// other page's initial bundle.
const TFCLab = lazy(() => import("./pages/TFCLab"));
import Equipe from "./pages/Equipe";
import Tarifs from "./pages/Tarifs";
import FAQ from "./pages/FAQ";
import Contact from "./pages/Contact";
import Blog from "./pages/Blog";
import BlogArticle from "./pages/BlogArticle";
import NotFound from "./pages/NotFound";
import CheckoutReturn from "./pages/CheckoutReturn";
import Install from "./pages/Install";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

// Client pages
import ClientLogin from "./pages/client/ClientLogin";
import ClientRegister from "./pages/client/ClientRegister";
import ClientDashboard from "./pages/client/ClientDashboard";

// Admin pages
import Login from "./pages/admin/Login";
import Register from "./pages/admin/Register";
import Dashboard from "./pages/admin/Dashboard";
import TeamAdmin from "./pages/admin/TeamAdmin";
import PricingAdmin from "./pages/admin/PricingAdmin";
import FAQAdmin from "./pages/admin/FAQAdmin";
import TestimonialsAdmin from "./pages/admin/TestimonialsAdmin";
import MessagesAdmin from "./pages/admin/MessagesAdmin";
import SectionsAdmin from "./pages/admin/SectionsAdmin";
import SettingsAdmin from "./pages/admin/SettingsAdmin";
import SessionsAdmin from "./pages/admin/SessionsAdmin";
import CreditsAdmin from "./pages/admin/CreditsAdmin";
import ArticlesAdmin from "./pages/admin/ArticlesAdmin";
import PagesAdmin from "./pages/admin/PagesAdmin";
import StatsAdmin from "./pages/admin/StatsAdmin";
import MediaAdmin from "./pages/admin/MediaAdmin";
import AdminsAdmin from "./pages/admin/AdminsAdmin";
import MembersAdmin from "./pages/admin/MembersAdmin";
import AvailabilityAdmin from "./pages/admin/AvailabilityAdmin";
import AppointmentsAdmin from "./pages/admin/AppointmentsAdmin";
import NotificationsAdmin from "./pages/admin/NotificationsAdmin";

// Planning
import Planning from "./pages/Planning";

const queryClient = new QueryClient();

function ThemeOverride() {
  useThemeOverride();
  return null;
}

const App = () => {
  const [showLoader, setShowLoader] = useState(true);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <EditModeProvider>
        <TooltipProvider>
          {showLoader && (
            <InitialLoader 
              minimumDuration={2500} 
              onComplete={() => setShowLoader(false)} 
            />
          )}
          <Toaster />
          <Sonner />
          <PWAUpdateRoot />
          <ThemeOverride />
          <BrowserRouter>
            <ScrollToTop />
            <InstallPromptBanner />
            <NotificationBigView />
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Index />} />
              <Route path="/coaching-individuel" element={<CoachingIndividuel />} />
              <Route path="/coaching-collectif" element={<CoachingCollectif />} />
              <Route
                path="/tfclab"
                element={
                  <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}>
                    <TFCLab />
                  </Suspense>
                }
              />
              <Route path="/equipe" element={<Equipe />} />
              <Route path="/tarifs" element={<Tarifs />} />
              <Route path="/faq" element={<FAQ />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/blog/:slug" element={<BlogArticle />} />
              <Route path="/planning" element={<Planning />} />
              <Route path="/install" element={<Install />} />
              <Route path="/checkout/return" element={<CheckoutReturn />} />
              <Route path="/mot-de-passe-oublie" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />

              {/* Client routes */}
              <Route path="/connexion" element={<ClientLogin />} />
              <Route path="/inscription" element={<ClientRegister />} />
              <Route path="/mon-espace" element={<ClientDashboard />} />

              {/* Admin routes */}
              <Route path="/admin/login" element={<Login />} />
              <Route path="/admin/register" element={<Register />} />
              <Route path="/admin" element={<ProtectedRoute requireAdmin><Dashboard /></ProtectedRoute>} />
              <Route path="/admin/team" element={<ProtectedRoute requireAdmin><TeamAdmin /></ProtectedRoute>} />
              <Route path="/admin/pricing" element={<ProtectedRoute requireAdmin><PricingAdmin /></ProtectedRoute>} />
              <Route path="/admin/faq" element={<ProtectedRoute requireAdmin><FAQAdmin /></ProtectedRoute>} />
              <Route path="/admin/testimonials" element={<ProtectedRoute requireAdmin><TestimonialsAdmin /></ProtectedRoute>} />
              <Route path="/admin/messages" element={<ProtectedRoute requireAdmin><MessagesAdmin /></ProtectedRoute>} />
              <Route path="/admin/sections" element={<ProtectedRoute requireAdmin><SectionsAdmin /></ProtectedRoute>} />
              <Route path="/admin/settings" element={<ProtectedRoute requireAdmin><SettingsAdmin /></ProtectedRoute>} />
              <Route path="/admin/sessions" element={<ProtectedRoute requireAdmin><SessionsAdmin /></ProtectedRoute>} />
              <Route path="/admin/credits" element={<ProtectedRoute requireAdmin><CreditsAdmin /></ProtectedRoute>} />
              <Route path="/admin/members" element={<ProtectedRoute requireAdmin><MembersAdmin /></ProtectedRoute>} />
              <Route path="/admin/articles" element={<ProtectedRoute requireAdmin><ArticlesAdmin /></ProtectedRoute>} />
              <Route path="/admin/pages" element={<ProtectedRoute requireAdmin><PagesAdmin /></ProtectedRoute>} />
              <Route path="/admin/stats" element={<ProtectedRoute requireAdmin><StatsAdmin /></ProtectedRoute>} />
              <Route path="/admin/media" element={<ProtectedRoute requireAdmin><MediaAdmin /></ProtectedRoute>} />
              <Route path="/admin/admins" element={<ProtectedRoute requireAdmin><AdminsAdmin /></ProtectedRoute>} />
              <Route path="/admin/availability" element={<ProtectedRoute requireAdmin><AvailabilityAdmin /></ProtectedRoute>} />
              <Route path="/admin/appointments" element={<ProtectedRoute requireAdmin><AppointmentsAdmin /></ProtectedRoute>} />
              <Route path="/admin/notifications" element={<ProtectedRoute requireAdmin><NotificationsAdmin /></ProtectedRoute>} />

              {/* Catch-all route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            <EditModeToggle />
            <SiteEditorPanel />
          </BrowserRouter>
        </TooltipProvider>
        </EditModeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
