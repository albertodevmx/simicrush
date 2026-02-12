# Guía de Despliegue en IIS

## Configuración para servir Simi Crush en Internet Information Services (IIS)

### Paso 1: Build de la Aplicación

```bash
npm run build
```

Esto genera la carpeta `dist/` con todos los archivos necesarios.

### Paso 2: Preparar archivos para IIS

1. **Copiar `web.config` a la carpeta `dist/`:**
   ```bash
   copy web.config dist/web.config
   ```
   En Linux/Mac:
   ```bash
   cp web.config dist/web.config
   ```

2. **Servir en subcarpeta (recomendado):**
   - Crear carpeta en IIS: `C:\inetpub\wwwroot\simicrush\`
   - Copiar TODO el contenido de `dist/` a esa carpeta:
     - `index.html`
     - Carpeta `assets/`
     - `web.config` ← **IMPORTANTE**
   - La aplicación será accesible en: `https://www.porunpaismejor.com.mx/simicrush/`

### Paso 3: Configurar el Application Pool en IIS

1. Abrir **IIS Manager**
2. Ir a **Application Pools**
3. Crear o seleccionar el pool para tu aplicación
4. Configurar:
   - **.NET CLR version:** No managed code (es una app estática)
   - **Managed pipeline mode:** Integrated
   - **Start automatically:** ✓ (activado)

### Paso 4: Crear el Sitio Web en IIS

1. En **Sites** → Click derecho → **Add Website**
2. Configurar:
   - **Site name:** `Simi Crush`
   - **Physical path:** `C:\inetpub\wwwroot\` (o tu subcarpeta)
   - **Binding type:** `http`
   - **IP address:** `All Unassigned`
   - **Port:** `80` (o 443 para HTTPS)
   - **Host name:** (dejar vacío o poner tu dominio)
3. Click **OK**

### Paso 5: Verificar Permisos

IIS necesita permisos para leer los archivos:

1. Click derecho en la carpeta → **Properties**
2. **Security tab** → **Edit**
3. Agregar usuario `IIS_IUSRS` con permisos de **Read & Execute** y **Read**
4. Click **Apply**

### Paso 6: Verificar el `web.config`

El archivo `web.config` en la carpeta `dist/` configura:
- ✓ Reescritura de URLs (URL Rewrite) para SPA
- ✓ Tipos MIME correctos para `.js`, `.css`, etc.
- ✓ Compresión gzip automática
- ✓ Cache headers apropiados
- ✓ Headers de seguridad

**Importante:** Si usas una subcarpeta en IIS, el `web.config` ya está configurado correctamente.

### Paso 6b: DESPUÉS de copiar web.config - Reiniciar IIS

Este paso es CRÍTICO:

```bash
iisreset
```

O en PowerShell (como Administrador):
```powershell
net stop WAS
net start WAS
```

O en IIS Manager:
- Click en el servidor en el panel izquierdo
- En el panel derecho, click en **Restart**

## Paso 7: Habilitar URL Rewrite Module (IMPORTANTE)

Si después de reiniciar IIS siguen habiendo problemas:

1. Descargar **URL Rewrite Module** desde Microsoft:
   https://www.iis.net/downloads/microsoft/url-rewrite

2. Instalarlo en el servidor IIS

3. Reiniciar IIS nuevamente:
   ```bash
   iisreset
   ```

### Paso 8: Prueba Final

Abrir en el navegador:
- `http://tu-servidor/` (si es en raíz)
- `http://tu-servidor/simicrush/` (si es en subcarpeta)

Si ves la aplicación pero los assets no cargan:
- Abrir **Developer Tools** (F12)
- Verificar en **Network** si los `.js` y `.css` están disponibles
- Si hay errores 404, revisar los paths en el `web.config`

## Solución de Problemas

### Error: "Expected a JavaScript-or-Wasm module script but the server responded with a MIME type of text/html"

Este es el error más común. Significa que IIS está devolviendo HTML en lugar de JavaScript.

**Checklist de verificación:**

1. ✓ Verificar que `web.config` está en `C:\inetpub\wwwroot\simicrush\web.config`
2. ✓ **Reiniciar IIS después de copiar web.config:**
   ```bash
   iisreset
   ```
3. ✓ Abrir DevTools (F12) → Tab "Network"
4. ✓ Buscar la línea que intenta cargar (`index-XXXXX.js`)
5. ✓ Hacer click en ese archivo
6. ✓ Ver detalles:
   - **Headers tab:** Verificar `Content-Type: application/javascript`
   - **Response tab:** Debe mostrar código JavaScript, NO HTML
7. ✓ Si muestra HTML → El MIME type no está configurado
   - Solución: Copiar `web.config` y reiniciar IIS

**Si sigue sin funcionar después de copiar web.config:**

1. Abrir IIS Manager
2. Seleccionar el sitio `simicrush`
3. Hacer click en **MIME Types**
4. Verificar que `.js` está mapeado a `application/javascript`
5. Si no está, agregarlo:
   - Click **Add**
   - File name extension: `.js`
   - MIME type: `application/javascript`
   - Click **OK**

### Error: "Failed to load resource: net::ERR_FAILED"
- ✓ Verificar que `web.config` está en la carpeta de la app
- ✓ Verificar permisos IIS_IUSRS en la carpeta
- ✓ Reiniciar IIS: `iisreset`
- ✓ Habilitar URL Rewrite Module

### Error: Assets no cargan (404)
- ✓ En DevTools Network tab, ver la URL exacta del asset fallido
- ✓ Verificar que `vite.config.js` tiene el `base: '/simicrush/'` correcto
- ✓ Copiar el nuevo `dist/` a IIS
- ✓ Reiniciar IIS: `iisreset`

### CORS Error
- El `web.config` está configurado para permitir CORS
- Si aún hay problemas, revisar la sección `httpCors` del archivo

### Aplicación se carga pero redirecciones no funcionan
- Habilitar IIS URL Rewrite Module (paso 7)
- El `web.config` maneja esto automáticamente
- Reiniciar IIS después de instalar URL Rewrite Module

## Configuración para HTTPS (Producción)

1. Instalar certificado SSL/TLS en el servidor
2. En IIS Manager → Properties del sitio → Bindings
3. Agregar binding:
   - Type: `https`
   - Port: `443`
   - SSL Certificate: Seleccionar tu certificado
4. (Opcional) Redirigir HTTP → HTTPS agregando regla en `web.config`

## Actualizar la Aplicación

Cada vez que hagas cambios:

```bash
npm run build
```

Luego copiar la carpeta `dist/` nuevamente a IIS (sobrescribir).

---

¿Preguntas o problemas? Revisar los logs de IIS en:
`C:\inetpub\logs\LogFiles\W3SVC1\`
