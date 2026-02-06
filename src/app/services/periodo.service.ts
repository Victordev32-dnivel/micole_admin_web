import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UserService } from './UserData';

export interface Periodo {
    id: number;
    nombre: string;
}

@Injectable({
    providedIn: 'root'
})
export class PeriodoService {
    private apiBase = '/api/Periodo';

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

    getAll(): Observable<Periodo[]> {
        return this.http.get<Periodo[]>(this.apiBase, {
            headers: this.getHeaders()
        });
    }

    getByColegio(colegioId: number, alumnoId?: number): Observable<Periodo[]> {
        let params = new HttpParams();
        if (alumnoId) {
            params = params.set('alumnoId', alumnoId.toString());
        }
        return this.http.get<Periodo[]>(`${this.apiBase}/colegio/${colegioId}`, {
            headers: this.getHeaders(),
            params: params
        });
    }

    getById(id: number): Observable<Periodo> {
        return this.http.get<Periodo>(`${this.apiBase}/${id}`, {
            headers: this.getHeaders()
        });
    }

    create(periodo: { nombre: string }, colegioId: number): Observable<Periodo> {
        let params = new HttpParams()
            .set('nombre', periodo.nombre)
            .set('colegioId', colegioId.toString());
        return this.http.post<Periodo>(this.apiBase, null, {
            headers: this.getHeaders(),
            params: params
        });
    }

    update(id: number, periodo: { nombre: string; colegioId: number }): Observable<any> {
        let params = new HttpParams()
            .set('nombre', periodo.nombre)
            .set('colegioId', periodo.colegioId.toString());
        return this.http.put(`${this.apiBase}/${id}`, null, {
            headers: this.getHeaders(),
            params: params
        });
    }

    delete(id: number): Observable<any> {
        return this.http.delete(`${this.apiBase}/${id}`, {
            headers: this.getHeaders()
        });
    }
}
