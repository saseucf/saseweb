"use client";

import { useEffect, useRef, type ReactNode } from "react";

export default function HomeMotion({ children, className }: { children: ReactNode; className: string }) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = root.current;
    if (!container || typeof IntersectionObserver === "undefined" || !HTMLElement.prototype.animate) return;

    const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (motionPreference.matches) return;

    const animations = new Map<HTMLElement, Animation>();
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const element = entry.target as HTMLElement;
        observer.unobserve(element);
        if (motionPreference.matches || element.contains(document.activeElement)) continue;

        // Content is visible by default; only its first entrance gets animated.
        const animation = element.animate(
          [{ opacity: 0, transform: "translateY(16px)" }, { opacity: 1, transform: "translateY(0)" }],
          {
            duration: 520,
            delay: Number(element.dataset.homeReveal) || 0,
            easing: "cubic-bezier(0.22, 1, 0.36, 1)",
            fill: "backwards",
          },
        );
        animations.set(element, animation);
        animation.onfinish = animation.oncancel = () => animations.delete(element);
      }
    }, { rootMargin: "0px 0px -32px 0px", threshold: 0 });

    for (const element of container.querySelectorAll<HTMLElement>("[data-home-reveal]")) {
      // Avoid replaying content already visible after refresh or restored scroll.
      if (element.getBoundingClientRect().top >= window.innerHeight - 32) observer.observe(element);
    }

    const stopMotion = () => {
      if (!motionPreference.matches) return;
      observer.disconnect();
      animations.forEach((animation) => animation.cancel());
      animations.clear();
    };
    const revealFocusedContent = (event: FocusEvent) => {
      if (!(event.target instanceof Node)) return;
      for (const [element, animation] of animations) {
        if (element.contains(event.target)) animation.cancel();
      }
    };

    motionPreference.addEventListener("change", stopMotion);
    container.addEventListener("focusin", revealFocusedContent);
    return () => {
      observer.disconnect();
      animations.forEach((animation) => animation.cancel());
      motionPreference.removeEventListener("change", stopMotion);
      container.removeEventListener("focusin", revealFocusedContent);
    };
  }, []);

  return <div ref={root} className={className}>{children}</div>;
}
