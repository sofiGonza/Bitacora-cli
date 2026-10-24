// ========================================
// BITÁCORA DE APRENDIZAJE — punto de entrada
// ========================================
//
// index.js SOLO lee los argumentos y decide qué comando ejecutar.
// No toca fs ni calcula hashes: eso vive en almacen.js y notas.js.
//
// Uso:
//   npm start -- agregar "Hoy aprendí a usar fs" nodejs
//   npm start -- listar 3
//
// Los argumentos van después de "--" para que npm no se los trague.

const almacen = require('./almacen');
const notas = require('./notas');
const respaldo = require('./respaldo');
const exportador = require('./exportador');
const fechas = require('fechas-bitacora-sofiagonzalezgallego');

const NOTAS_POR_DEFECTO = 5;

const AYUDA = `Bitácora de aprendizaje — comandos disponibles

  agregar "<texto>" [etiqueta]    Guarda una nota (etiqueta opcional; por defecto: general)
  listar [N]                      Muestra las últimas N notas (por defecto: 5)
  buscar <palabra>                Busca en el texto sin distinguir mayúsculas
  borrar <id>                     Elimina la nota con ese id
  respaldar                       Copia data/notas.json a respaldos/
  exportar [carpeta-destino]      Mueve un archivo de texto a una ruta absoluta
  ayuda                           Muestra esta ayuda

Ejemplos (los argumentos van después de --):
  npm start -- agregar "Hoy aprendí a usar fs" nodejs
  npm start -- listar 3
  npm start -- buscar fs
  npm start -- borrar 3f9a1c2e
  npm start -- respaldar
  npm start -- exportar C:\\Users\\tu-usuario\\Desktop
  npm start -- ayuda`;

/**
 * Formatea una nota para mostrarla en consola.
 *
 * @param {object} nota
 * @returns {string}
 */
function formatearNota(nota) {
  const fecha = fechas.getShortDate('es-ES', nota.fecha);
  return `[${nota.id}] (${nota.etiqueta}) ${fecha} — ${nota.texto}`;
}

/**
 * Comando agregar.
 *
 * @param {string[]} argumentos
 * @returns {{codigo: number, resultado: string}}
 */
function comandoAgregar(argumentos) {
  const texto = argumentos[0];
  const etiqueta = argumentos[1];

  if (typeof texto !== 'string' || texto.trim() === '') {
    console.log('Falta el texto de la nota.');
    console.log('Uso: npm start -- agregar "<texto>" [etiqueta]');
    return { codigo: 1, resultado: 'error: falta el texto de la nota' };
  }

  const resultado = notas.agregar(texto, etiqueta);

  if (resultado.estado === 'duplicada') {
    console.log(`Ya existe una nota igual (id ${resultado.id}). No se guardó.`);
    return { codigo: 0, resultado: `duplicada (id ${resultado.id})` };
  }

  const { nota } = resultado;
  console.log(`Nota guardada [${nota.id}] (${nota.etiqueta}) — ${fechas.getLongTime('es-ES', nota.fecha)}`);
  return { codigo: 0, resultado: `guardada (id ${nota.id})` };
}

/**
 * Comando listar [N].
 *
 * @param {string[]} argumentos
 * @returns {{codigo: number, resultado: string}}
 */
function comandoListar(argumentos) {
  const solicitado = argumentos[0];
  let cantidad = NOTAS_POR_DEFECTO;

  if (solicitado !== undefined) {
    const numero = Number(solicitado);

    if (Number.isInteger(numero) && numero > 0) {
      cantidad = numero;
    } else {
      console.log(`"${solicitado}" no es un número válido; se muestran las últimas ${NOTAS_POR_DEFECTO} notas.`);
    }
  }

  const lista = notas.listar(cantidad);

  if (lista.length === 0) {
    console.log('La bitácora está vacía. Agrega tu primera nota con:');
    console.log('  npm start -- agregar "Hoy aprendí algo nuevo" general');
    return { codigo: 0, resultado: `0 notas listadas (se pidieron ${cantidad})` };
  }

  lista.forEach((nota) => console.log(formatearNota(nota)));

  return {
    codigo: 0,
    resultado: `${lista.length} nota(s) listada(s) (se pidieron ${cantidad})`
  };
}

/**
 * Comando buscar <palabra>.
 *
 * @param {string[]} argumentos
 * @returns {{codigo: number, resultado: string}}
 */
function comandoBuscar(argumentos) {
  const palabra = argumentos[0];

  if (typeof palabra !== 'string' || palabra.trim() === '') {
    console.log('Falta la palabra que quieres buscar.');
    console.log('Uso: npm start -- buscar <palabra>');
    return { codigo: 1, resultado: 'error: falta la palabra a buscar' };
  }

  const encontradas = notas.buscar(palabra);

  if (encontradas.length === 0) {
    console.log(`No se encontraron notas que contengan "${palabra}".`);
    return { codigo: 0, resultado: `sin coincidencias para "${palabra}"` };
  }

  console.log(`${encontradas.length} coincidencia(s) para "${palabra}":`);
  encontradas.forEach((nota) => console.log(formatearNota(nota)));

  return { codigo: 0, resultado: `${encontradas.length} coincidencia(s) para "${palabra}"` };
}

/**
 * Comando borrar <id>.
 *
 * @param {string[]} argumentos
 * @returns {{codigo: number, resultado: string}}
 */
function comandoBorrar(argumentos) {
  const id = argumentos[0];

  if (typeof id !== 'string' || id.trim() === '') {
    console.log('Falta el id de la nota que quieres borrar.');
    console.log('Uso: npm start -- borrar <id>');
    return { codigo: 1, resultado: 'error: falta el id' };
  }

  const resultado = notas.borrar(id);

  if (resultado.estado === 'no-encontrada') {
    console.log(`No existe una nota con el id "${id}".`);
    return { codigo: 1, resultado: `error: id "${id}" no encontrado` };
  }

  console.log(`Nota eliminada [${resultado.nota.id}] — ${resultado.nota.texto}`);
  return { codigo: 0, resultado: `eliminada (id ${resultado.nota.id})` };
}

/**
 * Comando respaldar (Reto 1).
 *
 * @returns {{codigo: number, resultado: string}}
 */
function comandoRespaldar() {
  const resultado = respaldo.crearRespaldo();

  if (resultado.estado === 'error') {
    console.log(`No se pudo crear el respaldo: ${resultado.mensaje}`);
    return { codigo: 1, resultado: `error: ${resultado.mensaje}` };
  }

  console.log(`Respaldo creado: ${resultado.destinoVisible} (${resultado.total} nota(s)).`);
  return { codigo: 0, resultado: `respaldo creado en ${resultado.destinoVisible}` };
}

/**
 * Comando exportar [carpeta-destino] (Reto 2).
 *
 * @param {string[]} argumentos
 * @returns {{codigo: number, resultado: string}}
 */
function comandoExportar(argumentos) {
  const resultado = exportador.exportar(argumentos[0]);

  if (resultado.estado === 'error') {
    console.log(`No se exportó nada: ${resultado.mensaje}`);
    return { codigo: 1, resultado: `error: ${resultado.mensaje}` };
  }

  console.log(`Archivo generado: ${resultado.origenVisible}`);
  console.log(`Notas exportadas: ${resultado.total}`);
  console.log(`Archivo movido a: ${resultado.destino}`);
  console.log('El archivo ya no está en salida/.');
  return { codigo: 0, resultado: `exportadas ${resultado.total} nota(s) a ${resultado.destino}` };
}

/**
 * Comando ayuda (también se usa si no hay comando).
 *
 * @returns {{codigo: number, resultado: string}}
 */
function comandoAyuda() {
  console.log(AYUDA);
  return { codigo: 0, resultado: 'ayuda mostrada' };
}

/**
 * Decide qué comando ejecutar.
 *
 * @param {string} comando
 * @param {string[]} argumentos
 * @returns {{codigo: number, resultado: string}}
 */
function ejecutar(comando, argumentos) {
  switch (comando) {
    case '':
      console.log('No indicaste un comando.');
      console.log('');
      return comandoAyuda();
    case 'agregar':
      return comandoAgregar(argumentos);
    case 'listar':
      return comandoListar(argumentos);
    case 'buscar':
      return comandoBuscar(argumentos);
    case 'borrar':
      return comandoBorrar(argumentos);
    case 'respaldar':
      return comandoRespaldar();
    case 'exportar':
      return comandoExportar(argumentos);
    case 'ayuda':
      return comandoAyuda();
    default:
      console.log(`El comando "${comando}" no existe.`);
      console.log('');
      console.log(AYUDA);
      return { codigo: 1, resultado: `comando no reconocido: ${comando}` };
  }
}

/**
 * Traduce un error en un mensaje claro, sin dejar que el programa
 * termine con una traza sin control.
 *
 * @param {Error} error
 * @returns {{codigo: number, resultado: string}}
 */
function responderError(error) {
  if (error && error.codigo === 'DATOS_DANADOS') {
    console.error('No se pudo leer la bitácora.');
    console.error(error.message);
    console.error('Revisa data/notas.json o restaura un respaldo de la carpeta respaldos/.');
    return { codigo: 1, resultado: `error: ${error.message}` };
  }

  console.error(`Ocurrió un error inesperado: ${error && error.message ? error.message : error}`);
  return {
    codigo: 1,
    resultado: `error inesperado: ${error && error.message ? error.message : error}`
  };
}

function main() {
  const argumentos = process.argv.slice(2);
  const comando = (argumentos[0] || '').toLowerCase();
  const comandoRegistrado = argumentos.length > 0 ? argumentos.join(' ') : '(sin comando)';

  let salida;

  try {
    salida = ejecutar(comando, argumentos.slice(1));
  } catch (error) {
    salida = responderError(error);
  }

  // Bitácora de acciones: una línea por comando ejecutado.
  // registrarAccion nunca lanza, así que no puede tumbar el programa.
  almacen.registrarAccion(comandoRegistrado, salida.resultado);

  process.exitCode = salida.codigo;
}

main();
