import React, { useState } from 'react';
import { AssetItem, OFFICIAL_KOP } from '../types';
import { Search, ScanLine, AlertCircle, CheckCircle2, X, Building, Tag, MapPin, Calendar } from 'lucide-react';

interface Props {
  assets: AssetItem[];
  onClose: () => void;
}

export const BarcodeScannerModal: React.FC<Props> = ({ assets, onClose }) => {
  const [scannedInput, setScannedInput] = useState('');
  const [matchedAsset, setMatchedAsset] = useState<AssetItem | null>(null);
  const [notFound, setNotFound] = useState(false);

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = scannedInput.trim().toUpperCase();
    if (!query) return;

    // Search by exact code or partial code
    const found = assets.find(
      (a) =>
        a.kodeBarang.toUpperCase() === query ||
        query.includes(a.kodeBarang.toUpperCase()) ||
        a.kodeBarang.toUpperCase().includes(query)
    );

    if (found) {
      setMatchedAsset(found);
      setNotFound(false);
    } else {
      setMatchedAsset(null);
      setNotFound(true);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-200 animate-in fade-in">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-200">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-100 text-blue-900 rounded-lg">
              <ScanLine className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-base">
                Verifikasi & Scan Barcode Aset
              </h3>
              <p className="text-xs text-gray-500">
                Pindai dengan barcode gun / input kode untuk verifikasi data TU
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Input Barcode */}
        <form onSubmit={handleSearch} className="mt-4">
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            Kode Barcode / QR Code Aset:
          </label>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                autoFocus
                placeholder="Contoh: AST-SMAGRO-2024-BOS-0001..."
                value={scannedInput}
                onChange={(e) => {
                  setScannedInput(e.target.value);
                  setNotFound(false);
                }}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white font-semibold text-xs rounded-lg transition-colors"
            >
              Cari Aset
            </button>
          </div>
        </form>

        {/* Not found state */}
        {notFound && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>
              Kode aset <strong>"{scannedInput}"</strong> tidak ditemukan dalam database inventaris sekolah.
            </span>
          </div>
        )}

        {/* Matched Asset Display */}
        {matchedAsset && (
          <div className="mt-4 bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase text-blue-700 tracking-wider">
                  Data Terverifikasi
                </span>
                <h4 className="font-bold text-gray-900 text-base leading-tight mt-0.5">
                  {matchedAsset.namaBarang}
                </h4>
                {matchedAsset.merkTipe && (
                  <p className="text-xs text-gray-600">{matchedAsset.merkTipe}</p>
                )}
              </div>
              <span
                className={`px-2.5 py-1 text-xs font-bold rounded-md ${
                  matchedAsset.kondisi === 'Baik'
                    ? 'bg-emerald-100 text-emerald-800'
                    : matchedAsset.kondisi === 'Rusak Ringan'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-rose-100 text-rose-800'
                }`}
              >
                {matchedAsset.kondisi}
              </span>
            </div>

            <div className="bg-white p-3 rounded-lg border border-gray-200 font-mono text-xs space-y-1.5">
              <div className="flex justify-between border-b pb-1 text-gray-700">
                <span className="text-gray-500">Kode Barang:</span>
                <span className="font-bold text-blue-900 select-all">{matchedAsset.kodeBarang}</span>
              </div>
              <div className="flex justify-between border-b pb-1 text-gray-700">
                <span className="text-gray-500">Lokasi:</span>
                <span className="font-medium text-gray-900">{matchedAsset.lokasi}</span>
              </div>
              <div className="flex justify-between border-b pb-1 text-gray-700">
                <span className="text-gray-500">Tahun / Asal:</span>
                <span className="font-medium text-gray-900">
                  {matchedAsset.tahunTerima} ({matchedAsset.asalPenerimaan})
                </span>
              </div>
              <div className="flex justify-between text-gray-700">
                <span className="text-gray-500">Catatan:</span>
                <span className="font-medium text-gray-900">{matchedAsset.keterangan || '-'}</span>
              </div>
            </div>

            {/* TU Notice Alert */}
            <div className="bg-amber-50 border-l-4 border-amber-500 p-3 rounded-r-lg">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-950">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>INFORMASI TATA USAHA BAGIAN ASET:</span>
              </div>
              <p className="text-xs text-amber-900 mt-1 leading-relaxed">
                {OFFICIAL_KOP.pesanPeminjaman}
              </p>
              <div className="mt-2 text-[11px] text-amber-800 font-semibold">
                Hubungi: {OFFICIAL_KOP.kontak}
              </div>
            </div>
          </div>
        )}

        <div className="mt-5 text-center">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs rounded-lg"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
