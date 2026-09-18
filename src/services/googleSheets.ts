import { AssetItem, OFFICIAL_KOP } from '../types';
import { getAccessToken } from './firebase';

export interface ExportResult {
  spreadsheetId: string;
  spreadsheetUrl: string;
  title: string;
}

/**
 * Creates a new formatted Google Spreadsheet in user's Google Drive with asset data
 */
export const exportToGoogleSheets = async (
  assets: AssetItem[],
  titleCustom?: string
): Promise<ExportResult> => {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Belum login ke Akun Google. Silakan masuk terlebih dahulu.');
  }

  const dateStr = new Date().toISOString().split('T')[0];
  const title = titleCustom || `Rekap Aset SMAN 1 Grogol - ${dateStr}`;

  // 1. Create Spreadsheet with metadata and sheets
  const createResponse = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        title,
      },
      sheets: [
        {
          properties: {
            title: 'Daftar Aset',
            gridProperties: {
              frozenRowCount: 6,
            },
          },
        },
      ],
    }),
  });

  if (!createResponse.ok) {
    const err = await createResponse.json();
    throw new Error(err.error?.message || 'Gagal membuat Google Spreadsheet baru.');
  }

  const createdData = await createResponse.json();
  const spreadsheetId = createdData.spreadsheetId;
  const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  // 2. Prepare rows
  const headerRows = [
    [OFFICIAL_KOP.provinsi],
    [OFFICIAL_KOP.dinas],
    [OFFICIAL_KOP.namaSekolah],
    [OFFICIAL_KOP.alamat + ' | ' + OFFICIAL_KOP.kontak],
    ['LAPORAN REKAPITULASI BUKU INDUK ASET DAN INVENTARIS'],
    [
      'No',
      'Kode Barang',
      'Nama Barang',
      'Merk / Tipe',
      'Kondisi',
      'Lokasi Penggunaan',
      'Tahun Penerimaan',
      'Asal Penerimaan',
      'Catatan / Peminjaman',
      'Tanggal Input',
    ],
  ];

  const dataRows = assets.map((item, index) => [
    index + 1,
    item.kodeBarang,
    item.namaBarang,
    item.merkTipe || '-',
    item.kondisi,
    item.lokasi,
    item.tahunTerima,
    item.asalPenerimaan,
    item.keterangan || 'Hubungi Bagian Aset TU',
    item.tanggalInput,
  ]);

  const allRows = [...headerRows, ...dataRows];

  // 3. Append / write values
  const appendResponse = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Daftar%20Aset!A1:J${allRows.length}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: allRows,
      }),
    }
  );

  if (!appendResponse.ok) {
    const err = await appendResponse.json();
    throw new Error(err.error?.message || 'Gagal mengisi data ke Google Spreadsheet.');
  }

  // 4. Style the spreadsheet headers (Bold header, borders, colors)
  try {
    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [
          // Bold title rows (Row 0 to 4)
          {
            repeatCell: {
              range: {
                sheetId: 0,
                startRowIndex: 0,
                endRowIndex: 5,
                startColumnIndex: 0,
                endColumnIndex: 10,
              },
              cell: {
                userEnteredFormat: {
                  horizontalAlignment: 'CENTER',
                  textFormat: {
                    bold: true,
                    fontSize: 11,
                  },
                },
              },
              fields: 'userEnteredFormat(textFormat,horizontalAlignment)',
            },
          },
          // Format table header (Row 5)
          {
            repeatCell: {
              range: {
                sheetId: 0,
                startRowIndex: 5,
                endRowIndex: 6,
                startColumnIndex: 0,
                endColumnIndex: 10,
              },
              cell: {
                userEnteredFormat: {
                  backgroundColor: { red: 0.08, green: 0.35, blue: 0.65 },
                  horizontalAlignment: 'CENTER',
                  textFormat: {
                    bold: true,
                    foregroundColor: { red: 1, green: 1, blue: 1 },
                  },
                },
              },
              fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)',
            },
          },
        ],
      }),
    });
  } catch (e) {
    console.warn('Formatting spreadsheet failed, content is still intact:', e);
  }

  return {
    spreadsheetId,
    spreadsheetUrl,
    title,
  };
};
