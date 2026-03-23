# Legacy Angular Frontend — Debugger Rules

> Eres un Senior Angular Engineer haciendo fixes paliativos.
> Este proyecto está en producción. Estabilizar sin romper.
> OBSERVAR → AISLAR → PROPONER → APROBAR → PARCHAR → DOCUMENTAR

---

## 🧠 Mentalidad del fix paliativo

```
Un fix paliativo AGREGA protección sin cambiar lógica existente.
Si tienes que cambiar la lógica → es refactor → requiere aprobación.
El happy path SIEMPRE debe quedar idéntico después del fix.
```

---

## 📋 Protocolo de diagnóstico — antes de tocar nada

```
PASO 1 — Reproduce el bug exactamente
  ¿Qué acción lo dispara?
  ¿Siempre ocurre o es intermitente?
  ¿Qué ve el usuario vs qué debería ver?

PASO 2 — Revisa el Network tab ANTES del código
  ¿Se hace el HTTP request?
    NO  → problema en el componente (no llama al servicio)
    SÍ  → ¿qué status retorna?
          401/403 → problema de auth/token
          404     → URL incorrecta
          400     → body mal formado (campos incorrectos)
          422     → validación fallida en el backend
          500     → error del backend
          200     → problema en cómo se procesa la respuesta

PASO 3 — Revisa la consola del browser
  ¿Hay errores de TypeScript en runtime?
  ¿Hay errores de template (ExpressionChanged...)?
  ¿Hay errores silenciosos (catchError vacío)?

PASO 4 — Forma una hipótesis
  "El bug ocurre porque X cuando Y"
  Antes de tocar código — propón el fix al humano
```

---

## 🔴 Gap 1 — El frontend llama a un endpoint que no existe

**Síntoma:** 404 en el Network tab, datos no cargan.

```typescript
// DIAGNÓSTICO: comparar la URL del frontend con el Swagger del backend
// Abrir docs/API_CONTRACT.md y buscar el endpoint correcto

// ❌ Frontend llama URL incorrecta
this.http.get('/api/usuario/listar')

// ✅ Fix paliativo — corregir la URL
this.http.get('/api/usuarios')  // según docs/API_CONTRACT.md

// SIEMPRE verificar:
// 1. El prefijo (/api vs /api/v1 vs sin prefijo)
// 2. El nombre exacto del recurso (singular vs plural)
// 3. El método HTTP correcto (GET vs POST)
// 4. Los path params (:id vs :userId)
```

---

## 🔴 Gap 2 — Parámetros mal enviados al backend

**Síntoma:** 400 Bad Request o 422 Unprocessable Entity.

```typescript
// DIAGNÓSTICO: comparar el body que envía el front
// con el DTO que espera el back (docs/API_CONTRACT.md)

// Herramienta: copiar el request del Network tab como cURL
// y pegarlo en el Swagger para ver qué espera el back

// ❌ Frontend envía campos con nombre incorrecto
const body = {
  nombre: this.form.value.name,        // back espera "name"
  apellido: this.form.value.surname,   // back espera "last_name"
};

// ✅ Fix paliativo — corregir los nombres de campo
const body = {
  name: this.form.value.name,
  last_name: this.form.value.surname,
};

// ❌ Frontend no envía campo requerido
const body = {
  name: this.form.value.name,
  // falta: college_id, required por el backend
};

// ✅ Fix paliativo — agregar el campo faltante
const body = {
  name: this.form.value.name,
  college_id: this.authService.getCollegeId(), // o de donde corresponda
};

// ❌ Frontend envía tipo incorrecto
amount: "150",     // back espera number
is_active: "true"  // back espera boolean

// ✅ Fix paliativo
amount: Number(this.form.value.amount),
is_active: this.form.value.isActive === true,
```

---

## 🔴 Gap 3 — Respuesta del backend no mapeada correctamente

**Síntoma:** 200 OK pero datos no se muestran, o se muestran undefined.

```typescript
// DIAGNÓSTICO: revisar la respuesta real en el Network tab
// vs cómo la procesa el servicio

// El backend retorna este formato estándar:
// { status_code: 200, message: "OK", data: { ... } }
// O para paginación: { results: [], total: N, page: N, take: N, total_pages: N }

// ❌ Frontend accede al campo incorrecto
this.http.get('/api/students').subscribe(response => {
  this.students = response as any; // el back retorna { data: [...] }
  // this.students es el objeto completo, no el array
});

// ✅ Fix paliativo — acceder al campo correcto
this.http.get<{data: Student[]}>('/api/students').subscribe(response => {
  this.students = response?.data ?? [];
});

// ❌ Paginación — campo incorrecto
this.students = response.items;   // el back retorna "results"

// ✅ Fix paliativo
this.students = (response as any).results ?? [];

// ❌ Campo con nombre diferente al esperado
this.userName = user.name;        // el back retorna "first_name"

// ✅ Fix paliativo
this.userName = (user as any).first_name ?? user.name ?? '';
```

---

## 🔴 Gap 4 — Autenticación / tokens mal manejados

**Síntoma:** 401 en todos los requests después de un tiempo, o al cargar la página.

```typescript
// DIAGNÓSTICO: revisar cómo se guarda y se envía el token
// Buscar: localStorage.getItem, Authorization header, interceptor

// Fix paliativo 1 — interceptor no envía el token
// Buscar el HTTP interceptor del proyecto y verificar:
intercept(req: HttpRequest<any>, next: HttpHandler) {
  const token = localStorage.getItem('token')     // o 'access_token'
              ?? localStorage.getItem('access_token')
              ?? sessionStorage.getItem('token');

  if (!token) {
    // Si no hay token, dejar pasar (el guard se encargará)
    return next.handle(req);
  }

  const authReq = req.clone({
    setHeaders: { Authorization: `Bearer ${token}` }
  });
  return next.handle(authReq);
}

// Fix paliativo 2 — 401 no redirige al login
// Buscar el catchError del interceptor y agregar redirect:
catchError((error: HttpErrorResponse) => {
  if (error.status === 401) {
    console.warn('[AuthInterceptor] Token expirado o inválido');
    localStorage.clear();
    // Usar la ruta de login del proyecto (revisar router)
    window.location.href = '/login';
  }
  return throwError(() => error);
})

// Fix paliativo 3 — token guardado con clave incorrecta
// Si el backend espera el token de login en "session_token"
// pero el frontend guarda "token":
const token = localStorage.getItem('session_token')
            ?? localStorage.getItem('access_token')
            ?? localStorage.getItem('token'); // fallback a nombres legacy
```

---

## 🔴 Gap 5 — Formulario no envía datos

**Síntoma:** submit no hace nada, o envía body vacío.

```typescript
// DIAGNÓSTICO: verificar en el Network tab si el request se hace
// Si no se hace: el submit no llama al servicio
// Si se hace con body vacío: el form no está bien vinculado

// Fix paliativo 1 — método submit no conectado
// En el template:
// ❌ <button type="button" (click)="save()">  → no hace submit del form
// ✅ <button type="submit">  → o verificar que save() llame al servicio

// Fix paliativo 2 — form values son null
onSubmit(): void {
  console.log('Form value:', this.form.value); // ADD para diagnosticar
  console.log('Form valid:', this.form.valid);  // ADD para diagnosticar

  if (this.form.invalid) {
    console.warn('Form is invalid:', this.form.errors);
    this.form.markAllAsTouched(); // ADD — muestra errores de validación
    return;
  }

  const body = this.form.value;
  console.log('Sending body:', body); // ADD para confirmar qué se envía
  this.service.create(body).subscribe(...);
}

// Fix paliativo 3 — FormControl con nombre incorrecto
// Si el form tiene: this.form.get('firstName')
// pero el template tiene: formControlName="first_name"
// → el valor siempre es null

// Verificar que los nombres coincidan exactamente
this.form = this.fb.group({
  firstName: [''],   // debe coincidir con formControlName="firstName"
});
```

---

## 🔴 Gap 6 — Error del backend no se muestra al usuario

**Síntoma:** algo falla pero el usuario solo ve la pantalla congelada o nada.

```typescript
// El backend retorna SIEMPRE:
// { status_code: N, error: "ERR_CODE", message: "texto legible" }

// Fix paliativo — extraer y mostrar el mensaje correcto
private handleError(error: HttpErrorResponse): Observable<never> {
  // Extraer mensaje legible del backend
  const message = error.error?.message    // campo "message" del backend
                ?? error.message           // mensaje de Angular (menos legible)
                ?? 'Error inesperado';

  const code = error.error?.error ?? 'ERR_UNKNOWN';

  console.error(`[Service] ${code}:`, message, error);

  // Mostrar al usuario — adaptar según el sistema de notificaciones del proyecto
  // Si usa toastr:
  // this.toastr.error(message);
  // Si usa un campo errorMessage en el componente:
  // this.errorMessage = message;
  // Si no hay sistema: agregar al menos el console.error

  return throwError(() => ({ message, code, status: error.status }));
}

// En cada servicio — reemplazar el catchError vacío:
// ❌ Antes
catchError(() => of(null))

// ✅ Después (paliativo — mantiene el of(null) pero agrega log)
catchError((error) => {
  const message = error.error?.message ?? error.message;
  console.error('[ServiceName] operación fallida:', message);
  return of(null); // mantén el valor original
})
```

---

## 🟡 Gap 7 — Datos null/undefined crashean el template

**Síntoma:** ExpressionChangedAfterItHasBeenCheckedError, o template en blanco.

```html
<!-- Fix paliativo — safe navigation operator en TODO el template -->

<!-- Strings -->
{{ item?.name ?? '—' }}

<!-- Fechas -->
{{ item?.createdAt | date:'dd/MM/yyyy' }}

<!-- Números -->
{{ item?.amount ?? 0 | number:'1.2-2' }}

<!-- Arrays en *ngFor -->
<tr *ngFor="let item of items ?? []">

<!-- Objetos anidados -->
{{ item?.address?.city ?? 'Sin ciudad' }}

<!-- Condiciones -->
<div *ngIf="item?.isActive">
<div *ngIf="items?.length > 0">
```

```typescript
// Fix paliativo en el componente — inicializar siempre
items: Item[] = [];           // ❌ nunca: items: Item[];
selectedItem: Item | null = null;
isLoading = false;
errorMessage = '';
totalItems = 0;
```

---

## 🟡 Gap 8 — Fechas en formato ISO raw

```html
<!-- ❌ Muestra: "2026-03-21T12:58:19.619Z" -->
{{ item.createdAt }}

<!-- ✅ Fix paliativo — DatePipe -->
{{ item.createdAt | date:'dd/MM/yyyy' }}
{{ item.createdAt | date:'dd/MM/yyyy HH:mm' }}

<!-- Si la fecha viene como string y DatePipe no la parsea: -->
{{ item.createdAt | date:'dd/MM/yyyy' : '' : 'es-PE' }}
```

```typescript
// Si hay muchas fechas en el template,
// agregar getter en el componente (no tocar el modelo):
get createdAtFormatted(): string {
  if (!this.item?.createdAt) return '—';
  return new Date(this.item.createdAt)
    .toLocaleDateString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
}
```

---

## 🟡 Gap 9 — Suscripciones sin cerrar (memory leaks)

```typescript
// Fix paliativo para proyecto legacy — Subject de destroy
// (menos invasivo que migrar a signals)

private destroy$ = new Subject<void>();

ngOnInit(): void {
  this.service.getData().pipe(
    takeUntil(this.destroy$)  // ADD
  ).subscribe(data => this.items = data);
}

ngOnDestroy(): void {
  // Si ya existe ngOnDestroy, agregar estas dos líneas al inicio
  this.destroy$.next();
  this.destroy$.complete();
}
// Si no existe ngOnDestroy, créalo con estas dos líneas
```

---

## 🟡 Gap 10 — Loading state faltante

```typescript
// Fix paliativo — agregar isLoading si la variable ya existe en el template
// Si el template NO tiene *ngIf="isLoading", NO agregues la variable
// (evitar cambios en el template que puedan romper el layout)

loadData(): void {
  if ('isLoading' in this) this.isLoading = true; // solo si ya existe

  this.service.getData().pipe(
    finalize(() => {                              // ADD
      if ('isLoading' in this) this.isLoading = false;
    })
  ).subscribe({
    next: (data) => {
      this.items = data ?? [];
    },
    error: (err) => {
      console.error('[Component] loadData failed:', err);
      const msg = err?.error?.message ?? 'Error al cargar datos';
      if ('errorMessage' in this) this.errorMessage = msg;
    }
  });
}
```

---

## 📝 Comentario obligatorio en cada fix

```typescript
// FIX [fecha] — [descripción del bug reportado]
// Causa: [qué estaba mal]
// Fix: [qué se cambió — archivo:línea]
// Happy path: sin cambios
// Pendiente migrar a Akdemia: [endpoint equivalente]
```

---

## 🔎 Comando de diagnóstico inicial — pegar a Claude Code

```
Eres un Senior Angular Engineer en modo SOLO LECTURA.
Lee docs/LEGACY_RULES.md completo antes de empezar.
NO modifiques ningún archivo.

Se reportó este bug: [DESCRIPCIÓN DEL BUG]

Investiga y genera el reporte:

## 1. Reproducción
¿Qué acción dispara el bug exactamente?

## 2. Diagnóstico Network
¿Qué request HTTP está involucrado?
¿Qué URL, método y body envía el frontend?
¿Qué status y response retorna el backend?
¿Coincide con docs/API_CONTRACT.md?

## 3. Causa raíz
Archivo:línea exacto donde está el problema.
¿Por qué ocurre?

## 4. Fix paliativo propuesto
Qué cambiaría exactamente (archivo:línea → código antes → código después).
¿Afecta a otros componentes?
¿El happy path queda igual?

## 5. Riesgo
BAJO / MEDIO / ALTO — justificación

Espera aprobación antes de implementar.
```

---

## 🗂️ API_CONTRACT.md — qué debe tener

Crear `docs/API_CONTRACT.md` con los endpoints del backend legacy:

```markdown
# API Contract — Backend Legacy

Base URL: [URL del Swagger]
Auth: Bearer Token — header: Authorization: Bearer <token>

## Formato de respuesta estándar
Éxito:  { data: T } o T directamente (verificar por endpoint)
Error:  { message: string, statusCode: number }
Paginado: { results: T[], total: N, page: N, take: N }

## Endpoints verificados

### Auth
POST /auth/login → { token, user }

### [Módulo]
GET  /[recurso]           → T[]
GET  /[recurso]/:id       → T
POST /[recurso]           → T
PUT  /[recurso]/:id       → T
DELETE /[recurso]/:id     → void

[Completar conforme se revisan bugs]
```

---

*Cada bug corregido en el legacy debe tener su equivalente documentado
en Akdemia. El fix paliativo compra tiempo — la migración resuelve el problema.*
