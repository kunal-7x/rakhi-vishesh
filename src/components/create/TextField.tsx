import type { ChangeEvent } from "react";

interface TextFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  hint?: string;
  error?: boolean;
}

export default function TextField({
  label,
  value,
  onChange,
  placeholder,
  maxLength,
  hint,
  error = false,
}: TextFieldProps) {
  function handle(e: ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    onChange(maxLength ? v.slice(0, maxLength) : v);
  }

  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.15em] text-[#ffd97a]/90">
        {label}
      </span>
      <input
        type="text"
        value={value}
        onChange={handle}
        placeholder={placeholder}
        maxLength={maxLength}
        className={`w-full rounded-xl border bg-[#160803]/70 px-4 py-3 text-[15px] text-[#fff6e9] outline-none transition placeholder:text-[#fff6e9]/25 focus:ring-2 ${
          error
            ? "border-red-400/70 focus:border-red-400 focus:ring-red-400/25"
            : "border-amber-100/15 focus:border-[#ffd97a]/60 focus:ring-[#ffd97a]/25"
        }`}
      />
      {hint && (
        <span className={`mt-1.5 block text-xs ${error ? "text-red-300" : "text-amber-100/40"}`}>
          {hint}
        </span>
      )}
    </label>
  );
}
