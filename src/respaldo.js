// ========================================
// RESPALDO — Reto 1 (Sesión 4)
// ========================================
//
// Copia data/notas.json a respaldos/notas_<marca-de-tiempo>.json.
// Se usa fs.copyFileSync, la forma más corta de copiar un archivo
// entero (internamente lee y escribe, pero en una sola llamada).

const fs = require('fs');
const path = require('path');
const almacen = require('./almacen');

/**
 * Crea un respaldo de data/notas.json en respaldos/.
 * Si el archivo de notas todavía no existe, primero se crea vacío
 * para que el respaldo siempre sea un archivo JSON válido.
 *
 * @returns {{estado: string, destino?: string, destinoVisible?: string, total?: number, mensaje?: string}}
 */
function crearRespaldo() {
  try {
    // leerNotas() crea data/ y data/notas.json si no existen,
    // y detecta contenido dañado con un mensaje claro.
    const notas = almacen.leerNotas();

    almacen.asegurarCarpeta(almacen.RUTAS.respaldos);

    const marcaDeTiempo = Date.now();
    const nombre = `notas_${marcaDeTiempo}.json`;
    const destino = path.join(almacen.RUTAS.respaldos, nombre);

    fs.copyFileSync(almacen.RUTAS.notas, destino);

    return {
      estado: 'ok',
      destino,
      destinoVisible: almacen.rutaVisible(destino),
      total: notas.length
    };
  } catch (error) {
    // Un archivo de notas dañado no debería impedir que el usuario
    // entienda qué pasó; se devuelve el mensaje como resultado.
    return { estado: 'error', mensaje: error.message };
  }
}

module.exports = {
  crearRespaldo
};
