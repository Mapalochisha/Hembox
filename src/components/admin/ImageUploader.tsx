"use client";

import { useState, useRef } from "react";
import { X, Upload, Loader2 } from "lucide-react";

interface UploadedImage {
  url: string;
  publicId: string;
  isPrimary: boolean;
}

interface Props {
  images: UploadedImage[];
  onChange: (images: UploadedImage[]) => void;
}

export default function ImageUploader({ images, onChange }: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList) {
    setError("");
    setUploading(true);

    const uploaded: UploadedImage[] = [];

    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) {
        setError("Only image files are allowed.");
        continue;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError("Each image must be under 10MB.");
        continue;
      }

      const formData = new FormData();
      formData.append("file", file);

      try {
        const res = await fetch("/api/admin/upload", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Upload failed");

        uploaded.push({
          url: data.url,
          publicId: data.publicId,
          isPrimary: images.length === 0 && uploaded.length === 0,
        });
      } catch (err: any) {
        setError(err.message);
      }
    }

    onChange([...images, ...uploaded]);
    setUploading(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    if (e.dataTransfer.files.length > 0) handleFiles(e.dataTransfer.files);
  }

  function setPrimary(index: number) {
    onChange(images.map((img, i) => ({ ...img, isPrimary: i === index })));
  }

  function removeImage(index: number) {
    const updated = images.filter((_, i) => i !== index);
    if (updated.length > 0 && !updated.some(i => i.isPrimary)) {
      updated[0].isPrimary = true;
    }
    onChange(updated);
  }

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={e => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
        className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center cursor-pointer hover:border-gray-400 transition-colors"
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={e => e.target.files && handleFiles(e.target.files)}
        />
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 size={24} className="animate-spin opacity-40" />
            <p className="text-xs opacity-40 tracking-widest uppercase">Uploading...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload size={24} className="opacity-30" />
            <p className="text-sm font-semibold">Drop images here or click to upload</p>
            <p className="text-xs opacity-40">PNG, JPG, WEBP up to 10MB each</p>
          </div>
        )}
      </div>

      {error && <p className="text-red-500 text-xs">{error}</p>}

      {/* Image previews */}
      {images.length > 0 && (
        <div className="grid grid-cols-4 gap-3">
          {images.map((img, i) => (
            <div key={img.publicId} className="relative group">
              <div className={`rounded-lg overflow-hidden border-2 transition-colors ${img.isPrimary ? "border-[#111]" : "border-transparent"}`}>
                <img src={img.url} alt="" className="w-full h-24 object-cover" />
              </div>

              {/* Primary badge */}
              {img.isPrimary && (
                <span className="absolute top-1.5 left-1.5 bg-[#111] text-white text-[8px] px-1.5 py-0.5 rounded tracking-widest font-bold">
                  PRIMARY
                </span>
              )}

              {/* Actions */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                {!img.isPrimary && (
                  <button
                    type="button"
                    onClick={() => setPrimary(i)}
                    className="bg-white text-[#111] text-[8px] px-2 py-1 rounded tracking-widest font-bold uppercase"
                  >
                    Set Primary
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
                >
                  <X size={10} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}