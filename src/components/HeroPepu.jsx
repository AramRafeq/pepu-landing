import { useEffect, useRef, useState } from "react";
import FluidBlob from "./FluidBlob";
import H from "../../styles/home.module.css";

// matches pepuLeap in home.module.css: when Pepu leaves the pool and lands back in it
const LEAP_MS = 1150;
const TAKEOFF_MS = 230;
const LANDING_MS = 820;

// Pepu's own poses: studying with headphones to start, cheering in the air,
// and landing as any of the rest (staying that one until the next tap)
const REST = "focus";
const AIR = "celebrate";
const LANDINGS = [
  "detective", "encourage", "focus", "hello", "help", "laughing", "lets_start",
  "listening", "rest", "thanks", "understood", "waiting",
];
const src = (pose) => `/assets/pepu/${pose}.webp`;

/** Pepu studying in a pool of cream. Tap them: they leap out, flip, and splash back in as someone else. */
const HeroPepu = () => {
  const pool = useRef(null);
  const timers = useRef([]);
  const [leaping, setLeaping] = useState(false);
  const [pose, setPose] = useState(REST);

  useEffect(() => {
    // fetch the other poses now so the first leap doesn't flash an empty frame
    [AIR, ...LANDINGS].forEach((p) => {
      new Image().src = src(p);
    });
    return () => timers.current.forEach(clearTimeout);
  }, []);

  const leap = () => {
    if (leaping || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    timers.current.forEach(clearTimeout);
    // a random pose, never the one Pepu is in now
    const others = LANDINGS.filter((p) => p !== pose);
    const landing = others[Math.floor(Math.random() * others.length)];
    setLeaping(true);
    timers.current = [
      setTimeout(() => {
        pool.current?.leap();
        setPose(AIR);
      }, TAKEOFF_MS),
      setTimeout(() => {
        pool.current?.land();
        setPose(landing);
      }, LANDING_MS),
      setTimeout(() => setLeaping(false), LEAP_MS),
    ];
  };

  return (
    <>
      <FluidBlob ref={pool} className={H.blob} />
      <img
        data-pepu
        className={`${H.heroPepu} ${leaping ? H.leaping : ""}`}
        src={src(pose)}
        alt="Pepu"
        onClick={leap}
      />
    </>
  );
};

export default HeroPepu;
