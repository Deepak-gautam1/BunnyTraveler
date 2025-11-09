import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  Mail,
  User,
  ArrowLeft,
  Sparkles,
  MapPin,
  Tag,
  Link,
} from "lucide-react";

interface SignUpFormProps {
  onBackToLanding: () => void;
}

const SignUpForm = ({ onBackToLanding }: SignUpFormProps) => {
  const [step, setStep] = useState<"form" | "verify">("form");
  const [loading, setLoading] = useState(false);
  const [otp, setOtp] = useState("");

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    homeCity: "",
    tagline: "",
    website: "",
  });

  const { toast } = useToast();

  const validateForm = () => {
    const errors: string[] = [];

    if (!formData.fullName.trim()) {
      errors.push("Full name is required");
    }

    if (!formData.email.trim()) {
      errors.push("Email is required");
    }

    if (!formData.homeCity.trim()) {
      errors.push("Home city is required");
    }

    if (!formData.tagline.trim()) {
      errors.push("Tagline is required");
    }

    if (formData.tagline.length > 50) {
      errors.push("Tagline must be 50 characters or less");
    }

    if (formData.website && !isValidUrl(formData.website)) {
      errors.push("Please enter a valid website URL");
    }

    return errors;
  };

  const isValidUrl = (string: string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      toast({
        title: "Please fix the following errors:",
        description: validationErrors.join(", "),
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: formData.email,
        options: {
          shouldCreateUser: true,
          data: {
            full_name: formData.fullName,
            home_city: formData.homeCity,
            tagline: formData.tagline,
            website: formData.website || null,
          },
        },
      });

      if (error) {
        toast({
          title: "Sign up failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        setStep("verify");
        toast({
          title: "Check your email! 📧",
          description: `We've sent a 6-digit code to ${formData.email}`,
        });
      }
    } catch (error: any) {
      console.error("Unexpected error:", error);
      toast({
        title: "Sign up failed",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOTPVerification = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!otp.trim() || otp.length !== 6) {
      toast({
        title: "Enter verification code",
        description: "Please enter the 6-digit code from your email",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: formData.email,
        token: otp,
        type: "email",
      });

      if (error) throw error;

      if (data.user) {
        const { error: profileError } = await supabase.from("profiles").upsert({
          id: data.user.id,
          full_name: formData.fullName,
          email: formData.email,
          home_city: formData.homeCity,
          tagline: formData.tagline,
          website: formData.website || null,
          avatar_url: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

        if (profileError) {
          console.error("Error creating profile:", profileError);
        }

        toast({
          title: "Welcome to SafarSquad! 🎉",
          description: "Redirecting to your adventure...",
        });

        // ✅ Keep loading state ON during redirect
        setTimeout(() => {
          window.location.href = "/";
        }, 1500);
      }
    } catch (error: any) {
      toast({
        title: "Invalid code",
        description: "Please check your email and try again",
        variant: "destructive",
      });
      setLoading(false); // ✅ Only turn off loading on error
    }
    // DON'T turn off loading here - keep button disabled during redirect
  };

  if (step === "verify") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Button
              variant="ghost"
              onClick={() => setStep("form")}
              className="absolute top-4 left-4 p-2"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <CardTitle className="flex items-center justify-center space-x-2">
              <Mail className="w-5 h-5 text-accent" />
              <span>Verify Your Email</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center space-y-2">
              <p className="text-muted-foreground">
                We've sent a 6-digit code to:
              </p>
              <p className="font-medium">{formData.email}</p>
              <p className="text-sm text-muted-foreground">
                Enter the code below to complete your registration
              </p>
            </div>

            <form onSubmit={handleOTPVerification} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otp">Verification Code</Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="Enter 6-digit code"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  maxLength={6}
                  className="text-center text-2xl tracking-widest"
                  required
                  disabled={loading}
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={loading || otp.length !== 6}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    Verify & Continue
                    <Sparkles className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </form>

            <div className="pt-4 space-y-2">
              <Button
                variant="outline"
                onClick={onBackToLanding}
                className="w-full"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                Didn't receive the code? Check your spam folder or try again.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Button
            variant="ghost"
            onClick={onBackToLanding}
            className="absolute top-4 left-4 p-2"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <CardTitle className="flex items-center justify-center space-x-2">
            <User className="w-5 h-5 text-accent" />
            <span>Join SafarSquad</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignUp} className="space-y-4">
            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="fullName" className="flex items-center">
                <User className="w-4 h-4 mr-2" />
                Full Name *
              </Label>
              <Input
                id="fullName"
                type="text"
                placeholder="Enter your full name"
                value={formData.fullName}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, fullName: e.target.value }))
                }
                required
                disabled={loading}
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center">
                <Mail className="w-4 h-4 mr-2" />
                Email Address *
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, email: e.target.value }))
                }
                required
                disabled={loading}
              />
            </div>

            {/* Home City */}
            <div className="space-y-2">
              <Label htmlFor="homeCity" className="flex items-center">
                <MapPin className="w-4 h-4 mr-2" />
                Home City *
              </Label>
              <Input
                id="homeCity"
                type="text"
                placeholder="Mumbai, Delhi, Bangalore, etc."
                value={formData.homeCity}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, homeCity: e.target.value }))
                }
                required
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                Help other travelers find you
              </p>
            </div>

            {/* Tagline */}
            <div className="space-y-2">
              <Label htmlFor="tagline" className="flex items-center">
                <Tag className="w-4 h-4 mr-2" />
                Tagline *
              </Label>
              <Input
                id="tagline"
                type="text"
                placeholder="Adventure seeker, Digital nomad, etc."
                value={formData.tagline}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, tagline: e.target.value }))
                }
                maxLength={50}
                required
                disabled={loading}
              />
              <div className="flex justify-between items-center">
                <p className="text-xs text-muted-foreground">
                  Short phrase that describes you
                </p>
                <p
                  className={`text-xs ${
                    formData.tagline.length > 45
                      ? "text-orange-500"
                      : "text-muted-foreground"
                  }`}
                >
                  {formData.tagline.length}/50
                </p>
              </div>
            </div>

            {/* Website (Optional) */}
            <div className="space-y-2">
              <Label htmlFor="website" className="flex items-center">
                <Link className="w-4 h-4 mr-2" />
                Website/Social (Optional)
              </Label>
              <Input
                id="website"
                type="url"
                placeholder="https://instagram.com/yourhandle"
                value={formData.website}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, website: e.target.value }))
                }
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                Instagram, personal website, or travel blog
              </p>
            </div>

            <div className="pt-2">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Create My Travel Profile
                  </>
                )}
              </Button>
            </div>

            <p className="text-xs text-center text-muted-foreground">
              By signing up, you agree to connect with fellow travelers and
              explore amazing destinations together.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default SignUpForm;
