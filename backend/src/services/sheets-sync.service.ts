import { google } from 'googleapis';
import { env } from '../config/env';
import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';

let sheetsClient: any = null;

function getClient() {
  if (sheetsClient) return sheetsClient;

  if (!env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !env.GOOGLE_PRIVATE_KEY || !env.GOOGLE_SPREADSHEET_ID) {
    return null;
  }

  const auth = new google.auth.JWT(
    env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    undefined,
    env.GOOGLE_PRIVATE_KEY,
    ['https://www.googleapis.com/auth/spreadsheets']
  );

  sheetsClient = google.sheets({ version: 'v4', auth });
  return sheetsClient;
}

async function isSyncEnabled(): Promise<boolean> {
  const config = await prisma.systemConfig.findUnique({
    where: { key: 'sheets_sync_enabled' },
  });
  return config?.value === 'true';
}

export async function syncEmployeesToSheets() {
  if (!(await isSyncEnabled())) return;
  const client = getClient();
  if (!client) return;

  try {
    const employees = await prisma.employee.findMany();
    const values = [
      ['DNI', 'NOMBRE', 'CARGO', 'AREA', 'FECHA_REGISTRO'],
      ...employees.map((e) => [e.dni, e.nombre, e.cargo, e.area, e.fechaRegistro.toISOString()]),
    ];

    await client.spreadsheets.values.update({
      spreadsheetId: env.GOOGLE_SPREADSHEET_ID,
      range: 'Empleados!A1',
      valueInputOption: 'RAW',
      requestBody: { values },
    });

    logger.debug('Empleados sincronizados a Google Sheets');
  } catch (error) {
    logger.error({ error }, 'Error sincronizando empleados a Sheets');
  }
}

export async function syncAttendanceToSheets() {
  if (!(await isSyncEnabled())) return;
  const client = getClient();
  if (!client) return;

  try {
    const records = await prisma.attendance.findMany({
      orderBy: { timestamp: 'desc' },
      take: 5000,
    });

    const values = [
      ['ID', 'DNI', 'NOMBRE', 'CARGO', 'TIPO', 'FECHA', 'HORA', 'PUNTO', 'LAT', 'LNG', 'TIMESTAMP'],
      ...records.map((r) => [
        r.id, r.dni, r.nombre, r.cargo, r.tipo, r.fecha, r.hora,
        r.punto || '', r.lat?.toString() || '', r.lng?.toString() || '',
        r.timestamp.toISOString(),
      ]),
    ];

    await client.spreadsheets.values.update({
      spreadsheetId: env.GOOGLE_SPREADSHEET_ID,
      range: 'Asistencias!A1',
      valueInputOption: 'RAW',
      requestBody: { values },
    });

    logger.debug('Asistencias sincronizadas a Google Sheets');
  } catch (error) {
    logger.error({ error }, 'Error sincronizando asistencias a Sheets');
  }
}

export async function syncConfigToSheets() {
  if (!(await isSyncEnabled())) return;
  const client = getClient();
  if (!client) return;

  try {
    const points = await prisma.qrPoint.findMany();
    const values = [
      ['ID', 'NOMBRE', 'LAT', 'LNG', 'RADIO', 'ACTIVO', 'FECHA_ACTUALIZACION'],
      ...points.map((p) => [
        p.id, p.nombre, p.lat.toString(), p.lng.toString(), p.radio.toString(),
        p.activo.toString(), p.fechaActualizacion.toISOString(),
      ]),
    ];

    await client.spreadsheets.values.update({
      spreadsheetId: env.GOOGLE_SPREADSHEET_ID,
      range: 'Configuracion!A1',
      valueInputOption: 'RAW',
      requestBody: { values },
    });

    logger.debug('Configuración sincronizada a Google Sheets');
  } catch (error) {
    logger.error({ error }, 'Error sincronizando config a Sheets');
  }
}
