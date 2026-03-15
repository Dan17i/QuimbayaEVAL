import React, { useMemo, useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Switch } from '../components/ui/switch';
import { FileDown, RefreshCw, Users, BarChart3, TrendingUp, BookOpen, Filter, FileSpreadsheet } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { StatCard } from '../components/StatCard';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ROUTES } from '../constants/routes';
import { Estadistica } from '../types';
import { FileText, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { formatNumber } from '../utils/format';
import { useEvaluaciones } from '../hooks/useEvaluaciones';
import { useCursos } from '../hooks/useCursos';
import { useDocentes } from '../hooks/useDocentes';
import { useAuth } from '../contexts/AuthContext';
import { resultadosService, ResultadoDetalle, ResumenCurso } from '../services/resultadosService';
import { cursosService, Curso } from '../services/cursosService';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';

// Tipos extendidos para reportes mejorados
export interface ResultadoReporte extends ResultadoDetalle {
  estudianteId?: number;
  documentoEstudiante?: string;
  fechaEntrega: string;
  estaReprobado: boolean;
}

export interface ResumenEstudiante {
  estudianteId: number;
  estudianteNombre: string;
  documentoEstudiante: string;
  promedioAcumulado: number;
  evaluaciones: { [key: string]: number };
  fechaEntrega?: string;
}

export const ReportesPage: React.FC = () => {
  const { user } = useAuth();
  const isCoordinador = user?.role === 'coordinador';

  const { evaluaciones, loading: loadingEvals } = useEvaluaciones();
  const { cursos, loading: loadingCursos } = useCursos();
  const { docentes, loading: loadingDocentes } = useDocentes();

  // Filtros
  const [filtroDocente, setFiltroDocente] = useState<string>('all');
  const [filtroCursoId, setFiltroCursoId] = useState<string>('');
  const [filtroReprobados, setFiltroReprobados] = useState<boolean>(false);
  const [filtroEvaluacionId, setFiltroEvaluacionId] = useState<string>('all');

  // Datos de notas
  const [notasEstudiantes, setNotasEstudiantes] = useState<ResultadoDetalle[]>([]);
  const [resumenGrupo, setResumenGrupo] = useState<ResumenCurso[]>([]);
  const [loadingNotas, setLoadingNotas] = useState(false);

  const loading = loadingEvals || loadingCursos || (isCoordinador && loadingDocentes);

  // Cursos filtrados por docente (coordinador) o todos (maestro)
  const cursosFiltrados = useMemo(() => {
    if (!isCoordinador) return cursos;
    if (filtroDocente === 'all') return cursos;
    return cursos.filter(c => c.profesorId === Number(filtroDocente));
  }, [cursos, filtroDocente, isCoordinador]);

  // Al cambiar curso, cargar notas
  useEffect(() => {
    if (!filtroCursoId) return;
    const id = Number(filtroCursoId);
    setLoadingNotas(true);
    Promise.all([
      resultadosService.getByCurso(id),
      resultadosService.getResumenCurso(id),
    ]).then(([notas, resumen]) => {
      setNotasEstudiantes(notas);
      setResumenGrupo(resumen);
    }).catch(() => {
      toast.error('Error al cargar notas del curso');
    }).finally(() => setLoadingNotas(false));
  }, [filtroCursoId]);

  // Cuando cambia docente, resetear curso
  useEffect(() => {
    setFiltroCursoId('');
    setNotasEstudiantes([]);
    setResumenGrupo([]);
  }, [filtroDocente]);

  const cursoActual = cursos.find(c => String(c.id) === filtroCursoId);

  // KPIs generales
  const estadisticasKPIs = useMemo<Estadistica[]>(() => [
    { label: 'Total Cursos', value: String(cursosFiltrados.length), icon: BookOpen, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Total Evaluaciones', value: String(evaluaciones.length), icon: FileText, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Activas', value: String(evaluaciones.filter(e => e.estado === 'Activa').length), icon: BarChart3, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Cerradas', value: String(evaluaciones.filter(e => e.estado === 'Cerrada').length), icon: FileText, color: 'text-orange-600', bg: 'bg-orange-50' },
  ], [cursosFiltrados, evaluaciones]);

  // Promedio general del grupo (de resumenGrupo)
  const promedioGeneral = useMemo(() => {
    if (resumenGrupo.length === 0) return null;
    const sum = resumenGrupo.reduce((acc, r) => acc + r.promedioEscala, 0);
    return (sum / resumenGrupo.length).toFixed(1);
  }, [resumenGrupo]);

  const totalAprobados = useMemo(() =>
    resumenGrupo.reduce((acc, r) => acc + r.aprobados, 0), [resumenGrupo]);

  const totalReprobados = useMemo(() =>
    resumenGrupo.reduce((acc, r) => acc + r.reprobados, 0), [resumenGrupo]);

  // Obtener evaluaciones únicas del curso
  const evaluacionesDelCurso = useMemo(() => {
    const evaluacionesMap = new Map<string, number>();
    notasEstudiantes.forEach(n => {
      if (!evaluacionesMap.has(n.evaluacionNombre)) {
        evaluacionesMap.set(n.evaluacionNombre, n.evaluacionId || 0);
      }
    });
    return Array.from(evaluacionesMap.entries()).map(([nombre, id]) => ({ nombre, id }));
  }, [notasEstudiantes]);

  // Calcular promedio acumulado por estudiante y preparar datos para exportación
  const datosProcesados = useMemo(() => {
    const estudiantesMap = new Map<number, {
      id: number;
      nombre: string;
      documento: string;
      email: string;
      evaluaciones: { [key: string]: { nota: number; fecha: string } };
      promedio: number;
     Count: number;
    }>();

    notasEstudiantes.forEach(n => {
      const estId = n.estudianteId || Math.random() * 10000;
      if (!estudiantesMap.has(estId)) {
        estudiantesMap.set(estId, {
          id: estId,
          nombre: n.estudianteNombre,
          documento: n.documentoEstudiante || `EST-${String(estId).padStart(6, '0')}`,
          email: n.estudianteEmail,
          evaluaciones: {},
          promedio: 0,
         Count: 0
        });
      }
      const est = estudiantesMap.get(estId)!;
      est.evaluaciones[n.evaluacionNombre] = {
        nota: n.notaEscala,
        fecha: n.createdAt
      };
    });

    // Calcular promedios
    estudiantesMap.forEach(est => {
      const notas = Object.values(est.evaluaciones);
      if (notas.length > 0) {
        est.promedio = notas.reduce((acc, n) => acc + n.nota, 0) / notas.length;
      }
    });

    return Array.from(estudiantesMap.values());
  }, [notasEstudiantes]);

  // Aplicar filtros a los datos procesados
  const datosFiltrados = useMemo(() => {
    let result = datosProcesados;

    // Filtro: Solo reprobados
    if (filtroReprobados) {
      result = result.filter(d => d.promedio < 3.0);
    }

    // Filtro: Evaluación específica
    if (filtroEvaluacionId !== 'all') {
      const evalNombre = evaluacionesDelCurso.find(e => String(e.id) === filtroEvaluacionId)?.nombre;
      if (evalNombre) {
        result = result.filter(d => d.evaluaciones[evalNombre] !== undefined);
      }
    }

    return result;
  }, [datosProcesados, filtroReprobados, filtroEvaluacionId, evaluacionesDelCurso]);

  // Calcular estadísticas grupales para el PDF
  const estadisticasGrupo = useMemo(() => {
    if (datosFiltrados.length === 0) return null;
    
    const promedios = datosFiltrados.map(d => d.promedio);
    const promedioGeneral = promedios.reduce((a, b) => a + b, 0) / promedios.length;
    const aprobados = promedios.filter(p => p >= 3.0).length;
    const reprobados = promedios.filter(p => p < 3.0).length;
    const porcentajeAprobacion = (aprobados / promedios.length) * 100;

    // Mejor y peor evaluación
    const evalStats: { [key: string]: number[] } = {};
    datosFiltrados.forEach(d => {
      Object.entries(d.evaluaciones).forEach(([evalNombre, data]) => {
        if (!evalStats[evalNombre]) evalStats[evalNombre] = [];
        evalStats[evalNombre].push(data.nota);
      });
    });

    let mejorEval = { nombre: '', promedio: 0 };
    let peorEval = { nombre: '', promedio: 100 };
    Object.entries(evalStats).forEach(([nombre, notas]) => {
      const prom = notas.reduce((a, b) => a + b, 0) / notas.length;
      if (prom > mejorEval.promedio) mejorEval = { nombre, promedio: prom };
      if (prom < peorEval.promedio) peorEval = { nombre, promedio: prom };
    });

    return {
      promedioGeneral: promedioGeneral.toFixed(1),
      porcentajeAprobacion: porcentajeAprobacion.toFixed(1),
      totalEstudiantes: datosFiltrados.length,
      aprobados,
      reprobados,
      mejorEval,
      peorEval
    };
  }, [datosFiltrados]);

  // --- EXPORTAR PDF (MEJORADO) ---
  const handleExportarPDF = () => {
    try {
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      let y = 20;
      const fechaGeneracion = new Date().toLocaleDateString('es-CO', { 
        year: 'numeric', month: 'long', day: 'numeric' 
      });

      // === ENCABEZADO INSTITUCIONAL ===
      // Barra decorativa superior
      pdf.setFillColor(30, 64, 175); // Azul institucional
      pdf.rect(0, 0, pageWidth, 12, 'F');
      
      // Título principal
      pdf.setFontSize(18);
      pdf.setTextColor(255, 255, 255);
      pdf.text('QUIMBAYA EVAL', pageWidth / 2, 8, { align: 'center' });
      
      // Subtítulo del reporte
      pdf.setFontSize(14);
      pdf.setTextColor(30, 30, 30);
      pdf.text('Reporte de Calificaciones', pageWidth / 2, y + 5, { align: 'center' });
      y += 15;

      // === INFORMACIÓN DEL CURSO ===
      pdf.setFontSize(10);
      pdf.setTextColor(60, 60, 60);
      pdf.text(`Curso: ${cursoActual?.codigo || 'General'} - ${cursoActual?.nombre || 'Varios'}`, 14, y);
      y += 5;
      pdf.text(`Docente: ${notasEstudiantes[0]?.profesorNombre || 'No asignado'}`, 14, y);
      y += 5;
      pdf.text(`Fecha de Generación: ${fechaGeneracion}`, 14, y);
      y += 10;

      // === ESTADÍSTICAS GRUPALES (SOLO SI HAY DATOS) ===
      if (estadisticasGrupo) {
        // Fondo para estadísticas
        pdf.setFillColor(248, 250, 252);
        pdf.rect(14, y - 3, pageWidth - 28, 35, 'F');
        
        // Título del cuadro
        pdf.setFontSize(11);
        pdf.setTextColor(30, 64, 175);
        pdf.text('Resumen Estadístico del Grupo', 14, y + 2);
        y += 8;

        // Métricas en fila
        pdf.setFontSize(9);
        pdf.setTextColor(40, 40, 40);
        
        // Promedio general
        pdf.setFillColor(59, 130, 246);
        pdf.circle(22, y, 4, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.text('PG', 22, y + 0.5, { align: 'center' });
        pdf.setTextColor(40, 40, 40);
        pdf.text(`Promedio General: ${estadisticasGrupo.promedioGeneral}`, 30, y);
        
        // Porcentaje aprobación
        pdf.setFillColor(34, 197, 94);
        pdf.circle(75, y, 4, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.text('%', 75, y + 0.5, { align: 'center' });
        pdf.setTextColor(40, 40, 40);
        pdf.text(`Aprobación: ${estadisticasGrupo.porcentajeAprobacion}%`, 83, y);
        y += 6;

        // Aprobados vs Reprobados
        pdf.setFillColor(34, 197, 94);
        pdf.circle(22, y, 3.5, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.text('A', 22, y + 0.5, { align: 'center' });
        pdf.setTextColor(34, 197, 94);
        pdf.text(`${estadisticasGrupo.aprobados} Aprobados`, 30, y);
        
        pdf.setFillColor(239, 68, 68);
        pdf.circle(65, y, 3.5, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.text('R', 65, y + 0.5, { align: 'center' });
        pdf.setTextColor(239, 68, 68);
        pdf.text(`${estadisticasGrupo.reprobados} Reprobados`, 73, y);
        y += 7;

        // Mejor y peor evaluación
        if (estadisticasGrupo.mejorEval.nombre) {
          pdf.setTextColor(34, 197, 94);
          pdf.text(`✓ Mejor Evaluación: ${estadisticasGrupo.mejorEval.nombre} (${estadisticasGrupo.mejorEval.promedio.toFixed(1)})`, 14, y);
          y += 5;
        }
        if (estadisticasGrupo.peorEval.nombre && estadisticasGrupo.peorEval.nombre !== estadisticasGrupo.mejorEval.nombre) {
          pdf.setTextColor(239, 68, 68);
          pdf.text(`✗ Evaluación con Menor Desempeño: ${estadisticasGrupo.peorEval.nombre} (${estadisticasGrupo.peorEval.promedio.toFixed(1)})`, 14, y);
        }
        y += 12;
      }

      // === TABLA DE NOTAS POR ESTUDIANTE ===
      if (datosFiltrados.length > 0) {
        // Título de sección
        pdf.setFontSize(12);
        pdf.setTextColor(30, 30, 30);
        pdf.text('Notas por Estudiante', 14, y);
        y += 5;

        // Encabezado de tabla
        const colWidths = [40, 25, 20, 20, 20]; // Anchos de columnas
        const headers = ['Estudiante', 'Documento', 'Promedio', 'Estado', 'Fecha'];
        
        pdf.setFillColor(30, 64, 175); // Azul institucional
        pdf.rect(14, y - 4, pageWidth - 28, 7, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(8);
        
        let xPos = 16;
        headers.forEach((header, i) => {
          pdf.text(header, xPos, y);
          xPos += colWidths[i];
        });
        y += 5;

        // Datos de estudiantes
        pdf.setFontSize(7);
        pdf.setTextColor(40, 40, 40);
        
        datosFiltrados.forEach((est, index) => {
          if (y > pageHeight - 40) {
            pdf.addPage();
            y = 20;
            // Repetir encabezado en nueva página
            pdf.setFillColor(30, 64, 175);
            pdf.rect(14, y - 4, pageWidth - 28, 7, 'F');
            pdf.setTextColor(255, 255, 255);
            xPos = 16;
            headers.forEach((header, i) => {
              pdf.text(header, xPos, y);
              xPos += colWidths[i];
            });
            y += 5;
            pdf.setTextColor(40, 40, 40);
          }
          
          // Zebra striping
          if (index % 2 === 0) {
            pdf.setFillColor(248, 250, 252);
            pdf.rect(14, y - 3, pageWidth - 28, 6, 'F');
          }
          
          // Color del estado (alerta visual)
          const estadoColor = est.promedio >= 3.0 ? [34, 197, 94] : [239, 68, 68];
          
          // Nombre del estudiante (truncar si es muy largo)
          const nombre = est.nombre.length > 22 ? est.nombre.substring(0, 20) + '...' : est.nombre;
          
          pdf.text(nombre, 16, y);
          pdf.text(est.documento, 16 + colWidths[0], y);
          pdf.text(est.promedio.toFixed(1), 16 + colWidths[0] + colWidths[1], y);
          
          // Estado con color
          pdf.setTextColor(estadoColor[0], estadoColor[1], estadoColor[2]);
          pdf.text(est.promedio >= 3.0 ? 'Aprobado' : 'Reprobado', 16 + colWidths[0] + colWidths[1] + colWidths[2], y);
          
          // Fecha de última entrega
          pdf.setTextColor(100, 100, 100);
          const fechaEntrega = Object.values(est.evaluaciones)[0]?.fecha 
            ? new Date(Object.values(est.evaluaciones)[0].fecha).toLocaleDateString('es-CO')
            : '-';
          pdf.text(fechaEntrega, 16 + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3], y);
          
          pdf.setTextColor(40, 40, 40);
          y += 6;
        });
        y += 5;
      }

      // === RESUMEN POR EVALUACIÓN ===
      if (resumenGrupo.length > 0) {
        if (y > pageHeight - 60) {
          pdf.addPage();
          y = 20;
        }
        
        pdf.setFontSize(12);
        pdf.setTextColor(30, 30, 30);
        pdf.text('Resumen por Evaluación', 14, y);
        y += 5;

        // Encabezado
        pdf.setFillColor(16, 185, 129); // Verde
        pdf.rect(14, y - 4, pageWidth - 28, 7, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(8);
        pdf.text('Evaluación', 16, y);
        pdf.text('Promedio', 90, y);
        pdf.text('Aprobados', 125, y);
        pdf.text('Reprobados', 155, y);
        y += 5;

        pdf.setTextColor(40, 40, 40);
        pdf.setFontSize(7);
        resumenGrupo.forEach((r, i) => {
          if (y > pageHeight - 30) {
            pdf.addPage();
            y = 20;
          }
          if (i % 2 === 0) {
            pdf.setFillColor(240, 255, 248);
            pdf.rect(14, y - 3, pageWidth - 28, 6, 'F');
          }
          
          // Color del promedio
          const promedioColor = r.promedioEscala >= 3.0 ? [34, 197, 94] : [239, 68, 68];
          const evalName = r.evaluacionNombre.length > 40 ? r.evaluacionNombre.substring(0, 38) + '...' : r.evaluacionNombre;
          
          pdf.text(evalName, 16, y);
          pdf.setTextColor(promedioColor[0], promedioColor[1], promedioColor[2]);
          pdf.text(r.promedioEscala.toFixed(1), 92, y);
          pdf.setTextColor(34, 197, 94);
          pdf.text(String(r.aprobados), 128, y);
          pdf.setTextColor(239, 68, 68);
          pdf.text(String(r.reprobados), 158, y);
          pdf.setTextColor(40, 40, 40);
          y += 6;
        });
      }

      // === ESPACIO PARA FIRMAS ===
      y = Math.max(y + 15, pageHeight - 50);
      if (y > pageHeight - 50) {
        pdf.addPage();
        y = 30;
      }
      
      // Línea divisoria
      pdf.setDrawColor(200, 200, 200);
      pdf.line(14, y, pageWidth - 14, y);
      y += 10;
      
      pdf.setFontSize(10);
      pdf.setTextColor(60, 60, 60);
      pdf.text('Firmas de Autorización', pageWidth / 2, y, { align: 'center' });
      y += 10;
      
      // Firmas
      pdf.setDrawColor(0, 0, 0);
      pdf.setLineWidth(0.3);
      
      // Firma docente
      pdf.line(20, y + 15, 80, y + 15);
      pdf.setFontSize(8);
      pdf.text('Firma del Docente', 50, y + 20, { align: 'center' });
      pdf.setFontSize(7);
      pdf.text(notasEstudiantes[0]?.profesorNombre || '_________________', 50, y + 25, { align: 'center' });
      
      // Firma coordinador
      pdf.line(pageWidth - 80, y + 15, pageWidth - 20, y + 15);
      pdf.setFontSize(8);
      pdf.text('Firma del Coordinador', pageWidth - 50, y + 20, { align: 'center' });
      pdf.setFontSize(7);
      pdf.text('_________________________', pageWidth - 50, y + 25, { align: 'center' });
      
      // Pie de página
      pdf.setFontSize(6);
      pdf.setTextColor(150, 150, 150);
      pdf.text(`Documento generado por QuimbayaEVAL - Fecha: ${new Date().toLocaleString('es-CO')}`, pageWidth / 2, pageHeight - 5, { align: 'center' });

      pdf.save(`reporte-${cursoActual?.codigo ?? 'general'}-${new Date().toISOString().slice(0, 10)}.pdf`);
      toast.success('PDF generado', { description: 'Archivo descargado correctamente' });
    } catch (error) {
      console.error('Error al generar PDF:', error);
      toast.error('Error al generar PDF');
    }
  };

  // --- EXPORTAR EXCEL (MEJORADO) ---
  const handleExportarExcel = () => {
    try {
      const wb = XLSX.utils.book_new();
      const fechaGeneracion = new Date().toLocaleDateString('es-CO', { 
        year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' 
      });

      // Obtener lista de evaluaciones únicas para columnas
      const listaEvaluaciones = Array.from(
        new Set(notasEstudiantes.map(n => n.evaluacionNombre))
      );

      // === HOJA 1: Datos Crudos por Estudiante (con columnas por evaluación) ===
      if (datosFiltrados.length > 0) {
        // Encabezados: ID, Nombre, Email, [Evaluaciones...], Promedio, Estado
        const headers = ['ID Estudiante', 'Nombre', 'Documento', 'Email', ...listaEvaluaciones, 'Promedio Acumulado', 'Estado'];
        const wsDatos = XLSX.utils.aoa_to_sheet([headers]);

        // Agregar datos de cada estudiante
        datosFiltrados.forEach(est => {
          const row = [
            est.id,
            est.nombre,
            est.documento,
            est.email
          ];
          
          // Agregar nota de cada evaluación (en orden)
          listaEvaluaciones.forEach(evalNombre => {
            row.push(est.evaluaciones[evalNombre]?.nota ?? '');
          });
          
          // Promedio y estado
          row.push(est.promedio.toFixed(2));
          row.push(est.promedio >= 3.0 ? 'Aprobado' : 'Reprobado');
          
          XLSX.utils.sheet_add_aoa(wsDatos, [row], { origin: -1 });
        });

        // Aplicar estilo a la primera fila (encabezados)
        const range = XLSX.utils.decode_range(wsDatos['!ref'] || 'A1');
        for (let col = range.s.c; col <= range.e.c; col++) {
          const cellRef = XLSX.utils.encode_cell({ r: 0, c: col });
          if (wsDatos[cellRef]) {
            wsDatos[cellRef].s = { font: { bold: true }, fill: { fgColor: { rgb: 'E3F2FD' } } };
          }
        }

        XLSX.utils.book_append_sheet(wb, wsDatos, 'Notas por Estudiante');
      }

      // === HOJA 2: Notas Detalladas (formato original para referencia) ===
      if (notasEstudiantes.length > 0) {
        const wsNotas = XLSX.utils.aoa_to_sheet([
          ['ID Estudiante', 'Nombre', 'Documento', 'Email', 'Evaluación', 'Curso', 'Nota (Escala)', 'Puntuación', 'Máximo', 'Porcentaje', 'Fecha Entrega', 'Estado'],
          ...notasEstudiantes.map(n => [
            n.estudianteId ?? '',
            n.estudianteNombre, 
            n.documentoEstudiante || '',
            n.estudianteEmail, 
            n.evaluacionNombre,
            n.cursoNombre, 
            n.notaEscala.toFixed(1), 
            n.puntuacionTotal, 
            n.puntuacionMaxima, 
            `${n.porcentaje.toFixed(1)}%`,
            new Date(n.createdAt).toLocaleDateString('es-CO'),
            n.estadoAprobacion
          ]),
        ]);
        XLSX.utils.book_append_sheet(wb, wsNotas, 'Notas Detalladas');
      }

      // === HOJA 3: Resumen del Grupo ===
      if (resumenGrupo.length > 0) {
        const wsResumen = XLSX.utils.aoa_to_sheet([
          ['Evaluación', 'Promedio (Escala)', 'Total Estudiantes', 'Aprobados', 'Reprobados', '% Aprobación'],
          ...resumenGrupo.map(r => [
            r.evaluacionNombre, 
            r.promedioEscala.toFixed(1),
            r.totalEstudiantes, 
            r.aprobados, 
            r.reprobados,
            `${((r.aprobados / r.totalEstudiantes) * 100).toFixed(1)}%`
          ]),
        ]);
        XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen Grupo');
      }

      // === HOJA 4: Metadatos del Reporte ===
      const wsMeta = XLSX.utils.aoa_to_sheet([
        ['REPORTE QUIMBAYA EVAL - DATOS DE EXPORTACIÓN', ''],
        ['', ''],
        ['Nombre del Curso', cursoActual ? `${cursoActual.codigo} - ${cursoActual.nombre}` : 'Todos'],
        ['ID del Curso', cursoActual?.id || 'N/A'],
        ['Docente', notasEstudiantes[0]?.profesorNombre || 'No asignado'],
        ['Fecha de Generación', fechaGeneracion],
        ['Total Estudiantes Reportados', datosFiltrados.length],
        ['Total Evaluaciones', listaEvaluaciones.length],
        ['', ''],
        ['FILTROS APLICADOS', ''],
        ['Solo Reprobados', filtroReprobados ? 'Sí' : 'No'],
        ['Evaluación Específica', filtroEvaluacionId !== 'all' ? 
          (evaluacionesDelCurso.find(e => String(e.id) === filtroEvaluacionId)?.nombre || 'N/A') : 'Todas'],
        ['', ''],
        ['NOTA: Este archivo contiene datos crudos que pueden ser usados para cálculos y fórmulas en Excel.', ''],
        ['Las notas están en escala de 1 a 5. Se requiere mínimo 3.0 para aprobar.', '']
      ]);
      XLSX.utils.book_append_sheet(wb, wsMeta, 'Información Reporte');

      XLSX.writeFile(wb, `reporte-${cursoActual?.codigo ?? 'general'}-${new Date().toISOString().slice(0, 10)}.xlsx`);
      toast.success('Excel generado', { description: 'Archivo descargado correctamente' });
    } catch (error) {
      console.error('Error al generar Excel:', error);
      toast.error('Error al generar Excel');
    }
  };

  const sidebar = (
    <Card>
      <CardContent className="pt-6">
        <h3 className="mb-4">Filtros</h3>
        <div className="space-y-4">
          {isCoordinador && (
            <div>
              <label className="text-sm text-gray-600 mb-2 block">Docente</label>
              <Select value={filtroDocente} onValueChange={setFiltroDocente}>
                <SelectTrigger><SelectValue placeholder="Todos los docentes" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los docentes</SelectItem>
                  {docentes.map(d => (
                    <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <label className="text-sm text-gray-600 mb-2 block">Curso</label>
            <Select value={filtroCursoId} onValueChange={setFiltroCursoId}>
              <SelectTrigger><SelectValue placeholder="Selecciona un curso" /></SelectTrigger>
              <SelectContent>
                {cursosFiltrados.map(c => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.codigo} - {c.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filtros Avanzados */}
          {filtroCursoId && notasEstudiantes.length > 0 && (
            <>
              <div className="border-t pt-4 mt-4">
                <div className="flex items-center gap-2 mb-3">
                  <Filter className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Filtros de Exportación</span>
                </div>
                
                {/* Filtro: Solo reprobados */}
                <div className="flex items-center justify-between mb-3 p-2 bg-red-50 rounded-md">
                  <label className="text-sm text-gray-700 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                    Solo reprobados
                  </label>
                  <Switch
                    checked={filtroReprobados}
                    onCheckedChange={setFiltroReprobados}
                  />
                </div>

                {/* Filtro: Evaluación específica */}
                <div className="mb-3">
                  <label className="text-sm text-gray-600 mb-2 block flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-500" />
                    Evaluación específica
                  </label>
                  <Select value={filtroEvaluacionId} onValueChange={setFiltroEvaluacionId}>
                    <SelectTrigger className="text-sm">
                      <SelectValue placeholder="Todas las evaluaciones" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas las evaluaciones</SelectItem>
                      {evaluacionesDelCurso.map((evalItem) => (
                        <SelectItem key={evalItem.id} value={String(evalItem.id)}>
                          {evalItem.nombre.length > 30 ? evalItem.nombre.substring(0, 28) + '...' : evalItem.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Indicador de resultados filtrados */}
                {(filtroReprobados || filtroEvaluacionId !== 'all') && (
                  <div className="p-2 bg-blue-50 rounded-md text-xs text-blue-700">
                    <p className="font-medium mb-1">Filtros activos:</p>
                    <ul className="list-disc list-inside">
                      {filtroReprobados && <li>Solo estudiantes reprobados</li>}
                      {filtroEvaluacionId !== 'all' && (
                        <li>Evaluación: {evaluacionesDelCurso.find(e => String(e.id) === filtroEvaluacionId)?.nombre}</li>
                      )}
                    </ul>
                    <p className="mt-2 font-medium">
                      Estudiantes que aplicarán: <span className="text-blue-900">{datosFiltrados.length}</span>
                    </p>
                  </div>
                )}
              </div>
            </>
          )}

          <Button variant="ghost" className="w-full flex items-center gap-2" onClick={() => {
            setFiltroDocente('all');
            setFiltroCursoId('');
            setNotasEstudiantes([]);
            setResumenGrupo([]);
            setFiltroReprobados(false);
            setFiltroEvaluacionId('all');
          }}>
            <RefreshCw className="w-4 h-4" /> Limpiar
          </Button>
        </div>

        <div className="mt-6 p-3 bg-blue-50 rounded-lg">
          <p className="text-xs text-gray-600">
            Selecciona un curso para ver las notas detalladas. Usa los filtros para exportar reportes específicos.
          </p>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <ProtectedRoute allowedRoles={['coordinador', 'maestro']}>
      <Layout
        breadcrumbs={[{ label: 'Dashboard', href: ROUTES.DASHBOARD }, { label: 'Reportes' }]}
        sidebar={sidebar}
      >
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2>Reportes y Análisis</h2>
              <p className="text-gray-500 mt-1 text-sm">
                {cursoActual ? `${cursoActual.codigo} - ${cursoActual.nombre}` : 'Selecciona un curso para ver las notas'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                className="flex items-center gap-2 border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800" 
                onClick={handleExportarPDF} 
                disabled={!filtroCursoId}
              >
                <FileDown className="w-4 h-4" /> PDF
              </Button>
              <Button 
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700" 
                onClick={handleExportarExcel} 
                disabled={!filtroCursoId}
              >
                <FileSpreadsheet className="w-4 h-4" /> Excel
              </Button>
            </div>
          </div>

          {loading ? (
            <LoadingSpinner size="lg" text="Cargando datos..." />
          ) : (
            <div className="space-y-6">
              {/* KPIs generales */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {estadisticasKPIs.map(stat => <StatCard key={stat.label} stat={stat} />)}
              </div>

              {/* Contenido del curso seleccionado */}
              {!filtroCursoId ? (
                <Card>
                  <CardContent className="py-12 text-center text-gray-400">
                    <BookOpen className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                    <p>Selecciona un curso en el panel izquierdo para ver las notas.</p>
                  </CardContent>
                </Card>
              ) : loadingNotas ? (
                <LoadingSpinner size="md" text="Cargando notas..." />
              ) : (
                <Tabs defaultValue="notas">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="notas">Notas por Estudiante</TabsTrigger>
                    <TabsTrigger value="resumen">Resumen del Grupo</TabsTrigger>
                  </TabsList>

                  {/* TAB 1: Notas individuales */}
                  <TabsContent value="notas" className="mt-4">
                    {notasEstudiantes.length === 0 ? (
                      <Card>
                        <CardContent className="py-10 text-center text-gray-400">
                          No hay notas registradas para este curso aún.
                        </CardContent>
                      </Card>
                    ) : (
                      <Card>
                        <CardHeader>
                          <CardTitle>Notas por Estudiante</CardTitle>
                          <CardDescription>
                            {cursoActual?.codigo}
                            {notasEstudiantes[0]?.profesorNombre && ` — Docente: ${notasEstudiantes[0].profesorNombre}`}
                            {` — ${notasEstudiantes.length} registros`}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="overflow-x-auto -mx-6">
                            <div className="inline-block min-w-full px-6">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Estudiante</TableHead>
                                    <TableHead>Documento</TableHead>
                                    <TableHead>Evaluación</TableHead>
                                    <TableHead>Nota</TableHead>
                                    <TableHead>Porcentaje</TableHead>
                                    <TableHead>Estado</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {notasEstudiantes.map(n => (
                                    <TableRow key={n.id}>
                                      <TableCell>
                                        <div>
                                          <p className="text-gray-900">{n.estudianteNombre}</p>
                                          <p className="text-xs text-gray-500">{n.estudianteEmail}</p>
                                        </div>
                                      </TableCell>
                                      <TableCell className="text-sm text-gray-600">
                                        {n.documentoEstudiante || '-'}
                                      </TableCell>
                                      <TableCell>{n.evaluacionNombre}</TableCell>
                                      <TableCell>
                                        <span className="font-medium">{n.notaEscala.toFixed(1)}</span>
                                      </TableCell>
                                      <TableCell>
                                        <span className={n.porcentaje >= 60 ? 'text-green-600' : 'text-red-600'}>
                                          {n.porcentaje.toFixed(1)}%
                                        </span>
                                      </TableCell>
                                      <TableCell>
                                        {n.estadoAprobacion === 'Aprobado' ? (
                                          <span className="inline-flex items-center gap-1 text-green-600 text-sm">
                                            <CheckCircle className="w-4 h-4" /> Aprobado
                                          </span>
                                        ) : (
                                          <span className="inline-flex items-center gap-1 text-red-600 text-sm">
                                            <XCircle className="w-4 h-4" /> Reprobado
                                          </span>
                                        )}
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>

                  {/* TAB 2: Resumen del grupo */}
                  <TabsContent value="resumen" className="mt-4 space-y-4">
                    {resumenGrupo.length === 0 ? (
                      <Card>
                        <CardContent className="py-10 text-center text-gray-400">
                          No hay datos de resumen para este curso aún.
                        </CardContent>
                      </Card>
                    ) : (
                      <>
                        {/* KPIs del grupo */}
                        {promedioGeneral && (
                          <div className="grid grid-cols-3 gap-4">
                            <Card>
                              <CardContent className="pt-5 pb-5">
                                <p className="text-sm text-gray-500">Promedio General</p>
                                <p className="text-3xl mt-1 text-blue-600">{promedioGeneral}%</p>
                              </CardContent>
                            </Card>
                            <Card>
                              <CardContent className="pt-5 pb-5">
                                <p className="text-sm text-gray-500">Aprobados</p>
                                <p className="text-3xl mt-1 text-green-600">{totalAprobados}</p>
                              </CardContent>
                            </Card>
                            <Card>
                              <CardContent className="pt-5 pb-5">
                                <p className="text-sm text-gray-500">Reprobados</p>
                                <p className="text-3xl mt-1 text-red-600">{totalReprobados}</p>
                              </CardContent>
                            </Card>
                          </div>
                        )}

                        {/* Gráfica promedio por evaluación */}
                        <Card>
                          <CardHeader>
                            <CardTitle>Promedio por Evaluación</CardTitle>
                            <CardDescription>Desempeño del grupo en cada evaluación</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <ResponsiveContainer width="100%" height={280}>
                              <BarChart data={resumenGrupo}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="evaluacionNombre" tick={{ fontSize: 11 }} />
                                <YAxis domain={[0, 100]} unit="%" />
                                <Tooltip formatter={(v: number) => `${v.toFixed(1)}%`} />
                                <Bar dataKey="promedioEscala" fill="#3b82f6" radius={[8, 8, 0, 0]} name="Promedio" />
                              </BarChart>
                            </ResponsiveContainer>
                          </CardContent>
                        </Card>

                        {/* Tabla resumen */}
                        <Card>
                          <CardHeader>
                            <CardTitle>Detalle por Evaluación</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="overflow-x-auto -mx-6">
                              <div className="inline-block min-w-full px-6">
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Evaluación</TableHead>
                                      <TableHead>Promedio</TableHead>
                                      <TableHead>Total</TableHead>
                                      <TableHead>Aprobados</TableHead>
                                      <TableHead>Reprobados</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {resumenGrupo.map(r => (
                                      <TableRow key={r.evaluacionId}>
                                        <TableCell>{r.evaluacionNombre}</TableCell>
                                        <TableCell>
                                          <span className={r.promedioEscala >= 3 ? 'text-green-600' : 'text-red-600'}>
                                            {r.promedioEscala.toFixed(1)}
                                          </span>
                                        </TableCell>
                                        <TableCell>{r.totalEstudiantes}</TableCell>
                                        <TableCell><span className="text-green-600">{r.aprobados}</span></TableCell>
                                        <TableCell><span className="text-red-600">{r.reprobados}</span></TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </>
                    )}
                  </TabsContent>
                </Tabs>
              )}
            </div>
          )}
        </div>
      </Layout>
    </ProtectedRoute>
  );
};
