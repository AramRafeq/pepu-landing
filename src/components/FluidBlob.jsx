import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";

// The edge is N points on springs round a circle, in a 200×200 box. Each
// point is pulled back to its rest radius and towards its neighbours, so a
// push in one place travels round the edge like a wave in a drop of water.
const N = 24;
const R = 76;
const C = 100;
const REACH = 46; // how close the pointer has to get to the edge to move it
const DROPS = 28; // most splash droplets in the air at once
const GRAVITY = 0.32;

// a slow breathing wobble, so it never sits perfectly still
const idle = (i, t) => 4 * Math.sin(t * 0.8 + i * 0.52) + 2.5 * Math.sin(t * 1.5 - i * 0.98);
const angleOf = (i) => (i / N) * Math.PI * 2;

const pointsOf = (off, t) =>
  Array.from({ length: N }, (_, i) => {
    const r = R + idle(i, t) + off[i];
    return [C + Math.cos(angleOf(i)) * r, C + Math.sin(angleOf(i)) * r];
  });

// a smooth closed curve through the points (Catmull-Rom as cubic Béziers)
const pathOf = (pts) => {
  const f = (n) => n.toFixed(2);
  let d = `M${f(pts[0][0])},${f(pts[0][1])}`;
  for (let i = 0; i < N; i++) {
    const [p0, p1, p2, p3] = [pts[(i - 1 + N) % N], pts[i], pts[(i + 1) % N], pts[(i + 2) % N]];
    d += `C${f(p1[0] + (p2[0] - p0[0]) / 6)},${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)},${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])},${f(p2[1])}`;
  }
  return `${d}Z`;
};

const REST = pathOf(pointsOf(new Float32Array(N), 0));

/**
 * The hero's cream blob, wobbling like liquid where the mouse or a finger
 * touches it. A tap away from Pepu splashes it there; the parent can make
 * the whole pool `leap` (Pepu jumping out) and `land` (Pepu falling back).
 */
const FluidBlob = forwardRef(({ className }, ref) => {
  const svg = useRef(null);
  const path = useRef(null);
  const dropEls = useRef([]);
  const api = useRef({ leap() {}, land() {} });
  useImperativeHandle(ref, () => ({ leap: () => api.current.leap(), land: () => api.current.land() }), []);

  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return undefined;

    const off = new Float32Array(N);
    const vel = new Float32Array(N);
    const drops = Array.from({ length: DROPS }, () => ({ live: false, x: 0, y: 0, vx: 0, vy: 0, r: 0 }));
    const p = { x: 0, y: 0, vx: 0, vy: 0, on: false };
    let raf = 0;
    let visible = true;
    let t = 0;
    const t0 = performance.now();

    const edgeAt = (i) => R + idle(i, t) + off[i];
    const nearest = (a) => ((Math.round((a / (Math.PI * 2)) * N) % N) + N) % N;

    // throw a droplet off the edge at point i, outwards and a little up
    const fling = (i, speed) => {
      const d = drops.find((x) => !x.live);
      if (!d) return;
      const a = angleOf(i) + (Math.random() - 0.5) * 0.25;
      const r = edgeAt(i);
      const s = speed * (0.6 + Math.random() * 0.6);
      Object.assign(d, {
        live: true,
        x: C + Math.cos(a) * r,
        y: C + Math.sin(a) * r,
        vx: Math.cos(a) * s * 0.8,
        vy: Math.sin(a) * s * 0.8 - s * 0.7,
        r: 2.2 + Math.random() * 3.6,
      });
    };

    api.current = {
      // Pepu kicks off: the pool sinks, then droplets jump from its upper half
      leap() {
        for (let i = 0; i < N; i++) vel[i] -= 5;
        for (let i = 0; i < N; i++) {
          const up = -Math.sin(angleOf(i)); // 1 at the top, -1 at the bottom
          if (up > -0.2 && Math.random() < 0.75) fling(i, 5 + 3 * Math.max(0, up));
        }
      },
      // Pepu lands: squashed flat, sides bulging, a ring of smaller drops
      land() {
        for (let i = 0; i < N; i++) vel[i] += 6 * Math.cos(2 * angleOf(i)) - 1.5;
        for (let i = 0; i < N; i++) if (Math.random() < 0.45) fling(i, 3.5);
      },
    };

    const local = (e) => {
      const box = svg.current.getBoundingClientRect();
      return [((e.clientX - box.left) / box.width) * 200, ((e.clientY - box.top) / box.height) * 200];
    };

    const move = (e) => {
      const [x, y] = local(e);
      if (p.on) {
        p.vx = x - p.x;
        p.vy = y - p.y;
      }
      p.x = x;
      p.y = y;
      p.on = true;
    };
    const leave = (e) => {
      if (e.pointerType !== "mouse" || e.type === "pointerleave") p.on = false;
    };
    // a tap on the pool (not on Pepu, who jumps instead): a splash right there
    const down = (e) => {
      move(e);
      if (e.target.closest?.("[data-pepu]")) return;
      const [x, y] = local(e);
      const dist = Math.hypot(x - C, y - C);
      if (dist > R + REACH) return;
      const at = nearest(Math.atan2(y - C, x - C));
      for (let i = 0; i < N; i++) {
        const a = angleOf(i);
        const d = Math.hypot(C + Math.cos(a) * R - x, C + Math.sin(a) * R - y);
        vel[i] -= 7 * Math.max(0, 1 - d / 120);
      }
      for (let k = -2; k <= 2; k++) fling((at + k + N) % N, 4.5 - Math.abs(k));
    };

    const step = () => {
      t = (performance.now() - t0) / 1000;
      const pts = pointsOf(off, t);
      for (let i = 0; i < N; i++) {
        const a = angleOf(i);
        let force = -0.05 * off[i] + 0.2 * (off[(i - 1 + N) % N] + off[(i + 1) % N] - 2 * off[i]);
        if (p.on) {
          const d = Math.hypot(pts[i][0] - p.x, pts[i][1] - p.y);
          const w = Math.max(0, 1 - d / REACH) ** 2;
          if (w > 0) {
            const inside = Math.hypot(p.x - C, p.y - C) < edgeAt(i);
            // drag the surface along with the pointer, and give way where it presses in
            force += w * 0.45 * (p.vx * Math.cos(a) + p.vy * Math.sin(a));
            if (inside) force -= w * 1.1;
          }
        }
        vel[i] = (vel[i] + force) * 0.9;
      }
      for (let i = 0; i < N; i++) off[i] = Math.max(-34, Math.min(30, off[i] + vel[i]));
      p.vx *= 0.7;
      p.vy *= 0.7;

      // droplets: fly, fall, and melt back into the pool where they hit it
      drops.forEach((d, k) => {
        const el = dropEls.current[k];
        if (!d.live) return;
        d.vy += GRAVITY;
        d.x += d.vx;
        d.y += d.vy;
        const a = Math.atan2(d.y - C, d.x - C);
        const i = nearest(a);
        if (d.vy > 0 && Math.hypot(d.x - C, d.y - C) < edgeAt(i)) {
          d.live = false;
          vel[i] -= d.r * 0.5;
        } else if (d.y > 260) {
          d.live = false;
        }
        if (!d.live) {
          el.setAttribute("rx", "0");
          el.setAttribute("ry", "0");
          return;
        }
        // stretched along the way it is moving, like a falling drop
        const speed = Math.hypot(d.vx, d.vy);
        el.setAttribute("rx", (d.r * (1 + speed * 0.07)).toFixed(2));
        el.setAttribute("ry", d.r.toFixed(2));
        el.setAttribute(
          "transform",
          `translate(${d.x.toFixed(2)} ${d.y.toFixed(2)}) rotate(${((Math.atan2(d.vy, d.vx) * 180) / Math.PI).toFixed(1)})`
        );
      });

      path.current.setAttribute("d", pathOf(pointsOf(off, t)));
      raf = visible ? requestAnimationFrame(step) : 0;
    };

    // no work while the hero is scrolled away
    const seen = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible && !raf) raf = requestAnimationFrame(step);
    });
    seen.observe(svg.current);

    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerdown", down, { passive: true });
    window.addEventListener("pointerup", leave, { passive: true });
    window.addEventListener("pointercancel", leave, { passive: true });
    document.documentElement.addEventListener("pointerleave", leave);
    return () => {
      cancelAnimationFrame(raf);
      seen.disconnect();
      api.current = { leap() {}, land() {} };
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerdown", down);
      window.removeEventListener("pointerup", leave);
      window.removeEventListener("pointercancel", leave);
      document.documentElement.removeEventListener("pointerleave", leave);
    };
  }, []);

  return (
    <svg ref={svg} className={className} viewBox="0 0 200 200" aria-hidden="true">
      <defs>
        <linearGradient id="pepuBlobFill" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffe7c2" />
          <stop offset="1" stopColor="#ffd29a" />
        </linearGradient>
      </defs>
      <path ref={path} d={REST} fill="url(#pepuBlobFill)" />
      {Array.from({ length: DROPS }, (_, k) => (
        <ellipse key={k} ref={(el) => (dropEls.current[k] = el)} rx="0" ry="0" fill="url(#pepuBlobFill)" />
      ))}
    </svg>
  );
});

FluidBlob.displayName = "FluidBlob";

export default FluidBlob;
