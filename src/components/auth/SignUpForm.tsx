import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Link as RouterLink } from "react-router-dom";
import {
  Loader2,
  Mail,
  User,
  ArrowLeft,
  Sparkles,
  MapPin,
  Tag,
  Link as LinkIcon,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  UserPlus,
} from "lucide-react";

interface SignUpFormProps {
  onBackToLanding: () => void;
}

const SignUpForm = ({ onBackToLanding }: SignUpFormProps) => {
  // Step 1: Choose mode (signin or signup)
  // Step 2: Show form
  // Step 3: OTP verification (only for signup)
  const [step, setStep] = useState<
    | "choose"
    | "signin"
    | "signup"
    | "forgot"
    | "verify"
    | "verify-reset"
    | "update-password"
  >("choose");

  const [loading, setLoading] = useState(false);
  const [otp, setOtp] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    homeCity: "",
    tagline: "",
    website: "",
  });
  useEffect(() => {
    setFormData({
      fullName: "",
      email: "",
      password: "",
      homeCity: "",
      tagline: "",
      website: "",
    });
    setOtp("");
    setAgreedToTerms(false);
    setShowPassword(false);
  }, []);
  const { toast } = useToast();

  const validateForm = () => {
    const errors: string[] = [];

    if (!formData.fullName.trim()) errors.push("Full name is required");
    if (!formData.homeCity.trim()) errors.push("Home city is required");
    if (!formData.tagline.trim()) errors.push("Tagline is required");
    if (formData.tagline.length > 50)
      errors.push("Tagline must be 50 characters or less");
    if (formData.website && !isValidUrl(formData.website))
      errors.push("Please enter a valid website URL");

    if (!formData.email.trim()) errors.push("Email is required");
    if (!formData.password.trim()) errors.push("Password is required");
    if (formData.password.length < 8)
      errors.push("Password must be at least 8 characters");

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

  // ============= SIGN IN =============
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      toast({
        title: "Missing information",
        description: "Please enter both email and password",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          toast({
            title: "Invalid credentials",
            description: "Please check your email and password",
            variant: "destructive",
          });
        } else {
          throw error;
        }
        return;
      }

      toast({
        title: "Welcome back! 👋",
        description: "Redirecting to your adventure...",
      });

      setTimeout(() => {
        window.location.href = "/";
      }, 1000);
    } catch (error: any) {
      toast({
        title: "Sign in failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // ============= SIGN UP =============
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!agreedToTerms) {
      toast({
        title: "Terms Required",
        description: "Please accept the Terms and Conditions to continue",
        variant: "destructive",
      });
      return;
    }

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
      // Check if user already exists
      const { data: existingUser } = await supabase
        .from("profiles")
        .select("email")
        .eq("email", formData.email)
        .maybeSingle();

      if (existingUser) {
        toast({
          title: "Account exists",
          description: "Please sign in instead",
          variant: "destructive",
        });
        setStep("signin");
        setLoading(false);
        return;
      }

      // Sign up with password
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: formData.fullName,
            home_city: formData.homeCity,
            tagline: formData.tagline,
            website: formData.website || null,
          },
        },
      });

      if (error) throw error;

      if (data.user) {
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

  // ============= OTP VERIFICATION =============
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
          terms_accepted_at: new Date().toISOString(),
          privacy_accepted_at: new Date().toISOString(),
        });

        if (profileError) {
          console.error("Error creating profile:", profileError);
          toast({
            title: "Profile creation failed",
            description: "Please contact support",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        toast({
          title: "Welcome to SafarSquad! 🎉",
          description: "Redirecting to your adventure...",
        });

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
      setLoading(false);
    }
  };

  // ============= OTP VERIFICATION SCREEN =============
  if (step === "verify") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Button
              variant="ghost"
              onClick={() => setStep("signup")}
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

  // ============= CHOOSE: SIGN IN OR SIGN UP =============
  if (step === "choose") {
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
              <Mail className="w-5 h-5 text-accent" />
              <span>Email Authentication</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-muted-foreground">
              Choose an option to continue
            </p>

            {/* Sign In Button */}
            <Button
              variant="outline"
              className={`w-full h-16 flex flex-col items-start justify-center
    border-2
    ${
      step === "signin"
        ? "border-orange-500 bg-orange-50/80 shadow-none"
        : "border-gray-55 bg-white"
    }
    hover:bg-orange-50/60
  `}
              onClick={() => setStep("signin")}
            >
              <div className={`flex items-center gap-2 w-full`}>
                <LogIn className="w-5 h-5 text-orange-600" />
                <div className="text-left flex-1">
                  <p
                    className={`font-semibold ${
                      step === "signin" ? "text-orange-800" : "text-gray-900"
                    }`}
                  >
                    Already have an account?
                  </p>
                  <p
                    className={`text-xs ${
                      step === "signin" ? "text-orange-700" : "text-gray-500"
                    }`}
                  >
                    Sign in with your email and password
                  </p>
                </div>
              </div>
            </Button>

            <Button
              variant="outline"
              className={`w-full h-16 flex flex-col items-start justify-center
    border-2
    ${
      step === "signup"
        ? "border-orange-500 bg-orange-50/80 shadow-none"
        : "border-gray-55 bg-white"
    }
    hover:bg-orange-50/60
  `}
              onClick={() => setStep("signup")}
            >
              <div className={`flex items-center gap-2 w-full`}>
                <UserPlus className="w-5 h-5 text-orange-600" />
                <div className="text-left flex-1">
                  <p
                    className={`font-semibold ${
                      step === "signup" ? "text-orange-800" : "text-gray-900"
                    }`}
                  >
                    New to SafarSquad?
                  </p>
                  <p
                    className={`text-xs ${
                      step === "signup" ? "text-orange-700" : "text-gray-500"
                    }`}
                  >
                    Create your travel profile
                  </p>
                </div>
              </div>
            </Button>

            <div className="pt-4 border-t">
              <Button
                variant="ghost"
                onClick={onBackToLanding}
                className="w-full"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ============= SIGN IN FORM =============
  if (step === "signin") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Button
              variant="ghost"
              onClick={() => setStep("choose")}
              className="absolute top-4 left-4 p-2"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <CardTitle className="flex items-center justify-center space-x-2">
              <LogIn className="w-5 h-5 text-accent" />
              <span>Welcome Back</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">
                  <Mail className="w-4 h-4 inline mr-2" />
                  Email Address
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

              <div className="space-y-2">
                <Label htmlFor="password">
                  <Lock className="w-4 h-4 inline mr-2" />
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        password: e.target.value,
                      }))
                    }
                    required
                    disabled={loading}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  className="text-accent text-sm font-medium hover:underline"
                  onClick={() => setStep("forgot")}
                >
                  Forgot password?
                </button>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4 mr-2" />
                    Sign In
                  </>
                )}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={() => setStep("signup")}
                  className="text-accent font-medium hover:underline"
                >
                  Sign up
                </button>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === "forgot") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Button
              variant="ghost"
              onClick={() => setStep("signin")}
              className="absolute top-4 left-4 p-2"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <CardTitle className="flex items-center justify-center space-x-2">
              <Mail className="w-5 h-5 text-accent" />
              <span>Forgot Password</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              <div>
                <Label htmlFor="forgot-email">
                  <Mail className="w-4 h-4 inline mr-2" />
                  Enter your email to reset password
                </Label>
                <Input
                  id="forgot-email"
                  type="email"
                  placeholder="your@email.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      email: e.target.value,
                    }))
                  }
                  required
                  disabled={loading}
                />
              </div>
              <Button
                disabled={loading}
                className="w-full"
                onClick={async () => {
                  if (!formData.email) {
                    toast({
                      title: "Email required",
                      description: "Please enter your email address",
                      variant: "destructive",
                    });
                    return;
                  }
                  setLoading(true);
                  try {
                    const { error } = await supabase.auth.resetPasswordForEmail(
                      formData.email,
                      { redirectTo: window.location.origin + "/reset" }
                    );
                    if (error) throw error;
                    toast({
                      title: "Reset Email Sent",
                      description:
                        "We've sent a password reset link to your email.",
                    });
                    setStep("signin");
                  } catch (err: any) {
                    toast({
                      title: "Error",
                      description: err.message,
                      variant: "destructive",
                    });
                  } finally {
                    setLoading(false);
                  }
                }}
              >
                {loading ? "Sending..." : "Send reset link"}
              </Button>
              <button
                type="button"
                className="text-accent text-sm font-medium hover:underline"
                onClick={() => setStep("signin")}
              >
                ← Back to Sign In
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ============= SIGN UP FORM =============
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Button
            variant="ghost"
            onClick={() => setStep("choose")}
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
                  setFormData((prev) => ({
                    ...prev,
                    fullName: e.target.value,
                  }))
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

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password" className="flex items-center">
                <Lock className="w-4 h-4 mr-2" />
                Password *
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="At least 8 characters"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      password: e.target.value,
                    }))
                  }
                  required
                  disabled={loading}
                  minLength={8}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <div className="flex justify-between items-center">
                <p className="text-xs text-muted-foreground">
                  Minimum 8 characters
                </p>
              </div>
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
                  setFormData((prev) => ({
                    ...prev,
                    homeCity: e.target.value,
                  }))
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
                  setFormData((prev) => ({
                    ...prev,
                    tagline: e.target.value,
                  }))
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
                <LinkIcon className="w-4 h-4 mr-2" />
                Website/Social (Optional)
              </Label>
              <Input
                id="website"
                type="url"
                placeholder="https://instagram.com/yourhandle"
                value={formData.website}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    website: e.target.value,
                  }))
                }
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                Instagram, personal website, or travel blog
              </p>
            </div>

            {/* Terms Checkbox */}
            <div className="flex items-start space-x-2 pt-2">
              <Checkbox
                id="terms"
                checked={agreedToTerms}
                onCheckedChange={(checked) =>
                  setAgreedToTerms(checked as boolean)
                }
                className="mt-1"
              />
              <label
                htmlFor="terms"
                className="text-sm text-muted-foreground leading-relaxed cursor-pointer"
              >
                I agree to the{" "}
                <RouterLink
                  to="/terms"
                  target="_blank"
                  className="text-accent underline hover:text-accent/80"
                >
                  Terms and Conditions
                </RouterLink>{" "}
                and{" "}
                <RouterLink
                  to="/privacy"
                  target="_blank"
                  className="text-accent underline hover:text-accent/80"
                >
                  Privacy Policy
                </RouterLink>
                . I understand that SafarSquad is not responsible for any
                incidents, accidents, or issues during trips, and I travel at my
                own risk.
              </label>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <Button
                type="submit"
                className="w-full"
                disabled={loading || !agreedToTerms}
              >
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

            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => setStep("signin")}
                className="text-accent font-medium hover:underline"
              >
                Sign in
              </button>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default SignUpForm;
