// src/pages/Contact.tsx

export default function Contact() {
  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4 text-orange-500">Contact Us</h1>
      <p className="mb-2 text-gray-700">You can reach us at:</p>
      <ul className="list-disc list-inside space-y-2 text-gray-800">
        <li>
          Phone:{" "}
          <a href="tel:+919599171623" className="text-orange-500 underline">
            +91 9599171623
          </a>
        </li>
        <li>
          Email:{" "}
          <a
            href="mailto:deepakgautam2647@gmail.com"
            className="text-orange-500 underline"
          >
            deepakgautam2647@gmail.com
          </a>
        </li>
      </ul>
      <p className="mt-6 text-gray-600">
        We would love to hear from you! Feel free to contact us with any
        questions or feedback.
      </p>
    </div>
  );
}
