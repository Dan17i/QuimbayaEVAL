import React, { useState, useMemo } from 'react';
import { Layout } from '../components/Layout';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { FileDown, Filter, RefreshCw } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { StatCard } from '../components/StatCard';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ROUTES } from '../constants/routes';
import { Estadistica } from '../types';
import { BarChart3, Users, TrendingUp, FileText } from 'lucide-react';
import { toast } from 'sonner';

export const ReportesPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [periodo, setPeriodo] = useState('actual');
  const [cursoFiltro, setCursoFiltro] = useState('all');

  const desempenoPorCurso = [
    { curso: 'MAT-301', estudiantes: 45, promedio: 4.2, aprobacion: 88, reprobacion: 12 },
    { curso: 'FIS-401', estudiantes: 42, promedio: 3.8, aprobacion: 76, reprobacion: 24 },
    { curso: 'PRG-205', estudiantes: 38, promedio: 4.5, aprobacion: 92, reprobacion: 8 },
    { curso: 'ING-102', estudiantes: 51, promedio: 4.1, aprobacion: 85, reprobacion: 15 },
    { curso: 'QUI-203', estudiantes: 36, promedio: 3.6, aprobacion: 72, reprobacion: 28 },
  ];

  const tendenciaMensual = [
    { mes: 'Jun', aprobacion: 82, promedio: 3.9, evaluaciones: 45 },
    { mes: 'Jul', aprobacion: 85, promedio: 4.0, evaluaciones: 52 },
    { mes: 'Ago', aprobacion: 84, promedio: 4.1, evaluaciones: 48 },
    { mes: 'Sep', aprobacion: 87, promedio: 4.2, evaluaciones: 56 },
    { mes: 'Oct', aprobacion: 87, promedio: 4.2, evaluaciones: 50 },
  ];

  const distribucionCalificaciones = [
    { rango: '4.5-5.0', cantidad: 156, porcentaje: 35 },
    { rango: '4.0-4.4', cantidad: 134, porcentaje: 30 },
    { rango: '3.5-3.9', cantidad: 89, porcentaje: 20 },
    { rango: '3.0-3.4', cantidad: 45, porcentaje: 10 },
    { rango: '<3.0', cantidad: 22, porcentaje: 5 },
  ];

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#6b7280'];

  const estadisticasKPIs = useMemo<Estadistica[]>(() => [
    { label: 'Total Estudiantes', value: '2,847', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Promedio Institucional', value: '4.15', icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Tasa de Aprobación', value: '87.3%', icon: BarChart3, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Evaluaciones Realizadas', value: '251', icon: FileText, color: 'text-orange-600', bg: 'bg-orange-50' },
  ], []);

  const handleExportarPDF = () => {
    toast.info('Exportando PDF', { description: 'Generando reporte en formato PDF...' });
  };

  const handleExportarXLSX = () => {
    toast.info('Exportando Excel', { description: 'Generando reporte en formato Excel...' });
  };

  const handleAplicarFiltros = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success('Filtros aplicados', { description: 'Los datos se han actualizado según los filtros seleccionados' });
    }, 500);
  };

  const handleLimpiarFiltros = () => {
    setPeriodo('actual');
    setCursoFiltro('all');
    toast.info('Filtros limpiados', { description: 'Se han restablecido todos los filtros' });
  };

  const sidebar = (
    <Card>
      <CardContent className="pt-6">
        <h3 className="mb-4">Filtros Avanzados</h3>
        <div className="space-y-4">
          <div>
            <Label htmlFor="periodo">Período</Label>
            <Select value={periodo} onValueChange={setPeriodo}>
              <SelectTrigger id="periodo" className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="actual">Período Actual (2025-2)</SelectItem>
                <SelectItem value="anterior">Período Anterior (2025-1)</SelectItem>
                <SelectItem value="anual">Año 2025</SelectItem>
                <SelectItem value="custom">Personalizado...</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="curso-filter">Curso</Label>
            <Select value={cursoFiltro} onValueChange={setCursoFiltro}>
              <SelectTrigger id="curso-filter" className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los cursos</SelectItem>
                <SelectItem value="MAT-301">MAT-301</SelectItem>
                <SelectItem value="FIS-401">FIS-401</SelectItem>
                <SelectItem value="PRG-205">PRG-205</SelectItem>
                <SelectItem value="ING-102">ING-102</SelectItem>
                <SelectItem value="QUI-203">QUI-203</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="programa">Programa</Label>
            <Select defaultValue="all">
              <SelectTrigger id="programa" className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los programas</SelectItem>
                <SelectItem value="ingenieria">Ingeniería</SelectItem>
                <SelectItem value="ciencias">Ciencias</SelectItem>
                <SelectItem value="humanidades">Humanidades</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="fecha-desde">Desde</Label>
            <Input id="fecha-desde" type="date" className="mt-2" />
          </div>

          <div>
            <Label htmlFor="fecha-hasta">Hasta</Label>
            <Input id="fecha-hasta" type="date" className="mt-2" />
          </div>

          <Button 
            variant="outline" 
            className="w-full flex items-center gap-2"
            onClick={handleAplicarFiltros}
            disabled={loading}
          >
            <Filter className="w-4 h-4" />
            {loading ? 'Aplicando...' : 'Aplicar Filtros'}
          </Button>

          <Button 
            variant="ghost" 
            className="w-full flex items-center gap-2"
            onClick={handleLimpiarFiltros}
            disabled={loading}
          >
            <RefreshCw className="w-4 h-4" />
            Limpiar
          </Button>
        </div>

        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <p className="text-xs text-gray-600">
            Los reportes se generan en tiempo real. Para datasets grandes puede tomar unos segundos.
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
          {loading && (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="lg" text="Cargando datos..." />
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <div>
              <h2>Reportes y Análisis</h2>
              <p className="text-gray-600 mt-2">KPIs institucionales y métricas de desempeño</p>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                className="flex items-center gap-2"
                onClick={handleExportarPDF}
              >
                <FileDown className="w-4 h-4" />
                Exportar PDF
              </Button>
              <Button 
                className="flex items-center gap-2"
                onClick={handleExportarXLSX}
              >
                <FileDown className="w-4 h-4" />
                Exportar XLSX
              </Button>
            </div>
          </div>

          {/* KPIs Resumen */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {estadisticasKPIs.map((stat) => (
              <StatCard key={stat.label} stat={stat} />
            ))}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Desempeño por Curso</CardTitle>
                <CardDescription>Promedio y tasa de aprobación por materia</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={desempenoPorCurso}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="curso" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="aprobacion" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tendencia Mensual</CardTitle>
                <CardDescription>Evolución de aprobación y promedio</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={tendenciaMensual}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mes" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="aprobacion" stroke="#10b981" strokeWidth={2} />
                    <Line type="monotone" dataKey="promedio" stroke="#8b5cf6" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Distribución de Calificaciones */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Distribución de Calificaciones</CardTitle>
                <CardDescription>Por rangos de nota</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={distribucionCalificaciones}
                      dataKey="cantidad"
                      nameKey="rango"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={(entry) => `${entry.rango}: ${entry.porcentaje}%`}
                    >
                      {distribucionCalificaciones.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Resumen por Rango</CardTitle>
                <CardDescription>Detalle de distribución</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {distribucionCalificaciones.map((item, index) => (
                    <div key={item.rango} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="text-sm text-gray-900">{item.rango}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-900">{formatNumber(item.cantidad)} estudiantes</p>
                        <p className="text-xs text-gray-500">{formatPercentage(item.porcentaje)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabla Detallada */}
          <Card>
            <CardHeader>
              <CardTitle>Detalle por Curso</CardTitle>
              <CardDescription>Vista completa de métricas</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Curso</TableHead>
                    <TableHead>Estudiantes</TableHead>
                    <TableHead>Promedio</TableHead>
                    <TableHead>Aprobación</TableHead>
                    <TableHead>Reprobación</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {desempenoPorCurso.map((curso) => (
                    <TableRow key={curso.curso}>
                      <TableCell>{curso.curso}</TableCell>
                      <TableCell>{formatNumber(curso.estudiantes)}</TableCell>
                      <TableCell>{curso.promedio.toFixed(1)}/5.0</TableCell>
                      <TableCell>
                        <span className="text-green-600">{formatPercentage(curso.aprobacion)}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-red-600">{formatPercentage(curso.reprobacion)}</span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </Layout>
    </ProtectedRoute>
  );
};
