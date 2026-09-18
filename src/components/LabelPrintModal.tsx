import React, { useState } from 'react';
import { AssetItem } from '../types';
import { BarcodeLabel } from './BarcodeLabel';
import { Printer, X, LayoutGrid } from 'lucide-react';

interface Props {
  assets: AssetItem[];
  onClose: () => void;
}

export const LabelPrintModal: React.FC<Props> = ({ assets, onClose }) => {
  const [labelMode, setLabelMode] = useState<'full' | 'barcode-only' | 'compact'>('full');
  const [barcodeType, setBarcodeType] = useState<'qr' | 'linear' | 'both'>('qr');
  const [gridColumns, setGridColumns] = useState<1 | 2 | 3>(2);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-5xl w-full p-6 shadow-2xl my-6 print:p-0 print:m-0 print:shadow-none print:max-w-none print:w-full">
        {/* Controls Bar (Hidden during printing) */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-200 print:hidden">
          <div>
            <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
              <Printer className="w-5 h-5 text-blue-900" />
              <span>Pratinjau Cetak Label Aset Kecil Memanjang ({assets.length} Label)</span>
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Format stiker kecil memanjang tanpa logo, presisi untuk kertas label / stiker A4 dan inventaris barang.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Grid Columns */}
            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg text-xs font-semibold text-gray-700">
              <span className="text-[10px] text-gray-500 px-1 flex items-center gap-0.5">
                <LayoutGrid className="w-3 h-3" />
                Kolom:
              </span>
              <button
                type="button"
                onClick={() => setGridColumns(2)}
                className={`px-2 py-0.5 rounded-md transition-all ${
                  gridColumns === 2 ? 'bg-white shadow-xs text-blue-900 font-bold' : 'hover:text-gray-900'
                }`}
              >
                2 Kolom
              </button>
              <button
                type="button"
                onClick={() => setGridColumns(3)}
                className={`px-2 py-0.5 rounded-md transition-all ${
                  gridColumns === 3 ? 'bg-white shadow-xs text-blue-900 font-bold' : 'hover:text-gray-900'
                }`}
              >
                3 Kolom
              </button>
            </div>

            {/* Mode selection */}
            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg text-xs font-semibold text-gray-700">
              <button
                type="button"
                onClick={() => setLabelMode('full')}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  labelMode === 'full' ? 'bg-white shadow-xs text-blue-900 font-bold' : 'hover:text-gray-900'
                }`}
              >
                Lengkap
              </button>
              <button
                type="button"
                onClick={() => setLabelMode('barcode-only')}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  labelMode === 'barcode-only'
                    ? 'bg-white shadow-xs text-blue-900 font-bold'
                    : 'hover:text-gray-900'
                }`}
              >
                Barcode Saja
              </button>
              <button
                type="button"
                onClick={() => setLabelMode('compact')}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  labelMode === 'compact'
                    ? 'bg-white shadow-xs text-blue-900 font-bold'
                    : 'hover:text-gray-900'
                }`}
              >
                Ringkas
              </button>
            </div>

            {/* Barcode Type */}
            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg text-xs font-semibold text-gray-700">
              <button
                type="button"
                onClick={() => setBarcodeType('qr')}
                className={`px-2 py-1 rounded-md transition-all ${
                  barcodeType === 'qr' ? 'bg-white shadow-xs text-blue-900 font-bold' : 'hover:text-gray-900'
                }`}
              >
                QR 2D
              </button>
              <button
                type="button"
                onClick={() => setBarcodeType('linear')}
                className={`px-2 py-1 rounded-md transition-all ${
                  barcodeType === 'linear'
                    ? 'bg-white shadow-xs text-blue-900 font-bold'
                    : 'hover:text-gray-900'
                }`}
              >
                Garis 1D
              </button>
              <button
                type="button"
                onClick={() => setBarcodeType('both')}
                className={`px-2 py-1 rounded-md transition-all ${
                  barcodeType === 'both'
                    ? 'bg-white shadow-xs text-blue-900 font-bold'
                    : 'hover:text-gray-900'
                }`}
              >
                Keduanya
              </button>
            </div>

            {/* Print Action Buttons */}
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold rounded-lg shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Sekarang</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Grid of Labels */}
        <div className="p-4 overflow-y-auto max-h-[75vh] print:max-h-none print:overflow-visible print:p-0">
          <div
            className={`grid gap-3.5 print:gap-2.5 ${
              gridColumns === 3
                ? 'grid-cols-1 md:grid-cols-3 print:grid-cols-3'
                : 'grid-cols-1 md:grid-cols-2 print:grid-cols-2'
            }`}
          >
            {assets.map((asset) => (
              <div key={asset.id} className="flex justify-center">
                <BarcodeLabel
                  asset={asset}
                  mode={labelMode}
                  barcodeType={barcodeType}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Modal footer note */}
        <div className="mt-4 pt-3 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500 print:hidden">
          <span>
            Tips: Gunakan skala cetak 100% dan nonaktifkan header/footer browser untuk hasil cetak
            stiker terbaik tanpa logo.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-xs text-gray-700 bg-gray-100 hover:bg-gray-200 rounded font-medium"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
