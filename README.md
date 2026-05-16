# Cuadre de Caja · Cargo

App de cuadre de caja diario para Cargo Beer Burger & Grill. Suelta el PDF de cierre, confirma el conteo de billetes, y la app calcula el descuadre. Los datos históricos se guardan automáticamente en este mismo repo (`data/cuadre.json`) usando la API de GitHub.

## Cómo usar

1. **Abre el sitio** (servido por GitHub Pages, ver más abajo).
2. **Conecta GitHub** en *Ajustes*:
   - Genera un Personal Access Token (fine-grained) en [github.com/settings/personal-access-tokens/new](https://github.com/settings/personal-access-tokens/new)
   - Resource owner: tu cuenta · Repository access: *Only select repositories* → este repo
   - Permission: **Contents: Read and write**
   - Pega el token en la app + escribe `usuario/cuadre-de-caja`
3. **Cuadre del día**: suelta el PDF de Loggro, ajusta lo que necesites, cuenta los billetes.
4. Cada cambio se guarda en `data/cuadre.json` como commit, y al abrir la app desde otro dispositivo se lee la versión más reciente.

## Estructura

```
index.html                # entry point — carga React + Babel + módulos
app-shared.jsx            # tokens de diseño, helpers (fmtMoney, fechas), Sidebar
app-store.jsx             # useStore: estado global + localStorage + integración con sync
app-github-sync.jsx       # capa de sincronización GitHub Contents API
app-settings.jsx          # pantalla "Ajustes" — token + repo + estado
app-pdf-parser.jsx        # pdfjs + Tesseract.js OCR para parsear PDF Loggro
app-cuadre.jsx            # vista principal "Cuadre del día"
app-screens.jsx           # vistas auxiliares (Calendario, Resumen, Propinas, etc.)
data/cuadre.json          # base de datos histórica (commits automáticos)
assets/cargo-logo.png     # logo
```

## Modelo de datos

`data/cuadre.json` tiene la forma:

```json
{
  "schemaVersion": 1,
  "days": {
    "2026-05-12": {
      "date": "2026-05-12",
      "comprobante": "131",
      "responsable": "Cargo Beer Burger Pto Colombia",
      "pdfFilename": "Cierre 5-12.pdf",
      "ventas": { "efectivo": 212000, "tarjeta": 266500, "transferencia": 324000 },
      "domicilioEfectivo": 0,
      "propinaTotal": 57000,
      "gastos": { "nomina": 100000, "proveedores": 31000, "domicilios": 0, "otros": 0 },
      "ajustes": [],
      "notas": [],
      "contadoDetalle": { "monedas": 0, "b2k": 0, "b5k": 0, "b10k": 0, "b20k": 0, "b50k": 0, "b100k": 0 },
      "_mtime": 1747008000000
    }
  },
  "extrasMes": {
    "2026-05": [{ "id": 1.7e12, "fecha": "2026-05-14", "desc": "...", "monto": 50000 }]
  }
}
```

- `_mtime` es el timestamp de la última edición local — se usa para resolver conflictos last-write-wins cuando dos dispositivos escriben sobre el mismo día.

## Cómo funciona la sincronización

1. Al abrir la app, si hay token configurado, se lee `data/cuadre.json` del repo y se **mezcla** con lo que haya en `localStorage` (gana el de `_mtime` más reciente por día; los extras se unen por `id`).
2. Cada cambio dispara un push con **debounce de 4s** que hace `PUT /repos/.../contents/data/cuadre.json` con el SHA conocido.
3. Si el PUT falla con conflicto (otro dispositivo guardó primero), se hace un pull, merge, y reintento automático.
4. El token vive solo en `localStorage` del navegador. **Nunca se commitea**, nunca sale del cliente excepto en los headers `Authorization` hacia `api.github.com`.

## Publicación con GitHub Pages

1. Sube el repo (instrucciones abajo).
2. En GitHub → Settings → Pages → Source: *Deploy from a branch* → Branch: `main` / root.
3. El sitio queda en `https://<usuario>.github.io/cuadre-de-caja/`.

## Desarrollo local

No necesita build. Sirve la carpeta con cualquier servidor estático:

```powershell
python -m http.server 8000
# o
npx serve .
```

Abre `http://localhost:8000`.

## Stack

- React 18 + Babel standalone (sin build)
- pdf.js (PDF render) + Tesseract.js (OCR español)
- SheetJS (`xlsx`) para exportar propinas
- GitHub Contents API para persistencia
