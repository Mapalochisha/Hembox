"use client";

import { useState, useRef } from "react";
import { X, Upload, Loader2, Image as ImageIcon } from "lucide-react";

interface Props {
  value?: string;
  onChange: (url: string) => void;
  label?: string;
  uploadType?: "product" | "banner";
}

export default function SingleImageUploader({ value, onChange, label = "Upload Image", uploadType = "banner" }: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setError("");
    setUploading(true);

    if (!file.type.startsWith("image/")) {
      setError("Only image files are allowed.");
      setUploading(false);
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("Image must be under 10MB.");
      setUploading(false);
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", uploadType);

    try {
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");

      onChange(data.url);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    if (e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  }

  function removeImage() {
    onChange("");
  }

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      
      {value ? (
        <div className="relative group rounded-xl overflow-hidden border border-gray-200 inline-block">
          <img src={value} alt="Uploaded" className="max-w-full h-auto max-h-64 object-contain" />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <button
              type="button"
              onClick={removeImage}
              className="bg-red-500 text-white rounded-full p-2 flex items-center justify-center hover:bg-red-600 transition-colors shadow-sm"
              title="Remove Image"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
          className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition-colors flex flex-col items-center justify-center min-h-[160px]"
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={e => e.target.files && handleFile(e.target.files[0])}
          />
          {uploading ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 size={28} className="animate-spin text-blue-500" />
              <p className="text-sm font-medium text-gray-500">Uploading...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="bg-gray-100 p-3 rounded-full text-gray-500">
                <ImageIcon size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Click to upload or drag and drop</p>
                <p className="text-xs text-gray-500 mt-1">SVG, PNG, JPG or WEBP (max. 10MB)</p>
              </div>
            </div>
          )}
        </div>
      )}

      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
    </div>
  );
}
