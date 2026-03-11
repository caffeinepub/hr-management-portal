import React, { useState } from 'react';
import { useInternetIdentity } from '../../hooks/useInternetIdentity';
import { Button } from '../ui/button';
import { LogIn, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '../ui/alert';

export default function LoginPage() {
  const { login, loginStatus } = useInternetIdentity();
  const [error, setError] = useState<string | null>(null);

  const isLoggingIn = loginStatus === 'logging-in';

  const handleLogin = async () => {
    setError(null);
    try {
      await login();
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Failed to login. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
      <div className="w-full max-w-5xl">
        {/* Hero Image */}
        <div className="mb-8 flex justify-center">
          <img 
            src="/assets/generated/hr-hero.dim_1200x600.png" 
            alt="HR Management Portal" 
            className="w-full max-w-3xl rounded-2xl shadow-2xl"
          />
        </div>

        {/* Login Card */}
        <div className="bg-card border border-border rounded-2xl shadow-xl p-8 md:p-12 max-w-2xl mx-auto">
          <div className="text-center space-y-6">
            {/* Branding */}
            <div className="space-y-3">
              <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground">
                HR Management Portal
              </h1>
              <p className="text-muted-foreground text-lg md:text-xl">
                Streamline your workforce management with our comprehensive HR solution
              </p>
            </div>

            {/* Features List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-6 text-left">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                <div>
                  <p className="font-medium text-foreground">Employee Management</p>
                  <p className="text-sm text-muted-foreground">Complete employee directory and profiles</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                <div>
                  <p className="font-medium text-foreground">Leave Tracking</p>
                  <p className="text-sm text-muted-foreground">Manage leave requests and balances</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                <div>
                  <p className="font-medium text-foreground">Attendance System</p>
                  <p className="text-sm text-muted-foreground">Track employee attendance and hours</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                <div>
                  <p className="font-medium text-foreground">Payroll Management</p>
                  <p className="text-sm text-muted-foreground">Secure payslip generation and access</p>
                </div>
              </div>
            </div>

            {/* Error Alert */}
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Login Button */}
            <div className="pt-4">
              <Button
                onClick={handleLogin}
                disabled={isLoggingIn}
                size="lg"
                className="w-full md:w-auto px-12 py-6 text-lg font-semibold"
              >
                {isLoggingIn ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <LogIn className="mr-2 h-5 w-5" />
                    Login with Internet Identity
                  </>
                )}
              </Button>
            </div>

            {/* Info Text */}
            <div className="pt-4 space-y-2">
              <p className="text-sm text-muted-foreground">
                Secure authentication powered by Internet Identity
              </p>
              <p className="text-xs text-muted-foreground">
                No passwords required • Biometric or device-based authentication
              </p>
            </div>
          </div>
        </div>

        {/* Footer Attribution */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>
            © {new Date().getFullYear()} HR Management Portal • Built with love using{' '}
            <a
              href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline font-medium"
            >
              caffeine.ai
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
