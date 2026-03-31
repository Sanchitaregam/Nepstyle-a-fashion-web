import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import CreateOutfitPage from "./pages/CreateOutfitPage";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import LoginFormPage from "./pages/LoginFormPage";
import OutfitDetailPage from "./pages/OutfitDetailPage";
import ProfilePage from "./pages/ProfilePage";
import RegisterPage from "./pages/RegisterPage";
import "./App.css";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/login/form" element={<LoginFormPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/create/outfit" element={<CreateOutfitPage />} />
          <Route path="/outfits/:id" element={<OutfitDetailPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/u/:username" element={<ProfilePage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
