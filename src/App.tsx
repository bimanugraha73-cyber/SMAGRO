import React, { useState, useEffect } from 'react';
import { AssetItem, OFFICIAL_KOP } from './types';
import { getStoredAssets, saveAssetsToStorage } from './services/storage';
import { initAuth, googleSignIn, logout as fbLogout } from './services/firebase';
import { User } from 'firebase/auth';
import { Header } from './components/Header';
import { AssetForm } from './components/AssetForm';
import { BarcodeLabel } from './components/BarcodeLabel';
import { SpreadsheetView } from './components/SpreadsheetView';
import { LabelPrintModal } from './components/LabelPrintModal';
import { BarcodeScannerModal } from './components/BarcodeScannerModal';
import {
  Printer,
  FileSpreadsheet,
  QrCode,
  Tag,
  CheckCircle2,
  Sliders,
  Layers,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  Search,
  AlertCircle,
  X,
} from 'lucide-react';

export default function App() {
  const [assets, setAssets] = useState<AssetItem[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [authFeedback, setAuthFeedback] = useState<{
    message: string;
    type: 'error' | 'info' | 'success';
  } | null>(null);
  const [activeTab, setActiveTab] = useState<'form' | 'spreadsheet'>('form');
  const [quickRecentSearch, setQuickRecentSearch] = useState('');

  // Print modal state
  const [printModalAssets, setPrintModalAssets] = useState<AssetItem[] | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Preview label settings in form view
  const [previewMode, setPreviewMode] = useState<'full' | 'barcode-only' | 'compact'>('full');
  const [previewBarcodeType, setPreviewBarcodeType] = useState<'qr' | 'linear' | 'both'>('qr');
  const [selectedPreviewAssetId, setSelectedPreviewAssetId] = useState<string>('');

  // Load assets from storage on mount
  useEffect(() => {
    const loaded = getStoredAssets();
    setAssets(loaded);
    if (loaded.length > 0) {
      setSelectedPreviewAssetId(loaded[0].id);
    }
  }, []);

  // Initialize Firebase Auth listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (user) => {
        setCurrentUser(user);
      },
      () => {
        setCurrentUser(null);
      }
    );
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  // Handle Google Login
  const handleGoogleLogin = async () => {
    setIsLoggingIn(true);
    setAuthFeedback(null);
    try {
      const res = await googleSignIn();
      if (res?.user) {
        setCurrentUser(res.user);
        setAuthFeedback({
          message: `Berhasil terhubung dengan Akun Google: ${res.user.displayName || res.user.email || 'Pengguna'}`,
          type: 'success',
        });
      }
      // If res is null, the user cancelled or closed the popup. Handled cleanly without alert or error.
    } catch (err: any) {
      if (err?.code === 'auth/popup-blocked') {
        setAuthFeedback({
          message:
            'Jendela pop-up Google Sign-In diblokir oleh peramban. Silakan izinkan pop-up di address bar peramban Anda atau buka aplikasi di tab baru.',
          type: 'error',
        });
      } else {
        setAuthFeedback({
          message: 'Gagal menghubungkan Google Account: ' + (err.message || 'Terjadi kesalahan tidak terduga'),
          type: 'error',
        });
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleGoogleLogout = async () => {
    try {
      await fbLogout();
      setCurrentUser(null);
    } catch (e) {
      console.error(e);
    }
  };

  // Add new assets handler
  const handleAddAssets = (newAssets: AssetItem[]) => {
    const updated = [...newAssets, ...assets];
    setAssets(updated);
    saveAssetsToStorage(updated);
    if (newAssets.length > 0) {
      setSelectedPreviewAssetId(newAssets[0].id);
    }
  };

  // Delete asset handler
  const handleDeleteAsset = (id: string) => {
    const updated = assets.filter((a) => a.id !== id);
    setAssets(updated);
    saveAssetsToStorage(updated);
    if (selectedPreviewAssetId === id && updated.length > 0) {
      setSelectedPreviewAssetId(updated[0].id);
    }
  };

  // The asset currently viewed in the preview card
  const currentPreviewAsset =
    assets.find((a) => a.id === selectedPreviewAssetId) || (assets.length > 0 ? assets[0] : null);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans flex flex-col">
      {/* Official Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        onLogin={handleGoogleLogin}
        onLogout={handleGoogleLogout}
        isLoggingIn={isLoggingIn}
        onOpenScanner={() => setIsScannerOpen(true)}
        totalAssets={assets.length}
      />

      {/* Auth Feedback Banner */}
      {authFeedback && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 w-full">
          <div
            className={`flex items-center justify-between p-3 rounded-lg border text-xs font-medium shadow-2xs ${
              authFeedback.type === 'error'
                ? 'bg-rose-50 border-rose-200 text-rose-800'
                : authFeedback.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-blue-50 border-blue-200 text-blue-800'
            }`}
          >
            <div className="flex items-center gap-2">
              {authFeedback.type === 'error' ? (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              ) : authFeedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
              )}
              <span>{authFeedback.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setAuthFeedback(null)}
              className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors"
              title="Tutup pesan"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Main Body */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full">
        {activeTab === 'form' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Asset Form */}
            <div className="lg:col-span-7 space-y-6">
              <AssetForm onAddAssets={handleAddAssets} />

              {/* Information / Guidance Card for School Staff */}
              <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs text-xs space-y-3">
                <div className="flex items-center gap-2 font-bold text-slate-800">
                  <ShieldCheck className="w-4 h-4 text-blue-900" />
                  <span>Petunjuk Kodefikasi & Tata Tertib Aset SMAN 1 Grogol</span>
                </div>
                <div className="space-y-1.5 text-slate-600 leading-relaxed">
                  <p>
                    • Format kode otomatis:{' '}
                    <code className="bg-blue-50 text-blue-950 font-mono font-bold px-1.5 py-0.5 rounded border border-blue-200">
                      AST-SMAGRO-&#123;TAHUN&#125;-&#123;ASAL&#125;-&#123;NOMOR&#125;
                    </code>{' '}
                    dengan nomor urut 4 digit mulai <code>0001</code>.
                  </p>
                  <p>
                    • Apabila input lebih dari 1 unit (batch), sistem otomatis memberikan akhiran{' '}
                    <code className="bg-blue-50 text-blue-950 font-mono font-bold px-1 rounded">
                      .1, .2, .3
                    </code>{' '}
                    sesuai instruksi dinas.
                  </p>
                  <p>
                    • Barcode QR Code memuat seluruh informasi barang beserta klausul wajib:{' '}
                    <em>"{OFFICIAL_KOP.pesanPeminjaman}"</em>.
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column: Live Barcode Label Preview & Print */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between pb-3 border-b border-gray-200 mb-3">
                  <div>
                    <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                      <QrCode className="w-4 h-4 text-blue-900" />
                      <span>Pratinjau Label Barcode Terpilih</span>
                    </h3>
                    <p className="text-[11px] text-gray-500">
                      Label stiker resmi siap tempel pada barang inventaris
                    </p>
                  </div>
                  {currentPreviewAsset && (
                    <button
                      type="button"
                      onClick={() => setPrintModalAssets([currentPreviewAsset])}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold rounded-lg shadow-xs transition-colors"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Cetak Label Ini</span>
                    </button>
                  )}
                </div>

                {/* View Mode controls */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-gray-600">Model Label:</span>
                    <div className="flex items-center gap-1 bg-gray-100 p-0.5 rounded-lg text-[11px] font-semibold text-gray-700">
                      <button
                        type="button"
                        onClick={() => setPreviewMode('full')}
                        className={`px-2 py-0.5 rounded transition-all ${
                          previewMode === 'full' ? 'bg-white shadow-xs text-blue-900' : ''
                        }`}
                      >
                        Lengkap
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewMode('barcode-only')}
                        className={`px-2 py-0.5 rounded transition-all ${
                          previewMode === 'barcode-only' ? 'bg-white shadow-xs text-blue-900' : ''
                        }`}
                      >
                        Barcode Saja
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewMode('compact')}
                        className={`px-2 py-0.5 rounded transition-all ${
                          previewMode === 'compact' ? 'bg-white shadow-xs text-blue-900' : ''
                        }`}
                      >
                        Ringkas
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-gray-600">Jenis Barcode:</span>
                    <div className="flex items-center gap-1 bg-gray-100 p-0.5 rounded-lg text-[11px] font-semibold text-gray-700">
                      <button
                        type="button"
                        onClick={() => setPreviewBarcodeType('qr')}
                        className={`px-2 py-0.5 rounded transition-all ${
                          previewBarcodeType === 'qr' ? 'bg-white shadow-xs text-blue-900' : ''
                        }`}
                      >
                        QR Code 2D
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewBarcodeType('linear')}
                        className={`px-2 py-0.5 rounded transition-all ${
                          previewBarcodeType === 'linear' ? 'bg-white shadow-xs text-blue-900' : ''
                        }`}
                      >
                        Barcode 1D
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewBarcodeType('both')}
                        className={`px-2 py-0.5 rounded transition-all ${
                          previewBarcodeType === 'both' ? 'bg-white shadow-xs text-blue-900' : ''
                        }`}
                      >
                        Keduanya
                      </button>
                    </div>
                  </div>
                </div>

                {/* Display Current Selected Label */}
                {currentPreviewAsset ? (
                  <div className="flex justify-center my-2">
                    <BarcodeLabel
                      asset={currentPreviewAsset}
                      mode={previewMode}
                      barcodeType={previewBarcodeType}
                      onPrintSingle={(ast) => setPrintModalAssets([ast])}
                    />
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400 text-xs">
                    Belum ada data barang. Silakan input data barang pada formulir di sebelah kiri.
                  </div>
                )}

                {/* Quick selector of recent items */}
                {assets.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-gray-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-gray-700">
                        Pilih Aset Lain untuk Dilihat / Dicetak:
                      </span>
                      <button
                        type="button"
                        onClick={() => setActiveTab('spreadsheet')}
                        className="text-[11px] text-blue-700 font-bold hover:underline"
                      >
                        Buka Rekap & Filter Lengkap →
                      </button>
                    </div>

                    {/* Quick search inside recent items */}
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Filter cepat nama / kode..."
                        value={quickRecentSearch}
                        onChange={(e) => setQuickRecentSearch(e.target.value)}
                        className="w-full pl-8 pr-2 py-1 text-xs bg-slate-50 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white"
                      />
                    </div>

                    <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                      {assets
                        .filter(
                          (ast) =>
                            !quickRecentSearch ||
                            ast.namaBarang.toLowerCase().includes(quickRecentSearch.toLowerCase()) ||
                            ast.kodeBarang.toLowerCase().includes(quickRecentSearch.toLowerCase()) ||
                            ast.lokasi.toLowerCase().includes(quickRecentSearch.toLowerCase())
                        )
                        .slice(0, 12)
                        .map((ast) => (
                          <div
                            key={ast.id}
                            onClick={() => setSelectedPreviewAssetId(ast.id)}
                            className={`p-2 rounded-lg text-xs cursor-pointer border transition-colors flex items-center justify-between ${
                              selectedPreviewAssetId === ast.id
                                ? 'bg-blue-50 border-blue-400 text-blue-950 font-semibold'
                                : 'bg-gray-50 border-gray-200 hover:bg-gray-100 text-gray-700'
                            }`}
                          >
                            <div className="min-w-0 pr-2">
                              <div className="font-mono text-[10.5px] truncate">{ast.kodeBarang}</div>
                              <div className="truncate text-[11px] text-gray-600">
                                {ast.namaBarang} ({ast.lokasi})
                              </div>
                            </div>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-white border border-gray-300 font-semibold shrink-0">
                              {ast.asalPenerimaan}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Tab 2: Spreadsheet / Excel Mode View */
          <SpreadsheetView
            assets={assets}
            currentUser={currentUser}
            onDeleteAsset={handleDeleteAsset}
            onPrintSelectedLabels={(selected) => setPrintModalAssets(selected)}
            onSignInGoogle={handleGoogleLogin}
          />
        )}
      </main>

      {/* Label Print Modal */}
      {printModalAssets && (
        <LabelPrintModal
          assets={printModalAssets}
          onClose={() => setPrintModalAssets(null)}
        />
      )}

      {/* Barcode Scanner / Verifier Modal */}
      {isScannerOpen && (
        <BarcodeScannerModal
          assets={assets}
          onClose={() => setIsScannerOpen(false)}
        />
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12 py-5 text-center text-xs text-gray-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>
            © {new Date().getFullYear()} Tata Usaha Bagian Aset • {OFFICIAL_KOP.namaSekolah}
          </p>
          <p className="text-[11px]">
            {OFFICIAL_KOP.alamat} • Telp: (0354) 773009
          </p>
        </div>
      </footer>
    </div>
  );
}
