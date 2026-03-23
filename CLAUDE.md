# Legacy Frontend — Claude Code Instructions

> Este es un proyecto LEGACY en producción activa.
> Modo: corrección de bugs y gaps front-back ÚNICAMENTE.
> NUNCA refactorizar. NUNCA cambiar arquitectura. NUNCA asumir.

---

## Archivos de referencia obligatorios

| Archivo                  | Cuándo leerlo                       |
| ------------------------ | ------------------------------------ |
| `docs/LEGACY_RULES.md` | Siempre — antes de cualquier cambio |
| `docs/API_CONTRACT.md` | Cuando el bug involucre HTTP calls   |

---

## Flujo obligatorio para CADA bug reportado

```
1. REPRODUCIR — entender exactamente qué falla y cuándo
2. DIAGNOSTICAR — leer el error completo, revisar Network tab
3. AISLAR — identificar el único archivo origen del problema
4. PROPONER — describir el fix antes de implementarlo
5. ESPERAR — no implementar sin aprobación del humano
6. APLICAR — fix mínimo, solo lo necesario
7. DOCUMENTAR — comentario en el código explicando el cambio
```

---

## Restricciones absolutas — NUNCA sin aprobación explícita

```
❌ Cambiar firma de métodos públicos (rompe en cascada)
❌ Cambiar interfaces o modelos de dominio
❌ Cambiar rutas del router
❌ Cambiar environment.ts o environment.prod.ts
❌ Tocar archivos de auth (interceptors, guards, servicios de login)
❌ Refactorizar aunque el código sea feo
❌ Cambiar nombres de variables que aparecen en templates HTML
❌ Actualizar dependencias o versiones
❌ Implementar sin que el humano apruebe la propuesta primero
```

---

## Lo que SÍ puedes hacer sin pedir permiso

```
✅ Agregar null safety (?.) en templates
✅ Agregar console.error donde el error era silencioso
✅ Agregar ?? [] o ?? null como fallback
✅ Agregar manejo de error donde no había (solo log + mensaje)
✅ Agregar finalize(() => this.isLoading = false)
✅ Corregir una URL de endpoint incorrecta
✅ Corregir un campo mal nombrado en el body del request
✅ Agregar un campo que faltaba en el request body
```
