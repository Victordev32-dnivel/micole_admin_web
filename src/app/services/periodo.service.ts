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

    getById(id: number): Observable<Periodo> {
        return this.http.get<Periodo>(`${this.apiBase}/${id}`, {
            headers: this.getHeaders()
        });
    }

    create(periodo: { nombre: string }): Observable<Periodo> {
        let params = new HttpParams().set('nombre', periodo.nombre);
        return this.http.post<Periodo>(this.apiBase, null, {
            headers: this.getHeaders(),
            params: params
        });
    }

    update(id: number, periodo: { id: number; nombre: string }): Observable<any> {
        return this.http.put(`${this.apiBase}/${id}`, periodo, {
            headers: this.getHeaders()
        });
    }

    delete(id: number): Observable<any> {
        return this.http.delete(`${this.apiBase}/${id}`, {
            headers: this.getHeaders()
        });
    }
}
