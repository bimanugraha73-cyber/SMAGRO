import { AssetItem, AsalPenerimaan, KondisiBarang } from '../types';

const STORAGE_KEY = 'sman1grogol_aset_records_v1';
const NEXT_SEQ_KEY = 'sman1grogol_aset_next_seq';

// Seed initial realistic assets for SMAN 1 Grogol if empty
const INITIAL_ASSETS: AssetItem[] = [
  {
    id: 'ast-init-0001',
    kodeBarang: 'AST-SMAGRO-2024-BOS-0001',
    namaBarang: 'Laptop ASUS VivoBook 14',
    merkTipe: 'ASUS A416MA-FHD421 Core i3',
    kondisi: 'Baik',
    lokasi: 'Laboratorium Komputer 1',
    tahunTerima: 2024,
    asalPenerimaan: 'BOS',
    nomorUrut: 1,
    keterangan: 'Digunakan untuk praktikum TIK & Asesmen Nasional',
    tanggalInput: '2024-02-15',
  },
  {
    id: 'ast-init-0002-1',
    kodeBarang: 'AST-SMAGRO-2024-BPOPP-0002.1',
    namaBarang: 'Proyektor InFocus DLP',
    merkTipe: 'InFocus IN114xv 3800 Lumens',
    kondisi: 'Baik',
    lokasi: 'Ruang Kelas XII MIPA 1',
    tahunTerima: 2024,
    asalPenerimaan: 'BPOPP',
    nomorUrut: 2,
    subIndex: 1,
    totalBatch: 2,
    keterangan: 'Paket Pengadaan Multimedia Kelas',
    tanggalInput: '2024-03-10',
  },
  {
    id: 'ast-init-0002-2',
    kodeBarang: 'AST-SMAGRO-2024-BPOPP-0002.2',
    namaBarang: 'Proyektor InFocus DLP',
    merkTipe: 'InFocus IN114xv 3800 Lumens',
    kondisi: 'Baik',
    lokasi: 'Ruang Kelas XII MIPA 2',
    tahunTerima: 2024,
    asalPenerimaan: 'BPOPP',
    nomorUrut: 2,
    subIndex: 2,
    totalBatch: 2,
    keterangan: 'Paket Pengadaan Multimedia Kelas',
    tanggalInput: '2024-03-10',
  },
  {
    id: 'ast-init-0003-1',
    kodeBarang: 'AST-SMAGRO-2023-KOMITE-0003.1',
    namaBarang: 'Meja Siswa Kayu Jati',
    merkTipe: 'Standar SMAGRO K-20',
    kondisi: 'Baik',
    lokasi: 'Ruang Kelas X-A',
    tahunTerima: 2023,
    asalPenerimaan: 'KOMITE',
    nomorUrut: 3,
    subIndex: 1,
    totalBatch: 3,
    keterangan: 'Bantuan Komite Sekolah TA 2023/2024',
    tanggalInput: '2023-08-04',
  },
  {
    id: 'ast-init-0003-2',
    kodeBarang: 'AST-SMAGRO-2023-KOMITE-0003.2',
    namaBarang: 'Meja Siswa Kayu Jati',
    merkTipe: 'Standar SMAGRO K-20',
    kondisi: 'Baik',
    lokasi: 'Ruang Kelas X-A',
    tahunTerima: 2023,
    asalPenerimaan: 'KOMITE',
    nomorUrut: 3,
    subIndex: 2,
    totalBatch: 3,
    keterangan: 'Bantuan Komite Sekolah TA 2023/2024',
    tanggalInput: '2023-08-04',
  },
  {
    id: 'ast-init-0003-3',
    kodeBarang: 'AST-SMAGRO-2023-KOMITE-0003.3',
    namaBarang: 'Meja Siswa Kayu Jati',
    merkTipe: 'Standar SMAGRO K-20',
    kondisi: 'Rusak Ringan',
    lokasi: 'Ruang Kelas X-A',
    tahunTerima: 2023,
    asalPenerimaan: 'KOMITE',
    nomorUrut: 3,
    subIndex: 3,
    totalBatch: 3,
    keterangan: 'Pernis terkelupas sedikit, masih layak pakai',
    tanggalInput: '2023-08-04',
  },
  {
    id: 'ast-init-0004',
    kodeBarang: 'AST-SMAGRO-2022-HIBAH-0004',
    namaBarang: 'Mikroskop Binokuler Olympus',
    merkTipe: 'Olympus CX23 LED',
    kondisi: 'Baik',
    lokasi: 'Laboratorium Biologi',
    tahunTerima: 2022,
    asalPenerimaan: 'HIBAH',
    nomorUrut: 4,
    keterangan: 'Hibah Alumni Angkatan 2000',
    tanggalInput: '2022-11-20',
  }
];

export const getStoredAssets = (): AssetItem[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_ASSETS));
      localStorage.setItem(NEXT_SEQ_KEY, '5');
      return INITIAL_ASSETS;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load assets from localStorage:', e);
    return INITIAL_ASSETS;
  }
};

export const saveAssetsToStorage = (assets: AssetItem[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(assets));
  } catch (e) {
    console.error('Failed to save assets to localStorage:', e);
  }
};

export const getNextNomorUrut = (): number => {
  try {
    const raw = localStorage.getItem(NEXT_SEQ_KEY);
    if (raw && !isNaN(parseInt(raw, 10))) {
      return parseInt(raw, 10);
    }
    const assets = getStoredAssets();
    if (assets.length === 0) return 1;
    const maxNum = Math.max(...assets.map(a => a.nomorUrut || 0));
    return maxNum + 1;
  } catch {
    return 1;
  }
};

export const setNextNomorUrut = (nextSeq: number): void => {
  localStorage.setItem(NEXT_SEQ_KEY, String(nextSeq));
};

export const formatNomorUrut = (num: number): string => {
  return String(num).padStart(4, '0');
};

/**
 * Format standard code according to specifications:
 * Single item: AST-SMAGRO-{TAHUN TERIMA}-{ASAL PENERIMAAN}-{NOMOR URUT ASET}
 * Multi items: AST-SMAGRO-{TAHUN TERIMA}-{ASAL PENERIMAAN}-{NOMOR URUT ASET}.{jumlah barang} (.1, .2, .3...)
 */
export const generateKodeBarang = (
  tahun: number,
  asal: AsalPenerimaan,
  nomorUrut: number,
  subIndex?: number,
  totalBatch?: number
): string => {
  const seqStr = formatNomorUrut(nomorUrut);
  const base = `AST-SMAGRO-${tahun}-${asal}-${seqStr}`;
  if (totalBatch && totalBatch > 1 && subIndex !== undefined) {
    return `${base}.${subIndex}`;
  }
  return base;
};
