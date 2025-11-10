// src/pages/AboutUs.tsx

export default function AboutUs() {
  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold text-orange-500 mb-4">
        About SafarSquad
      </h1>

      <div className="space-y-4 text-gray-700 leading-relaxed">
        <p>
          Hi, I'm <span className="font-semibold">Deepak Gautam</span>, a travel
          enthusiast who recently entered the corporate world. Like many of you,
          I cherished those spontaneous trips with friends—exploring new places,
          sharing stories around a campfire, and creating memories that last a
          lifetime.
        </p>

        <p>
          But as life moved forward, my friends and I scattered across different
          cities, chasing careers and dreams. The trips became rare. The group
          chats went silent. And I realized—
          <span className="font-semibold">I wasn't alone in feeling this.</span>
        </p>

        <p>That's when SafarSquad was born.</p>

        {/* Bunny's Philosophy Section */}
        <div className="bg-orange-50 border-l-4 border-orange-500 p-4 my-6 italic">
          <p className="text-gray-800 mb-2">
            You know what Bunny said in{" "}
            <span className="font-semibold">Yeh Jawaani Hai Deewani</span>?
          </p>
          <p className="text-orange-600 font-medium">
            "22 tak padhai, 25 pe naukri, 26 pe chokri, 30 pe bachche, 60 pe
            retirement… Aur phir maut ka intezaar…{" "}
            <span className="font-bold">
              Dhat! Aisi ghisi-piti life thodi jeena chahta hoon!
            </span>
            "
          </p>
          <p className="text-gray-800 mt-3">
            <span className="font-semibold text-orange-600">
              "Main udna chahta hoon, daudna chahta hoon, girna bhi chahta hoon…
              Bus rukna nahi chahta."
            </span>
          </p>
        </div>

        <p>
          That dialogue hit me hard. It's the story of every dreamer stuck in
          the 9-to-5 grind, watching life pass by while adventure waits. I
          refused to let that be my story. And I know you feel the same.
        </p>

        <h2 className="text-2xl font-semibold text-orange-500 mt-6">
          The Idea
        </h2>
        <p>
          SafarSquad is my answer to the wanderlust that corporate life tried to
          suppress. It's a platform where travelers—solo adventurers, weekend
          wanderers, budget explorers, or luxury seekers—can{" "}
          <span className="font-semibold">find their squad</span> and travel
          together, no matter where life has scattered them.
        </p>

        <p>
          Whether you're planning a trek to the Himalayas, a beach escape to
          Goa, or a cultural tour of Rajasthan, SafarSquad helps you:
        </p>

        <ul className="list-disc list-inside space-y-1 ml-4">
          <li>Connect with like-minded travelers</li>
          <li>Create or join trips based on your budget and interests</li>
          <li>Meet new people and build lifelong friendships</li>
          <li>Explore India and the world—together</li>
        </ul>

        <h2 className="text-2xl font-semibold text-orange-500 mt-6">
          Breaking the Barrier
        </h2>
        <p>
          Life tried to box us in. Society gave us a script: study, job,
          marriage, kids, retirement, death. But we're here to rewrite it.
          SafarSquad is about breaking free from that "ghisi-piti" routine and
          living the life Bunny talked about—one where we{" "}
          <span className="font-semibold">fly, run, fall, but never stop.</span>
        </p>

        <p>
          This isn't just about travel. It's about choosing adventure over
          routine. It's about saying "yes" to the mountains calling your name,
          the beaches waiting for your footprints, and the friendships waiting
          to be formed.
        </p>

        <h2 className="text-2xl font-semibold text-orange-500 mt-6">
          Built Solo, Made for All
        </h2>
        <p>
          I built SafarSquad entirely on my own—from design to
          development—because I believe that{" "}
          <span className="font-semibold">
            travel shouldn't be expensive, complicated, or lonely.
          </span>{" "}
          It's a passion project, made with love, late nights, and a lot of
          chai.
        </p>

        <p>
          This platform is{" "}
          <span className="font-semibold text-orange-500">100% free</span> for
          everyone. No hidden charges. No premium plans. Just pure, simple
          connections between travelers who share the same dream: to explore the
          world.
        </p>

        <h2 className="text-2xl font-semibold text-orange-500 mt-6">
          Join the Squad
        </h2>
        <p>
          SafarSquad is more than a website—it's a community. A movement. A
          tribe of travelers who refuse to let life's responsibilities kill
          their love for adventure.
        </p>

        <p>
          So if you're tired of the same old routine, if you miss the thrill of
          discovering new places, if you believe that life is meant to be lived,
          not just survived—
          <span className="font-semibold text-orange-600">
            {" "}
            this is your squad.
          </span>
        </p>

        <p className="font-semibold text-lg text-orange-600">
          Welcome to SafarSquad—where you safar with your squad. 🌍✈️
        </p>

        <div className="bg-gradient-to-r from-orange-100 to-pink-100 p-4 rounded-lg mt-6">
          <p className="text-sm text-gray-700 italic text-center">
            "Zindagi mein sabse mushkil kaam hai, khud ko badalna. Par agar aap
            badal sakte ho, toh koi bhi cheez mumkin hai."
          </p>
          <p className="text-xs text-gray-500 text-center mt-2">
            — Bunny, YJHD
          </p>
        </div>

        <p className="text-sm text-gray-500 mt-6">
          Have questions or feedback? Reach out at{" "}
          <a
            href="mailto:safarsquad.india@gmail.com"
            className="text-orange-500 underline"
          >
            safarsquad.india@gmail.com
          </a>
        </p>
      </div>
    </div>
  );
}
