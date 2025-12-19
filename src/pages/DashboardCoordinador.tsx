import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Users, BarChart3, TrendingUp, TrendingDown, FileDown, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

export const DashboardCoordinador: React.FC = () => {
  const navigate = useNavigate();
  const kpis = [
    { label: 'Total Estudiantes', value: '2,847', change: '+12%', trend: 'up', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Tasa de Aprobación', value: '87.3%', change: '+3.2%', trend: 'up', icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Evaluaciones Activas', value: '156', change: '-8', trend: 'down', icon: BarChart3, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Estudiantes en Riesgo', value: '73', change: '-15', trend: 'down', icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-50' },
  ];

  const desempenoPorCurso = [
    { curso: 'MAT-301', promedio: 4.2, aprobacion: 88 },
    { curso: 'FIS-401', promedio: 3.8, aprobacion: 76 },
    { curso: 'PRG-205', promedio: 4.5, aprobacion: 92 },
    { curso: 'ING-102', promedio: 4.1, aprobacion: 85 },
    { curso: 'QUI-203', promedio: 3.6, aprobacion: 72 },
  ];

  const tendenciaMensual = [
    { mes: 'Jun', aprobacion: 82, promedio: 3.9 },
    { mes: 'Jul', aprobacion: 85, promedio: 4.0 },
    { mes: 'Ago', aprobacion: 84, promedio: 4.1 },
    { mes: 'Sep', aprobacion: 87, promedio: 4.2 },
    { mes: 'Oct', aprobacion: 87, promedio: 4.2 },
  ];

  return (
    <ProtectedRoute allowedRoles={['coordinador']}>
      <Layout breadcrumbs={[{ label: 'Dashboard' }]}>
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h2>Panel de Coordinación</h2>
              <p className="text-gray-600 mt-2">Indicadores institucionales y reportes analíticos</p>
            </div>
            <Button className="flex items-center gap-2" onClick={() => navigate('/reportes')}>
              <FileDown className="w-4 h-4" />
              Exportar Reporte
            </Button>
          </div>

          {/* KPIs Grid - Optimizado para móvil */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
            {kpis.map((kpi) => (
              <Card key={kpi.label}>
                <CardContent className="pt-4 sm:pt-6 pb-4 sm:pb-6 px-3 sm:px-6">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm text-gray-600 truncate">{kpi.label}</p>
                      <p className="text-2xl sm:text-3xl mt-1 sm:mt-2">{kpi.value}</p>
                      <div className="flex items-center gap-1 mt-2">
                        {kpi.trend === 'up' ? (
                          <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
                        ) : (
                          <TrendingDown className="w-3 h-3 sm:w-4 sm:h-4 text-red-600" />
                        )}
                        <span className={`text-xs sm:text-sm ${kpi.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                          {kpi.change}
                        </span>
                      </div>
                    </div>
                    <div className={`${kpi.bg} p-2 sm:p-3 rounded-lg flex-shrink-0`}>
                      <kpi.icon className={`w-5 h-5 sm:w-6 sm:h-6 ${kpi.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Desempeño por Curso</CardTitle>
                <CardDescription>Tasa de aprobación por materia (período actual)</CardDescription>
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
                <CardDescription>Evolución de aprobación y promedio institucional</CardDescription>
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

          {/* Quick Actions - Semejanza y Continuidad (Gestalt) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6" role="navigation" aria-label="Acciones rápidas">
            <Card 
              className="hover:shadow-lg hover:border-blue-300 transition-all duration-200 cursor-pointer group focus-within:ring-2 focus-within:ring-blue-500" 
              onClick={() => navigate('/reportes')}
              tabIndex={0}
              role="button"
              onKeyPress={(e) => e.key === 'Enter' && navigate('/reportes')}
              aria-label="Ver reportes avanzados"
            >
              <CardHeader>
                <div className="bg-blue-50 w-12 h-12 rounded-lg flex items-center justify-center mb-3 group-hover:bg-blue-100 transition-colors">
                  <BarChart3 className="w-6 h-6 text-blue-600" />
                </div>
                <CardTitle>Reportes Avanzados</CardTitle>
                <CardDescription>Consulta KPIs, filtra por curso y exporta a PDF/XLSX</CardDescription>
              </CardHeader>
            </Card>

            <Card 
              className="hover:shadow-lg hover:border-green-300 transition-all duration-200 cursor-pointer group focus-within:ring-2 focus-within:ring-green-500" 
              onClick={() => navigate('/usuarios')}
              tabIndex={0}
              role="button"
              onKeyPress={(e) => e.key === 'Enter' && navigate('/usuarios')}
              aria-label="Gestionar usuarios"
            >
              <CardHeader>
                <div className="bg-green-50 w-12 h-12 rounded-lg flex items-center justify-center mb-3 group-hover:bg-green-100 transition-colors">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
                <CardTitle>Gestión de Usuarios</CardTitle>
                <CardDescription>Crear, editar roles y activar/bloquear cuentas</CardDescription>
              </CardHeader>
            </Card>

            <Card 
              className="hover:shadow-lg hover:border-purple-300 transition-all duration-200 cursor-pointer group focus-within:ring-2 focus-within:ring-purple-500"
              tabIndex={0}
              role="button"
              aria-label="Ver auditoría del sistema"
            >
              <CardHeader>
                <div className="bg-purple-50 w-12 h-12 rounded-lg flex items-center justify-center mb-3 group-hover:bg-purple-100 transition-colors">
                  <FileDown className="w-6 h-6 text-purple-600" />
                </div>
                <CardTitle>Auditoría</CardTitle>
                <CardDescription>Trazabilidad de accesos y modificaciones del sistema</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
};
