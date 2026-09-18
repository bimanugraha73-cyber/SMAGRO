export type AsalPenerimaan = 'BOS' | 'BPOPP' | 'KOMITE' | 'HIBAH' | 'DLL';

export type KondisiBarang = 'Baik' | 'Rusak Ringan' | 'Rusak Berat';

export interface AssetItem {
  id: string;
  kodeBarang: string; // e.g. AST-SMAGRO-2024-BOS-0001 or AST-SMAGRO-2024-BOS-0001.1
  namaBarang: string;
  merkTipe?: string;
  kondisi: KondisiBarang;
  lokasi: string;
  tahunTerima: number;
  asalPenerimaan: AsalPenerimaan;
  nomorUrut: number; // raw numeric sequence
  subIndex?: number; // .1, .2 if batch
  totalBatch?: number; // total in batch if > 1
  keterangan?: string;
  tanggalInput: string;
}

export interface KopSuratData {
  provinsi: string;
  dinas: string;
  namaSekolah: string;
  alamat: string;
  kontak: string;
  pesanPeminjaman: string;
}

export const OFFICIAL_KOP: KopSuratData = {
  provinsi: 'PEMERINTAH PROVINSI JAWA TIMUR',
  dinas: 'DINAS PENDIDIKAN',
  namaSekolah: 'SMA NEGERI 1 GROGOL KABUPATEN KEDIRI',
  alamat: 'Jalan Raya Gringging 16 Sonorejo Grogol Kediri 64151',
  kontak: 'Telepon (0354) 773009, Laman sman1grogol.sch.id, Pos-el info@sman1grogol.sch.id',
  pesanPeminjaman: 'Untuk peminjaman atau pemindahan barang harus menghubungi pihak Tata Usaha Bagian ASET SMA Negeri 1 Grogol Kabupaten Kediri.',
};
