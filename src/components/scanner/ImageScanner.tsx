import React, { useRef } from 'react';
import { Camera } from 'lucide-react';

interface Props {
  onImageReady: (base64: string) => void;
  label: string;
  className?: string;
}

const ImageScanner = ({ onImageReady, label, className }: Props) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      onImageReady(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  return (
    <>
      <button 
        onClick={() => fileInputRef.current?.click()}
        className={className || "bg-orange-600 text-white p-4 rounded-xl flex items-center gap-2 font-black uppercase text-[10px]"}
      >
        <Camera size={16} /> {label}
      </button>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*" // Abre cámara o galería en el celu
        style={{ display: 'none' }}
      />
    </>
  );
};

export default ImageScanner;