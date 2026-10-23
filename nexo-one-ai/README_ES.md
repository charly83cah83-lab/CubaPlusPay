# NEXO ONE AI — inicio del proyecto

## Estado real
Esta carpeta es un prototipo web funcional en modo local. Incluye interfaz futurista adaptable, borradores de estrategia, especificación de aplicaciones, calculadora de economía unitaria, exportación TXT y PWA básica. **Todavía no está conectada a un modelo de IA, autenticación, base de datos ni pagos reales.** No presenta ingresos ficticios como reales.

## Publicación
Se aloja en una subcarpeta independiente del sitio actual: `/CubaPlusPay/nexo-one-ai/`. No reemplaza el `index.html` de CubaPlusPay.

## Próximo paso: Supabase + IA
1. En el proyecto Supabase correcto, habilitar Edge Functions.
2. Crear secretos del servidor: `OPENAI_API_KEY` y opcionalmente `OPENAI_MODEL`.
3. Desplegar la función de `supabase/functions/nexo-ai/index.ts` con verificación JWT activada.
4. Configurar autenticación, límites de uso, registro de consumo y políticas RLS antes de abrir a clientes.
5. No colocar claves privadas en HTML/JavaScript del navegador.

## Monetización (aún no activa)
Los precios en la interfaz son hipótesis para validar. Antes de cobrar se necesita proveedor de pagos compatible, webhook firmado, idempotencia, registro de pagos, créditos calculados en servidor, términos, política de privacidad y controles antifraude. No se han realizado cobros.

## Economía unitaria
El precio de un plan debe cubrir coste del modelo, alojamiento, pagos, soporte, reembolsos e impuestos, dejando margen. Los créditos deben medirse y deducirse en backend, no confiar en el navegador.

## Límites
El generador actual produce especificaciones y borradores, no código ejecutable completo ni publicación automática de apps. No promete resultados financieros.
