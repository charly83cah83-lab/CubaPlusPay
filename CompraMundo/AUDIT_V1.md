# CompraMundo V1 — Auditoría técnica inicial

Fecha: 2026-10-24
Rama de trabajo: `audit/compramundo-v1-crx`

## Resumen ejecutivo
La revisión del código fuente confirma que CompraMundo es una maqueta frontend estática. La interfaz no procesa dinero y no debe presentarse como una billetera operativa. El símbolo de la moneda interna se cambió de CMX a CRX en la interfaz y en el esquema SQL borrador.

## Verificado en GitHub
- `CompraMundo/index.html`: HTML/CSS/JavaScript en un único archivo; enlaces de búsqueda externa para Temu, Amazon y eBay; convertidor local con tasa manual; el botón de acceso muestra un aviso en lugar de autenticar.
- `CompraMundo/supabase/schema.sql`: borrador de tablas de perfiles, billeteras, pedidos, entradas contables y eventos de pago, con RLS parcial. No implementa por sí mismo un sistema de saldos ni las funciones transaccionales.
- `CompraMundo/README.md`: actualizado con el estado real y la hoja de ruta.

## Riesgos y defectos que impiden producción
1. No hay cliente Supabase configurado en el frontend ni flujo Auth real.
2. No se pudo confirmar el proyecto Supabase ni consultar sus tablas, migraciones, funciones o políticas en esta sesión; la lista de proyectos devolvió cero y la consulta directa de proyecto no autorizó la operación.
3. El esquema borrador no debe aplicarse a ciegas: puede duplicar o entrar en conflicto con objetos existentes.
4. La tabla de eventos de pago no es una integración de pagos; no hay verificación de firmas de webhook, conciliación ni procesador de estados.
5. Las entradas contables no bastan para un libro de doble entrada: falta un modelo transaccional validado en servidor que impida movimientos desbalanceados y doble acreditación.
6. No existe un sistema de roles de propietario/admin ni autorización privilegiada en servidor.
7. No hay API de catálogo ni checkout autorizado para las tiendas; los enlaces solo abren sus webs.
8. CRX sigue siendo una propuesta conceptual. No debe asignársele un valor, emitir saldos o permitir transferencias hasta definir la naturaleza del activo, los controles y las obligaciones legales.

## Cambios hechos en esta rama
- Sustitución visible de CMX por CRX en la interfaz.
- Sustitución del código de activo CMX por CRX en las restricciones del esquema borrador.
- README actualizado para no afirmar capacidades que todavía no existen.

## Plan de implementación seguro
### Fase 0 — Acceso y auditoría de backend
- Obtener acceso autorizado al proyecto Supabase correcto.
- Inspeccionar tablas, columnas, claves, RLS, políticas, funciones, triggers, migraciones y avisos de seguridad.
- Comparar esos objetos con el esquema borrador y diseñar migraciones incrementales.

### Fase 1 — Identidad y roles
- Configurar Supabase Auth, confirmación de correo, recuperación de contraseña y sesión.
- Crear perfiles y autorización de servidor.
- Definir el rol de propietario de forma verificable; no permitir que el cliente se conceda el rol.

### Fase 2 — Pedidos
- Definir catálogo y órdenes, estados permitidos, precios y divisa.
- Guardar las órdenes en el servidor y validar los datos.
- Añadir idempotencia, auditoría y cancelaciones/refunds controlados.

### Fase 3 — Contabilidad
- Diseñar libro de doble entrada con moneda, importe exacto, referencia única y transacción atómica.
- Impedir escrituras directas desde el cliente.
- Implementar funciones de servidor para reservas, capturas, liberaciones, reversiones y comisiones.
- Probar duplicados, concurrencia, límites y conservación contable.

### Fase 4 — Proveedores
- Seleccionar proveedor autorizado y compatible con los países objetivo.
- Mantener credenciales en secretos del servidor.
- Verificar firmas de webhook, guardar eventos idempotentes y conciliar antes de acreditar.
- Mantener depósitos/retiros deshabilitados hasta superar pruebas.

### Fase 5 — Catálogo comercial y salida a producción
- Integrar únicamente APIs/programas permitidos por cada tienda.
- Ejecutar pruebas funcionales, de autorización, seguridad, restauración y contabilidad.
- Completar revisión legal, privacidad, KYC/AML y restricciones por jurisdicción antes de operar.

## Criterio de aceptación
La versión no estará lista para dinero real hasta que autenticación, permisos, operaciones contables, webhooks, conciliación, auditoría y recuperación hayan superado pruebas repetibles en un entorno de pruebas.
