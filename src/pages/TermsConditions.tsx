const TermsConditions = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-6 md:p-12">
        <h1 className="text-4xl font-bold mb-8">Terms and Conditions</h1>

        <div className="space-y-6 text-muted-foreground">
          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-3">
              1. Acceptance of Terms
            </h2>
            <p>
              By accessing and using SafarSquad ("the Platform"), you accept and
              agree to be bound by the terms and provision of this agreement. If
              you do not agree to abide by the above, please do not use this
              service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-3">
              2. Use License
            </h2>
            <p>
              Permission is granted to temporarily use SafarSquad for personal,
              non-commercial transitory viewing only. This is the grant of a
              license, not a transfer of title.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-3">
              3. User Responsibilities
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                You are responsible for maintaining the confidentiality of your
                account
              </li>
              <li>
                You agree to accept responsibility for all activities under your
                account
              </li>
              <li>You must be at least 18 years old to use this service</li>
              <li>You agree to provide accurate and complete information</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-3">
              4. Travel at Your Own Risk
            </h2>
            <p className="font-semibold text-destructive">
              IMPORTANT: SafarSquad is a platform that connects travelers. We
              are NOT responsible for:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>Any injuries, accidents, or incidents during trips</li>
              <li>Actions or behavior of other users</li>
              <li>Lost, stolen, or damaged property</li>
              <li>Trip cancellations or changes</li>
              <li>Verification of user identities beyond platform features</li>
              <li>Medical emergencies or health issues</li>
            </ul>
            <p className="mt-3 font-semibold">
              By joining any trip, you acknowledge and accept all risks
              associated with travel.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-3">
              5. Disclaimer of Warranties
            </h2>
            <p>
              The materials on SafarSquad are provided on an 'as is' basis.
              SafarSquad makes no warranties, expressed or implied, and hereby
              disclaims and negates all other warranties including, without
              limitation, implied warranties or conditions of merchantability,
              fitness for a particular purpose, or non-infringement of
              intellectual property.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-3">
              6. Limitation of Liability
            </h2>
            <p>
              In no event shall SafarSquad or its suppliers be liable for any
              damages (including, without limitation, damages for loss of data
              or profit, or due to business interruption) arising out of the use
              or inability to use SafarSquad, even if SafarSquad or a SafarSquad
              authorized representative has been notified orally or in writing
              of the possibility of such damage.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-3">
              7. Prohibited Activities
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Harassment or abuse of other users</li>
              <li>Posting false or misleading information</li>
              <li>Commercial solicitation without permission</li>
              <li>Illegal activities or content</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-3">
              8. Modifications
            </h2>
            <p>
              SafarSquad may revise these terms of service at any time without
              notice. By using this platform, you agree to be bound by the
              current version of these terms of service.
            </p>
          </section>

          <p className="text-sm mt-8 pt-8 border-t">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  );
};

export default TermsConditions;
