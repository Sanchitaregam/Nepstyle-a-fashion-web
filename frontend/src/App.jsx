import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import CreateOutfitPage from "./pages/CreateOutfitPage";
import ChatPage from "./pages/ChatPage";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import LoginFormPage from "./pages/LoginFormPage";
import OutfitDetailPage from "./pages/OutfitDetailPage";
import ProfilePage from "./pages/ProfilePage";
import RegisterPage from "./pages/RegisterPage";
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
          <Route path="/login" element={<LoginPage />} />
          <Route path="/login/form" element={<LoginFormPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/create/outfit" element={<CreateOutfitPage />} />
          <Route path="/outfits/:id" element={<OutfitDetailPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/u/:username" element={<ProfilePage />} />
          <Route path="/messages" element={<ChatPage />} />
          <Route path="/messages/:conversationId" element={<ChatPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
