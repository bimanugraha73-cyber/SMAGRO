import React from 'react';
import { OFFICIAL_KOP } from '../types';

interface Props {
  compact?: boolean;
}

export const OfficialKop: React.FC<Props> = ({ compact = false }) => {
  return (
    <div className={`text-center font-serif select-none ${compact ? 'py-1' : 'py-2'}`}>
      <div className="flex items-center justify-between gap-2 px-2">
        {/* Official Logo / Emblem Jawa Timur / Tut Wuri Handayani SVG */}
        <div className="shrink-0 flex items-center justify-center">
          <svg
            className={compact ? 'w-10 h-10' : 'w-13 h-13'}
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Outer shield */}
            <path
              d="M50 5 L90 20 V50 C90 75 50 95 50 95 C50 95 10 75 10 50 V20 Z"
              fill="#0F3B66"
              stroke="#D4AF37"
              strokeWidth="3"
            />
            {/* Inner shield gold accent */}
            <path
              d="M50 12 L82 24 V48 C82 68 50 85 50 85 C50 85 18 68 18 48 V24 Z"
              fill="#164E63"
              stroke="#FDE047"
              strokeWidth="1.5"
            />
            {/* Central torch & book motif */}
            <circle cx="50" cy="38" r="12" fill="#F59E0B" />
            <polygon points="50,22 45,35 55,35" fill="#EF4444" />
            {/* Open book */}
            <path
              d="M32 58 C40 54 50 56 50 56 C50 56 60 54 68 58 V68 C60 64 50 66 50 66 C50 66 40 64 32 68 Z"
              fill="#FFFFFF"
            />
            {/* Star at the top */}
            <polygon
              points="50,14 52,19 57,19 53,22 55,27 50,24 45,27 47,22 43,19 48,19"
              fill="#FBBF24"
            />
          </svg>
        </div>

        {/* Text Kop Surat */}
        <div className="flex-1 text-center leading-tight">
          <p className={`${compact ? 'text-[9px]' : 'text-xs'} font-bold tracking-wider text-gray-900 uppercase`}>
            {OFFICIAL_KOP.provinsi}
          </p>
          <p className={`${compact ? 'text-[9px]' : 'text-xs'} font-bold tracking-wider text-gray-900 uppercase`}>
            {OFFICIAL_KOP.dinas}
          </p>
          <h2
            className={`${
              compact ? 'text-xs' : 'text-sm'
            } font-extrabold text-blue-950 tracking-tight uppercase font-sans mt-0.5`}
          >
            {OFFICIAL_KOP.namaSekolah}
          </h2>
          <p className={`${compact ? 'text-[7.5px]' : 'text-[9.5px]'} text-gray-700 font-sans mt-0.5`}>
            {OFFICIAL_KOP.alamat}
          </p>
          <p className={`${compact ? 'text-[7px]' : 'text-[8.5px]'} text-gray-600 font-sans`}>
            {OFFICIAL_KOP.kontak}
          </p>
        </div>

        {/* SMAN 1 Grogol Badge Icon */}
        <div className="shrink-0 flex items-center justify-center">
          <div
            className={`${
              compact ? 'w-10 h-10 text-[8px]' : 'w-13 h-13 text-[9px]'
            } rounded-full border-2 border-amber-600 bg-amber-50 flex flex-col items-center justify-center text-amber-950 font-bold font-sans shadow-xs`}
          >
            <span>SMA</span>
            <span className="text-blue-900 -mt-1 font-black">GROGOL</span>
            <span className="text-[6.5px] text-gray-600 -mt-0.5">KEDIRI</span>
          </div>
        </div>
      </div>

      {/* Official Government Double Line Border */}
      <div className={`mt-1.5 ${compact ? 'mb-1' : 'mb-2'}`}>
        <div className="border-b-[2.5px] border-black w-full" />
        <div className="border-b-[0.8px] border-black w-full mt-[1.5px]" />
      </div>
    </div>
  );
};
