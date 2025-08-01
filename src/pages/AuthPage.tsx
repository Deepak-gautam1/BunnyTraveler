import { useState } from "react";
import { useNavigate } from "react-router-dom";
import LandingPage from "@/components/landing/LandingPage";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const AuthPage = () => {
  const navigate = useNavigate();

  const handleSkipForNow = () => {
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background relative">
      {/* Back to Home Button */}
      <Button
        variant="ghost"
        onClick={() => navigate("/")}
        className="absolute top-4 left-4 z-10 hover-scale"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Home
      </Button>

      {/* Landing Page Component */}
      <LandingPage onSkipForNow={handleSkipForNow} />
    </div>
  );
};

export default AuthPage;
