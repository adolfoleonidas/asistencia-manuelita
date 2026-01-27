// ============================================================
// GOOGLE APPS SCRIPT - SISTEMA DE ASISTENCIA MANUELITA
// ============================================================
// INSTRUCCIONES:
// 1. Abre tu Google Sheets
// 2. Ve a Extensiones > Apps Script
// 3. Borra todo el código existente y pega este
// 4. Guarda (Ctrl+S)
// 5. Implementar > Nueva implementación > Aplicación web
// 6. Ejecutar como: Yo mismo
// 7. Acceso: Cualquier persona
// 8. Copia la URL generada y pégala en Configuración del panel admin
// ============================================================

// Configuración de hojas
const SHEETS = {
  EMPLEADOS: 'Empleados',
  ASISTENCIAS: 'Asistencias',
  USUARIOS: 'Usuarios',  // Nueva hoja para usuarios admin
  CONFIGURACION: 'Configuracion'
};

// ============================================================
// FUNCIÓN PRINCIPAL - Maneja todas las peticiones GET
// ============================================================
function doGet(e) {
  const action = e.parameter.action;

  try {
    switch(action) {
      case 'getEmployees':
        return jsonResponse(getEmployees());
      case 'getRecords':
        return jsonResponse(getRecords(e.parameter.date));
      case 'getUsers':
        return jsonResponse(getUsers());
      case 'validateUser':
        return jsonResponse(validateUser(e.parameter.username, e.parameter.password));
      case 'getConfig':
        return jsonResponse(getConfig());
      default:
        return jsonResponse({ success: false, error: 'Acción no válida' });
    }
  } catch (error) {
    return jsonResponse({ success: false, error: error.toString() });
  }
}

// ============================================================
// FUNCIÓN PRINCIPAL - Maneja todas las peticiones POST
// ============================================================
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const operation = data.operation;

    switch(operation) {
      case 'add':
        return jsonResponse(addEmployee(data.employee));
      case 'edit':
        return jsonResponse(editEmployee(data.employee));
      case 'delete':
        return jsonResponse(deleteEmployee(data.employee.DNI));
      case 'addRecord':
        return jsonResponse(addRecord(data.record));
      case 'addUser':
        return jsonResponse(addUser(data.user));
      case 'editUser':
        return jsonResponse(editUser(data.user));
      case 'deleteUser':
        return jsonResponse(deleteUser(data.userId));
      case 'saveConfig':
        return jsonResponse(saveConfig(data.puntos));
      default:
        return jsonResponse({ success: false, error: 'Operación no válida' });
    }
  } catch (error) {
    return jsonResponse({ success: false, error: error.toString() });
  }
}

// ============================================================
// FUNCIONES DE EMPLEADOS
// ============================================================
function getEmployees() {
  const sheet = getOrCreateSheet(SHEETS.EMPLEADOS, ['DNI', 'NOMBRE', 'CARGO', 'AREA', 'FECHA_REGISTRO']);
  const data = sheet.getDataRange().getValues();

  if (data.length <= 1) return { success: true, data: [] };

  const employees = data.slice(1).map(row => ({
    DNI: row[0].toString(),
    NOMBRE: row[1],
    CARGO: row[2],
    AREA: row[3]
  })).filter(e => e.DNI);

  return { success: true, data: employees };
}

function addEmployee(employee) {
  const sheet = getOrCreateSheet(SHEETS.EMPLEADOS, ['DNI', 'NOMBRE', 'CARGO', 'AREA', 'FECHA_REGISTRO']);

  // Verificar si ya existe
  const data = sheet.getDataRange().getValues();
  const exists = data.some(row => row[0].toString() === employee.DNI);
  if (exists) return { success: false, error: 'El DNI ya existe' };

  sheet.appendRow([
    employee.DNI,
    employee.NOMBRE,
    employee.CARGO,
    employee.AREA,
    new Date().toISOString()
  ]);

  return { success: true };
}

function editEmployee(employee) {
  const sheet = getOrCreateSheet(SHEETS.EMPLEADOS, ['DNI', 'NOMBRE', 'CARGO', 'AREA', 'FECHA_REGISTRO']);
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][0].toString() === employee.DNI) {
      sheet.getRange(i + 1, 2, 1, 3).setValues([[employee.NOMBRE, employee.CARGO, employee.AREA]]);
      return { success: true };
    }
  }

  return { success: false, error: 'Empleado no encontrado' };
}

function deleteEmployee(dni) {
  const sheet = getOrCreateSheet(SHEETS.EMPLEADOS, ['DNI', 'NOMBRE', 'CARGO', 'AREA', 'FECHA_REGISTRO']);
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][0].toString() === dni) {
      sheet.deleteRow(i + 1);
      return { success: true };
    }
  }

  return { success: false, error: 'Empleado no encontrado' };
}

// ============================================================
// FUNCIONES DE ASISTENCIAS
// ============================================================
function getRecords(date) {
  const sheet = getOrCreateSheet(SHEETS.ASISTENCIAS, ['ID', 'DNI', 'NOMBRE', 'CARGO', 'TIPO', 'FECHA', 'HORA', 'PUNTO', 'LAT', 'LNG', 'TIMESTAMP']);
  const data = sheet.getDataRange().getValues();

  if (data.length <= 1) return { success: true, data: [] };

  let records = data.slice(1).map(row => ({
    id: row[0],
    dni: row[1].toString(),
    nombre: row[2],
    cargo: row[3],
    tipo: row[4],
    date: row[5],
    time: row[6],
    punto: row[7],
    lat: row[8],
    lng: row[9],
    timestamp: row[10]
  }));

  if (date) {
    records = records.filter(r => r.date === date);
  }

  return { success: true, data: records };
}

function addRecord(record) {
  const sheet = getOrCreateSheet(SHEETS.ASISTENCIAS, ['ID', 'DNI', 'NOMBRE', 'CARGO', 'TIPO', 'FECHA', 'HORA', 'PUNTO', 'LAT', 'LNG', 'TIMESTAMP']);

  sheet.appendRow([
    record.id || Date.now().toString(),
    record.dni,
    record.nombre,
    record.cargo || '',
    record.tipo,
    record.date,
    record.time,
    record.punto || '',
    record.lat || '',
    record.lng || '',
    record.timestamp || new Date().toISOString()
  ]);

  return { success: true };
}

// ============================================================
// FUNCIONES DE USUARIOS ADMIN
// ============================================================
function getUsers() {
  const sheet = getOrCreateSheet(SHEETS.USUARIOS, ['ID', 'USERNAME', 'PASSWORD', 'NOMBRE', 'ROL', 'FECHA_CREACION', 'ACTIVO']);
  const data = sheet.getDataRange().getValues();

  if (data.length <= 1) {
    // Crear usuario admin por defecto si no hay usuarios
    createDefaultUser(sheet);
    return getUsers();
  }

  const users = data.slice(1).map(row => ({
    id: row[0],
    username: row[1],
    // No enviamos la contraseña por seguridad
    nombre: row[3],
    rol: row[4],
    createdAt: row[5],
    activo: row[6] !== false && row[6] !== 'FALSE'
  })).filter(u => u.id && u.activo);

  return { success: true, data: users };
}

function validateUser(username, password) {
  const sheet = getOrCreateSheet(SHEETS.USUARIOS, ['ID', 'USERNAME', 'PASSWORD', 'NOMBRE', 'ROL', 'FECHA_CREACION', 'ACTIVO']);
  const data = sheet.getDataRange().getValues();

  if (data.length <= 1) {
    createDefaultUser(sheet);
    return validateUser(username, password);
  }

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const isActive = row[6] !== false && row[6] !== 'FALSE' && row[6] !== 0;

    if (row[1].toString().toLowerCase() === username.toLowerCase() &&
        row[2].toString() === password &&
        isActive) {
      return {
        success: true,
        user: {
          id: row[0],
          username: row[1],
          nombre: row[3],
          rol: row[4],
          createdAt: row[5]
        }
      };
    }
  }

  return { success: false, error: 'Usuario o contraseña incorrectos' };
}

function addUser(user) {
  const sheet = getOrCreateSheet(SHEETS.USUARIOS, ['ID', 'USERNAME', 'PASSWORD', 'NOMBRE', 'ROL', 'FECHA_CREACION', 'ACTIVO']);

  // Verificar si ya existe
  const data = sheet.getDataRange().getValues();
  const exists = data.some(row => row[1].toString().toLowerCase() === user.username.toLowerCase());
  if (exists) return { success: false, error: 'El usuario ya existe' };

  const newId = 'user_' + Date.now();
  sheet.appendRow([
    newId,
    user.username.toLowerCase(),
    user.password,
    user.nombre,
    user.rol || 'admin',
    new Date().toISOString(),
    true
  ]);

  return { success: true, id: newId };
}

function editUser(user) {
  const sheet = getOrCreateSheet(SHEETS.USUARIOS, ['ID', 'USERNAME', 'PASSWORD', 'NOMBRE', 'ROL', 'FECHA_CREACION', 'ACTIVO']);
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === user.id) {
      // Actualizar username, nombre y rol
      sheet.getRange(i + 1, 2).setValue(user.username.toLowerCase());
      sheet.getRange(i + 1, 4).setValue(user.nombre);
      sheet.getRange(i + 1, 5).setValue(user.rol);

      // Solo actualizar contraseña si se proporcionó una nueva
      if (user.password && user.password.length >= 4) {
        sheet.getRange(i + 1, 3).setValue(user.password);
      }

      return { success: true };
    }
  }

  return { success: false, error: 'Usuario no encontrado' };
}

function deleteUser(userId) {
  const sheet = getOrCreateSheet(SHEETS.USUARIOS, ['ID', 'USERNAME', 'PASSWORD', 'NOMBRE', 'ROL', 'FECHA_CREACION', 'ACTIVO']);
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === userId) {
      // En lugar de eliminar, marcamos como inactivo
      sheet.getRange(i + 1, 7).setValue(false);
      return { success: true };
    }
  }

  return { success: false, error: 'Usuario no encontrado' };
}

function createDefaultUser(sheet) {
  sheet.appendRow([
    'user_default_1',
    'admin',
    'admin123',
    'Administrador Principal',
    'super_admin',
    new Date().toISOString(),
    true
  ]);
}

// ============================================================
// FUNCIONES DE CONFIGURACIÓN (PUNTOS DE MARCACIÓN)
// ============================================================
function getConfig() {
  const sheet = getOrCreateSheet(SHEETS.CONFIGURACION, ['ID', 'NOMBRE', 'LAT', 'LNG', 'RADIO', 'ACTIVO', 'FECHA_ACTUALIZACION']);
  const data = sheet.getDataRange().getValues();

  if (data.length <= 1) return { success: true, data: [] };

  const puntos = data.slice(1).map(row => ({
    id: row[0].toString(),
    nombre: row[1].toString(),
    lat: parseFloat(row[2]) || 0,
    lng: parseFloat(row[3]) || 0,
    radio: parseInt(row[4]) || 150,
    activo: row[5] !== false && row[5] !== 'FALSE' && row[5] !== 0
  })).filter(p => p.id && p.activo);

  return { success: true, data: puntos };
}

function saveConfig(puntos) {
  if (!puntos || !Array.isArray(puntos)) {
    return { success: false, error: 'Datos de configuración inválidos' };
  }

  const sheet = getOrCreateSheet(SHEETS.CONFIGURACION, ['ID', 'NOMBRE', 'LAT', 'LNG', 'RADIO', 'ACTIVO', 'FECHA_ACTUALIZACION']);

  // Borrar filas existentes (excepto encabezado)
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.deleteRows(2, lastRow - 1);
  }

  // Escribir todos los puntos
  const now = new Date().toISOString();
  puntos.forEach(function(p) {
    sheet.appendRow([
      p.id || '',
      p.nombre || '',
      p.lat || 0,
      p.lng || 0,
      p.radio || 150,
      true,
      now
    ]);
  });

  return { success: true, count: puntos.length };
}

// ============================================================
// FUNCIONES AUXILIARES
// ============================================================
function getOrCreateSheet(name, headers) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(name);

  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }

  return sheet;
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// ============================================================
// FUNCIÓN DE PRUEBA - Ejecuta esto primero para autorizar
// ============================================================
function testSetup() {
  // Esta función crea las hojas necesarias
  getOrCreateSheet(SHEETS.EMPLEADOS, ['DNI', 'NOMBRE', 'CARGO', 'AREA', 'FECHA_REGISTRO']);
  getOrCreateSheet(SHEETS.ASISTENCIAS, ['ID', 'DNI', 'NOMBRE', 'CARGO', 'TIPO', 'FECHA', 'HORA', 'PUNTO', 'LAT', 'LNG', 'TIMESTAMP']);
  getOrCreateSheet(SHEETS.USUARIOS, ['ID', 'USERNAME', 'PASSWORD', 'NOMBRE', 'ROL', 'FECHA_CREACION', 'ACTIVO']);
  getOrCreateSheet(SHEETS.CONFIGURACION, ['ID', 'NOMBRE', 'LAT', 'LNG', 'RADIO', 'ACTIVO', 'FECHA_ACTUALIZACION']);

  Logger.log('✅ Hojas creadas correctamente (incluye Configuracion)');
  Logger.log('Ahora implementa como Aplicación Web');
}
