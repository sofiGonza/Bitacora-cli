# bitacora-cli

Bitácora de aprendizaje por consola — **Taller 1 · Ficha 3406211 · Node.js (Sesiones 0 a 4)**

Lleva un registro de lo que aprendes cada día sin salir de la terminal: guarda notas en un archivo,
rechaza notas repetidas, genera respaldos, exporta tus notas a un archivo de texto y usa un paquete
npm propio para formatear fechas.

## Qué hace

- `agregar`: guarda una nota con un id único derivado del texto (`object-hash`).
- `listar`: muestra las últimas N notas (por defecto 5).
- `buscar`: encuentra notas por palabra, sin distinguir mayúsculas.
- `borrar`: elimina una nota por id.
- `respaldar`: copia `data/notas.json` a `respaldos/`.
- `exportar`: crea un texto legible en `salida/` y lo **mueve** a una ruta absoluta.
- `ayuda`: muestra el uso de todos los comandos.

Cada comando ejecutado deja una línea en `data/bitacora.log` con el formato `fecha | comando | resultado`.

## Instalación

```bash
npm install
```

El proyecto usa dos dependencias:

- `object-hash` (externa, se instala desde npm).
- `fechas-bitacora-sofiagonzalezgallego` (paquete **propio**, declarado como `^1.0.0` y satisfecho
  con `npm link`; vive en la carpeta hermana `fechas-bitacora-sofiagonzalezgallego/`, fuera de este
  proyecto, como pide el taller).

Orden recomendado (sesión 3):

```bash
# 1. En la carpeta del paquete
cd ../fechas-bitacora-sofiagonzalezgallego
npm link

# 2. En la carpeta del proyecto
cd ../Bitacora-cli
npm link fechas-bitacora-sofiagonzalezgallego
npm install
```


## Comandos

Todos los argumentos van **después de** `--` para que npm no se los coma.

| Comando | Qué hace | Ejemplo |
| --- | --- | --- |
| `agregar "<texto>" [etiqueta]` | Guarda una nota (etiqueta opcional, por defecto `general`) | `npm start -- agregar "Hoy aprendí a usar fs" nodejs` |
| `listar [N]` | Muestra las últimas N notas (por defecto 5) | `npm start -- listar 3` |
| `buscar <palabra>` | Busca en el texto, sin distinguir mayúsculas | `npm start -- buscar fs` |
| `borrar <id>` | Elimina la nota con ese id | `npm start -- borrar 3f9a1c2e` |
| `respaldar` | Copia `data/notas.json` a `respaldos/` | `npm start -- respaldar` |
| `exportar [carpeta-destino]` | Mueve el texto a una ruta absoluta (por defecto tu carpeta personal) | `npm start -- exportar C:\Users\tu-usuario\Desktop` |
| `ayuda` | Muestra esta ayuda | `npm start -- ayuda` |

Ejemplo de salida:

```bash
$ npm start -- agregar "Hoy aprendí a usar fs" nodejs
Nota guardada [3d79f3e7] (nodejs) — jueves, 22 de octubre de 2026, 16:35:08 GMT-5

$ npm start -- agregar "Hoy aprendí a usar fs" nodejs
Ya existe una nota igual (id 3d79f3e7). No se guardó.

$ npm start -- listar 3
[3d79f3e7] (nodejs) 22/10/2026 — Hoy aprendí a usar fs
```

## Estructura

```
bitacora-cli/
├── src/
│   ├── index.js      # lee los argumentos y decide qué comando ejecutar
│   ├── notas.js      # lógica: agregar, listar, buscar, borrar (usa object-hash)
│   ├── almacen.js    # lee y escribe archivos (fs), rutas y log
│   ├── respaldo.js   # Reto 1: copiar data/notas.json a respaldos/
│   └── exportador.js # Reto 2: crear exportacion.txt y moverlo a una ruta absoluta
├── data/             # se crea solo al ejecutar (no sube a Git)
├── respaldos/        # se crea con "respaldar" (no sube a Git)
├── evidencias/       # salidas reales de la sesión de pruebas
├── .gitignore
├── package.json
└── README.md
```

El módulo de fechas se movió al paquete **`fechas-bitacora-sofiagonzalezgallego`**
(carpeta aparte, enlazado con `npm link`), por lo que `src/fechas.js` ya no existe.

## Reflexión

### ¿Por qué elegiste CommonJS o ES Modules? ¿Qué cambió en tu package.json y en la forma de importar?

Elegí **CommonJS**. La sesión 3 del curso enseña el paquete de fechas con `module.exports`, y usar
el mismo sistema en todo el proyecto evita fricciones de interoperabilidad: `require()` directo
para el paquete propio, para `object-hash` y para el módulo local `notas.js`, con la misma sintaxis
en todos los archivos. En `package.json` solo hubo que declarar `"type": "commonjs"`; la forma de
importar es `const mod = require('./modulo')` o `require('paquete')` en todos lados. Si hubiera
elegido ES Modules, habría puesto `"type": "module"`, usado `import`/`export` y resuelto la carpeta
`data/` con `import.meta.dirname` en lugar de `__dirname`.

### fs, object-hash y fechas (tu paquete) se importan distinto del módulo local notas.js. ¿Cuál es la diferencia y cómo decide Node dónde buscar cada uno?

- `fs` es un **módulo nativo**: Node lo busca primero en su lista de módulos internos, sin mirar
  archivos ni `node_modules/`.
- `object-hash` y `fechas-bitacora-sofiagonzalezgallego` son **externos**: no llevan `./` ni
  extensión, así que Node sube desde la carpeta del archivo que los pide hacia arriba buscando
  `node_modules/` (en este caso, el paquete propio está enlazado ahí con `npm link`).
- `notas.js` es **local**: se importa con `./notas`, una ruta relativa que Node resuelve contra el
  directorio del archivo que hace el `require`. Sin `./`, Node no lo encontraría.

### ¿Por qué data/notas.json se resuelve distinto si ejecutas el programa desde otra carpeta?

Porque una ruta relativa como `data/notas.json` se resuelve contra el **directorio de trabajo**
donde lanzaste el comando (`process.cwd()`), no contra la ubicación del código. Desde la raíz del
proyecto apunta bien, pero `cd src && node index.js listar` buscaría `src/data/notas.json`. Por eso
`almacen.js` construye la ruta a partir del archivo que la usa: `path.join(__dirname, '..', 'data')`.

### ¿Por qué node_modules/ no se sube a Git y cómo recupera otra persona las dependencias?

`node_modules/` es gigante, se regenera completo a partir de `package.json` + `package-lock.json`
y es específico de cada máquina/plataforma; subirlo ensuciaría el repositorio y provocaría
conflictos. Por eso está en `.gitignore`. Quien clone el proyecto corre `npm install` (o
`npm ci`) y npm reconstruye las dependencias desde el registro. En este taller el paquete de fechas
no está publicado, así que además se necesita `npm link` (o la carpeta hermana del proyecto).

### ¿Qué diferencia viste al importar tu paquete CommonJS desde tu proyecto?

Como el paquete usa `module.exports` y el proyecto también es CommonJS, se importa exactamente igual
que cualquier dependencia externa: `require('fechas-bitacora-sofiagonzalezgallego')`, sin `./` y sin
extensión, y devuelve un objeto plano con las tres funciones listas para usar. Si la bitácora fuera
ES Modules, habría que importarlo con `import fechas from 'fechas-bitacora-sofiagonzalezgallego'`
(export default) o con `createRequire`, porque Node no importa CommonJS con la misma sintaxis
de los módulos locales.

## Licencia

MIT
