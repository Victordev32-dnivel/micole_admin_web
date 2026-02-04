import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UserService } from './UserData';

@Injectable({
    providedIn: 'root'
})
export class BoletaService {
    private apiBase = '/api';

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

    // GET /api/Boleta
    getBoletas(periodoId: number, cursoId: number): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiBase}/Boleta?periodoId=${periodoId}&cursoId=${cursoId}`, {
            headers: this.getHeaders()
        });
    }

    // POST /api/Boleta
    createBoleta(cursoId: number, periodoId: number): Observable<any> {
        return this.http.post<any>(`${this.apiBase}/Boleta?CursoId=${cursoId}&PeriodoId=${periodoId}`, {}, {
            headers: this.getHeaders()
        });
    }

    // PATCH /api/Boleta
    updateBoletaNota(cursoId: number, periodoId: number, alumnoId: number, nota: number): Observable<any> {
        return this.http.patch<any>(`${this.apiBase}/Boleta?CursoId=${cursoId}&PeriodoId=${periodoId}&AlumnoId=${alumnoId}&Nota=${nota}`, {}, {
            headers: this.getHeaders()
        });
    }

    // DELETE /api/Boleta
    deleteBoletas(cursoId: number, periodoId: number): Observable<any> {
        return this.http.delete<any>(`${this.apiBase}/Boleta?CursoId=${cursoId}&PeriodoId=${periodoId}`, {
            headers: this.getHeaders()
        });
    }
}
