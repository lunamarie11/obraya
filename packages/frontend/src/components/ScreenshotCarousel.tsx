"use client";

import { useState } from "react";

export default function ScreenshotCarousel() {
  const images = [
    "https://images.unsplash.com/photo-1581090700227-3c2f3c0d6f6b?q=80&w=1400&auto=format&fit=crop&s=1",
    "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?q=80&w=1400&auto=format&fit=crop&s=2",
    "https://images.unsplash.com/photo-1508385082359-f2f1d0b3b4a6?q=80&w=1400&auto=format&fit=crop&s=3",
  ];

  const [idx, setIdx] = useState(0);

  function prev() {
    setIdx((i) => (i - 1 + images.length) % images.length);
  }
  function next() {
    setIdx((i) => (i + 1) % images.length);
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="relative bg-white rounded-2xl shadow-lg overflow-hidden border">
        <img
          src={images[idx]}
          alt={`Screenshot ${idx + 1}`}
          className="w-full h-72 object-cover"
        />

        <div className="p-4 flex items-center justify-between">
          <div className="text-sm text-slate-600">Vistas de la aplicación (mock)</div>
          <div className="flex items-center gap-2">
            <button onClick={prev} aria-label="Anterior" className="px-3 py-1 bg-slate-100 rounded">◀</button>
            <button onClick={next} aria-label="Siguiente" className="px-3 py-1 bg-slate-100 rounded">▶</button>
          </div>
        </div>

        <div className="absolute left-4 bottom-4 flex gap-2">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              aria-label={`Ver ${i + 1}`}
              className={`w-2 h-2 rounded-full ${i === idx ? "bg-orange-500" : "bg-slate-300"}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
