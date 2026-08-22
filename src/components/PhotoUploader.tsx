"use client";

import { useState } from "react";
import type { PhotoSpec, ThemeId } from "@/lib/types";

const MAX = 12;

export default function PhotoUploader({ value, onChange }: { value: PhotoSpec[]; onChange: (p: PhotoSpec[]) => void }) {
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleFiles(files: FileList | File[]) {
    setErr("");
    const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (!list.length) return;
    const room = MAX - value.length;
    if (list.length > room) setErr(`Maximum ${MAX} photos. Remove some first.`);
    const take = list.slice(0, room);
    if (!take.length) return;
    setBusy(true);
    try {
      const added: PhotoSpec[] = [];
      for (const file of take) {
        const dataUrl = await readAsDataUrl(file);
        added.push({ url: dataUrl });
      }
      onChange([...value, ...added]);
    } finally {
      setBusy(false);
    }
  }

  function removeAt(i: number) {
    onChange(value.filter((_, idx) => idx !== i));
  }

  return (
    <div className="w-full">
      <label
        className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-amber-300/40 bg-amber-400/5 px-6 py-10 text-center transition hover:border-amber-300/70 hover:bg-amber-400/10 cursor-pointer"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          handleFiles(e.dataTransfer.files);
        }}
      >
        <input
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />
        <span className="text-4xl">🖼️</span>
        <span className="text-sm font-semibold text-amber-100">Add photos of your sister</span>
        <span className="text-xs text-amber-200/60">Drag & drop, tap to pick — max {MAX}</span>
        {busy && <span className="text-xs text-amber-200">Optimizing…</span>}
        {err && <span className="text-xs text-red-300">{err}</span>}
      </label>

      {value.length > 0 && (
        <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
          {value.map((p, i) => (
            <div key={i} className="group relative aspect-square overflow-hidden rounded-xl border border-white/10">
              <img src={p.url} alt={`photo ${i + 1}`} className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => removeAt(i)}
                className="absolute right-1.5 top-1.5 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white opacity-0 transition group-hover:opacity-100"
              >
                ✕
              </button>
              <span className="absolute bottom-1 left-1.5 rounded bg-black/50 px-1.5 py-0.5 text-[10px] text-white/80">
                {i + 1}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(String(fr.result));
    fr.onerror = reject;
    fr.readAsDataURL(file);
  });
}
