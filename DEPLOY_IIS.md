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

2. **Servir como Virtual Directory dentro de "porunpaismejor":**
   - La carpeta física es: `C:\inetpub\wwwroot\porunpaismejor\simicrush\`
   - Copiar TODO el contenido de `dist/` a esa carpeta:
     - `index.html`
     - Carpeta `assets/`
     - `web.config` ← **IMPORTANTE**
   - La aplicación será accesible en: `https://www.porunpaismejor.com.mx/simicrush/`

### Paso 3: Configurar el Application Pool en IIS (si es necesario)

Como es una Virtual Directory dentro del sitio "porunpaismejor" existente, el Application Pool ya debería estar configurado correctamente. Si necesitas verificar:

1. Abrir **IIS Manager**
2. Ir a **Application Pools**
3. Encontrar el pool del sitio "porunpaismejor"
4. Verificar que está configurado con:
   - **.NET CLR version:** No managed code (es una app estática)
   - **Managed pipeline mode:** Integrated
   - **Start automatically:** ✓ (activado)

### Paso 4: Crear la Virtual Directory en IIS (si no existe)

Como es una Virtual Directory dentro del sitio "porunpaismejor" existente:

1. En **Sites** → **porunpaismejor** → Click derecho → **Add Virtual Directory**
2. Configurar:
   - **Alias:** `simicrush`
   - **Physical path:** `C:\inetpub\wwwroot\porunpaismejor\simicrush\`
3. Click **OK**

**Nota:** Si "simicrush" ya existe como una carpeta dentro de "porunpaismejor", IIS debería reconocerla automáticamente.

### Paso 5: Verificar Permisos

IIS necesita permisos para leer los archivos en `C:\inetpub\wwwroot\porunpaismejor\simicrush\`:

1. Click derecho en la carpeta `simicrush` → **Properties**
2. **Security tab** → **Edit**
3. Verificar que `IIS_IUSRS` tiene permisos de **Read & Execute** y **Read**
4. Si no está, agregarlo y click **Apply**

**Nota:** El sitio "porunpaismejor" ya debería tener permisos configurados, pero verifica la subcarpeta "simicrush".

### Paso 6: Verificar el `web.config`

El archivo `web.config` en la carpeta `dist/` configura:
- ✓ Reescritura de URLs (URL Rewrite) para SPA
- ✓ Tipos MIME correctos para `.js`, `.css`, etc.
- ✓ Compresión gzip automática
- ✓ Cache headers apropiados
- ✓ Headers de seguridad

**Importante:** Si usas una subcarpeta en IIS, el `web.config` ya está configurado correctamente.

### Paso 6b: DESPUÉS de copiar web.config - Reciclar Application Pool

Este paso es importante pero **SEGURO** (no afecta otros sitios):

En **IIS Manager**:
1. Ir a **Application Pools**
2. Click derecho en el Application Pool de "porunpaismejor"
3. Click en **Recycle**

**Alternativa (si tienes acceso PowerShell como Administrador):**
```powershell
# Reciclar solo el Application Pool de porunpaismejor
Restart-WebAppPool -Name "porunpaismejor"
```

**NOTA:** NO uses `iisreset` ya que eso reinicia TODOS los sitios IIS y puede afectar otros proyectos en el servidor.

## Paso 7: URL Rewrite Module (Opcional)

El `web.config` simplificado está diseñado para **NO requerir** URL Rewrite Module. Sin embargo, si después de desplegar siguen habiendo problemas de redirecciones:

1. Descargar **URL Rewrite Module** desde Microsoft:
   https://www.iis.net/downloads/microsoft/url-rewrite

2. Instalarlo en el servidor IIS

3. Reciclar el Application Pool de "porunpaismejor"
   - En IIS Manager: **Application Pools** → Click derecho en "porunpaismejor" → **Recycle**

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

1. ✓ Verificar que `web.config` está en `C:\inetpub\wwwroot\porunpaismejor\simicrush\web.config`
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
2. Seleccionar el sitio `porunpaismejor` → **simicrush** (Virtual Directory)
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
