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
            href="mailto:safarsquad.india@gmail.com"
            className="text-orange-500 underline"
          >
            safarsquad.india@gmail.com
          </a>
        </li>
        <li>
          Instagram:{" "}
          <a
            href="https://www.instagram.com/safar.squad?utm_source=qr&igsh=M3UzcDZncHd3YWtv"
            target="_blank"
            rel="noopener noreferrer"
            className="text-orange-500 underline"
          >
            @safarsquad.in
          </a>
        </li>
        <li>
          Facebook:{" "}
          <a
            href="https://www.facebook.com/share/1EJbGFkhxj/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-orange-500 underline"
          >
            SafarSquad
          </a>
        </li>
        <li>
          Twitter:{" "}
          <a
            href="https://x.com/safar_squad?t=uOFezk2oJ0nGDqA30eO-5w&s=08"
            target="_blank"
            rel="noopener noreferrer"
            className="text-orange-500 underline"
          >
            SafarSquad
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
