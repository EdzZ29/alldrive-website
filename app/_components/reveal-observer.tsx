"use client";

import { useEffect } from "react";

const offsets: Record<string, string> = {
  left: "translateX(-32px)",
  right: "translateX(32px)",
  zoom: "scale(0.94)",
};

/**
 * Plays a fade/slide-in on every `[data-reveal]` element as it scrolls into view.
 *
 * Uses the Web Animations API instead of toggling classes: parts of the page can
 * hydrate after this effect runs, and changing their `className` before React
 * hydrates them causes a hydration mismatch. Animations never touch attributes.
 */
export function RevealObserver() {
  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const seen = new WeakSet<Element>();

    const reveal = (el: HTMLElement) => {
      const delay = parseFloat(getComputedStyle(el).getPropertyValue("--d")) || 0;
      el.animate(
        [
          { opacity: 0, transform: offsets[el.dataset.reveal ?? ""] ?? "translateY(28px)" },
          { opacity: 1, transform: "none" },
        ],
        {
          duration: reduceMotion ? 0 : 800,
          delay: reduceMotion ? 0 : delay,
          easing: "cubic-bezier(0.16, 1, 0.3, 1)",
          fill: "forwards",
        },
      );
    };

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            reveal(entry.target as HTMLElement);
            io.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" },
    );

    const observeAll = () =>
      document.querySelectorAll("[data-reveal]").forEach((el) => {
        if (seen.has(el)) return;
        seen.add(el);
        io.observe(el);
      });

    observeAll();

    // Pick up elements rendered later (e.g. after filtering the fleet).
    const mo = new MutationObserver(observeAll);
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, []);

  return null;
}
