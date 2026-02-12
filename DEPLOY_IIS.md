# Guía de Despliegue en IIS

## Configuración para servir Simi Crush en Internet Information Services (IIS)

### Paso 1: Build de la Aplicación

```bash
npm run build
```

Esto genera la carpeta `dist/` con todos los archivos necesarios.

### Paso 2: Copiar archivos a IIS

1. **Opción A - Servir en la raíz del servidor:**
   - Copiar contenido de la carpeta `dist/` a: `C:\inetpub\wwwroot\`
   - La aplicación será accesible en: `http://tu-servidor/`

2. **Opción B - Servir en una subcarpeta (recomendado para múltiples apps):**
   - Crear una carpeta: `C:\inetpub\wwwroot\simicrush\`
   - Copiar contenido de `dist/` ahí
   - La aplicación será accesible en: `http://tu-servidor/simicrush/`
   - **IMPORTANTE:** Modificar `vite.config.js` línea 8:
     ```javascript
     base: '/simicrush/',  // En lugar de '/'
     ```
   - Hacer nuevo build: `npm run build`
   - Copiar `dist/` actualizado a IIS

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

### Paso 7: Habilitar URL Rewrite Module (IMPORTANTE)

Si los assets se cargan pero las rutas internas no funcionan:

1. Descargar **URL Rewrite Module** desde Microsoft:
   https://www.iis.net/downloads/microsoft/url-rewrite

2. Instalarlo en el servidor IIS

3. Reiniciar IIS:
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

### Error: "Failed to load resource: net::ERR_FAILED"
- ✓ Verificar que `web.config` está en la carpeta de la app
- ✓ Verificar permisos IIS_IUSRS en la carpeta
- ✓ Habilitar URL Rewrite Module

### Error: Assets no cargan (404)
- ✓ Revisar en Developer Tools (F12) el path exacto de los assets
- ✓ Verificar que `vite.config.js` tiene el `base:` correcto
- ✓ Si cambió el `base:`, hacer nuevo build: `npm run build`

### CORS Error
- El `web.config` está configurado para permitir CORS
- Si aún hay problemas, revisar la sección `httpCors` del archivo

### Aplicación se carga pero redirecciones no funcionan
- Habilitar IIS URL Rewrite Module (paso 7)
- El `web.config` maneja esto automáticamente

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
