// ========================================
// EXPORTADOR — Reto 2 (Sesión 4)
// ========================================
//
// Genera un archivo de texto legible (exportacion.txt) con todas las
// notas, dentro de la carpeta salida/ del proyecto, y luego lo MUEVE
// a una ruta absoluta: la que recibe el comando o, si no se indica,
// la carpeta personal del usuario (os.homedir()).
//
// Al terminar, el archivo ya no debe existir en salida/.
//
// Sobre mover archivos:
//   fs.renameSync mueve dentro de un mismo disco, pero lanza EXDEV
//   cuando origen y destino están en discos distintos. La solución es
//   combinar copia (fs.copyFileSync) y borrado (fs.unlinkSync).

const fs = require('fs');
const os = require('os');
const path = require('path');
const almacen = require('./almacen');
const fechas = require('fechas-bitacora-sofiagonzalezgallego');

const CARPETA_SALIDA = almacen.RUTAS.salida;
const NOMBRE_ARCHIVO = 'exportacion.txt';
const SEPARADOR = '='.repeat(72);

/**
 * Construye el texto legible con todas las notas.
 *
 * @param {Array<object>} notas
 * @returns {string}
 */
function construirTexto(notas) {
  const lineas = [
    'BITÁCORA DE APRENDIZAJE',
    `Exportada: ${fechas.getLongTime('es-ES')}`,
    `Total de notas: ${notas.length}`,
    SEPARADOR
  ];

  notas.forEach((nota, indice) => {
    const fechaCorta = fechas.getShortDate('es-ES', nota.fecha);
    lineas.push(`[${nota.id}] (${nota.etiqueta}) ${fechaCorta}`);
    lineas.push(nota.texto);

    if (indice < notas.length - 1) {
      lineas.push('-'.repeat(72));
    }
  });

  return `${lineas.join('\n')}\n`;
}

/**
 * Valida la carpeta destino: debe ser una ruta absoluta y existir.
 *
 * @param {string} destino
 * @returns {{ok: boolean, ruta: string, error?: string}}
 */
function validarDestino(destino) {
  if (typeof destino !== 'string' || destino.trim() === '') {
    return { ok: false, ruta: destino, error: 'No indicaste una carpeta destino.' };
  }

  const ruta = destino.trim();

  if (!path.isAbsolute(ruta)) {
    return {
      ok: false,
      ruta,
      error: `"${ruta}" no es una ruta absoluta. Escribe la ruta completa, por ejemplo C:\\Users\\tu-usuario\\Desktop en Windows o /home/tu-usuario en Linux/macOS.`
    };
  }

  if (!fs.existsSync(ruta)) {
    return { ok: false, ruta, error: `La carpeta "${ruta}" no existe.` };
  }

  if (!fs.statSync(ruta).isDirectory()) {
    return { ok: false, ruta, error: `"${ruta}" existe pero no es una carpeta.` };
  }

  return { ok: true, ruta };
}

/**
 * Mueve un archivo. renameSync es lo directo, pero falla con EXDEV
 * (discos distintos) o EPERM/EEXIST (Windows, destino ya existe);
 * entonces se copia y se borra el origen con unlinkSync.
 *
 * @param {string} origen
 * @param {string} destino
 */
function moverArchivo(origen, destino) {
  try {
    fs.renameSync(origen, destino);
  } catch (error) {
    if (['EXDEV', 'EPERM', 'EEXIST', 'EACCES', 'EBUSY'].includes(error.code)) {
      fs.copyFileSync(origen, destino);
      fs.unlinkSync(origen);
    } else {
      throw error;
    }
  }
}

/**
 * Exporta las notas a texto y mueve el archivo a la ruta destino.
 *
 * @param {string|undefined} destinoSolicitado
 * @returns {{estado: string, mensaje?: string, origen?: string, origenVisible?: string, destino?: string, total?: number}}
 */
function exportar(destinoSolicitado) {
  const destinoFinal = typeof destinoSolicitado === 'string' && destinoSolicitado.trim() !== ''
    ? destinoSolicitado.trim()
    : os.homedir();

  const validacion = validarDestino(destinoFinal);

  if (!validacion.ok) {
    return { estado: 'error', mensaje: validacion.error };
  }

  const rutaDestino = validacion.ruta;

  if (path.resolve(rutaDestino) === path.resolve(CARPETA_SALIDA)) {
    return {
      estado: 'error',
      mensaje: 'La carpeta destino es la misma carpeta salida/ del proyecto; elige otra ruta para poder mover el archivo.'
    };
  }

  const notas = almacen.leerNotas();
  const texto = construirTexto(notas);

  almacen.asegurarCarpeta(CARPETA_SALIDA);

  const origen = path.join(CARPETA_SALIDA, NOMBRE_ARCHIVO);
  fs.writeFileSync(origen, texto, 'utf8');

  const destino = path.join(rutaDestino, NOMBRE_ARCHIVO);
  moverArchivo(origen, destino);

  return {
    estado: 'ok',
    origen,
    origenVisible: almacen.rutaVisible(origen),
    destino,
    total: notas.length
  };
}

module.exports = {
  CARPETA_SALIDA,
  NOMBRE_ARCHIVO,
  construirTexto,
  validarDestino,
  moverArchivo,
  exportar
};
