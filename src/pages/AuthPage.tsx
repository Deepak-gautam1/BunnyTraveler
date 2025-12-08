// src/pages/AuthPage.tsx - CLEANED VERSION
import { useNavigate } from "react-router-dom";
import LandingPage from "@/components/landing/LandingPage";

const AuthPage = () => {
  const navigate = useNavigate();

  const handleSkipForNow = () => {
    navigate("/"); // Navigate to main app
  };

  return (
    <div className="min-h-screen bg-background">
      {/* ✅ REMOVED: Back button - landing page should be standalone */}
      <LandingPage onSkipForNow={handleSkipForNow} />
    </div>
  );
};

export default AuthPage;
