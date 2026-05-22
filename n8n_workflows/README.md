# ⚙️ Workflows Pre-Armados de n8n para canchaOS

¡Hola Ariel! Te dejé la vida solucionada, crack. ⚽🔥
Acá tenés tres flujos de trabajo profesionales listos para usar. No hace falta que arrastres nodos ni programes nada desde cero.

## 🚀 ¿Cómo importarlos en tu n8n?

Tenés **dos formas ultra fáciles** de cargarlos:

### Opción A (La más rápida - Copy & Paste):
1. Abrí cualquiera de los archivos `.json` de esta carpeta en tu editor de código o Bloc de notas.
2. Seleccioná todo el texto y copialo (`CTRL + C`).
3. Entrá a tu panel de **n8n** en tu navegador, creá un **Nuevo Workflow** (Workflow en blanco).
4. Hace un clic en cualquier parte vacía de la cuadrícula (el lienzo) y simplemente pegalo (`CTRL + V`).
5. ¡BOOM! Aparecerán todos los nodos conectados mágicamente.

### Opción B (Importación clásica):
1. Entrá a tu panel de **n8n** y creá un **Nuevo Workflow**.
2. Arriba a la derecha, hacé clic en el botón de los tres puntitos (`...`) o menú de opciones.
3. Elegí **"Import from File"** (Importar desde archivo).
4. Seleccioná el archivo `.json` de esta carpeta.
5. ¡Listo! Todo cargado.

---

## 📂 ¿Qué contiene cada flujo?

1. **`reserva_confirmacion.json` (Flujo 1):**
   * Escucha las inserciones en la tabla `reservas_web` (gracias al Webhook que estás creando ahora en Supabase).
   * Genera el mensaje de confirmación con el nombre del cliente, la sede, y el enlace de pago dinámico.
   * Envía el WhatsApp de forma automatizada por Twilio.

2. **`lista_espera_alerta.json` (Flujo 2):**
   * Se activa cuando un turno reservado pasa a estar libre (se cancela).
   * Hace una consulta automática a Supabase a la tabla `lista_espera` filtrando por la misma sede, deporte, fecha y hora del turno cancelado.
   * Si encuentra a alguien, le manda un WhatsApp avisándole que tiene la prioridad absoluta para quedarse con el turno.

3. **`auditoria_caja_diaria.json` (Flujo 3):**
   * Se ejecuta automáticamente todos los días a las **23:59 PM**.
   * Consulta todos los movimientos de caja registrados hoy en Supabase.
   * Calcula los ingresos, egresos y la **Ganancia Neta** por separado para Lanús y Belgrano.
   * Te manda un balance global a tu WhatsApp para que te acuestes sabiendo exactamente cuánto rindió el complejo hoy.

---

## 🛠️ ¿Qué tenés que configurar en los nodos?

* **Supabase Nodes (en Flujo 2 y 3):** Poné la URL de tu proyecto de Supabase (`https://vcwqhxuyngqcnpptirtb.supabase.co`) y tu `anon key` (está en tu `.env` o en los mismos archivos `.json` ya viene pre-cargada).
* **Notificaciones de WhatsApp (Twilio):** En el nodo de HTTP Request de Twilio, tendrás que ingresar tu `ACCOUNT SID` y tu `AUTH TOKEN` (que te da Twilio gratis al registrarte) para poder mandar los WhatsApps reales.

¡Esto va a ser un golazo de media cancha para canchaOS! 🏟️✨🙌
