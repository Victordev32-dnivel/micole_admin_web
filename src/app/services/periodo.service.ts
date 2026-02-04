import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
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

    // GET /api/Periodo
    getPeriodos(): Observable<Periodo[]> {
        return this.http.get<Periodo[]>(`${this.apiBase}/Periodo`, {
            headers: this.getHeaders()
        });
    }

    // POST /api/Periodo
    createPeriodo(periodo: Periodo): Observable<Periodo> {
        return this.http.post<Periodo>(`${this.apiBase}/Periodo`, periodo, {
            headers: this.getHeaders()
        });
    }

    // GET /api/Periodo/{id}
    getPeriodoById(id: number): Observable<Periodo> {
        return this.http.get<Periodo>(`${this.apiBase}/Periodo/${id}`, {
            headers: this.getHeaders()
        });
    }

    // PUT /api/Periodo/{id}
    updatePeriodo(id: number, periodo: Periodo): Observable<Periodo> {
        return this.http.put<Periodo>(`${this.apiBase}/Periodo/${id}`, periodo, {
            headers: this.getHeaders()
        });
    }
}
