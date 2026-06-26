import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import AnalyticsPage from "./pages/AnalyticsPage";
import CreateOutfitPage from "./pages/CreateOutfitPage";
import ChatPage from "./pages/ChatPage";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import LoginFormPage from "./pages/LoginFormPage";
import OutfitDetailPage from "./pages/OutfitDetailPage";
import PaymentFailurePage from "./pages/PaymentFailurePage";
import PaymentRedirectPage from "./pages/PaymentRedirectPage";
import PaymentSuccessPage from "./pages/PaymentSuccessPage";
import ProfilePage from "./pages/ProfilePage";
import RegisterPage from "./pages/RegisterPage";
import SearchPage from "./pages/SearchPage";
import SubscriptionPage from "./pages/SubscriptionPage";
import "./App.css";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/login/form" element={<LoginFormPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/create/outfit" element={<CreateOutfitPage />} />
          <Route path="/outfits/:id" element={<OutfitDetailPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/u/:username" element={<ProfilePage />} />
          <Route path="/messages" element={<ChatPage />} />
          <Route path="/messages/:conversationId" element={<ChatPage />} />
          <Route path="/subscription" element={<SubscriptionPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/payment/redirect" element={<PaymentRedirectPage />} />
          <Route path="/payment/success" element={<PaymentSuccessPage />} />
          <Route path="/payment/failure" element={<PaymentFailurePage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
