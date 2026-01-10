import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';

@Injectable({
    providedIn: 'root'
})
export class ExcelService {

    constructor() { }

    /**
     * Genera y descarga un reporte de asistencia en Excel con formato específico.
     * @param data Datos de los alumnos y su asistencia.
     * @param mes Nombre del mes (ej: "SETIEMBRE").
     * @param gradoSeccion String con grado y sección (ej: "PRIMERO / SECCIÓN 'A'").
     * @param filename Nombre del archivo a descargar.
     */
    exportarAsistencia(data: any[], mes: string, gradoSeccion: string, filename: string): void {
        // 1. Configuración inicial
        const wb: XLSX.WorkBook = XLSX.utils.book_new();
        const ws_name = "Asistencia"; // Nombre de la hoja

        // 2. Estructura de encabezados
        // Filas iniciales para el título, institución, etc.
        const headers = [
            ["", "", "INSTITUCIÓN EDUCATIVA \"SAN CARLOS\"", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
            ["", "", "CONTROL DE ASISTENCIA POR GRADO Y SECCIÓN", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
            ["", "", `GRADO: ${gradoSeccion}`],
            [], // Espacio
            // Fila de encabezado principal (DNI, Nombres, Apellidos, Días)
            ["DNI", "NOMBRES", "APELLIDOS", mes], // La celda 'mes' se fusionará sobre los días
            // Fila de días (L, M, M, J, V...) - Esto se llena dinámicamente o estáticamente según el mes
            // Fila de números (1, 2, 3...)
        ];

        // Generar días del mes (asumiendo 30 o 31 días estándar o lógica dinámica si se pasan los días específicos)
        // Para simplificar y matchar la imagen, generaremos columnas para días 1 al 31 (o lo que se requiera)
        // La imagen muestra agrupaciones L, M, M, J, V. Idealmente esto debería ser dinámico.
        // Por ahora haremos una estructura base de 1 al 31.

        // Crear filas 5 y 6 (índices 4 y 5) dinámicamente
        const rowDiasLetras = ["", "", "", ""]; // DNI, Nomb, Apell, [Días...]
        const rowDiasNumeros = ["", "", "", ""];

        // Rellenar días simulados (esto debería ajustarse al mes real si es posible, o ser genérico 1-31)
        // En la imagen se ve que las columnas de días empiezan en la columna 4 (índice 3, si 0-indexed)
        for (let i = 1; i <= 31; i++) {
            rowDiasLetras.push(""); // Aquí iría la letra L, M, M... (requiere calcular fecha real)
            rowDiasNumeros.push(i.toString());
        }

        // Agregar columnas de totales
        const headersTotales = ["TOTAL A_TIEMPO", "TOTAL TARDANZA", "TOTAL FALTAS"];

        // Completar headers
        // Fila 4: Mes (ya puesta), luego vacíos hasta totales
        const rowMes = headers[4];
        for (let i = 0; i < 31; i++) rowMes.push(""); // Espacios para merge del mes 

        // Agregar totales a la fila de DNI/Nombres (rowMes)
        rowMes.push(...headersTotales);

        // Agregar filas de días
        headers.push(rowDiasLetras); // Esta fila tendría las letras (L, M...)
        headers.push(rowDiasNumeros); // Esta fila tendría los números (1, 2...)


        // 3. Convertir datos a formato de filas
        const dataRows = data.map(alumno => {
            // Estructura: [DNI, Nombres, Apellidos, ...dias..., Totales]
            const row = [
                alumno.dni || '',
                alumno.nombres || '',
                alumno.apellidos || '',
                // Aquí irían los estados de asistencia (A, T, F, etc.) mapeados a los días
                ...this.mapAsistenciasToDays(alumno.asistencias),
                alumno.totalATiempo || 0,
                alumno.totalTardanza || 0,
                alumno.totalFaltas || 0
            ];
            return row;
        });

        // Totales finales (Fila inferior)
        const totalRow = ["", "", "TOTALES"];
        // Rellenarlo con vacíos o sumas si se desea

        // Combinar todo
        // Nota: XLSX.utils.aoa_to_sheet toma un array de arrays
        // Ajustar encabezados manuales primero
        // Fila 0, 1, 2 son títulos.
        // Fila 4 es encabezado tabla.
        // Fila 5 es letras días.
        // Fila 6 es números días.

        // Reconstruimos para mayor claridad en la lógica de merge
        const ws_data = [
            ...headers.slice(0, 4), // Títulos y espacio
            rowMes, // Encabezado principal
            rowDiasLetras, // Letras
            rowDiasNumeros, // Números
            ...dataRows,
            totalRow
        ];

        const ws: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(ws_data);

        // 4. Configurar Merges (Fusionar celdas)
        // Coordenadas: { s: {r, c}, e: {r, c} } -> Start/End Row/Col
        const merges = [
            // Título Institución
            { s: { r: 0, c: 2 }, e: { r: 0, c: 15 } },
            // Subtítulo
            { s: { r: 1, c: 2 }, e: { r: 1, c: 15 } },
            // Grado
            { s: { r: 2, c: 2 }, e: { r: 2, c: 10 } },

            // Encabezados Tabla
            { s: { r: 4, c: 0 }, e: { r: 6, c: 0 } }, // DNI (3 filas alto: 4, 5, 6)
            { s: { r: 4, c: 1 }, e: { r: 6, c: 1 } }, // NOMBRES 
            { s: { r: 4, c: 2 }, e: { r: 6, c: 2 } }, // APELLIDOS

            // Mes (Fila 4, col 3 hasta el final de días)
            { s: { r: 4, c: 3 }, e: { r: 4, c: 3 + 30 } }, // Asumiendo 31 días (índice 3 a 33)

            // Totales (Encabezados verticales)
            { s: { r: 4, c: 34 }, e: { r: 6, c: 34 } }, // Total A Tiempo
            { s: { r: 4, c: 35 }, e: { r: 6, c: 35 } }, // Total Tardanza
            { s: { r: 4, c: 36 }, e: { r: 6, c: 36 } }, // Total Faltas
        ];

        ws['!merges'] = merges;

        // 5. Ajustar anchos de columnas
        // wch = width chars
        const colWidths = [
            { wch: 10 }, // DNI
            { wch: 25 }, // Nombres
            { wch: 25 }, // Apellidos
            ...Array(31).fill({ wch: 3 }), // Días estrechos
            { wch: 10 }, { wch: 10 }, { wch: 10 } // Totales
        ];
        ws['!cols'] = colWidths;

        // 6. Generar archivo
        XLSX.utils.book_append_sheet(wb, ws, ws_name);
        XLSX.writeFile(wb, `${filename}.xlsx`);
    }

    // Helper para mapear asistencias a array de 31 días
    private mapAsistenciasToDays(asistencias: any[]): string[] {
        const days = Array(31).fill("");
        if (!asistencias) return days;

        // Aquí implementaremos la lógica real cuando tengamos la data
        // Se espera que 'asistencias' tenga un día o fecha para mapear al índice correcto
        asistencias.forEach(a => {
            // Ejemplo: a.dia (1-31)
            if (a.dia >= 1 && a.dia <= 31) {
                days[a.dia - 1] = a.estado; // 'A', 'T', 'F', etc.
            }
        });

        return days;
    }
}
