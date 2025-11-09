// src/pages/Safety.tsx
export default function Safety() {
  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4 text-orange-500">
        SafarSquad Safety & Community Guidelines
      </h1>
      <p className="mb-4 text-gray-700">
        Your safety is our highest priority. Please read these rules and
        measures to ensure a safe, fun, and respectful travel experience with
        SafarSquad.
      </p>

      <div className="space-y-4">
        <div>
          <h2 className="font-semibold mb-1 text-lg">
            🔐 Account & Member Verification
          </h2>
          <ul className="list-disc list-inside space-y-1 text-sm text-gray-800">
            <li>
              All users must sign up using secure OTP verification or Google
              Sign-In. No anonymous accounts allowed.
            </li>
            <li>
              Each profile is unique and can only be created with a valid email
              or Google account.
            </li>
          </ul>
        </div>

        <div>
          <h2 className="font-semibold mb-1 text-lg">
            🧑‍💼 Trip Creator Permissions
          </h2>
          <ul className="list-disc list-inside space-y-1 text-sm text-gray-800">
            <li>
              <span className="font-semibold">Trip creators</span> control who
              can join their group. The creator must approve new join requests
              before members are added to the trip group.
            </li>
            <li>
              Trip creators can remove or block any participant if they violate
              rules or comfortable group guidelines.
            </li>
            <li>
              All trip modifications (dates, details, participant list) can only
              be made by the trip creator.
            </li>
          </ul>
        </div>

        <div>
          <h2 className="font-semibold mb-1 text-lg">
            ✔️ Safety Measures Taken
          </h2>
          <ul className="list-disc list-inside space-y-1 text-sm text-gray-800">
            <li>
              <span className="font-semibold">Google Sign-In</span> and OTP
              authentication for every user.
            </li>
            <li>
              All groups and chats are monitored for spam, phishing, or
              harassment. Violators will be banned.
            </li>
            <li>
              Reporting tools: Flag or report any user or trip that you find
              suspicious or unsafe.
            </li>
            <li>
              Profile details are only visible to verified SafarSquad members.
            </li>
          </ul>
        </div>

        <div>
          <h2 className="font-semibold mb-1 text-lg">
            🚨 Emergency Guidelines
          </h2>
          <ul className="list-disc list-inside space-y-1 text-sm text-gray-800">
            <li>
              If you feel unsafe at any time, leave the group and report the
              issue to SafarSquad support:{" "}
              <span className="font-semibold text-orange-500">
                hello@SafarSquad.com
              </span>
            </li>
            <li>
              For immediate help,{" "}
              <span className="font-semibold text-orange-500">call 100</span>{" "}
              (Police, India).
            </li>
            <li>
              Never share sensitive personal information in the group chat.
            </li>
            <li>
              Meet in public places during first in-person meetings with group
              members.
            </li>
          </ul>
        </div>
      </div>

      <div className="mt-8 p-4 bg-orange-100 rounded-xl text-gray-800">
        <span className="font-semibold">Remember:</span> SafarSquad does not
        tolerate abuse, harassment, discrimination, or fraudulent behavior.
        Violators will be permanently removed.
      </div>
    </div>
  );
}
