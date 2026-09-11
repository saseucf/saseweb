"use client";

import { useEffect, useRef, type RefObject } from "react";
import { flushSync } from "react-dom";

const easing = "cubic-bezier(0.22, 1, 0.36, 1)";

// Measure once before and after a disclosure. Only transforms animate between
// those layouts, so expanding a long event does not reflow the page every frame.
export function useEventMotion(root: RefObject<HTMLDivElement | null>) {
    const active = useRef(new Set<Animation>());
    const pending = useRef<{ element: HTMLElement; animation: Animation; commit: () => void } | null>(null);

    const track = (animation: Animation) => {
        active.current.add(animation);
        animation.onfinish = animation.oncancel = () => active.current.delete(animation);
        return animation;
    };

    useEffect(() => {
        const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
        const animations = active.current;
        const stop = () => {
            animations.forEach(animation => animation.cancel());
            animations.clear();
        };
        const finishImmediately = () => {
            if (!preference.matches) return;
            const closing = pending.current;
            pending.current = null;
            stop();
            if (closing) flushSync(closing.commit);
        };
        preference.addEventListener("change", finishImmediately);
        return () => {
            pending.current = null;
            stop();
            preference.removeEventListener("change", finishImmediately);
        };
    }, []);

    return (update: () => void, exiting?: HTMLElement | null) => {
        const previous = pending.current;
        pending.current = null;
        if (previous) {
            previous.animation.cancel();
            // A second click while closing reverses the dismissal immediately.
            if (previous.element === exiting) return;
            flushSync(previous.commit);
        }

        const page = root.current?.closest("main");
        if (!page || window.matchMedia("(prefers-reduced-motion: reduce)").matches || !HTMLElement.prototype.animate) {
            update();
            return;
        }

        const commit = () => {
            const elements = [...page.querySelectorAll<HTMLElement>("[data-event-motion]")];
            const before = new Map(elements.map(element => [element, element.getBoundingClientRect()]));
            active.current.forEach(animation => animation.cancel());
            active.current.clear();
            flushSync(update);
            const after = new Map(elements.map(element => [element, element.getBoundingClientRect()]));

            for (const element of elements) {
                const first = before.get(element)!;
                const last = after.get(element)!;
                if (!element.isConnected || !first.height || !last.height) continue;
                if ((first.bottom <= 0 && last.bottom <= 0) || (first.top >= window.innerHeight && last.top >= window.innerHeight)) continue;
                const parent = element.parentElement?.closest<HTMLElement>("[data-event-motion]");
                const parentFirst = parent && before.get(parent);
                const parentLast = parent && after.get(parent);
                const x = first.left - last.left - (parentFirst && parentLast ? parentFirst.left - parentLast.left : 0);
                const y = first.top - last.top - (parentFirst && parentLast ? parentFirst.top - parentLast.top : 0);
                const surface = element.dataset.eventMotion === "surface";
                const scale = surface ? ` scale(${first.width / last.width}, ${first.height / last.height})` : "";
                if (Math.abs(x) < 0.5 && Math.abs(y) < 0.5 && (!surface || Math.abs(first.height - last.height) < 0.5)) continue;
                track(element.animate([
                    { transform: `translate(${x}px, ${y}px)${scale}`, transformOrigin: "top left" },
                    { transform: "none", transformOrigin: "top left" },
                ], { duration: exiting ? 320 : 420, easing }));
            }
        };

        if (exiting) {
            const animation = track(exiting.animate([
                { opacity: 1, transform: "translateY(0)" },
                { opacity: 0, transform: "translateY(-8px)" },
            ], { duration: 140, easing, fill: "forwards" }));
            const closing = { element: exiting, animation, commit: update };
            pending.current = closing;
            animation.finished.then(() => {
                if (pending.current !== closing) return;
                pending.current = null;
                commit();
                animation.cancel();
            }, () => { /* Interrupted disclosures keep their current state. */ });
        } else {
            commit();
        }
    };
}
