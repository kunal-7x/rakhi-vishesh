interface StepDotsProps {
  labels: readonly string[];
  current: number;
  onSelect: (index: number) => void;
}

export default function StepDots({ labels, current, onSelect }: StepDotsProps) {
  return (
    <div className="flex w-full items-start">
      {labels.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={label} className="flex flex-1 items-start last:flex-none">
            <button
              type="button"
              onClick={() => done && onSelect(i)}
              disabled={!done}
              aria-label={`Go to ${label} step`}
              className={`flex flex-col items-center gap-1.5 transition ${
                done ? "cursor-pointer" : "cursor-default"
              }`}
            >
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold transition ${
                  active
                    ? "bg-gradient-to-br from-[#ffd97a] to-[#ff9d2e] text-[#2a0e04] shadow-[0_0_20px_rgba(255,217,122,0.35)]"
                    : done
                      ? "border border-[#ffd97a]/60 text-[#ffd97a]"
                      : "border border-white/15 text-white/30"
                }`}
              >
                {done ? "✓" : i + 1}
              </span>
              <span
                className={`text-[10px] font-medium tracking-wide sm:text-xs ${
                  active
                    ? "text-[#fff6e9]"
                    : done
                      ? "text-[#ffd97a]/70"
                      : "text-white/30"
                }`}
              >
                {label}
              </span>
            </button>
            {i < labels.length - 1 && (
              <span
                className={`mt-[17px] h-0.5 flex-1 rounded transition ${
                  i < current ? "bg-[#ffd97a]/40" : "bg-white/10"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
