// ========================================
// ALMACÉN — persistencia con el módulo nativo fs
// ========================================
//
// Este módulo es el ÚNICO que toca el sistema de archivos.
// index.js no debe leer ni escribir archivos: solo pide datos aquí.
// notas.js tampoco toca fs: recibe y entrega arreglos de notas.
//
// Rutas: se construyen a partir de la ubicación de ESTE archivo
// (__dirname), no del directorio desde donde se ejecuta el programa.
// Así "cd src && node index.js listar" sigue apuntando a la misma
// carpeta data/ del proyecto (Sesión 4).

const fs = require('fs');

const path = require('path');

const RAIZ_PROYECTO = path.join(__dirname, '..');

const RUTAS = {
  raiz: RAIZ_PROYECTO,
  datos: path.join(RAIZ_PROYECTO, 'data'),
  notas: path.join(RAIZ_PROYECTO, 'data', 'notas.json'),
  bitacora: path.join(RAIZ_PROYECTO, 'data', 'bitacora.log'),
  respaldos: path.join(RAIZ_PROYECTO, 'respaldos'),
  salida: path.join(RAIZ_PROYECTO, 'salida')
};

/**
 * Devuelve una ruta relativa al proyecto para mostrarla al usuario
 * sin llenar la consola de rutas absolutas.
 *
 * @param {string} rutaAbsoluta
 * @returns {string}
 */
function rutaVisible(rutaAbsoluta) {
  return path.relative(RAIZ_PROYECTO, rutaAbsoluta).split(path.sep).join('/');
}

/**
 * Crea la carpeta si no existe (recursive evita errores si ya existe).
 *
 * @param {string} carpeta
 */
function asegurarCarpeta(carpeta) {
  if (!fs.existsSync(carpeta)) {
    fs.mkdirSync(carpeta, { recursive: true });
  }
}

/**
 * Error controlado para archivos dañados. Lleva un código propio
 * para que index.js lo distinga de un error inesperado.
 *
 * @param {string} detalle
 * @returns {Error}
 */
function errorDeDatos(detalle) {
  const error = new Error(
    `El archivo ${rutaVisible(RUTAS.notas)} está dañado o no tiene el formato esperado. ${detalle}`
  );
  error.codigo = 'DATOS_DANADOS';
  return error;
}

/**
 * Revisa que cada elemento del arreglo sea una nota con id y texto.
 * Si el JSON es válido pero su contenido no, también es un archivo dañado.
 *
 * @param {unknown} datos
 * @returns {Array<object>}
 */
function validarNotas(datos) {
  if (!Array.isArray(datos)) {
    throw errorDeDatos('Se esperaba un arreglo JSON ([]) con las notas.');
  }

  datos.forEach((nota, indice) => {
    const esObjeto = nota !== null && typeof nota === 'object' && !Array.isArray(nota);

    if (!esObjeto) {
      throw errorDeDatos(`La posición ${indice} no es un objeto de nota.`);
    }

    if (typeof nota.id !== 'string' || nota.id.trim() === '') {
      throw errorDeDatos(`La nota en la posición ${indice} no tiene un "id" válido.`);
    }

    if (typeof nota.texto !== 'string' || nota.texto.trim() === '') {
      throw errorDeDatos(`La nota en la posición ${indice} no tiene un "texto" válido.`);
    }
  });

  return datos;
}

/**
 * Lee data/notas.json.
 * - Si la carpeta o el archivo no existen, los crea con un arreglo vacío.
 * - Si el archivo está dañado, lanza un error con codigo = 'DATOS_DANADOS'.
 *
 * @returns {Array<object>}
 */
function leerNotas() {
  asegurarCarpeta(RUTAS.datos);

  if (!fs.existsSync(RUTAS.notas)) {
    fs.writeFileSync(RUTAS.notas, '[]\n', 'utf8');
    return [];
  }

  const contenido = fs.readFileSync(RUTAS.notas, 'utf8').trim();

  // Un archivo vacío se interpreta como "todavía no hay notas".
  if (contenido === '') {
    fs.writeFileSync(RUTAS.notas, '[]\n', 'utf8');
    return [];
  }

  let datos;
  try {
    datos = JSON.parse(contenido);
  } catch (error) {
    throw errorDeDatos(`El JSON no se pudo interpretar (${error.message}).`);
  }

  return validarNotas(datos);
}

/**
 * Sobrescribe data/notas.json con el arreglo completo.
 * Se escribe con sangría de 2 espacios para que sea legible a mano.
 *
 * @param {Array<object>} notas
 */
function escribirNotas(notas) {
  asegurarCarpeta(RUTAS.datos);
  fs.writeFileSync(RUTAS.notas, `${JSON.stringify(notas, null, 2)}\n`, 'utf8');
}

/**
 * Limpia un texto para que quepa en una sola línea del log
 * y no rompa el formato "fecha | comando | resultado".
 *
 * @param {string} valor
 * @returns {string}
 */
function limpiarParaLog(valor) {
  return String(valor)
    .replace(/\r?\n/g, ' ')
    .replace(/\|/g, '/')
    .trim();
}

/**
 * Agrega una línea a data/bitacora.log con appendFileSync.
 * Formato: fecha | comando | resultado
 *
 * Si el log no se puede escribir, el programa NO se cae:
 * registrar la acción es secundario frente a atender al usuario.
 *
 * @param {string} comando
 * @param {string} resultado
 * @returns {boolean} true si la línea se escribió.
 */
function registrarAccion(comando, resultado) {
  try {
    asegurarCarpeta(RUTAS.datos);

    const fecha = new Date().toISOString();
    const linea = `${fecha} | ${limpiarParaLog(comando)} | ${limpiarParaLog(resultado)}\n`;

    fs.appendFileSync(RUTAS.bitacora, linea, 'utf8');
    return true;
  } catch (error) {
    return false;
  }
}

module.exports = {
  RUTAS,
  rutaVisible,
  asegurarCarpeta,
  leerNotas,
  escribirNotas,
  registrarAccion
};
