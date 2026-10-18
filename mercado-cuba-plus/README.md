# Mercado Cuba Plus — piloto

Esta aplicación vive en una subcarpeta de CubaPlusPay para no reemplazar ni alterar el index.html existente.

URL prevista de GitHub Pages: https://charly83cah83-lab.github.io/CubaPlusPay/mercado-cuba-plus/

## Incluye
- Interfaz móvil adaptable, catálogo por categorías y buscador.
- Precios editables por separado en USD y CUP.
- Carrito, cantidades y cálculo de comisión configurable.
- Preferencias de pago: efectivo USD, efectivo CUP, transferencia CUP o coordinar.
- Formulario de pedido de prueba, botones de WhatsApp y llamada.
- Panel local para editar precios, disponibilidad y comisión.
- Exportación CSV de pedidos de prueba.

## Limitación actual
Esta es una demo estática. Los datos se guardan en localStorage del navegador que la abre. No hay base de datos compartida, autenticación real, inventario central, cobro online ni registro central de pedidos. El panel local no debe usarse para administrar una tienda pública ni se deben introducir datos personales reales.

## Siguiente fase para producción
1. Conectar un proyecto Supabase independiente o expresamente autorizado.
2. Revisar y aplicar supabase/schema.sql con RLS.
3. Añadir autenticación del propietario y permisos de administración.
4. Implementar una Edge Function que valide precios, stock, moneda, comisión y total en el servidor.
5. Conectar el frontend usando solo URL y clave publicable; nunca incluir claves service_role/secret en el navegador.
6. Probar duplicados, manipulación de precios, acceso cruzado a pedidos y cálculo de comisión.
7. Activar pedidos reales solo tras completar las pruebas.

Los precios iniciales son ejemplos de diseño, no precios de mercado verificados.
