import { useMemo, useRef, useState } from "react";

export type UseCoverflowOptions = {
    count: number;
    loop?: boolean;
    visibleRange?: number; // how many steps on each side (default 2 => 5 slots)
    animationMs?: number;
};

export default function useCoverflow({ count, loop = true, visibleRange = 2, animationMs = 230 }: UseCoverflowOptions) {
    const [active, setActive] = useState(0);
    const [dir, setDir] = useState<"none" | "next" | "prev">("none");

    const clamp = (i: number) => ((i % count) + count) % count;

    const setActiveWithAnim = (nextIdx: number) => {
        if (!count) return;
        const bounded = loop ? clamp(nextIdx) : Math.max(0, Math.min(count - 1, nextIdx));
        if (bounded === active) return;
        const forward = ((bounded - active + count) % count) <= ((active - bounded + count) % count);
        setDir(forward ? "next" : "prev");
        setActive(bounded);
        window.setTimeout(() => setDir("none"), animationMs);
    };

    const goPrev = () => {
        if (!count) return;
        if (!loop && active === 0) return;
        setActiveWithAnim(active - 1);
    };
    const goNext = () => {
        if (!count) return;
        if (!loop && active === count - 1) return;
        setActiveWithAnim(active + 1);
    };

    const slots = useMemo(() => {
        if (!count) return [] as number[];
        const rel: number[] = [];
        for (let i = -visibleRange; i <= visibleRange; i++) rel.push(i);
        return rel
            .map((o) => {
                const idx = active + o;
                if (loop) return clamp(idx);
                if (idx < 0 || idx >= count) return null;
                return idx;
            })
            .filter((x): x is number => x !== null);
    }, [active, count, loop, visibleRange]);

    // Swipe
    const drag = useRef<{ x0: number } | null>(null);
    const onPointerDown = (e: React.PointerEvent) => {
        if ((e.target as HTMLElement).closest("button")) return;
        drag.current = { x0: e.clientX };
    };
    const onPointerUp = (e: React.PointerEvent) => {
        const st = drag.current;
        drag.current = null;
        if (!st) return;
        const dx = e.clientX - st.x0;
        if (dx > 40) goPrev();
        else if (dx < -40) goNext();
    };

    const gridAnimClass = dir === "next" ? "anim-next" : dir === "prev" ? "anim-prev" : "";

    return {
        active,
        dir,
        slots,
        setActive,
        setActiveWithAnim,
        goPrev,
        goNext,
        onPointerDown,
        onPointerUp,
        gridAnimClass,
    } as const;
}

