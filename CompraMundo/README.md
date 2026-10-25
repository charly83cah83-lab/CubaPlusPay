# CompraMundo — V2 en desarrollo

CompraMundo es una interfaz móvil para explorar tiendas, consultar una wallet CRX y registrar solicitudes de compra por enlace. CRX es una unidad interna propuesta; no es una criptomoneda pública ni tiene un valor de cambio garantizado.

## Código y vista previa
- Frontend: `index.html` (HTML/CSS/JavaScript modular con Supabase JS).
- Vista prevista en GitHub Pages: https://charly83cah83-lab.github.io/CubaPlusPay/CompraMundo/
- Rama de trabajo: `feature/compramundo-supabase-auth-orders`.
- PR de implementación: https://github.com/charly83cah83-lab/CubaPlusPay/pull/2

## Backend verificado
Proyecto Supabase: `zccgesqiztrtuapffevz`.

La migración `compramundo_v1_core_crx_wallet_orders` se aplicó y se verificaron estas tablas con RLS activado:
- `cm_profiles`
- `cm_wallets`
- `cm_ledger_entries`
- `cm_orders`
- `cm_payment_intents`
- `cm_provider_events`
- `cm_admin_members`

El frontend V2 añade:
- Supabase Auth: entrar, crear cuenta, cerrar sesión y recuperar contraseña.
- Lectura de balances desde `cm_wallets`; no se permite escribir balances desde el navegador.
- Solicitudes draft de compra por enlace en `cm_orders`.
- Historial de pedidos del usuario autenticado.

## Lo que todavía NO está habilitado
- Recargas, retiros, conversiones ni acreditación de CRX.
- Integración real con QvaPay o CubaPay.
- Compra automática o checkout con Amazon, eBay o Temu.
- Panel administrativo y asignación segura del rol de propietario.
- Cotizaciones definitivas de productos, envíos o comisiones.

Los enlaces externos permiten navegar por las tiendas; no significan que acepten CRX directamente. Los pedidos enviados son solicitudes, no compras pagadas ni cotizaciones finales.

## Seguridad y pruebas pendientes
- Configurar y probar las URL de confirmación y recuperación de Auth en Supabase.
- Ejecutar pruebas de registro, login, sesión, lectura de wallets y creación/listado de pedidos con una cuenta de prueba.
- Resolver los avisos informativos del asesor de seguridad para las tablas privadas `cm_admin_members` y `cm_provider_events` sin abrir acceso a usuarios normales.
- Implementar funciones de servidor con idempotencia, verificación de eventos y conciliación antes de cualquier acreditación.
- Definir el modelo económico/legal de CRX y confirmar compatibilidad de proveedores por país.

No se deben manejar fondos reales hasta completar las pruebas funcionales, de autorización, conciliación, recuperación y revisión legal.
