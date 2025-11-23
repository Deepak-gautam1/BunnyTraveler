const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-6 md:p-12">
        <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>

        <div className="space-y-6 text-muted-foreground">
          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-3">
              Information We Collect
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Account information (name, email, profile details)</li>
              <li>Trip information and preferences</li>
              <li>Messages and communications</li>
              <li>Usage data and cookies</li>
              <li>Location data (with permission)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-3">
              How We Use Your Information
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>To provide and improve our services</li>
              <li>To connect you with other travelers</li>
              <li>To send notifications about trips and messages</li>
              <li>To ensure platform safety and security</li>
              <li>To analyze usage patterns</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-3">
              Cookies
            </h2>
            <p>
              We use cookies to remember your preferences, improve user
              experience, and analyze site traffic. You can control cookie
              settings in your browser.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-3">
              Data Security
            </h2>
            <p>
              We implement security measures to protect your personal
              information. However, no method of transmission over the Internet
              is 100% secure.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-3">
              Your Rights
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Access your personal data</li>
              <li>Request data correction or deletion</li>
              <li>Opt-out of marketing communications</li>
              <li>Export your data</li>
            </ul>
          </section>

          <p className="text-sm mt-8 pt-8 border-t">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
