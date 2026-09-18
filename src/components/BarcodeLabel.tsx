import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import JsBarcode from 'jsbarcode';
import { AssetItem, OFFICIAL_KOP } from '../types';
import { Download, Printer } from 'lucide-react';

interface Props {
  asset: AssetItem;
  mode?: 'full' | 'barcode-only' | 'compact';
  barcodeType?: 'qr' | 'linear' | 'both';
  onPrintSingle?: (asset: AssetItem) => void;
}

export const BarcodeLabel: React.FC<Props> = ({
  asset,
  mode = 'full',
  barcodeType = 'qr',
  onPrintSingle,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const barcodeCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Generate payload string for the QR code
  const barcodePayload = [
    `=== ASET SMAN 1 GROGOL KEDIRI ===`,
    `KODE: ${asset.kodeBarang}`,
    `NAMA: ${asset.namaBarang}`,
    `MERK/TIPE: ${asset.merkTipe || '-'}`,
    `KONDISI: ${asset.kondisi}`,
    `LOKASI: ${asset.lokasi}`,
    `TAHUN: ${asset.tahunTerima}`,
    `ASAL: ${asset.asalPenerimaan}`,
    `--------------------------------`,
    `PERHATIAN / PROSEDUR:`,
    `${OFFICIAL_KOP.pesanPeminjaman}`,
    `Telp: (0354) 773009 | sman1grogol.sch.id`,
  ].join('\n');

  // Generate QR Code
  useEffect(() => {
    QRCode.toDataURL(
      barcodePayload,
      {
        width: 200,
        margin: 1,
        errorCorrectionLevel: 'M',
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      },
      (err, url) => {
        if (!err && url) {
          setQrDataUrl(url);
        }
      }
    );
  }, [barcodePayload]);

  // Generate 1D Code128 Barcode if requested
  useEffect(() => {
    if (barcodeCanvasRef.current && (barcodeType === 'linear' || barcodeType === 'both')) {
      try {
        JsBarcode(barcodeCanvasRef.current, asset.kodeBarang, {
          format: 'CODE128',
          lineColor: '#000000',
          width: 1.2,
          height: mode === 'compact' ? 24 : 30,
          displayValue: false,
          margin: 0,
        });
      } catch (e) {
        console.warn('JsBarcode render error:', e);
      }
    }
  }, [asset.kodeBarang, barcodeType, mode]);

  const handleDownloadLabelImage = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `Label_Aset_${asset.kodeBarang}.png`;
    a.click();
  };

  return (
    <div
      className={`bg-white border-1.5 border-black rounded-xs shadow-xs text-black font-sans print:border-black print:shadow-none print:break-inside-avoid print:rounded-none w-full transition-all ${
        mode === 'compact'
          ? 'max-w-[320px] p-2'
          : mode === 'barcode-only'
          ? 'max-w-[350px] p-2.5'
          : 'max-w-[360px] p-2.5'
      }`}
    >
      {/* Header Teks Resmi TANPA LOGO - Format Kecil Memanjang */}
      <div className="border-b border-black pb-1 mb-1.5 flex items-center justify-between text-[9px] leading-tight select-none">
        <div className="text-left">
          <div className="text-[7.5px] uppercase tracking-wider text-gray-700 font-semibold print:text-black">
            PEMERINTAH PROVINSI JAWA TIMUR • DINAS PENDIDIKAN
          </div>
          <div className="font-extrabold text-black tracking-tight text-[10px] uppercase font-sans">
            SMAN 1 GROGOL KEDIRI
          </div>
        </div>
        <div className="text-right shrink-0">
          <span className="inline-block bg-black text-white text-[7.5px] font-bold px-1.5 py-0.5 rounded-xs tracking-wider uppercase print:bg-black print:text-white">
            INVENTARIS ASET
          </span>
        </div>
      </div>

      {/* Main Body: Tata Letak Kecil Memanjang (Horizontal Strip) */}
      {mode === 'barcode-only' ? (
        /* Mode 1: Barcode Saja Memanjang (Tanpa Logo) */
        <div className="flex items-center gap-2.5">
          {/* QR Code */}
          {barcodeType !== 'linear' && qrDataUrl && (
            <div className="shrink-0 flex flex-col items-center">
              <img
                src={qrDataUrl}
                alt={`QR ${asset.kodeBarang}`}
                className="w-16 h-16 object-contain border border-black p-0.5 bg-white"
              />
              <span className="text-[7px] text-gray-600 font-mono mt-0.5 print:text-black">
                SCAN
              </span>
            </div>
          )}

          {/* Linear Barcode Canvas if selected */}
          {barcodeType === 'linear' && (
            <div className="shrink-0 flex flex-col items-center">
              <canvas ref={barcodeCanvasRef} className="max-w-[130px]" />
            </div>
          )}

          {/* Info Utama */}
          <div className="flex-1 min-w-0 text-left">
            <div className="text-[7px] uppercase tracking-wider text-gray-600 font-bold print:text-black">
              KODE ASET RESMI:
            </div>
            <div className="font-mono font-black text-[12px] text-black tracking-tight select-all leading-snug break-all">
              {asset.kodeBarang}
            </div>
            <div className="font-bold text-[10px] text-gray-900 truncate mt-0.5 leading-tight print:text-black">
              {asset.namaBarang}
            </div>
            <div className="text-[8px] text-gray-700 leading-tight mt-0.5 print:text-black">
              {asset.lokasi} • Thn {asset.tahunTerima} ({asset.asalPenerimaan})
            </div>
            <div className="text-[7px] text-gray-500 mt-1 leading-tight border-t border-dashed border-gray-300 pt-0.5 print:border-black print:text-black">
              *Peminjaman hubungi TU Bagian Aset
            </div>
          </div>
        </div>
      ) : mode === 'compact' ? (
        /* Mode 2: Compact Ringkas Memanjang (Tanpa Logo) */
        <div className="flex items-center gap-2">
          {barcodeType !== 'linear' && qrDataUrl && (
            <img
              src={qrDataUrl}
              alt={`QR ${asset.kodeBarang}`}
              className="w-13 h-13 object-contain border border-black p-0.5 bg-white shrink-0"
            />
          )}

          {barcodeType === 'linear' && (
            <div className="shrink-0">
              <canvas ref={barcodeCanvasRef} className="max-w-[110px]" />
            </div>
          )}

          <div className="flex-1 min-w-0 text-left leading-tight">
            <div className="font-mono font-black text-[10.5px] tracking-tight text-black select-all break-all">
              {asset.kodeBarang}
            </div>
            <div className="font-bold text-[9.5px] truncate text-gray-900 print:text-black">
              {asset.namaBarang}
            </div>
            <div className="text-[8px] text-gray-700 mt-0.5 print:text-black">
              {asset.lokasi} • {asset.asalPenerimaan} ({asset.tahunTerima})
            </div>
          </div>
        </div>
      ) : (
        /* Mode 3 (Default): Standar Lengkap Kecil Memanjang (Tanpa Logo) */
        <div className="space-y-1.5">
          <div className="flex items-start gap-2.5">
            {/* Visual Barcode: QR Code 2D di sebelah kiri */}
            {barcodeType !== 'linear' && qrDataUrl && (
              <div className="shrink-0 flex flex-col items-center">
                <img
                  src={qrDataUrl}
                  alt={`QR ${asset.kodeBarang}`}
                  className="w-16 h-16 object-contain border border-black p-0.5 bg-white"
                />
                <span className="text-[6.5px] font-bold text-gray-600 uppercase mt-0.5 tracking-wider print:text-black">
                  SCAN ASET
                </span>
              </div>
            )}

            {/* Jika hanya 1D Barcode */}
            {barcodeType === 'linear' && (
              <div className="shrink-0 flex flex-col items-center justify-center p-1 border border-black bg-white">
                <canvas ref={barcodeCanvasRef} className="max-w-[125px]" />
                <span className="font-mono text-[7.5px] font-bold mt-0.5">{asset.kodeBarang}</span>
              </div>
            )}

            {/* Rincian Inventaris di sebelah kanan */}
            <div className="flex-1 min-w-0 text-left">
              {/* Kotak Kode Barang */}
              <div className="bg-gray-100 border border-gray-400 px-1.5 py-0.5 mb-1 print:bg-white print:border-black">
                <div className="text-[6.5px] font-bold text-gray-600 uppercase leading-none print:text-black">
                  KODE BARANG:
                </div>
                <div className="font-mono font-black text-[11px] leading-tight tracking-tight text-black select-all break-all">
                  {asset.kodeBarang}
                </div>
              </div>

              {/* Nama & Merk Barang */}
              <div className="text-[10px] font-bold text-gray-950 truncate leading-snug print:text-black">
                {asset.namaBarang}
              </div>
              {asset.merkTipe && (
                <div className="text-[8.5px] text-gray-600 truncate leading-none print:text-black">
                  Merk: {asset.merkTipe}
                </div>
              )}

              {/* Lokasi, Tahun, Asal, Kondisi */}
              <div className="text-[8px] text-gray-800 leading-tight mt-1 print:text-black">
                <span className="font-semibold">Lok:</span> {asset.lokasi} •{' '}
                <span className="font-semibold">Thn:</span> {asset.tahunTerima} (
                <span className="font-bold">{asset.asalPenerimaan}</span>) •{' '}
                <span className="font-semibold">{asset.kondisi}</span>
              </div>
            </div>
          </div>

          {/* Jika memilih 'both' (QR dan Barcode Garis 1D) */}
          {barcodeType === 'both' && (
            <div className="flex flex-col items-center justify-center py-0.5 border-t border-dashed border-gray-300 print:border-black">
              <canvas ref={barcodeCanvasRef} className="max-w-[200px]" />
            </div>
          )}

          {/* Pesan Peminjaman Singkat TU di bagian bawah */}
          <div className="border-t border-gray-300 pt-1 text-center text-[7px] leading-tight text-gray-700 font-medium print:border-black print:text-black">
            *Untuk peminjaman/pemindahan barang wajib lapor TU Bagian Aset SMAN 1 Grogol
          </div>
        </div>
      )}

      {/* Screen Action Bar (disembunyikan saat dicetak) */}
      <div className="mt-2 pt-1.5 border-t border-gray-200 flex items-center justify-between text-[10px] text-gray-500 print:hidden">
        <span className="font-mono text-[9px] text-gray-400">#LabelStiker</span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleDownloadLabelImage}
            title="Unduh Gambar QR"
            className="p-1 hover:bg-gray-100 rounded text-gray-600 hover:text-black border border-gray-200"
          >
            <Download className="w-3 h-3" />
          </button>
          {onPrintSingle && (
            <button
              type="button"
              onClick={() => onPrintSingle(asset)}
              className="inline-flex items-center gap-1 px-2 py-0.5 bg-black hover:bg-gray-800 text-white text-[10px] font-bold rounded transition-colors"
            >
              <Printer className="w-2.5 h-2.5" />
              Cetak
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
