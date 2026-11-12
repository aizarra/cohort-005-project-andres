// PROTOTYPE — floating variant switcher bar
import { useNavigate, useSearchParams } from "react-router";
import { useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const VARIANTS = [
  { key: "A", name: "Minimal popover" },
  { key: "B", name: "Rich panel" },
  { key: "C", name: "Inbox rows" },
] as const;

export function PrototypeSwitcher() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const current = searchParams.get("variant") ?? "A";
  const idx = VARIANTS.findIndex((v) => v.key === current);

  const goTo = useCallback(
    (key: string) => {
      const params = new URLSearchParams(searchParams);
      params.set("variant", key);
      navigate(`?${params.toString()}`, { replace: true });
    },
    [navigate, searchParams]
  );

  const prev = useCallback(() => {
    const i = (idx - 1 + VARIANTS.length) % VARIANTS.length;
    goTo(VARIANTS[i].key);
  }, [idx, goTo]);

  const next = useCallback(() => {
    const i = (idx + 1) % VARIANTS.length;
    goTo(VARIANTS[i].key);
  }, [idx, goTo]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement).isContentEditable)
        return;
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [prev, next]);

  const v = VARIANTS[idx] ?? VARIANTS[0];

  return (
    <div className="fixed bottom-4 left-1/2 z-[9999] flex -translate-x-1/2 items-center gap-2 rounded-full border border-border bg-background/95 px-3 py-2 shadow-lg backdrop-blur">
      <button
        onClick={prev}
        className="rounded-full p-1 hover:bg-accent"
        aria-label="Previous variant"
      >
        <ChevronLeft className="size-4" />
      </button>
      <span className="min-w-[140px] text-center text-sm font-medium">
        {v.key} ({v.name})
      </span>
      <button
        onClick={next}
        className="rounded-full p-1 hover:bg-accent"
        aria-label="Next variant"
      >
        <ChevronRight className="size-4" />
      </button>
    </div>
  );
}
