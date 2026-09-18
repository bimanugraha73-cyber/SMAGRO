import React from 'react';
import { User } from 'firebase/auth';
import { OFFICIAL_KOP } from '../types';
import { LogOut, CheckCircle, Shield, FileSpreadsheet, PlusCircle, ScanLine, School } from 'lucide-react';

interface Props {
  activeTab: 'form' | 'spreadsheet';
  setActiveTab: (tab: 'form' | 'spreadsheet') => void;
  currentUser: User | null;
  onLogin: () => void;
  onLogout: () => void;
  isLoggingIn: boolean;
  onOpenScanner: () => void;
  totalAssets: number;
}

export const Header: React.FC<Props> = ({
  activeTab,
  setActiveTab,
  currentUser,
  onLogin,
  onLogout,
  isLoggingIn,
  onOpenScanner,
  totalAssets,
}) => {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-xs">
      {/* Top micro bar with school contact */}
      <div className="bg-slate-900 text-slate-300 text-[11px] px-4 py-1.5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-white">PEMERINTAH PROVINSI JAWA TIMUR</span>
          <span className="text-slate-500">•</span>
          <span>DINAS PENDIDIKAN</span>
          <span className="text-slate-500">•</span>
          <span className="text-amber-400 font-medium">{OFFICIAL_KOP.namaSekolah}</span>
        </div>
        <div className="flex items-center gap-3 text-slate-400">
          <span>{OFFICIAL_KOP.kontak.split(',')[0]}</span>
          <span>info@sman1grogol.sch.id</span>
        </div>
      </div>

      {/* Main header banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          {/* Subtle school icon container */}
          <div className="w-10 h-10 rounded-xl bg-blue-900 text-white flex items-center justify-center shadow-xs">
            <School className="w-5 h-5 text-amber-400" />
          </div>

          <div>
            <h1 className="text-lg sm:text-xl font-black text-gray-950 tracking-tight flex items-center gap-2">
              <span>Sistem Pencatatan & Barcode Aset Sekolah</span>
              <span className="text-[10px] font-bold bg-blue-100 text-blue-900 px-2 py-0.5 rounded-full border border-blue-200">
                Tata Usaha
              </span>
            </h1>
            <p className="text-xs text-gray-600">
              SMAN 1 Grogol Kabupaten Kediri • Label Barcode Resmi & Rekap Spreadsheet
            </p>
          </div>
        </div>

        {/* Right tools: Google Workspace Status + Scanner */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Quick Scanner button */}
          <button
            type="button"
            onClick={onOpenScanner}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg border border-slate-300 transition-colors"
          >
            <ScanLine className="w-4 h-4 text-blue-800" />
            <span>Scan / Cek Barcode</span>
          </button>

          {/* Google Sign-in / Workspace Status */}
          {currentUser ? (
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-300 px-3 py-1 rounded-lg">
              {currentUser.photoURL ? (
                <img
                  src={currentUser.photoURL}
                  alt={currentUser.displayName || 'Petugas'}
                  className="w-6 h-6 rounded-full border border-emerald-400"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-emerald-700 text-white flex items-center justify-center text-[10px] font-bold">
                  {currentUser.displayName?.[0] || 'U'}
                </div>
              )}
              <div className="text-left leading-none">
                <div className="text-[11px] font-bold text-emerald-950 truncate max-w-[120px]">
                  {currentUser.displayName || currentUser.email}
                </div>
                <div className="text-[9px] text-emerald-700 font-medium">Sheets & Drive Aktif</div>
              </div>
              <button
                type="button"
                onClick={onLogout}
                title="Keluar dari Akun Google"
                className="ml-1 p-1 hover:bg-emerald-100 rounded text-emerald-800 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            /* Official Google Sign in button as mandated by workspace-integration */
            <button
              type="button"
              onClick={onLogin}
              disabled={isLoggingIn}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg shadow-xs text-xs font-semibold text-gray-700 transition-all disabled:opacity-50"
            >
              <svg className="w-4 h-4" viewBox="0 0 48 48">
                <path
                  fill="#EA4335"
                  d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                />
                <path
                  fill="#4285F4"
                  d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                />
                <path
                  fill="#FBBC05"
                  d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                />
                <path
                  fill="#34A853"
                  d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                />
              </svg>
              <span>{isLoggingIn ? 'Menghubungkan...' : 'Hubungkan Google Drive/Sheets'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Tab Bar Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between border-t border-gray-100">
        <nav className="flex space-x-2 py-2">
          <button
            type="button"
            onClick={() => setActiveTab('form')}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              activeTab === 'form'
                ? 'bg-blue-900 text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Pendataan & Cetak Label</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('spreadsheet')}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              activeTab === 'spreadsheet'
                ? 'bg-blue-900 text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Pencarian, Rekap & Ekspor ({totalAssets})</span>
          </button>
        </nav>

        <div className="text-[11px] text-gray-500 font-mono hidden sm:block">
          Total Inventaris Terdata: <strong className="text-gray-900 font-bold">{totalAssets}</strong> Unit
        </div>
      </div>
    </header>
  );
};
