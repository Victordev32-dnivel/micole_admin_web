import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UserService } from './UserData';

@Injectable({
    providedIn: 'root'
})
export class CursoService {
    private apiBase = '/api';

    constructor(
        private http: HttpClient,
        private userService: UserService
    ) { }

    private getHeaders(): HttpHeaders {
        const token = this.userService.getJwtToken();
        return new HttpHeaders({
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        });
    }

    // GET /api/salon/colegio/lista/{id}
    getSalones(colegioId: number): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiBase}/salon/colegio/lista/${colegioId}`, {
            headers: this.getHeaders()
        });
    }

    // POST /api/Curso
    createCurso(curso: { titulo: string; descripcion: string; salonId: number }): Observable<any> {
        return this.http.post<any>(`${this.apiBase}/Curso`, curso, {
            headers: this.getHeaders()
        });
    }

    // GET /api/Curso (Assuming this lists all courses - filtering likely needed)
    // Or maybe /api/Curso/colegio/{colegioId}? I'll try /api/Curso/colegio/{id} based on patterns.
    // User didn't specify list endpoint, so I'll try the pattern matching 'salon'.
    // GET /api/Curso/salon/{salonId}
    getCursosPorSalon(salonId: number): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiBase}/Curso/salon/${salonId}`, {
            headers: this.getHeaders()
        });
    }

    // GET /api/Curso/{id}
    getCursoById(id: number): Observable<any> {
        return this.http.get<any>(`${this.apiBase}/Curso/${id}`, {
            headers: this.getHeaders()
        });
    }

    // PUT /api/Curso/{id}
    updateCurso(id: number, curso: { id: number; titulo: string; descripcion: string; salonId: number }): Observable<any> {
        return this.http.put<any>(`${this.apiBase}/Curso/${id}`, curso, {
            headers: this.getHeaders()
        });
    }

    // DELETE /api/Curso/{id}
    deleteCurso(id: number): Observable<any> {
        return this.http.delete<any>(`${this.apiBase}/Curso/${id}`, {
            headers: this.getHeaders()
        });
    }

    // GET /api/alumno/salon/{idSalon}
    getAlumnosPorSalon(salonId: number): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiBase}/alumno/salon/${salonId}`, {
            headers: this.getHeaders()
        });
    }

    // POST /api/CursoAlumno
    asignarCursosAlumno(data: { cursosId: number[], alumnoId: number }): Observable<any> {
        return this.http.post<any>(`${this.apiBase}/CursoAlumno`, data, {
            headers: this.getHeaders()
        });
    }
}
