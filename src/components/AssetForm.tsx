import React, { useState, useEffect, useMemo } from 'react';
import { AssetItem, AsalPenerimaan, KondisiBarang } from '../types';
import {
  formatNomorUrut,
  generateKodeBarang,
  getNextNomorUrut,
  setNextNomorUrut,
} from '../services/storage';
import { PlusCircle, Layers, Info, CheckCircle2, RotateCcw, AlertCircle } from 'lucide-react';

interface Props {
  onAddAssets: (newAssets: AssetItem[]) => void;
}

const ASAL_OPTIONS: AsalPenerimaan[] = ['BOS', 'BPOPP', 'KOMITE', 'HIBAH', 'DLL'];
const KONDISI_OPTIONS: KondisiBarang[] = ['Baik', 'Rusak Ringan', 'Rusak Berat'];

const SUGGESTED_LOCATIONS = [
  'Laboratorium Komputer 1',
  'Laboratorium Komputer 2',
  'Laboratorium IPA / Biologi',
  'Laboratorium Fisika & Kimia',
  'Perpustakaan Sekolah',
  'Ruang Guru',
  'Ruang Kepala Sekolah',
  'Ruang Tata Usaha (TU)',
  'Ruang BK / Konseling',
  'Ruang UKS',
  'Ruang OSIS',
  'Aula Pertemuan SMAN 1 Grogol',
  'Ruang Kelas X-1',
  'Ruang Kelas X-2',
  'Ruang Kelas XI MIPA',
  'Ruang Kelas XI IPS',
  'Ruang Kelas XII MIPA',
  'Ruang Kelas XII IPS',
];

export const AssetForm: React.FC<Props> = ({ onAddAssets }) => {
  const currentYear = new Date().getFullYear();

  const [namaBarang, setNamaBarang] = useState('');
  const [merkTipe, setMerkTipe] = useState('');
  const [kondisi, setKondisi] = useState<KondisiBarang>('Baik');
  const [lokasi, setLokasi] = useState('');
  const [tahunTerima, setTahunTerima] = useState<number>(currentYear);
  const [asalPenerimaan, setAsalPenerimaan] = useState<AsalPenerimaan>('BOS');
  const [nomorUrut, setNomorUrut] = useState<number>(1);
  const [jumlahBarang, setJumlahBarang] = useState<number>(1);
  const [keterangan, setKeterangan] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Sync initial next sequence number
  useEffect(() => {
    setNomorUrut(getNextNomorUrut());
  }, []);

  // Compute live preview of generated codes
  const previewCodes = useMemo(() => {
    const list: string[] = [];
    if (jumlahBarang <= 1) {
      list.push(generateKodeBarang(tahunTerima, asalPenerimaan, nomorUrut));
    } else {
      for (let i = 1; i <= Math.min(jumlahBarang, 5); i++) {
        list.push(generateKodeBarang(tahunTerima, asalPenerimaan, nomorUrut, i, jumlahBarang));
      }
    }
    return list;
  }, [tahunTerima, asalPenerimaan, nomorUrut, jumlahBarang]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!namaBarang.trim()) {
      setErrorMsg('Mohon masukkan Nama Barang terlebih dahulu.');
      return;
    }

    if (!lokasi.trim()) {
      setErrorMsg('Mohon tentukan atau pilih Lokasi Penggunaan Barang.');
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const createdAssets: AssetItem[] = [];

    if (jumlahBarang === 1) {
      const code = generateKodeBarang(tahunTerima, asalPenerimaan, nomorUrut);
      createdAssets.push({
        id: `ast-${Date.now()}-1`,
        kodeBarang: code,
        namaBarang: namaBarang.trim(),
        merkTipe: merkTipe.trim() || undefined,
        kondisi,
        lokasi: lokasi.trim(),
        tahunTerima,
        asalPenerimaan,
        nomorUrut,
        keterangan: keterangan.trim() || undefined,
        tanggalInput: todayStr,
      });
    } else {
      // Multiple items batch
      for (let i = 1; i <= jumlahBarang; i++) {
        const code = generateKodeBarang(tahunTerima, asalPenerimaan, nomorUrut, i, jumlahBarang);
        createdAssets.push({
          id: `ast-${Date.now()}-${i}`,
          kodeBarang: code,
          namaBarang: namaBarang.trim(),
          merkTipe: merkTipe.trim() || undefined,
          kondisi,
          lokasi: lokasi.trim(),
          tahunTerima,
          asalPenerimaan,
          nomorUrut,
          subIndex: i,
          totalBatch: jumlahBarang,
          keterangan: keterangan.trim() || undefined,
          tanggalInput: todayStr,
        });
      }
    }

    // Call parent handler
    onAddAssets(createdAssets);

    // Increment next asset sequence
    const nextSeq = nomorUrut + 1;
    setNextNomorUrut(nextSeq);
    setNomorUrut(nextSeq);

    // Reset some form values
    setNamaBarang('');
    setMerkTipe('');
    setJumlahBarang(1);
    setKeterangan('');

    setSuccessMsg(
      `Berhasil mencatat ${createdAssets.length} unit barang (${createdAssets[0].kodeBarang}${
        createdAssets.length > 1 ? ` s/d .${createdAssets.length}` : ''
      })!`
    );
    setTimeout(() => setSuccessMsg(''), 5000);
  };

  const handleResetSequence = () => {
    const fresh = getNextNomorUrut();
    setNomorUrut(fresh);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header section */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <PlusCircle className="w-5 h-5 text-blue-300" />
            <h3 className="font-bold text-base tracking-tight">
              Input Pendataan Aset Baru SMAN 1 Grogol
            </h3>
          </div>
          <span className="text-xs bg-blue-800/80 text-blue-200 px-2.5 py-1 rounded-full font-mono">
            No. Urut: {formatNomorUrut(nomorUrut)}
          </span>
        </div>
        <p className="text-xs text-blue-200 mt-1">
          Formulir pencatatan inventaris resmi sesuai format kode aset dan label barcode standar Tata Usaha.
        </p>
      </div>

      {/* Success Notification */}
      {successMsg && (
        <div className="m-4 p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs rounded-lg flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-medium">{successMsg}</span>
        </div>
      )}

      {/* Error Notification */}
      {errorMsg && (
        <div className="m-4 p-3 bg-rose-50 border border-rose-300 text-rose-800 text-xs rounded-lg flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span className="font-medium">{errorMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMsg('')}
            className="text-xs text-rose-700 hover:text-rose-900 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Form Content */}
      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        {/* Row 1: Nama Barang & Merk/Tipe */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Nama Barang <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={namaBarang}
              onChange={(e) => setNamaBarang(e.target.value)}
              placeholder="Contoh: Laptop Komputer Siswa, Meja Siswa..."
              className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Merk / Tipe Barang
            </label>
            <input
              type="text"
              value={merkTipe}
              onChange={(e) => setMerkTipe(e.target.value)}
              placeholder="Contoh: ASUS VivoBook Core i3, Standar Kayu Jati..."
              className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* Row 2: Kondisi Barang & Lokasi Penggunaan */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Kondisi Barang <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {KONDISI_OPTIONS.map((k) => (
                <button
                  type="button"
                  key={k}
                  onClick={() => setKondisi(k)}
                  className={`px-2 py-2 text-xs font-semibold rounded-lg border transition-all ${
                    kondisi === k
                      ? k === 'Baik'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : k === 'Rusak Ringan'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                        : 'bg-rose-600 text-white border-rose-600 shadow-xs'
                      : 'bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100'
                  }`}
                >
                  {k}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Lokasi Penggunaan <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              list="lokasi-list"
              value={lokasi}
              onChange={(e) => setLokasi(e.target.value)}
              placeholder="Pilih atau ketik lokasi ruang..."
              className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
            />
            <datalist id="lokasi-list">
              {SUGGESTED_LOCATIONS.map((loc) => (
                <option key={loc} value={loc} />
              ))}
            </datalist>
          </div>
        </div>

        {/* Row 3: Tahun Penerimaan & Asal Penerimaan */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Tahun Penerimaan <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              required
              min={2000}
              max={2099}
              value={tahunTerima}
              onChange={(e) => setTahunTerima(parseInt(e.target.value, 10) || currentYear)}
              className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Asal Penerimaan <span className="text-red-500">*</span>
            </label>
            <select
              value={asalPenerimaan}
              onChange={(e) => setAsalPenerimaan(e.target.value as AsalPenerimaan)}
              className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent font-medium bg-white"
            >
              {ASAL_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-gray-700">
                Nomor Urut Aset (4 Digit)
              </label>
              <button
                type="button"
                onClick={handleResetSequence}
                title="Sinkron nomor urut berikutnya"
                className="text-[10px] text-blue-700 hover:underline flex items-center gap-0.5"
              >
                <RotateCcw className="w-2.5 h-2.5" /> Auto
              </button>
            </div>
            <div className="relative">
              <input
                type="number"
                min={1}
                max={9999}
                value={nomorUrut}
                onChange={(e) => setNomorUrut(parseInt(e.target.value, 10) || 1)}
                className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono font-bold text-blue-900"
              />
              <span className="absolute right-3 top-2 text-xs text-gray-400 font-mono">
                {formatNomorUrut(nomorUrut)}
              </span>
            </div>
          </div>
        </div>

        {/* Row 4: Jumlah Barang (Batch / Multi Item Specification) */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-800">
                Jumlah Barang / Unit
              </label>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Jika lebih dari 1 unit dengan nama, merk, tahun & asal yang sama, sistem otomatis
                memberi kode .1, .2, .3 dst.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={100}
                value={jumlahBarang}
                onChange={(e) => setJumlahBarang(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="w-24 px-3 py-1.5 text-center text-sm font-bold border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              <span className="text-xs font-semibold text-slate-600">Unit</span>
            </div>
          </div>

          {/* Live Code Preview Box */}
          <div className="mt-3 pt-3 border-t border-slate-200">
            <div className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold mb-1.5">
              <Layers className="w-3.5 h-3.5 text-blue-600" />
              <span>Preview Kode Barang yang Dihasilkan:</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {previewCodes.map((code, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center px-2.5 py-1 rounded bg-blue-100/70 border border-blue-200 text-blue-900 font-mono font-bold text-xs"
                >
                  {code}
                </span>
              ))}
              {jumlahBarang > 5 && (
                <span className="text-xs text-slate-500 self-center">
                  ... dan {jumlahBarang - 5} unit lainnya sampai .{jumlahBarang}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Row 5: Keterangan Tambahan */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            Catatan / Keterangan Khusus (Opsional)
          </label>
          <input
            type="text"
            value={keterangan}
            onChange={(e) => setKeterangan(e.target.value)}
            placeholder="Contoh: Pengadaan BOS Tahap I, Bantuan Alumni, Garansi 1 Tahun..."
            className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        {/* Submit Button */}
        <div className="pt-2 flex items-center justify-end gap-3">
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-900 hover:bg-blue-800 text-white text-sm font-bold rounded-lg shadow-sm hover:shadow transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Simpan & Buat Label Barcode ({jumlahBarang} Unit)</span>
          </button>
        </div>
      </form>
    </div>
  );
};
