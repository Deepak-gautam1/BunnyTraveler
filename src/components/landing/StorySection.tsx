// src/components/landing/StorySection.tsx
import { MotionValue } from "framer-motion";
import { motion, useScroll, useTransform } from "framer-motion";
import storyCamp from "@/assets/storyCamp.png";
import storyHero from "@/assets/storyHero.png";
import storyTrek from "@/assets/storyTrek.png";

interface Slide {
  id: string;
  title: string;
  text: string;
  img: string;
}

const slides: Slide[] = [
  {
    id: "discover",
    title: "Discover Amazing Places",
    text: "From hidden mountain trails to pristine beaches, find your next adventure.",
    img: storyCamp,
  },
  {
    id: "connect",
    title: "Connect with Fellow Travelers",
    text: "Join like-minded adventurers and create unforgettable memories together.",
    img: storyHero,
  },
  {
    id: "explore",
    title: "Explore Together Safely",
    text: "Experience India's beauty with verified travel companions and local guides.",
    img: storyTrek,
  },
];

// Extracted component so hooks are called at the top level of a component
const SlideCaption = ({
  s,
  i,
  scrollYProgress,
}: {
  s: Slide;
  i: number;
  scrollYProgress: MotionValue<number>;
}) => {
  const start = i / slides.length;
  const end = (i + 1) / slides.length;
  const opacity = useTransform(scrollYProgress, [start, end], [1, 0]);
  const y = useTransform(scrollYProgress, [start, end], ["0%", "-30%"]);

  return (
    <motion.div
      className="sticky top-0 h-screen w-full flex justify-center items-center px-4"
      style={{ opacity, y }}
    >
      <div className="bg-black/60 rounded-xl p-6 md:p-10 max-w-xl">
        <motion.h2
          className="text-3xl md:text-5xl font-bold text-white mb-4"
          initial={{ y: 50, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          {s.title}
        </motion.h2>
        <motion.p
          className="text-lg md:text-xl text-white/90"
          initial={{ y: 30, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          {s.text}
        </motion.p>
      </div>
    </motion.div>
  );
};

export default function StorySection() {
  const { scrollYProgress } = useScroll({
    offset: ["start start", "end start"],
  });

  const trackX = useTransform(
    scrollYProgress,
    [0, 1],
    ["0%", `-${(slides.length - 1) * 100}%`]
  );
  const barScale = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  return (
    <section
      className={`relative h-[${slides.length * 100}vh] overflow-hidden`}
    >
      {/* Image track */}
      <motion.div
        className="sticky top-0 h-screen w-[300vw] flex"
        style={{ x: trackX }}
      >
        {slides.map((s) => (
          <div
            key={s.id}
            className="w-screen h-screen bg-center bg-cover shrink-0 relative"
            style={{ backgroundImage: `url(${s.img})` }}
          >
            <div className="absolute inset-0 bg-black/40" />
          </div>
        ))}
      </motion.div>

      {/* Captions */}
      <div className="pointer-events-none absolute inset-0 flex">
        {slides.map((s, i) => (
          <SlideCaption
            key={s.id}
            s={s}
            i={i}
            scrollYProgress={scrollYProgress}
          />
        ))}
      </div>

      {/* Progress bar */}
      <motion.div
        className="fixed left-0 bottom-0 h-1 bg-gradient-to-r from-orange-500 to-pink-500 z-50 origin-left"
        style={{ scaleX: barScale }}
      />
    </section>
  );
}
