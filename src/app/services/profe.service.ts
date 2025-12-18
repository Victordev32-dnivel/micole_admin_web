import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UserService } from './UserData';

@Injectable({
    providedIn: 'root'
})
export class ProfeService {
    private apiBase = 'https://proy-back-dnivel-44j5.onrender.com/api';

    constructor(
        private http: HttpClient,
        private userService: UserService
    ) { }

    private getHeaders(): HttpHeaders {
        const token = this.userService.getJwtToken();
        const headers = new HttpHeaders({
            'Content-Type': 'application/json',
        });

        if (token) {
            return headers.append('Authorization', `Bearer ${token}`);
        }
        return headers;
    }

    // GET /Profe/{colegioId}
    // Using absolute URL to bypass potential proxy issues (CORS permitting)
    getProfesores(colegioId: number): Observable<any[]> {
        return this.http.get<any[]>(`https://proy-back-dnivel-44j5.onrender.com/Profe/${colegioId}`, {
            headers: this.getHeaders()
        });
    }

    // POST /Profe
    createProfe(profe: any): Observable<any> {
        return this.http.post<any>(`https://proy-back-dnivel-44j5.onrender.com/Profe`, profe, {
            headers: this.getHeaders()
        });
    }

    // PUT /Profe/update/{id}
    updateProfe(id: number, profe: any): Observable<any> {
        return this.http.put<any>(`https://proy-back-dnivel-44j5.onrender.com/Profe/update/${id}`, profe, {
            headers: this.getHeaders()
        });
    }

    // DELETE /Profe/delete/{id}
    deleteProfe(id: number): Observable<any> {
        return this.http.delete<any>(`https://proy-back-dnivel-44j5.onrender.com/Profe/delete/${id}`, {
            headers: this.getHeaders()
        });
    }

    // GET /Profe/detail/{id}
    getProfeDetail(id: number): Observable<any> {
        return this.http.get<any>(`https://proy-back-dnivel-44j5.onrender.com/Profe/detail/${id}`, {
            headers: this.getHeaders()
        });
    }

    getProfeSalones(): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiBase}/ProfeSalon`, {
            headers: this.getHeaders()
        });
    }

    // POST /ProfeCurso/{usuarioId}
    assignCoursesToProfe(usuarioId: number, listaCursoId: number[]): Observable<any> {
        const payload = { listaCursoId };
        return this.http.post<any>(`${this.apiBase}/ProfeCurso/${usuarioId}`, payload, {
            headers: this.getHeaders()
        });
    }
}
