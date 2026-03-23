# API Contract — Backend Legacy

> Fuente de verdad para los contratos del backend legacy.
> Swagger: https://proy-back-dnivel-44j5.onrender.com/index.html
> Actualizar este archivo conforme se descubren y corrigen gaps.

---

## Configuración base

```
Base URL:     [completar desde environment.ts del proyecto]
Auth:         Bearer Token
Header:       Authorization: Bearer <token>
Content-Type: application/json
```

---

## Formato de respuestas

> ⚠️ Verificar por endpoint — el legacy puede no ser consistente

```
// Posibles formatos (verificar cuál usa cada endpoint):
T                           // retorna el objeto directo
{ data: T }                 // wrapeado en data
{ message, statusCode, data } // formato estándar
{ results, total, page }    // paginado
```

---

## Endpoints documentados

> Completar conforme se reportan y corrigen bugs.
> Formato: MÉTODO /ruta → request body → response shape

### Auth

```
POST /auth/login
  body:     { document: string, password: string }
  response: { token: string, user: {...} }
  notas:    [completar]

POST /auth/logout
  headers:  Authorization: Bearer <token>
  response: 204 No Content
```

---

### [Módulo — completar conforme aparecen bugs]

```
GET  /[recurso]
  response: T[] | { data: T[] }
  notas:

POST /[recurso]
  body:     { campo1, campo2 }
  response: T
  notas:

PUT  /[recurso]/:id
  body:     { campo1, campo2 }
  response: T
  notas:

DELETE /[recurso]/:id
  response: void | { message }
  notas:
```

---

## Gaps conocidos

> Documentar aquí los gaps encontrados para evitar que otros
> los vuelvan a investigar.

| Fecha | Módulo | Gap encontrado | Fix aplicado | Equivalente Akdemia |
| ----- | ------- | -------------- | ------------ | ------------------- |
|       |         |                |              |                     |

---

## Campos problemáticos conocidos

> Campos donde el front y el back usan nombres diferentes.

| Front usa | Back espera | Módulo | Fix aplicado |
| --------- | ----------- | ------- | ------------ |
|           |             |         |              |
