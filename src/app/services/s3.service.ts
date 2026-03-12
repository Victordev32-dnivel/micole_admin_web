import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class S3Service {
    private readonly API_URL = `${environment.apiUrl}/Upload`;

    constructor(private http: HttpClient) { }

    private getHeaders(): HttpHeaders {
        // Obtenemos el token del localStorage si existe, similar a otros servicios
        let token = '';
        try {
            const userData = JSON.parse(localStorage.getItem('userData') || '{}');
            token = userData.jwt || '732612882'; // Fallback al token estático si no hay login
        } catch {
            token = '732612882';
        }
        
        return new HttpHeaders({
            'Authorization': `Bearer ${token}`
        });
    }

    async uploadFile(file: File, folder: string = 'colegios'): Promise<string> {
        const formData = new FormData();
        formData.append('file', file);
        
        const url = `${this.API_URL}?folder=${folder}`;

        try {
            // Según tu ejemplo de Fetch, no se envían headers personalizados.
            // Probamos sin el header de Authorization para descartar que sea la causa del 500.
            const response = await firstValueFrom(
                this.http.post<any>(url, formData)
            );
            
            if (response && response.url) {
                return response.url;
            } else {
                throw new Error('La respuesta del servidor no contiene el campo "url".');
            }
        } catch (error: any) {
            console.error('Error uploading file via API:', error);
            
            // Si el error tiene un cuerpo que no es JSON (como indica tu log "Unexpected token E..."),
            // Angular lo capturará aquí. Intentaremos dar una pista más clara.
            if (error.status === 500) {
                throw new Error('Error interno del servidor (500). Es posible que el servidor no tenga bien configuradas las credenciales de AWS o el bucket.');
            }
            throw new Error(error.message || 'Error desconocido al subir el archivo.');
        }
    }

    async deleteFile(fileUrl: string): Promise<any> {
        const url = `${this.API_URL}?url=${encodeURIComponent(fileUrl)}`;
        try {
            return await firstValueFrom(
                this.http.delete(url, { headers: this.getHeaders() })
            );
        } catch (error) {
            console.error('Error deleting file via API:', error);
            throw error;
        }
    }
}
