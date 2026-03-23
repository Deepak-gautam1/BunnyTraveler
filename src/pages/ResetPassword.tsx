import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Lock, Eye, EyeOff, CheckCircle2, XCircle } from "lucide-react";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const { toast } = useToast();

  // Real-time validation states
  const isLengthValid = password.length >= 8;
  const isMatch = password && confirm && password === confirm;

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isLengthValid) {
      toast({
        title: "Weak Password",
        description: "Password must be at least 8 characters.",
        variant: "destructive",
      });
      return;
    }
    if (!isMatch) {
      toast({
        title: "Mismatch",
        description: "Passwords do not match.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      toast({
        title: "Success! 🔒",
        description: "Your password has been updated. Redirecting...",
      });

      // Redirect after short delay
      setTimeout(() => (window.location.href = "/auth"), 2000);
    } catch (err: unknown) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : 'An error occurred',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    // 1. Centered Layout with Background
    <div className="min-h-[80vh] flex items-center justify-center px-4 bg-gray-50/50">
      {/* 2. Constrained Width Card */}
      <Card className="w-full max-w-md shadow-lg border-0 sm:border">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-2">
            <Lock className="w-6 h-6 text-orange-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Reset Password
          </CardTitle>
          <CardDescription>
            Enter your new password below to secure your account.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleReset} className="space-y-6">
            {/* New Password Field */}
            <div className="space-y-2">
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="New password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>

              {/* Length Indicator */}
              <div
                className={`text-xs flex items-center gap-1 ${
                  password
                    ? isLengthValid
                      ? "text-green-600"
                      : "text-red-500"
                    : "text-gray-500"
                }`}
              >
                {isLengthValid ? (
                  <CheckCircle2 className="w-3 h-3" />
                ) : (
                  <div className="w-3 h-3 rounded-full border border-current" />
                )}
                At least 8 characters
              </div>
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-2">
              <div className="relative">
                <Input
                  type={showConfirm ? "text" : "password"}
                  placeholder="Confirm new password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showConfirm ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>

              {/* Match Indicator */}
              {confirm && (
                <div
                  className={`text-xs flex items-center gap-1 ${
                    isMatch ? "text-green-600" : "text-red-500"
                  }`}
                >
                  {isMatch ? (
                    <CheckCircle2 className="w-3 h-3" />
                  ) : (
                    <XCircle className="w-3 h-3" />
                  )}
                  {isMatch ? "Passwords match" : "Passwords do not match"}
                </div>
              )}
            </div>

            <Button
              type="submit"
              disabled={loading || !isLengthValid || !isMatch}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white"
            >
              {loading ? "Updating..." : "Reset Password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;
