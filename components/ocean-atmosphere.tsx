"use client";
import { useEffect, useRef } from "react";

export default function OceanAtmosphere() {
  const root = useRef<HTMLDivElement>(null);
  const cursor = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const page = element.parentElement;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    let frame = 0;
    let x = 0, y = 0;
    const render = () => {
      frame = 0;
      if (preference.matches) {
        page?.style.removeProperty("--ocean-scroll");
        page?.style.removeProperty("--cloud-clear-x");
        page?.style.removeProperty("--cloud-visibility");
        return;
      }
      const progress = Math.min(Math.max(window.scrollY / Math.max(window.innerHeight * .85, 1), 0), 1);
      const clearing = progress * progress * (3 - 2 * progress);
      page?.style.setProperty("--ocean-scroll", `${Math.min(window.scrollY * .13, 180)}px`);
      page?.style.setProperty("--cloud-clear-x", `${clearing * window.innerWidth * .55}px`);
      page?.style.setProperty("--cloud-visibility", `${1 - clearing}`);
      if (cursor.current) cursor.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(render); };
    const move = (event: PointerEvent) => {
      if (!fine.matches || preference.matches || event.pointerType === "touch") return;
      x = event.clientX; y = event.clientY;
      const target = event.target instanceof Element ? event.target : null;
      const inside = target?.closest(".ocean-page");
      if (cursor.current) {
        cursor.current.dataset.visible = inside ? "true" : "false";
        cursor.current.dataset.active = target?.closest("a, button, h1, h2, img, .sase-hero-brand") ? "true" : "false";
      }
      schedule();
    };
    const hide = () => { if (cursor.current) cursor.current.dataset.visible = "false"; };
    const changed = () => { hide(); schedule(); };
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    window.addEventListener("pointermove", move, { passive: true });
    document.documentElement.addEventListener("pointerleave", hide);
    window.addEventListener("blur", hide);
    preference.addEventListener("change", changed);
    schedule();
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("pointermove", move);
      document.documentElement.removeEventListener("pointerleave", hide);
      window.removeEventListener("blur", hide);
      preference.removeEventListener("change", changed);
      page?.style.removeProperty("--ocean-scroll");
      page?.style.removeProperty("--cloud-clear-x");
      page?.style.removeProperty("--cloud-visibility");
    };
  }, []);
  return <>
    <div ref={root} className="ocean-atmosphere" aria-hidden="true">
      <div className="ocean-sky"><span className="ocean-cloud ocean-cloud-one" /><span className="ocean-cloud ocean-cloud-two" /></div>
      <div className="ocean-school">{[0, 1, 2].map(index => <svg key={index} className={`ocean-fish ocean-fish-${index}`} viewBox="0 0 100 48"><path d="M24 24 4 8v32l20-16C40 1 70 3 94 24 70 45 40 47 24 24Z" fill="currentColor" /><path d="m44 11 11-9 5 12" fill="currentColor" /><circle cx="77" cy="21" r="2" fill="#f6f8fc" /></svg>)}</div>
      <div className="ocean-bubbles">{[0, 1, 2, 3, 4, 5].map(index => <span key={index} style={{ left: `${8 + index * 17}%`, animationDelay: `${index * -3.7}s`, animationDuration: `${19 + index * 2}s` }} />)}</div>
    </div>
    <div ref={cursor} className="ocean-cursor" aria-hidden="true"><span /></div>
  </>;
}
