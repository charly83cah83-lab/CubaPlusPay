# CompraMundo

Interfaz inicial futurista para compras globales y una futura billetera multimoneda.

## Publicación
La interfaz está en `CompraMundo/index.html`. Si GitHub Pages está habilitado para la rama `main` y la raíz del repositorio, se puede abrir en:
https://charly83cah83-lab.github.io/CubaPlusPay/CompraMundo/

## Estado real
- Los accesos de Temu, Amazon y eBay abren búsquedas en sus webs; no hay checkout unificado ni catálogo sincronizado.
- CMX es una propuesta, no una criptomoneda emitida, no tiene valor de cambio garantizado y no es transferible.
- No hay depósitos, retiros, conversiones, custodia ni pagos reales habilitados.
- No hay autenticación conectada en esta página; el botón de acceso no solicita ni almacena contraseñas.
- La tasa del convertidor es manual y solo hace cálculos locales.

## Backend Supabase
`supabase/schema.sql` es un borrador de esquema con RLS. No se ha aplicado a ningún proyecto. Antes de usarlo, revisar las tablas existentes y migraciones para evitar conflictos, aplicar en un proyecto de desarrollo y ejecutar pruebas de seguridad. La integración de Supabase no estaba disponible para este espacio de trabajo cuando se preparó este commit.

## Próximas etapas antes de manejar dinero real
1. Confirmar el proyecto Supabase correcto y aplicar migraciones revisadas en una rama/proyecto de pruebas.
2. Implementar Auth, recuperación de cuenta y roles administrativos con privilegios definidos en servidor.
3. Implementar libro contable de doble entrada e idempotencia; ningún cliente debe poder modificar saldos directamente.
4. Integrar proveedores autorizados para pagos y comprobar webhooks firmados y conciliación antes de acreditar fondos.
5. Integrar catálogos/checkout solo mediante API y programas autorizados de cada comercio.
6. Revisar requisitos legales, KYC/AML, sanciones, impuestos y disponibilidad por país antes de emitir o intercambiar activos.
7. Auditar y probar con fondos ficticios en entorno de pruebas antes de producción.

Nunca almacenar claves secretas de proveedor, claves de servicio Supabase o claves privadas de criptomonedas en el frontend o en GitHub.
