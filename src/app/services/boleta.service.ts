import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UserService } from './UserData';

@Injectable({
    providedIn: 'root'
})
export class BoletaService {
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

    // GET /api/Boleta
    getBoletas(periodoId: number, cursoId: number, colegioId: number): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiBase}/Boleta?periodoId=${periodoId}&cursoId=${cursoId}&colegioId=${colegioId}`, {
            headers: this.getHeaders()
        });
    }

    // POST /api/Boleta
    createBoleta(cursoId: number, periodoId: number, colegioId: number): Observable<any> {
        return this.http.post<any>(`${this.apiBase}/Boleta?CursoId=${cursoId}&PeriodoId=${periodoId}&colegioId=${colegioId}`, {}, {
            headers: this.getHeaders()
        });
    }

    // PATCH /api/Boleta
    updateBoletaNota(cursoId: number, periodoId: number, alumnoId: number, nota: number, colegioId: number): Observable<any> {
        return this.http.patch<any>(`${this.apiBase}/Boleta?CursoId=${cursoId}&PeriodoId=${periodoId}&AlumnoId=${alumnoId}&Nota=${nota}&colegioId=${colegioId}`, {}, {
            headers: this.getHeaders()
        });
    }

    // DELETE /api/Boleta
    deleteBoletas(cursoId: number, periodoId: number, colegioId: number): Observable<any> {
        return this.http.delete<any>(`${this.apiBase}/Boleta?CursoId=${cursoId}&PeriodoId=${periodoId}&colegioId=${colegioId}`, {
            headers: this.getHeaders()
        });
    }

    // GET /api/Boleta/alumno/{periodoId}/{alumnoId}/{colegioId}
    getBoletaAlumno(periodoId: number, alumnoId: number, colegioId: number): Observable<any> {
        return this.http.get<any>(`${this.apiBase}/Boleta/alumno/${periodoId}/${alumnoId}/${colegioId}`, {
            headers: this.getHeaders()
        });
    }

    // GET /api/Boleta/alumno/{alumnoId}/{colegioId}
    getBoletaAlumnoByColegio(alumnoId: number, colegioId: number): Observable<any> {
        return this.http.get<any>(`${this.apiBase}/Boleta/alumno/${alumnoId}/${colegioId}`, {
            headers: this.getHeaders()
        });
    }
}
