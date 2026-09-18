import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { AssetItem, AsalPenerimaan, KondisiBarang, OFFICIAL_KOP } from '../types';
import { exportToGoogleSheets } from '../services/googleSheets';
import { User } from 'firebase/auth';
import {
  FileSpreadsheet,
  Download,
  Printer,
  Search,
  Filter,
  CheckSquare,
  Square,
  Trash2,
  ExternalLink,
  Loader2,
  RefreshCw,
  FileCheck,
  CheckCircle2,
  Building2,
  SlidersHorizontal,
  RotateCcw,
  FileText,
  ChevronDown,
  ChevronUp,
  Layers,
  Tag,
  MapPin,
  Calendar,
  Sparkles,
  PenLine,
  User as UserIcon,
} from 'lucide-react';

export interface PengesahanPejabat {
  jabatan: string;
  sub: string;
  nama: string;
  nip: string;
}

export interface PengesahanConfig {
  kota: string;
  tanggalCustom: string;
  pejabat1: PengesahanPejabat; // Kepala Sekolah
  pejabat2: PengesahanPejabat; // Kepala Tata Usaha
  pejabat3: PengesahanPejabat; // Pengurus Barang / Aset
}

const DEFAULT_PENGESAHAN: PengesahanConfig = {
  kota: 'Kediri',
  tanggalCustom: '',
  pejabat1: {
    jabatan: 'Kepala SMAN 1 Grogol',
    sub: 'Mengetahui,',
    nama: 'Drs. H. MASHUDI, M.Pd.',
    nip: '19680512 199512 1 003',
  },
  pejabat2: {
    jabatan: 'Kepala Tata Usaha',
    sub: 'Menyetujui,',
    nama: 'SUPARNO, S.Sos.',
    nip: '19720410 199803 1 005',
  },
  pejabat3: {
    jabatan: 'Pengurus Barang / Aset',
    sub: '',
    nama: 'BIMA ADHI NUGRAHA, S.Pd.',
    nip: '19890815 201903 1 008',
  },
};

interface Props {
  assets: AssetItem[];
  currentUser: User | null;
  onDeleteAsset: (id: string) => void;
  onPrintSelectedLabels: (selected: AssetItem[]) => void;
  onSignInGoogle: () => void;
}

export const SpreadsheetView: React.FC<Props> = ({
  assets,
  currentUser,
  onDeleteAsset,
  onPrintSelectedLabels,
  onSignInGoogle,
}) => {
  // Search state
  const [searchGeneral, setSearchGeneral] = useState('');
  const [searchNama, setSearchNama] = useState('');
  const [searchKode, setSearchKode] = useState('');
  const [searchLokasi, setSearchLokasi] = useState('');
  const [searchTahun, setSearchTahun] = useState<string>('ALL');

  // Filter state
  const [selectedAsal, setSelectedAsal] = useState<string>('ALL');
  const [selectedKondisi, setSelectedKondisi] = useState<string>('ALL');
  const [isAdvancedFilterOpen, setIsAdvancedFilterOpen] = useState(false);

  // Selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isExportingSheets, setIsExportingSheets] = useState(false);
  const [googleSheetsUrl, setGoogleSheetsUrl] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(
    null
  );
  const [showPrintReportModal, setShowPrintReportModal] = useState(false);
  const [showConfirmSheetsModal, setShowConfirmSheetsModal] = useState(false);
  const [reportPaperOrientation, setReportPaperOrientation] = useState<'landscape' | 'portrait'>('landscape');

  // Manual Lembar Pengesahan (Nama & NIP yang diinput secara manual)
  const [pengesahan, setPengesahan] = useState<PengesahanConfig>(() => {
    try {
      const saved = localStorage.getItem('sman1grogol_lembar_pengesahan');
      if (saved) {
        return { ...DEFAULT_PENGESAHAN, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.warn('Gagal membaca data pengesahan:', e);
    }
    return DEFAULT_PENGESAHAN;
  });
  const [showEditSignersPanel, setShowEditSignersPanel] = useState(false);

  const updatePengesahan = (
    key: 'pejabat1' | 'pejabat2' | 'pejabat3',
    field: 'nama' | 'nip' | 'jabatan' | 'sub',
    value: string
  ) => {
    setPengesahan((prev) => {
      const next = {
        ...prev,
        [key]: {
          ...prev[key],
          [field]: value,
        },
      };
      localStorage.setItem('sman1grogol_lembar_pengesahan', JSON.stringify(next));
      return next;
    });
  };

  const updatePengesahanMeta = (field: 'kota' | 'tanggalCustom', value: string) => {
    setPengesahan((prev) => {
      const next = {
        ...prev,
        [field]: value,
      };
      localStorage.setItem('sman1grogol_lembar_pengesahan', JSON.stringify(next));
      return next;
    });
  };

  const resetPengesahanToDefault = () => {
    setPengesahan(DEFAULT_PENGESAHAN);
    localStorage.removeItem('sman1grogol_lembar_pengesahan');
  };

  // Available distinct years and locations
  const uniqueYears = useMemo(() => {
    const years = Array.from(new Set(assets.map((a) => a.tahunTerima))).sort((a, b) => b - a);
    return years;
  }, [assets]);

  const uniqueLocations = useMemo(() => {
    const locs = Array.from(new Set(assets.map((a) => a.lokasi))).sort();
    return locs;
  }, [assets]);

  // Counts per Asal Penerimaan
  const countPerAsal = useMemo(() => {
    const counts: Record<string, number> = {
      ALL: assets.length,
      BOS: 0,
      BPOPP: 0,
      KOMITE: 0,
      HIBAH: 0,
      DLL: 0,
    };
    assets.forEach((a) => {
      if (counts[a.asalPenerimaan] !== undefined) {
        counts[a.asalPenerimaan]++;
      } else {
        counts.DLL++;
      }
    });
    return counts;
  }, [assets]);

  // Check if any filter is actively applied
  const isFilterActive = useMemo(() => {
    return (
      searchGeneral.trim() !== '' ||
      searchNama.trim() !== '' ||
      searchKode.trim() !== '' ||
      searchLokasi.trim() !== '' ||
      searchTahun !== 'ALL' ||
      selectedAsal !== 'ALL' ||
      selectedKondisi !== 'ALL'
    );
  }, [searchGeneral, searchNama, searchKode, searchLokasi, searchTahun, selectedAsal, selectedKondisi]);

  // Reset all filters
  const handleResetFilters = () => {
    setSearchGeneral('');
    setSearchNama('');
    setSearchKode('');
    setSearchLokasi('');
    setSearchTahun('ALL');
    setSelectedAsal('ALL');
    setSelectedKondisi('ALL');
  };

  // Filtered assets based on all criteria
  const filteredAssets = useMemo(() => {
    return assets.filter((item) => {
      // 1. General search query (all fields)
      const q = searchGeneral.trim().toLowerCase();
      const matchGeneral =
        !q ||
        item.namaBarang.toLowerCase().includes(q) ||
        item.kodeBarang.toLowerCase().includes(q) ||
        (item.merkTipe && item.merkTipe.toLowerCase().includes(q)) ||
        item.lokasi.toLowerCase().includes(q) ||
        String(item.tahunTerima).includes(q) ||
        (item.keterangan && item.keterangan.toLowerCase().includes(q));

      // 2. Specific Search: Nama Barang
      const matchNama =
        !searchNama.trim() || item.namaBarang.toLowerCase().includes(searchNama.trim().toLowerCase());

      // 3. Specific Search: Kode Barang
      const matchKode =
        !searchKode.trim() || item.kodeBarang.toLowerCase().includes(searchKode.trim().toLowerCase());

      // 4. Specific Search: Lokasi Penggunaan
      const matchLokasi =
        !searchLokasi.trim() || item.lokasi.toLowerCase().includes(searchLokasi.trim().toLowerCase());

      // 5. Specific Search: Tahun Penerimaan
      const matchTahun = searchTahun === 'ALL' || item.tahunTerima === Number(searchTahun);

      // 6. Filter: Asal Penerimaan (BOS, BPOPP, KOMITE, HIBAH, DLL)
      const matchAsal = selectedAsal === 'ALL' || item.asalPenerimaan === selectedAsal;

      // 7. Filter: Kondisi Barang
      const matchKondisi = selectedKondisi === 'ALL' || item.kondisi === selectedKondisi;

      return (
        matchGeneral &&
        matchNama &&
        matchKode &&
        matchLokasi &&
        matchTahun &&
        matchAsal &&
        matchKondisi
      );
    });
  }, [
    assets,
    searchGeneral,
    searchNama,
    searchKode,
    searchLokasi,
    searchTahun,
    selectedAsal,
    selectedKondisi,
  ]);

  // Statistics for current filtered assets
  const stats = useMemo(() => {
    return {
      total: filteredAssets.length,
      baik: filteredAssets.filter((a) => a.kondisi === 'Baik').length,
      rusakRingan: filteredAssets.filter((a) => a.kondisi === 'Rusak Ringan').length,
      rusakBerat: filteredAssets.filter((a) => a.kondisi === 'Rusak Berat').length,
      bos: filteredAssets.filter((a) => a.asalPenerimaan === 'BOS').length,
      bpopp: filteredAssets.filter((a) => a.asalPenerimaan === 'BPOPP').length,
      komite: filteredAssets.filter((a) => a.asalPenerimaan === 'KOMITE').length,
      hibah: filteredAssets.filter((a) => a.asalPenerimaan === 'HIBAH').length,
      dll: filteredAssets.filter((a) => a.asalPenerimaan === 'DLL').length,
    };
  }, [filteredAssets]);

  // Selection handlers
  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredAssets.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredAssets.map((a) => a.id));
    }
  };

  // 1. Export to Excel (.xlsx) file
  const handleExportLocalExcel = () => {
    try {
      const rows = filteredAssets.map((item, index) => ({
        'No.': index + 1,
        'Kode Barang': item.kodeBarang,
        'Nama Barang': item.namaBarang,
        'Merk / Tipe': item.merkTipe || '-',
        'Kondisi Barang': item.kondisi,
        'Lokasi Penggunaan': item.lokasi,
        'Tahun Penerimaan': item.tahunTerima,
        'Asal Penerimaan': item.asalPenerimaan,
        'Keterangan / Prosedur': item.keterangan || OFFICIAL_KOP.pesanPeminjaman,
        'Tanggal Input': item.tanggalInput,
      }));

      // Add a summary row
      const summaryRow = {
        'No.': '',
        'Kode Barang': 'TOTAL REKAPITULASI',
        'Nama Barang': `${filteredAssets.length} Unit Barang`,
        'Merk / Tipe': '',
        'Kondisi Barang': `Baik: ${stats.baik}, Rusak Ringan: ${stats.rusakRingan}, Rusak Berat: ${stats.rusakBerat}`,
        'Lokasi Penggunaan': '',
        'Tahun Penerimaan': '',
        'Asal Penerimaan': `BOS: ${stats.bos}, BPOPP: ${stats.bpopp}, KOMITE: ${stats.komite}, HIBAH: ${stats.hibah}, DLL: ${stats.dll}`,
        'Keterangan / Prosedur': `Dicetak dari Sistem Aset ${OFFICIAL_KOP.namaSekolah}`,
        'Tanggal Input': new Date().toLocaleDateString('id-ID'),
      };

      const allRows = [...rows, summaryRow];
      const worksheet = XLSX.utils.json_to_sheet(allRows);

      // Auto-fit column widths
      worksheet['!cols'] = [
        { wch: 6 },
        { wch: 32 },
        { wch: 30 },
        { wch: 22 },
        { wch: 18 },
        { wch: 26 },
        { wch: 16 },
        { wch: 16 },
        { wch: 45 },
        { wch: 15 },
      ];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Rekap Aset SMAN 1 Grogol');

      const dateStr = new Date().toISOString().split('T')[0];
      XLSX.writeFile(workbook, `Rekap_Aset_SMAN1_Grogol_${dateStr}.xlsx`);

      setFeedbackMsg({
        text: `Berhasil mengunduh ${filteredAssets.length} data aset dalam format Excel (.xlsx).`,
        type: 'success',
      });
      setTimeout(() => setFeedbackMsg(null), 4000);
    } catch (e: any) {
      setFeedbackMsg({
        text: 'Gagal mengunduh file Excel: ' + e.message,
        type: 'error',
      });
    }
  };

  // 2. Export to CSV (.csv) file with UTF-8 BOM
  const handleExportCSV = () => {
    try {
      const headers = [
        'No',
        'Kode Barang',
        'Nama Barang',
        'Merk / Tipe',
        'Kondisi Barang',
        'Lokasi Penggunaan',
        'Tahun Penerimaan',
        'Asal Penerimaan',
        'Keterangan',
        'Tanggal Input',
      ];

      const escapeCsv = (val: any) => {
        if (val === null || val === undefined) return '""';
        const str = String(val).replace(/"/g, '""');
        return `"${str}"`;
      };

      const rows = filteredAssets.map((item, idx) => [
        idx + 1,
        item.kodeBarang,
        item.namaBarang,
        item.merkTipe || '-',
        item.kondisi,
        item.lokasi,
        item.tahunTerima,
        item.asalPenerimaan,
        item.keterangan || '-',
        item.tanggalInput,
      ]);

      // Summary row
      rows.push([
        '',
        'TOTAL REKAP',
        `${filteredAssets.length} Unit`,
        '',
        `B:${stats.baik} RR:${stats.rusakRingan} RB:${stats.rusakBerat}`,
        '',
        '',
        `BOS:${stats.bos} BPOPP:${stats.bpopp} KOMITE:${stats.komite} HIBAH:${stats.hibah} DLL:${stats.dll}`,
        `Sistem Aset ${OFFICIAL_KOP.namaSekolah}`,
        new Date().toLocaleDateString('id-ID'),
      ]);

      const csvContent =
        '\uFEFF' + // UTF-8 BOM so Excel opens without mojibake
        [headers.map(escapeCsv).join(','), ...rows.map((row) => row.map(escapeCsv).join(','))].join(
          '\r\n'
        );

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const dateStr = new Date().toISOString().split('T')[0];
      link.href = url;
      link.setAttribute('download', `Rekap_Aset_SMAN1_Grogol_${dateStr}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setFeedbackMsg({
        text: `Berhasil mengunduh ${filteredAssets.length} data aset dalam format CSV (.csv).`,
        type: 'success',
      });
      setTimeout(() => setFeedbackMsg(null), 4000);
    } catch (err: any) {
      setFeedbackMsg({
        text: 'Gagal mengunduh CSV: ' + err.message,
        type: 'error',
      });
    }
  };

  // 3. Google Sheets sync with explicit confirmation dialog
  const handleTriggerGoogleSheetsExport = () => {
    if (!currentUser) {
      onSignInGoogle();
      return;
    }
    setShowConfirmSheetsModal(true);
  };

  const handleExecuteGoogleSheets = async () => {
    setShowConfirmSheetsModal(false);
    setIsExportingSheets(true);
    setFeedbackMsg(null);

    try {
      const result = await exportToGoogleSheets(
        filteredAssets.length > 0 ? filteredAssets : assets,
        `Rekap Aset SMAN 1 Grogol (${new Date().toLocaleDateString('id-ID')})`
      );
      setGoogleSheetsUrl(result.spreadsheetUrl);
      setFeedbackMsg({
        text: `Berhasil mengekspor ${filteredAssets.length} aset ke Google Sheets di Google Drive Anda!`,
        type: 'success',
      });
    } catch (err: any) {
      setFeedbackMsg({
        text: 'Gagal mengekspor ke Google Sheets: ' + err.message,
        type: 'error',
      });
    } finally {
      setIsExportingSheets(false);
    }
  };

  const handlePrintRekapReport = () => {
    setShowPrintReportModal(true);
  };

  const handlePrintLabelsForSelected = () => {
    const selected = assets.filter((a) => selectedIds.includes(a.id));
    if (selected.length === 0) {
      setFeedbackMsg({
        text: 'Pilih setidaknya satu barang pada tabel untuk dicetak labelnya.',
        type: 'error',
      });
      return;
    }
    onPrintSelectedLabels(selected);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Top Banner Toolbar */}
      <div className="p-5 border-b border-gray-200 bg-slate-50/60">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-700" />
              <h3 className="font-bold text-base text-gray-900">
                Pencarian, Filter & Rekapitulasi Aset Sekolah
              </h3>
            </div>
            <p className="text-xs text-gray-600 mt-1">
              Daftar inventaris lengkap SMAN 1 Grogol Kabupaten Kediri. Cari berdasarkan nama, kode,
              lokasi, tahun, dan filter asal dana.
            </p>
          </div>

          {/* Action buttons: Excel, CSV, Google Sheets, & Cetak Laporan */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Download Excel (.xlsx) */}
            <button
              type="button"
              onClick={handleExportLocalExcel}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
              title="Unduh data dalam format file Excel"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Ekspor Excel (.xlsx)</span>
            </button>

            {/* Download CSV (.csv) */}
            <button
              type="button"
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
              title="Unduh data dalam format file CSV"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Ekspor CSV</span>
            </button>

            {/* Export to Google Sheets */}
            <button
              type="button"
              onClick={handleTriggerGoogleSheetsExport}
              disabled={isExportingSheets}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors disabled:opacity-50"
              title="Kirim dan buat spreadsheet di Google Drive"
            >
              {isExportingSheets ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <FileSpreadsheet className="w-3.5 h-3.5" />
              )}
              <span>
                {currentUser ? 'Sinkron Google Sheets' : 'Login Google & Buka di Sheets'}
              </span>
            </button>

            {/* Cetak Rekapitulasi Laporan */}
            <button
              type="button"
              onClick={handlePrintRekapReport}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
              title="Cetak format laporan resmi buku induk dengan tanda tangan"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Laporan</span>
            </button>
          </div>
        </div>

        {/* Feedback message banner */}
        {feedbackMsg && (
          <div
            className={`mt-3 p-3 rounded-lg text-xs flex items-center justify-between gap-2 ${
              feedbackMsg.type === 'success'
                ? 'bg-emerald-50 text-emerald-900 border border-emerald-300'
                : 'bg-rose-50 text-rose-900 border border-rose-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{feedbackMsg.text}</span>
            </div>
            {googleSheetsUrl && (
              <a
                href={googleSheetsUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-blue-700 underline font-bold"
              >
                <span>Buka Google Sheets</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        )}

        {/* 1. FILTER ASAL PENERIMAAN (BOS, BPOPP, KOMITE, HIBAH, DLL) */}
        <div className="mt-4 pt-3 border-t border-gray-200/80">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2 text-xs font-bold text-gray-800">
              <Tag className="w-3.5 h-3.5 text-blue-900" />
              <span>Filter Asal Penerimaan (Sumber Dana):</span>
            </div>
            {isFilterActive && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 hover:text-rose-900 hover:underline transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Semua Filter & Pencarian</span>
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                { id: 'ALL', label: 'Semua Asal', count: countPerAsal.ALL, color: 'bg-slate-100 text-slate-800 hover:bg-slate-200' },
                { id: 'BOS', label: 'BOS', count: countPerAsal.BOS, color: 'bg-blue-50 text-blue-900 hover:bg-blue-100 border-blue-200' },
                { id: 'BPOPP', label: 'BPOPP', count: countPerAsal.BPOPP, color: 'bg-indigo-50 text-indigo-900 hover:bg-indigo-100 border-indigo-200' },
                { id: 'KOMITE', label: 'KOMITE', count: countPerAsal.KOMITE, color: 'bg-purple-50 text-purple-900 hover:bg-purple-100 border-purple-200' },
                { id: 'HIBAH', label: 'HIBAH', count: countPerAsal.HIBAH, color: 'bg-amber-50 text-amber-900 hover:bg-amber-100 border-amber-200' },
                { id: 'DLL', label: 'DLL', count: countPerAsal.DLL, color: 'bg-emerald-50 text-emerald-900 hover:bg-emerald-100 border-emerald-200' },
              ] as const
            ).map((fund) => {
              const isActive = selectedAsal === fund.id;
              return (
                <button
                  key={fund.id}
                  type="button"
                  onClick={() => setSelectedAsal(fund.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    isActive
                      ? 'bg-blue-900 text-white border-blue-950 shadow-xs ring-2 ring-blue-500/20'
                      : `${fund.color} border-gray-200`
                  }`}
                >
                  <span>{fund.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      isActive ? 'bg-blue-800 text-amber-300' : 'bg-white/80 text-gray-700'
                    }`}
                  >
                    {fund.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. PENCARIAN TERPERINCI (Nama Barang, Kode Barang, Lokasi, Tahun) */}
        <div className="mt-3.5 bg-white p-3.5 rounded-xl border border-gray-200 shadow-2xs">
          {/* Main quick search bar + toggle for advanced search */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2.5">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
              <input
                type="text"
                placeholder="Pencarian cepat (Nama, Kode, Lokasi, Merk, dll)..."
                value={searchGeneral}
                onChange={(e) => setSearchGeneral(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50/70 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all font-medium"
              />
              {searchGeneral && (
                <button
                  type="button"
                  onClick={() => setSearchGeneral('')}
                  className="absolute right-2.5 top-2 text-gray-400 hover:text-gray-600 text-xs px-1"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Kondisi Filter Dropdown */}
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[11px] font-semibold text-gray-500">Kondisi:</span>
              <select
                value={selectedKondisi}
                onChange={(e) => setSelectedKondisi(e.target.value)}
                className="py-2 px-2.5 text-xs bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium"
              >
                <option value="ALL">Semua Kondisi</option>
                <option value="Baik">Baik</option>
                <option value="Rusak Ringan">Rusak Ringan</option>
                <option value="Rusak Berat">Rusak Berat</option>
              </select>
            </div>

            {/* Advanced Multi-Field Toggle */}
            <button
              type="button"
              onClick={() => setIsAdvancedFilterOpen(!isAdvancedFilterOpen)}
              className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border transition-colors shrink-0 ${
                isAdvancedFilterOpen ||
                searchNama ||
                searchKode ||
                searchLokasi ||
                searchTahun !== 'ALL'
                  ? 'bg-blue-50 text-blue-900 border-blue-300'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-300'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Pencarian Terperinci (Nama, Kode, Lokasi, Tahun)</span>
              {isAdvancedFilterOpen ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>
          </div>

          {/* Expandable Advanced Multi-field Search Panel */}
          {isAdvancedFilterOpen && (
            <div className="mt-3 pt-3 border-t border-gray-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-50/50 p-3 rounded-lg">
              {/* 1. Nama Barang */}
              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1 flex items-center gap-1">
                  <span>Nama Barang</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Proyektor, Laptop..."
                  value={searchNama}
                  onChange={(e) => setSearchNama(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              {/* 2. Kode Barang */}
              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1 flex items-center gap-1">
                  <span>Kode Barang</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: AST-SMAGRO, 0001..."
                  value={searchKode}
                  onChange={(e) => setSearchKode(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono"
                />
              </div>

              {/* 3. Lokasi Penggunaan */}
              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-gray-500" />
                  <span>Lokasi Penggunaan</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Lab Komputer, Ruang TU..."
                  value={searchLokasi}
                  onChange={(e) => setSearchLokasi(e.target.value)}
                  list="locations-list"
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
                <datalist id="locations-list">
                  {uniqueLocations.map((loc) => (
                    <option key={loc} value={loc} />
                  ))}
                </datalist>
              </div>

              {/* 4. Tahun Penerimaan */}
              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-gray-500" />
                  <span>Tahun Penerimaan</span>
                </label>
                <select
                  value={searchTahun}
                  onChange={(e) => setSearchTahun(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium"
                >
                  <option value="ALL">Semua Tahun</option>
                  {uniqueYears.map((yr) => (
                    <option key={yr} value={yr}>
                      Tahun {yr}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Quick Statistics Bar */}
        <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-1 bg-white border border-gray-300 rounded-md font-bold text-gray-900 shadow-2xs">
              Menampilkan: {stats.total} unit
              {isFilterActive && <span className="text-blue-700 font-semibold ml-1">(Tersaring)</span>}
            </span>
            <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-200 rounded font-medium text-emerald-800">
              Baik: <strong>{stats.baik}</strong>
            </span>
            <span className="px-2 py-0.5 bg-amber-50 border border-amber-200 rounded font-medium text-amber-800">
              Rusak Ringan: <strong>{stats.rusakRingan}</strong>
            </span>
            <span className="px-2 py-0.5 bg-rose-50 border border-rose-200 rounded font-medium text-rose-800">
              Rusak Berat: <strong>{stats.rusakBerat}</strong>
            </span>
          </div>

          <div className="text-[11px] text-gray-500 flex items-center gap-2">
            <span>
              Dana: BOS (<strong>{stats.bos}</strong>) • BPOPP (<strong>{stats.bpopp}</strong>) •
              KOMITE (<strong>{stats.komite}</strong>) • HIBAH (<strong>{stats.hibah}</strong>) • DLL (
              <strong>{stats.dll}</strong>)
            </span>
          </div>
        </div>
      </div>

      {/* Action Bar for selected items */}
      {selectedIds.length > 0 && (
        <div className="bg-blue-50 border-b border-blue-200 px-5 py-2.5 flex items-center justify-between text-xs text-blue-950">
          <span className="font-semibold">
            {selectedIds.length} barang terpilih dari tabel
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrintLabelsForSelected}
              className="inline-flex items-center gap-1 px-3 py-1 bg-blue-900 text-white font-medium rounded hover:bg-blue-800 transition-colors shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Barcode Terpilih ({selectedIds.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="px-2.5 py-1 text-gray-600 hover:text-gray-900"
            >
              Batalkan Pilihan
            </button>
          </div>
        </div>
      )}

      {/* Spreadsheet / Excel Table */}
      <div className="overflow-x-auto max-h-[580px]">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-slate-100/95 text-gray-700 font-semibold sticky top-0 z-10 border-b border-gray-300">
            <tr>
              <th className="p-3 w-10 text-center">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="text-gray-600 hover:text-blue-700"
                  title="Pilih Semua"
                >
                  {selectedIds.length > 0 && selectedIds.length === filteredAssets.length ? (
                    <CheckSquare className="w-4 h-4 text-blue-700" />
                  ) : (
                    <Square className="w-4 h-4" />
                  )}
                </button>
              </th>
              <th className="p-3 w-12 text-center">No</th>
              <th className="p-3 font-mono">Kode Barang (Barcode ID)</th>
              <th className="p-3">Nama Barang</th>
              <th className="p-3">Merk / Tipe</th>
              <th className="p-3">Kondisi Barang</th>
              <th className="p-3">Lokasi Penggunaan</th>
              <th className="p-3 text-center">Tahun Penerimaan</th>
              <th className="p-3 text-center">Asal Penerimaan</th>
              <th className="p-3">Keterangan</th>
              <th className="p-3 text-center w-16">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredAssets.length === 0 ? (
              <tr>
                <td colSpan={11} className="p-12 text-center text-gray-500">
                  <div className="max-w-xs mx-auto space-y-2">
                    <Search className="w-8 h-8 text-gray-300 mx-auto" />
                    <p className="font-semibold text-gray-700">Tidak ada aset yang sesuai</p>
                    <p className="text-[11px] text-gray-400">
                      Coba ubah kriteria pencarian nama, kode barang, lokasi, tahun, atau filter asal dana.
                    </p>
                    {isFilterActive && (
                      <button
                        type="button"
                        onClick={handleResetFilters}
                        className="mt-2 px-3 py-1.5 bg-blue-50 text-blue-800 text-xs font-semibold rounded-lg hover:bg-blue-100"
                      >
                        Reset Semua Filter
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              filteredAssets.map((item, idx) => {
                const isSelected = selectedIds.includes(item.id);
                return (
                  <tr
                    key={item.id}
                    className={`hover:bg-blue-50/40 transition-colors ${
                      isSelected ? 'bg-blue-50/70' : idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'
                    }`}
                  >
                    <td className="p-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleSelect(item.id)}
                        className="text-gray-500 hover:text-blue-700"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-blue-700" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </td>
                    <td className="p-3 text-center text-gray-500 font-medium">{idx + 1}</td>
                    <td className="p-3 font-mono font-bold text-blue-950 select-all whitespace-nowrap">
                      {item.kodeBarang}
                    </td>
                    <td className="p-3 font-semibold text-gray-900">{item.namaBarang}</td>
                    <td className="p-3 text-gray-600">{item.merkTipe || '-'}</td>
                    <td className="p-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10.5px] font-semibold ${
                          item.kondisi === 'Baik'
                            ? 'bg-emerald-100 text-emerald-800'
                            : item.kondisi === 'Rusak Ringan'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {item.kondisi}
                      </span>
                    </td>
                    <td className="p-3 text-gray-800 font-medium">{item.lokasi}</td>
                    <td className="p-3 text-center text-gray-700">{item.tahunTerima}</td>
                    <td className="p-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded font-bold text-[10px] ${
                          item.asalPenerimaan === 'BOS'
                            ? 'bg-blue-100 text-blue-800'
                            : item.asalPenerimaan === 'BPOPP'
                            ? 'bg-indigo-100 text-indigo-800'
                            : item.asalPenerimaan === 'KOMITE'
                            ? 'bg-purple-100 text-purple-800'
                            : item.asalPenerimaan === 'HIBAH'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {item.asalPenerimaan}
                      </span>
                    </td>
                    <td className="p-3 text-gray-500 max-w-[200px] truncate" title={item.keterangan}>
                      {item.keterangan || '-'}
                    </td>
                    <td className="p-3 text-center">
                      <button
                        type="button"
                        onClick={() => {
                          if (
                            confirm(`Hapus pencatatan aset ${item.namaBarang} (${item.kodeBarang})?`)
                          ) {
                            onDeleteAsset(item.id);
                          }
                        }}
                        className="p-1 text-gray-400 hover:text-rose-600 rounded transition-colors"
                        title="Hapus Aset"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Confirmation Modal for Google Sheets Export */}
      {showConfirmSheetsModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-gray-200 animate-in fade-in">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 text-base">
                  Ekspor ke Google Sheets
                </h4>
                <p className="text-xs text-gray-500">Google Drive Integration</p>
              </div>
            </div>

            <p className="text-sm text-gray-700 leading-relaxed">
              Aplikasi akan membuat spreadsheet baru di Google Drive Anda dengan judul:
              <br />
              <strong className="text-blue-900 font-mono text-xs block mt-1 p-2 bg-blue-50 rounded">
                Rekap Aset SMAN 1 Grogol ({filteredAssets.length} Data Barang)
              </strong>
            </p>

            <div className="mt-3 text-xs text-gray-600 bg-amber-50 p-2.5 rounded border border-amber-200">
              Dokumen akan diformat otomatis dengan Kop Surat SMAN 1 Grogol, baris judul tebal, dan kolom inventaris lengkap.
            </div>

            <div className="mt-5 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowConfirmSheetsModal(false)}
                className="px-4 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleExecuteGoogleSheets}
                className="px-4 py-2 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-lg shadow-sm"
              >
                Ya, Buat Dokumen Google Sheets
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal / View Print Rekap Laporan Resmi */}
      {showPrintReportModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div
            className={`bg-white rounded-xl ${
              reportPaperOrientation === 'landscape' ? 'max-w-6xl' : 'max-w-4xl'
            } w-full p-6 shadow-2xl my-8 text-black print:p-0 print:m-0 print:shadow-none print:max-w-none transition-all`}
          >
            {/* Top Toolbar in Print Preview Modal */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-200 mb-4 print:hidden gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Printer className="w-5 h-5 text-blue-900" />
                  <h4 className="font-bold text-base text-gray-900">
                    Pratinjau Cetak Laporan Rekapitulasi Inventaris Aset
                  </h4>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  Laporan resmi format BUKU INDUK BARANG INVENTARIS siap cetak atau simpan ke PDF.
                </p>
              </div>

              <div className="flex items-center gap-2">
                {/* Button Edit Pengesahan */}
                <button
                  type="button"
                  onClick={() => setShowEditSignersPanel((v) => !v)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all flex items-center gap-1.5 ${
                    showEditSignersPanel
                      ? 'bg-amber-100 text-amber-900 border-amber-300'
                      : 'bg-white text-gray-700 hover:bg-gray-100 border-gray-300'
                  }`}
                  title="Atur Nama dan NIP Penandatangan Lembar Pengesahan"
                >
                  <PenLine className="w-3.5 h-3.5 text-amber-700" />
                  <span>{showEditSignersPanel ? 'Tutup Atur TTD' : 'Atur Nama & NIP TTD'}</span>
                </button>

                {/* Orientation Selector */}
                <div className="flex items-center bg-gray-100 p-0.5 rounded-lg text-xs font-semibold text-gray-700">
                  <button
                    type="button"
                    onClick={() => setReportPaperOrientation('landscape')}
                    className={`px-2.5 py-1 rounded transition-all ${
                      reportPaperOrientation === 'landscape'
                        ? 'bg-white shadow-2xs text-blue-900 font-bold'
                        : ''
                    }`}
                  >
                    Landscape (Melebar)
                  </button>
                  <button
                    type="button"
                    onClick={() => setReportPaperOrientation('portrait')}
                    className={`px-2.5 py-1 rounded transition-all ${
                      reportPaperOrientation === 'portrait'
                        ? 'bg-white shadow-2xs text-blue-900 font-bold'
                        : ''
                    }`}
                  >
                    Portrait (Tegak)
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold rounded-lg shadow-xs flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak / Simpan PDF</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowPrintReportModal(false)}
                  className="px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-semibold rounded-lg"
                >
                  Tutup
                </button>
              </div>
            </div>

            {/* Quick Editor Panel for Lembar Pengesahan (Hidden during print) */}
            {showEditSignersPanel && (
              <div className="bg-amber-50/90 border border-amber-300 rounded-xl p-4 mb-4 text-xs text-gray-800 print:hidden shadow-xs">
                <div className="flex items-center justify-between pb-2 mb-3 border-b border-amber-200">
                  <div className="flex items-center gap-2">
                    <PenLine className="w-4 h-4 text-amber-800" />
                    <span className="font-bold text-sm text-amber-950">
                      Pengaturan Lembar Pengesahan (Nama & NIP Manual)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={resetPengesahanToDefault}
                    className="text-[11px] text-amber-800 hover:text-red-700 font-semibold flex items-center gap-1 hover:underline"
                    title="Kembalikan ke Nama & NIP bawaan"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Reset ke Standar
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Pejabat 1: Kepala Sekolah */}
                  <div className="bg-white p-3 rounded-lg border border-amber-200 space-y-2 shadow-2xs">
                    <div className="text-[11px] font-bold text-blue-950 flex items-center gap-1">
                      <UserIcon className="w-3.5 h-3.5 text-blue-800" />
                      <span>Pejabat 1 (Kepala SMAN 1 Grogol)</span>
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-gray-600 block mb-0.5">
                        Nama Lengkap & Gelar (Manual):
                      </label>
                      <input
                        type="text"
                        value={pengesahan.pejabat1.nama}
                        onChange={(e) => updatePengesahan('pejabat1', 'nama', e.target.value)}
                        placeholder="Contoh: Drs. H. MASHUDI, M.Pd."
                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-600 focus:outline-none font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-gray-600 block mb-0.5">
                        NIP (Nomor Induk Pegawai Manual):
                      </label>
                      <input
                        type="text"
                        value={pengesahan.pejabat1.nip}
                        onChange={(e) => updatePengesahan('pejabat1', 'nip', e.target.value)}
                        placeholder="Contoh: 19680512 199512 1 003"
                        className="w-full px-2 py-1 text-xs font-mono border border-gray-300 rounded focus:ring-1 focus:ring-blue-600 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Pejabat 2: Kepala Tata Usaha */}
                  <div className="bg-white p-3 rounded-lg border border-amber-200 space-y-2 shadow-2xs">
                    <div className="text-[11px] font-bold text-blue-950 flex items-center gap-1">
                      <UserIcon className="w-3.5 h-3.5 text-blue-800" />
                      <span>Pejabat 2 (Kepala Tata Usaha)</span>
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-gray-600 block mb-0.5">
                        Nama Lengkap & Gelar (Manual):
                      </label>
                      <input
                        type="text"
                        value={pengesahan.pejabat2.nama}
                        onChange={(e) => updatePengesahan('pejabat2', 'nama', e.target.value)}
                        placeholder="Contoh: SUPARNO, S.Sos."
                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-600 focus:outline-none font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-gray-600 block mb-0.5">
                        NIP (Nomor Induk Pegawai Manual):
                      </label>
                      <input
                        type="text"
                        value={pengesahan.pejabat2.nip}
                        onChange={(e) => updatePengesahan('pejabat2', 'nip', e.target.value)}
                        placeholder="Contoh: 19720410 199803 1 005"
                        className="w-full px-2 py-1 text-xs font-mono border border-gray-300 rounded focus:ring-1 focus:ring-blue-600 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Pejabat 3: Pengurus Barang / Aset */}
                  <div className="bg-white p-3 rounded-lg border border-amber-200 space-y-2 shadow-2xs">
                    <div className="text-[11px] font-bold text-blue-950 flex items-center gap-1">
                      <UserIcon className="w-3.5 h-3.5 text-blue-800" />
                      <span>Pejabat 3 (Pengurus Barang / Aset)</span>
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-gray-600 block mb-0.5">
                        Nama Lengkap & Gelar (Manual):
                      </label>
                      <input
                        type="text"
                        value={pengesahan.pejabat3.nama}
                        onChange={(e) => updatePengesahan('pejabat3', 'nama', e.target.value)}
                        placeholder="Contoh: BIMA ADHI NUGRAHA, S.Pd."
                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-600 focus:outline-none font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-gray-600 block mb-0.5">
                        NIP (Nomor Induk Pegawai Manual):
                      </label>
                      <input
                        type="text"
                        value={pengesahan.pejabat3.nip}
                        onChange={(e) => updatePengesahan('pejabat3', 'nip', e.target.value)}
                        placeholder="Contoh: 19890815 201903 1 008"
                        className="w-full px-2 py-1 text-xs font-mono border border-gray-300 rounded focus:ring-1 focus:ring-blue-600 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Kota & Tanggal Pengesahan */}
                <div className="mt-3 pt-2 border-t border-amber-200 flex flex-wrap items-center gap-4 text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-gray-700">Kota Pengesahan:</span>
                    <input
                      type="text"
                      value={pengesahan.kota}
                      onChange={(e) => updatePengesahanMeta('kota', e.target.value)}
                      placeholder="Kediri"
                      className="px-2 py-0.5 border border-gray-300 rounded text-xs w-28 bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
                    />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-gray-700">Tanggal Pengesahan:</span>
                    <input
                      type="text"
                      value={pengesahan.tanggalCustom}
                      onChange={(e) => updatePengesahanMeta('tanggalCustom', e.target.value)}
                      placeholder="Kosongkan untuk otomatis tanggal hari ini"
                      className="px-2 py-0.5 border border-gray-300 rounded text-xs w-64 bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
                    />
                  </div>
                  <span className="text-[10px] text-gray-500 italic ml-auto">
                    *Nama dan NIP tersimpan otomatis di browser untuk cetak berikutnya.
                  </span>
                </div>
              </div>
            )}

            {/* Printable Document Content */}
            <div className="p-4 bg-white print:p-0">
              {/* Kop Surat Resmi */}
              <div className="text-center font-serif mb-4">
                <p className="text-xs font-bold uppercase tracking-wider">{OFFICIAL_KOP.provinsi}</p>
                <p className="text-xs font-bold uppercase tracking-wider">{OFFICIAL_KOP.dinas}</p>
                <h1 className="text-base font-extrabold uppercase mt-0.5 tracking-tight font-sans text-black">
                  {OFFICIAL_KOP.namaSekolah}
                </h1>
                <p className="text-[10.5px] font-sans mt-0.5">{OFFICIAL_KOP.alamat}</p>
                <p className="text-[10px] font-sans">{OFFICIAL_KOP.kontak}</p>
                <div className="mt-2 border-b-[2.5px] border-black" />
                <div className="mt-[1.5px] border-b-[0.8px] border-black" />
              </div>

              {/* Title & Filter Information */}
              <div className="text-center my-4">
                <h2 className="text-sm font-bold uppercase underline">
                  BUKU INDUK DAN REKAPITULASI BARANG INVENTARIS
                </h2>
                <p className="text-[11px] text-gray-700 mt-0.5 font-medium">
                  Periode Rekapitulasi:{' '}
                  {new Date().toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}{' '}
                  {selectedAsal !== 'ALL' && `• Sumber Dana: ${selectedAsal}`}{' '}
                  {searchTahun !== 'ALL' && `• Tahun: ${searchTahun}`}
                </p>
              </div>

              {/* Summary Statistics Table in Printable Form */}
              <div className="mb-4 grid grid-cols-2 gap-3 text-[10px] border border-gray-400 p-2.5 rounded bg-gray-50/50 print:bg-white print:border-black">
                <div>
                  <span className="font-bold block mb-1">Rekapitulasi Menurut Kondisi:</span>
                  <div className="grid grid-cols-3 gap-1">
                    <span>Baik: <strong>{stats.baik}</strong> unit</span>
                    <span>Rusak Ringan: <strong>{stats.rusakRingan}</strong> unit</span>
                    <span>Rusak Berat: <strong>{stats.rusakBerat}</strong> unit</span>
                  </div>
                </div>
                <div>
                  <span className="font-bold block mb-1">Rekapitulasi Menurut Sumber Dana:</span>
                  <div className="grid grid-cols-5 gap-1">
                    <span>BOS: <strong>{stats.bos}</strong></span>
                    <span>BPOPP: <strong>{stats.bpopp}</strong></span>
                    <span>KOMITE: <strong>{stats.komite}</strong></span>
                    <span>HIBAH: <strong>{stats.hibah}</strong></span>
                    <span>DLL: <strong>{stats.dll}</strong></span>
                  </div>
                </div>
              </div>

              {/* Printable Table */}
              <table className="w-full text-left text-[10px] border border-black border-collapse mb-6">
                <thead>
                  <tr className="bg-gray-100 border-b border-black text-center font-bold">
                    <th className="border border-black p-1.5 w-7">No</th>
                    <th className="border border-black p-1.5">Kode Barang</th>
                    <th className="border border-black p-1.5">Nama Barang</th>
                    <th className="border border-black p-1.5">Merk / Tipe</th>
                    <th className="border border-black p-1.5">Kondisi Barang</th>
                    <th className="border border-black p-1.5">Lokasi Penggunaan</th>
                    <th className="border border-black p-1.5 w-14">Tahun Terima</th>
                    <th className="border border-black p-1.5 w-14">Asal Dana</th>
                    <th className="border border-black p-1.5">Keterangan</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAssets.map((item, i) => (
                    <tr key={item.id} className="border-b border-black">
                      <td className="border border-black p-1 text-center">{i + 1}</td>
                      <td className="border border-black p-1 font-mono font-bold whitespace-nowrap">
                        {item.kodeBarang}
                      </td>
                      <td className="border border-black p-1 font-semibold">{item.namaBarang}</td>
                      <td className="border border-black p-1">{item.merkTipe || '-'}</td>
                      <td className="border border-black p-1 text-center">{item.kondisi}</td>
                      <td className="border border-black p-1">{item.lokasi}</td>
                      <td className="border border-black p-1 text-center">{item.tahunTerima}</td>
                      <td className="border border-black p-1 text-center font-semibold">
                        {item.asalPenerimaan}
                      </td>
                      <td className="border border-black p-1 text-[9px]">
                        {item.keterangan || 'Tata Usaha Aset'}
                      </td>
                    </tr>
                  ))}
                  {/* Summary row */}
                  <tr className="border-t-2 border-black font-bold bg-gray-50">
                    <td colSpan={2} className="border border-black p-1 text-center">
                      JUMLAH UNIT
                    </td>
                    <td colSpan={7} className="border border-black p-1">
                      {filteredAssets.length} Unit Barang Terdata
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Signatures Footer - Lembar Pengesahan dengan Nama & NIP Input Manual */}
              <div className="grid grid-cols-3 gap-4 text-[10.5px] mt-8 text-center break-inside-avoid">
                {/* Kolom 1: Pejabat 1 (Kepala Sekolah) */}
                <div className="flex flex-col items-center">
                  <p className="font-medium text-gray-700 print:text-black">
                    {pengesahan.pejabat1.sub || 'Mengetahui,'}
                  </p>
                  <p className="font-bold text-gray-900 print:text-black">
                    {pengesahan.pejabat1.jabatan}
                  </p>

                  {/* Tanda Tangan Blank Area */}
                  <div className="h-16 flex items-center justify-center text-gray-300 italic text-[9px] print:text-transparent select-none">
                    (Tanda Tangan & Cap)
                  </div>

                  {/* Mode Layar: Input manual langsung */}
                  <div className="w-full max-w-[220px] space-y-1 print:hidden">
                    <input
                      type="text"
                      value={pengesahan.pejabat1.nama}
                      onChange={(e) => updatePengesahan('pejabat1', 'nama', e.target.value)}
                      placeholder="Input Nama & Gelar..."
                      title="Ubah Nama Pejabat secara manual"
                      className="w-full text-center font-bold text-xs border border-gray-300 bg-amber-50/40 rounded px-1.5 py-0.5 focus:bg-white focus:border-blue-600 focus:outline-none"
                    />
                    <div className="flex items-center justify-center gap-1 text-[10px]">
                      <span className="font-semibold text-gray-600">NIP.</span>
                      <input
                        type="text"
                        value={pengesahan.pejabat1.nip}
                        onChange={(e) => updatePengesahan('pejabat1', 'nip', e.target.value)}
                        placeholder="Input NIP..."
                        title="Ubah NIP Pejabat secara manual"
                        className="text-center font-mono text-[10px] border border-gray-300 bg-amber-50/40 rounded px-1 py-0.5 w-36 focus:bg-white focus:border-blue-600 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Mode Cetak: Format resmi bergaris bawah */}
                  <div className="hidden print:block text-center w-full">
                    <p className="font-bold underline uppercase text-[11px] text-black">
                      {pengesahan.pejabat1.nama || '(..................................................)'}
                    </p>
                    <p className="text-[10px] text-black mt-0.5 font-mono">
                      NIP. {pengesahan.pejabat1.nip || '................................................'}
                    </p>
                  </div>
                </div>

                {/* Kolom 2: Pejabat 2 (Kepala Tata Usaha) */}
                <div className="flex flex-col items-center">
                  <p className="font-medium text-gray-700 print:text-black">
                    {pengesahan.pejabat2.sub || 'Menyetujui,'}
                  </p>
                  <p className="font-bold text-gray-900 print:text-black">
                    {pengesahan.pejabat2.jabatan}
                  </p>

                  {/* Tanda Tangan Blank Area */}
                  <div className="h-16 flex items-center justify-center text-gray-300 italic text-[9px] print:text-transparent select-none">
                    (Tanda Tangan)
                  </div>

                  {/* Mode Layar: Input manual langsung */}
                  <div className="w-full max-w-[220px] space-y-1 print:hidden">
                    <input
                      type="text"
                      value={pengesahan.pejabat2.nama}
                      onChange={(e) => updatePengesahan('pejabat2', 'nama', e.target.value)}
                      placeholder="Input Nama & Gelar..."
                      title="Ubah Nama Pejabat secara manual"
                      className="w-full text-center font-bold text-xs border border-gray-300 bg-amber-50/40 rounded px-1.5 py-0.5 focus:bg-white focus:border-blue-600 focus:outline-none"
                    />
                    <div className="flex items-center justify-center gap-1 text-[10px]">
                      <span className="font-semibold text-gray-600">NIP.</span>
                      <input
                        type="text"
                        value={pengesahan.pejabat2.nip}
                        onChange={(e) => updatePengesahan('pejabat2', 'nip', e.target.value)}
                        placeholder="Input NIP..."
                        title="Ubah NIP Pejabat secara manual"
                        className="text-center font-mono text-[10px] border border-gray-300 bg-amber-50/40 rounded px-1 py-0.5 w-36 focus:bg-white focus:border-blue-600 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Mode Cetak: Format resmi bergaris bawah */}
                  <div className="hidden print:block text-center w-full">
                    <p className="font-bold underline uppercase text-[11px] text-black">
                      {pengesahan.pejabat2.nama || '(..................................................)'}
                    </p>
                    <p className="text-[10px] text-black mt-0.5 font-mono">
                      NIP. {pengesahan.pejabat2.nip || '................................................'}
                    </p>
                  </div>
                </div>

                {/* Kolom 3: Pejabat 3 (Pengurus Barang / Aset) */}
                <div className="flex flex-col items-center">
                  <p className="font-medium text-gray-700 print:text-black">
                    {pengesahan.kota},{' '}
                    {pengesahan.tanggalCustom ||
                      new Date().toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                  </p>
                  <p className="font-bold text-gray-900 print:text-black">
                    {pengesahan.pejabat3.jabatan}
                  </p>

                  {/* Tanda Tangan Blank Area */}
                  <div className="h-16 flex items-center justify-center text-gray-300 italic text-[9px] print:text-transparent select-none">
                    (Tanda Tangan)
                  </div>

                  {/* Mode Layar: Input manual langsung */}
                  <div className="w-full max-w-[220px] space-y-1 print:hidden">
                    <input
                      type="text"
                      value={pengesahan.pejabat3.nama}
                      onChange={(e) => updatePengesahan('pejabat3', 'nama', e.target.value)}
                      placeholder="Input Nama & Gelar..."
                      title="Ubah Nama Pejabat secara manual"
                      className="w-full text-center font-bold text-xs border border-gray-300 bg-amber-50/40 rounded px-1.5 py-0.5 focus:bg-white focus:border-blue-600 focus:outline-none"
                    />
                    <div className="flex items-center justify-center gap-1 text-[10px]">
                      <span className="font-semibold text-gray-600">NIP.</span>
                      <input
                        type="text"
                        value={pengesahan.pejabat3.nip}
                        onChange={(e) => updatePengesahan('pejabat3', 'nip', e.target.value)}
                        placeholder="Input NIP..."
                        title="Ubah NIP Pejabat secara manual"
                        className="text-center font-mono text-[10px] border border-gray-300 bg-amber-50/40 rounded px-1 py-0.5 w-36 focus:bg-white focus:border-blue-600 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Mode Cetak: Format resmi bergaris bawah */}
                  <div className="hidden print:block text-center w-full">
                    <p className="font-bold underline uppercase text-[11px] text-black">
                      {pengesahan.pejabat3.nama || '(..................................................)'}
                    </p>
                    <p className="text-[10px] text-black mt-0.5 font-mono">
                      NIP. {pengesahan.pejabat3.nip || '................................................'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
