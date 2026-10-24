// ========================================
// NOTAS — lógica de la bitácora (sin fs)
// ========================================
//
// Reglas de negocio del taller:
// - El id son los primeros 8 caracteres del hash (SHA-1 por defecto)
//   que genera object-hash sobre el TEXTO de la nota.
// - Si el texto ya existe, la nota NO se guarda y se informa su id.
// - Cada nota es: { id, texto, etiqueta, fecha } con fecha numérica.
//
// Este módulo NO toca el sistema de archivos: toda la persistencia
// vive en almacen.js.

const hash = require('object-hash');

const almacen = require('./almacen');

const ETIQUETA_POR_DEFECTO = 'general';

/**
 * Quita espacios al inicio y al final del texto.
 *
 * @param {string} valor
 * @returns {string}
 */
function normalizarTexto(valor) {
  return String(valor ?? '').trim();
}

/**
 * Calcula el id de una nota: primeros 8 caracteres del hash del texto.
 *
 * @param {string} texto
 * @returns {string}
 */
function generarId(texto) {
  return hash(texto).slice(0, 8);
}

/**
 * Agrega una nota si el texto no existe ya.
 *
 * @param {string} texto
 * @param {string} etiqueta
 * @returns {{estado: string, nota?: object, id?: string, mensaje?: string}}
 */
function agregar(texto, etiqueta) {
  const textoLimpio = normalizarTexto(texto);

  if (textoLimpio === '') {
    return { estado: 'invalida', mensaje: 'El texto de la nota no puede estar vacío.' };
  }

  const etiquetaFinal = normalizarTexto(etiqueta) || ETIQUETA_POR_DEFECTO;

  const notas = almacen.leerNotas();
  const existente = notas.find((nota) => nota.texto === textoLimpio);

  if (existente) {
    return { estado: 'duplicada', id: existente.id };
  }

  let id = generarId(textoLimpio);
  let intento = 1;

  // En teoría el hash de 8 caracteres casi no choca, pero si el id
  // ya lo tiene otra nota (con texto distinto), se varía el texto
  // hasta conseguir un id libre. El id sigue derivando del texto.
  while (notas.some((nota) => nota.id === id)) {
    id = generarId(`${textoLimpio} #${intento}`);
    intento += 1;
  }

  const nota = {
    id,
    texto: textoLimpio,
    etiqueta: etiquetaFinal,
    fecha: Date.now()
  };

  notas.push(nota);
  almacen.escribirNotas(notas);

  return { estado: 'guardada', nota, total: notas.length };
}

/**
 * Devuelve las últimas N notas: las más recientes primero.
 * El arreglo se guarda en orden de creación, así que se toma
 * la cola y se invierte.
 *
 * @param {number} cantidad
 * @returns {Array<object>}
 */
function listar(cantidad) {
  const notas = almacen.leerNotas();
  return notas.slice(-cantidad).reverse();
}

/**
 * Busca notas cuyo texto contenga la palabra, sin distinguir
 * mayúsculas ni minúsculas. Más recientes primero.
 *
 * @param {string} palabra
 * @returns {Array<object>}
 */
function buscar(palabra) {
  const termino = palabra.toLowerCase();
  const notas = almacen.leerNotas();
  return notas.filter((nota) => nota.texto.toLowerCase().includes(termino)).reverse();
}

/**
 * Elimina la nota con ese id.
 *
 * @param {string} id
 * @returns {{estado: string, nota?: object}}
 */
function borrar(id) {
  const idBusqueda = id.trim().toLowerCase();

  const notas = almacen.leerNotas();
  const indice = notas.findIndex((nota) => nota.id.toLowerCase() === idBusqueda);

  if (indice === -1) {
    return { estado: 'no-encontrada' };
  }

  const [notaEliminada] = notas.splice(indice, 1);
  almacen.escribirNotas(notas);

  return { estado: 'borrada', nota: notaEliminada };
}

/**
 * Total de notas guardadas.
 *
 * @returns {number}
 */
function total() {
  return almacen.leerNotas().length;
}

module.exports = {
  ETIQUETA_POR_DEFECTO,
  generarId,
  agregar,
  listar,
  buscar,
  borrar,
  total
};
