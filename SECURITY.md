# Política de seguridad

## Reportar una vulnerabilidad

Si descubres una vulnerabilidad de seguridad en TimeOS, **no abras un issue público** ni la divulgues hasta que haya sido corregida.

En su lugar, repórtala de forma privada por uno de estos medios:

- Email: `security@timeos.example` *(reemplaza por la dirección de seguridad de tu organización)*
- O abre un *Security Advisory* privado en GitHub (pestaña **Security → Report a vulnerability**).

Por favor incluye:

- Una descripción del problema y su impacto.
- Pasos para reproducirlo (PoC si es posible).
- Versión / commit afectado y entorno.

Nos comprometemos a acusar recibo del reporte y a coordinar una divulgación responsable. Te mantendremos informado del progreso de la corrección.

## Versiones soportadas

| Versión | Soportada |
| ------- | --------- |
| `main` (última) | ✅ |
| Versiones anteriores | ❌ |

Solo la rama `main` recibe parches de seguridad. Mantén tu despliegue actualizado.

## Hardening para producción

Antes de exponer TimeOS en producción, revisa esta checklist:

- [ ] **`JWT_SECRET` fuerte**: usa una cadena aleatoria de al menos 32 caracteres. Genérala con `openssl rand -base64 48`. Nunca uses valores por defecto ni de ejemplo.
- [ ] **`LUMA_API_KEY` fuerte**: define un secreto único y robusto para el backend Luma; evita valores triviales como `dev` o `test`.
- [ ] **HTTPS obligatorio**: ejecuta la app detrás de un proxy inverso (Nginx, Caddy, etc.) con TLS. Nunca sirvas tráfico de sesión sobre HTTP en producción.
- [ ] **Rotación de claves filtradas**: si `JWT_SECRET`, `LUMA_API_KEY`, `RESEND_API_KEY` o cualquier otro secreto se expone, rótalo de inmediato. Rotar `JWT_SECRET` invalida las sesiones activas.
- [ ] **`.env.local` fuera de git**: confirma que `.env.local` (y cualquier archivo con secretos) está en `.gitignore` y nunca se sube al repositorio. `.env.example` solo debe contener plantillas sin valores reales.
- [ ] **Principio de mínimo privilegio**: asigna a cada usuario el rol más restrictivo posible (admin/manager/member). Limita los administradores al mínimo necesario.
- [ ] **Elimina credenciales de prueba**: borra o cambia los usuarios semilla (p. ej. `ana.garcia@timeos.com`) y sus contraseñas por defecto antes de ir a producción.
- [ ] **Aísla Luma**: restringe el acceso de red al backend Luma (firewall / red privada) para que solo la app pueda alcanzarlo.
- [ ] **Dependencias actualizadas**: ejecuta `npm audit` periódicamente y mantén las dependencias al día.
