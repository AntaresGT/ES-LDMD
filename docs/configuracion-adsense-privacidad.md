# Configuración de AdSense: privacidad, RGPD y EE. UU.

Esta guía resume los pasos que debes completar en la **consola de Google AdSense** para que coincidan con el código del proyecto (Consent Mode v2, páginas legales en español y CMP de Google).

**Sitio de producción:** `https://es-ldmd.com`  
**URL de política de privacidad (para pegar en AdSense):** `https://es-ldmd.com/politica-privacidad`  
**URL de política de cookies:** `https://es-ldmd.com/politica-cookies`

---

## 1. Mensaje de regulaciones europeas (RGPD / EEE / Reino Unido)

1. Inicia sesión en [Google AdSense](https://www.google.com/adsense/).
2. En el menú lateral, entra en **Privacidad y mensajes**.
3. En la tarjeta **Mensaje de regulaciones europeas**, pulsa **Crear** (o **Gestionar** si ya existe).
4. **Selecciona el sitio** donde está alojada la aplicación (dominio verificado).
5. Añade el idioma **Español** para el texto del mensaje.
6. Activa la opción que permita **rechazar el consentimiento con un solo clic** («No consentir» o equivalente), para cumplir buenas prácticas en la UE.
7. En la configuración del mensaje, indica la URL de política de privacidad:  
   `https://es-ldmd.com/politica-privacidad`
8. Revisa el aspecto (colores, botones) y **Publica** el mensaje.

Documentación de referencia (Google): en Ayuda de AdSense, busca «Crear un mensaje de regulaciones europeas» y «Requisitos de gestión del consentimiento de Google».

---

## 2. Mensaje para regulaciones de estados de EE. UU. (CCPA / CPRA y similares)

1. En **Privacidad y mensajes**, localiza la tarjeta de **regulaciones de estados de Estados Unidos** (denominación exacta puede variar según la interfaz).
2. Pulsa **Crear mensaje** y asocia el mismo sitio.
3. Configura textos en **español** si ofrece la opción de idioma.
4. Enlaza la política de privacidad anterior.
5. **Publica** el mensaje.

Esto ayuda a ofrecer el aviso y mecanismos de opt-out que exigen muchas leyes estatales de EE. UU. respecto a publicidad dirigida y «venta» o «compartición» de datos.

---

## 3. Activar el modo de consentimiento (Consent Mode) en el CMP de Google

1. Dentro de **Privacidad y mensajes**, abre la **configuración de regulaciones europeas** (o la sección donde Google indique «Modo de consentimiento» / Consent Mode).
2. Activa las opciones que vinculen el CMP con **Consent Mode** para productos de **editor** y de **publicidad**, según lo que muestre tu cuenta.
3. Guarda los cambios.

El sitio ya envía valores por defecto **denegados** en el `<head>` (`ad_storage`, `ad_user_data`, `ad_personalization`, `analytics_storage`) antes de cargar `adsbygoogle.js`, de forma alineada con la documentación de Google sobre Consent Mode v2.

---

## 4. URL de política de privacidad en la ficha del sitio

1. Ve a **Sitios** (o **Cuenta** → **Sitios**, según el diseño actual).
2. Selecciona tu sitio y busca el campo de **política de privacidad** o información legal.
3. Introduce: `https://es-ldmd.com/politica-privacidad`

---

## 5. Comprobaciones recomendadas tras publicar

- Abre el sitio en **modo incógnito** desde una **VPN o ubicación de la UE**: debe mostrarse el mensaje de consentimiento de Google antes de tratar cookies publicitarias como consentidas.
- Prueba con **navegador que envíe GPC** (p. ej. Firefox con GPC activado): el código del sitio actualiza el consentimiento a denegado para almacenamiento publicitario y analítico cuando `navigator.globalPrivacyControl` es verdadero.
- Usa el enlace del pie **«Preferencias de privacidad y anuncios»**: debe abrir el diálogo de revocación de Google (`googlefc.showRevocationMessage`) cuando el CMP ya está desplegado.
- Verifica que `https://es-ldmd.com/ads.txt` sea accesible (ya está en `public/ads.txt`).

---

## 6. Textos legales en el código

- **Política de privacidad:** `src/app/politica-privacidad/page.tsx`  
  Revisa el correo `CORREO_CONTACTO_DATOS` y sustitúyelo por el contacto real del responsable del tratamiento.
- **Política de cookies:** `src/app/politica-cookies/page.tsx`

> **Aviso:** estos textos son informativos y no sustituyen asesoramiento jurídico. Ajusta según tu entidad jurídica, país y prácticas reales de tratamiento.

---

## 7. Enlaces útiles (documentación oficial de Google)

- Ayuda AdSense: **Privacidad y mensajes**, **mensajes de regulaciones europeas**, **requisitos de CMP** para el EEE, Reino Unido y Suiza.
- Desarrolladores Google: **Consent Mode** (guías de la plataforma de etiquetas).
- Ayuda AdSense: **ads.txt** y **ID de editor**.

Busca siempre las páginas con el idioma **español** (`hl=es`) en la URL de Ayuda si prefieres la interfaz en español.
