import type { ChangeEvent } from "react";

interface TextAreaFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  rows?: number;
  hint?: string;
}

export default function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
  maxLength,
  rows = 5,
  hint,
}: TextAreaFieldProps) {
  function handle(e: ChangeEvent<HTMLTextAreaElement>) {
    const v = e.target.value;
    onChange(maxLength ? v.slice(0, maxLength) : v);
  }

  const nearMax = maxLength ? value.length >= maxLength * 0.9 : false;

  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.15em] text-[#ffd97a]/90">
        {label}
      </span>
      <textarea
        value={value}
        onChange={handle}
        placeholder={placeholder}
        rows={rows}
        maxLength={maxLength}
        className={`w-full resize-y rounded-xl border border-amber-100/15 bg-[#160803]/70 px-4 py-3 text-[15px] leading-relaxed text-[#fff6e9] outline-none transition placeholder:text-[#fff6e9]/25 focus:border-[#ffd97a]/60 focus:ring-2 focus:ring-[#ffd97a]/25 ${
          nearMax ? "border-red-400/50" : ""
        }`}
      />
      <div className="mt-1.5 flex items-center justify-between gap-3">
        {hint ? (
          <span className="text-xs text-amber-100/40">{hint}</span>
        ) : (
          <span />
        )}
        {maxLength && (
          <span
            className={`text-xs tabular-nums ${
              nearMax ? "text-red-300" : "text-amber-100/40"
            }`}
          >
            {value.length}/{maxLength}
          </span>
        )}
      </div>
    </label>
  );
}
