# CompraMundo — Auditoría V1

Plataforma en desarrollo para explorar comercios internacionales y, en fases posteriores, gestionar pedidos y una billetera multimoneda. La moneda interna propuesta se llama **CRX** (antes CMX).

## Publicación
Interfaz: https://charly83cah83-lab.github.io/CubaPlusPay/CompraMundo/

## Hallazgos de la auditoría del código
- La página es una interfaz estática HTML/CSS/JavaScript.
- Los botones de Temu, Amazon y eBay abren búsquedas externas; no hay catálogo unificado, carrito compartido ni checkout integrado.
- La billetera, los saldos, la actividad y el acceso son marcadores visuales; no están conectados a autenticación ni a un backend financiero.
- El convertidor usa una tasa introducida manualmente, sin cotización de mercado.
- No se deben aceptar depósitos, retiros ni pagos desde esta versión.
- `supabase/schema.sql` es un borrador no aplicado; no se ha confirmado el esquema real del proyecto Supabase.
- Se actualizó el símbolo interno en la interfaz y el esquema de borrador de CMX a CRX. Si ya existen datos o restricciones con CMX en una base de datos, la migración debe ser revisada y ejecutada explícitamente; cambiar archivos de GitHub no modifica la base de datos.

## Arquitectura prevista
1. Supabase Auth, confirmación de correo, recuperación de acceso y perfiles.
2. Autorización de servidor y roles, incluido un rol de propietario/admin asignado de forma segura.
3. Pedidos, catálogo autorizado e historial.
4. Libro contable de doble entrada, movimientos inmutables e idempotencia.
5. Integración de proveedores de pago con webhooks verificados y conciliación.
6. Políticas RLS, auditoría, límites, prevención de fraude y pruebas.
7. Integraciones comerciales solo mediante APIs/programas autorizados.

## Bloqueos antes de producción
- Confirmar acceso al proyecto Supabase correcto y revisar tablas, migraciones, funciones, RLS y asesores de seguridad.
- No aplicar el esquema borrador a ciegas ni duplicar tablas existentes.
- Definir la naturaleza jurídica y económica de CRX antes de emitirla, asignarle valor o permitir transferencias.
- Confirmar proveedores disponibles para los países objetivo, sus requisitos y las condiciones legales.
- Mantener secretos únicamente en variables seguras del servidor; nunca en HTML público ni en GitHub.
- No activar dinero real hasta superar pruebas funcionales, de seguridad, conciliación y recuperación.

## Próximo paso
Completar la auditoría del backend Supabase con acceso autorizado. La integración directa no pudo verificarse en esta sesión; por ello no se afirma que el backend esté conectado ni que el esquema se haya desplegado.
