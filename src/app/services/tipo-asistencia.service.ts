import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UserService } from './UserData';

export interface TipoAsistencia {
    id: number;
    tipo: string;
}

@Injectable({
    providedIn: 'root'
})
export class TipoAsistenciaService {
    private apiBase = '/api/TipoAsistencia';

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

    getAll(): Observable<TipoAsistencia[]> {
        return this.http.get<TipoAsistencia[]>(this.apiBase, {
            headers: this.getHeaders()
        });
    }

    getById(id: number): Observable<TipoAsistencia> {
        return this.http.get<TipoAsistencia>(`${this.apiBase}/${id}`, {
            headers: this.getHeaders()
        });
    }

    create(tipo: { tipo: string }): Observable<TipoAsistencia> {
        return this.http.post<TipoAsistencia>(this.apiBase, tipo, {
            headers: this.getHeaders()
        });
    }

    update(id: number, tipo: { id: number; tipo: string }): Observable<any> {
        return this.http.put(`${this.apiBase}/${id}`, tipo, {
            headers: this.getHeaders()
        });
    }

    delete(id: number): Observable<any> {
        return this.http.delete(`${this.apiBase}/${id}`, {
            headers: this.getHeaders()
        });
    }
}
