# Evidencias del taller

Esta carpeta reúne **transcripciones reales** de las pruebas ejecutadas en esta máquina
(no capturas editadas). El evaluador también puede pedir **capturas de pantalla**: basta
abrir una terminal en la carpeta del proyecto y repetir los comandos que indica cada archivo,
tomando una foto de la ventana. La salida será idéntica en forma (los ids y las fechas cambiarán).

## Qué contiene

| Archivo | Evidencia | Comandos para reproducirla |
| --- | --- | --- |
| `01-sesion-completa.txt` | Sesión de uso con los 7 comandos: agregar, listar, buscar, borrar, respaldar, exportar y ayuda | Ver el propio archivo |
| `02-nota-duplicada.txt` | Rechazo de una nota repetida: no se guarda y se informa el id | `npm start -- agregar "Hoy aprendí a usar fs" nodejs` (2 veces) |
| `03-json-danado.txt` | `notas.json` con contenido dañado y mensaje de error controlado | Escribir basura en `data/notas.json` y ejecutar `npm start -- listar 3` |
| `04-npm-publish-dry-run.txt` | `npm publish --dry-run` del paquete de fechas: solo `README.md`, `package.json` y `src/index.js` (sin `node_modules`) | `cd ../fechas-bitacora-sofiagonzalezgallego && npm publish --dry-run` |
| `05-npm-link-y-npm-ls.txt` | `npm link` global (enlace simbólico en `C:`), el intento local y el resultado de `npm ls` | Ver el propio archivo |
| `06-validaciones.txt` | Validaciones: texto vacío, N no numérico, id inexistente, ruta relativa, carpeta inexistente y comando desconocido | Ver el propio archivo |
| `exportacion-ejemplo/exportacion.txt` | Resultado real de `exportar` movido a una ruta absoluta | `npm start -- exportar "E:\CuartoTrimestre\NodeJS\Bitacora-cli\evidencias\exportacion-ejemplo"` |

## Nota sobre el `npm link` local (disco FAT32)

El enlace **global** se creó sin problemas (vive en `C:\Users\Sofia\AppData\Roaming\npm\node_modules`,
disco NTFS). El enlace **local** dentro de `node_modules/` no puede crearse porque el proyecto está
en la unidad `E:`, que es FAT32: Windows exige NTFS para enlaces simbólicos y junction points.
En un equipo con disco NTFS, `npm link fechas-bitacora-sofiagonzalezgallego` dentro del proyecto
crea el enlace y `npm ls` lo muestra igual que en la sección 4 del archivo `05`.

## Datos de las pruebas

La bitácora quedó con notas de prueba en `data/` (carpeta ignorada por Git, no se sube).
Para empezar de cero:

```bash
rm -rf data respaldos salida
```
