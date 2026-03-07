import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth, UserRole } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { BookOpen, GraduationCap, UserCog, Users } from 'lucide-react';
import { Alert, AlertDescription } from '../components/ui/alert';
import { isValidEmail } from '../utils/validation';
import { toast } from 'sonner';
import { LoadingSpinner } from '../components/LoadingSpinner';

interface LoginFormData {
  email: string;
  password: string;
}

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState<UserRole>('estudiante');
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<LoginFormData>({
    mode: 'onChange',
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const emailValue = watch('email');
  const passwordValue = watch('password');

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true);

    try {
      // Validación: email y password son requeridos para autenticación real
      if (!data.email || !data.password) {
        toast.error('Campos requeridos', {
          description: 'Por favor ingresa tu email y contraseña',
        });
        setLoading(false);
        return;
      }

      // Validación de formato de email
      if (!isValidEmail(data.email)) {
        toast.error('Email inválido', {
          description: 'Por favor ingresa un email válido',
        });
        setLoading(false);
        return;
      }

      // Intentar login con el backend
      await login(data.email, data.password, selectedRole);
      
      // Si el login es exitoso, navegar al dashboard
      navigate('/dashboard');
    } catch (err) {
      // Manejar diferentes tipos de errores
      const error = err as any;
      
      if (error.response?.status === 401) {
        toast.error('Credenciales inválidas', {
          description: 'Email o contraseña incorrectos',
        });
      } else if (error.message?.includes('Network Error') || error.code === 'ERR_NETWORK') {
        toast.error('Error de conexión', {
          description: 'No se pudo conectar con el servidor. Verifica que el backend esté corriendo en http://localhost:8080',
        });
      } else {
        toast.error('Error al iniciar sesión', {
          description: error.message || 'Por favor intenta nuevamente',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md">
        {/* Header - Principio de Proximidad (Gestalt) - Optimizado para móvil */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4" role="banner">
            <div className="bg-blue-600 p-2 sm:p-3 rounded-lg sm:rounded-xl shadow-lg" aria-hidden="true">
              <BookOpen className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
            </div>
            <h1 className="text-blue-600 text-xl sm:text-2xl lg:text-3xl">QuimbayaEVAL</h1>
          </div>
          <p className="text-gray-700 text-sm sm:text-base px-4">Sistema de Gestión de Evaluaciones Académicas</p>
        </div>

        <Card className="shadow-xl">
          <CardHeader className="space-y-1 sm:space-y-1.5">
            <CardTitle className="text-lg sm:text-xl">Iniciar Sesión</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Selecciona tu rol e ingresa tus credenciales</CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            <Tabs value={selectedRole} onValueChange={(value) => setSelectedRole(value as UserRole)}>
              <TabsList className="grid w-full grid-cols-3 h-auto p-1" role="tablist" aria-label="Selección de rol">
                <TabsTrigger 
                  value="estudiante" 
                  className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-3 px-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all"
                  aria-label="Rol: Estudiante"
                >
                  <GraduationCap className="w-5 h-5" aria-hidden="true" />
                  <span className="text-xs sm:text-sm">Estudiante</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="maestro" 
                  className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-3 px-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all"
                  aria-label="Rol: Maestro"
                >
                  <Users className="w-5 h-5" aria-hidden="true" />
                  <span className="text-xs sm:text-sm">Maestro</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="coordinador" 
                  className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-3 px-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all"
                  aria-label="Rol: Coordinador"
                >
                  <UserCog className="w-5 h-5" aria-hidden="true" />
                  <span className="text-xs sm:text-sm">Coordinador</span>
                </TabsTrigger>
              </TabsList>

              <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
                <TabsContent value="estudiante" className="space-y-4 mt-0">
                  <div className="space-y-2">
                    <Label htmlFor="email-estudiante">Correo Electrónico</Label>
                    <Input
                      id="email-estudiante"
                      type="email"
                      placeholder="estudiante@universidad.edu"
                      {...register('email', {
                        required: 'El email es requerido',
                        validate: (value) => {
                          if (value && !isValidEmail(value)) {
                            return 'Email inválido';
                          }
                          return true;
                        },
                      })}
                      aria-invalid={errors.email ? 'true' : 'false'}
                      aria-describedby={errors.email ? 'email-error' : undefined}
                    />
                    {errors.email && (
                      <p id="email-error" className="text-sm text-red-600" role="alert">
                        {errors.email.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password-estudiante">Contraseña</Label>
                    <Input
                      id="password-estudiante"
                      type="password"
                      placeholder="••••••••"
                      {...register('password', {
                        required: 'La contraseña es requerida',
                        minLength: {
                          value: 3,
                          message: 'La contraseña debe tener al menos 3 caracteres'
                        }
                      })}
                      aria-invalid={errors.password ? 'true' : 'false'}
                      aria-describedby={errors.password ? 'password-error' : undefined}
                    />
                    {errors.password && (
                      <p id="password-error" className="text-sm text-red-600" role="alert">
                        {errors.password.message}
                      </p>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="maestro" className="space-y-4 mt-0">
                  <div className="space-y-2">
                    <Label htmlFor="email-maestro">Correo Electrónico</Label>
                    <Input
                      id="email-maestro"
                      type="email"
                      placeholder="maestro@universidad.edu"
                      {...register('email', {
                        required: 'El email es requerido',
                        validate: (value) => {
                          if (value && !isValidEmail(value)) {
                            return 'Email inválido';
                          }
                          return true;
                        },
                      })}
                      aria-invalid={errors.email ? 'true' : 'false'}
                      aria-describedby={errors.email ? 'email-error' : undefined}
                    />
                    {errors.email && (
                      <p id="email-error" className="text-sm text-red-600" role="alert">
                        {errors.email.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password-maestro">Contraseña</Label>
                    <Input
                      id="password-maestro"
                      type="password"
                      placeholder="••••••••"
                      {...register('password', {
                        required: 'La contraseña es requerida',
                        minLength: {
                          value: 3,
                          message: 'La contraseña debe tener al menos 3 caracteres'
                        }
                      })}
                      aria-invalid={errors.password ? 'true' : 'false'}
                      aria-describedby={errors.password ? 'password-error' : undefined}
                    />
                    {errors.password && (
                      <p id="password-error" className="text-sm text-red-600" role="alert">
                        {errors.password.message}
                      </p>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="coordinador" className="space-y-4 mt-0">
                  <div className="space-y-2">
                    <Label htmlFor="email-coordinador">Correo Electrónico</Label>
                    <Input
                      id="email-coordinador"
                      type="email"
                      placeholder="coordinador@universidad.edu"
                      {...register('email', {
                        required: 'El email es requerido',
                        validate: (value) => {
                          if (value && !isValidEmail(value)) {
                            return 'Email inválido';
                          }
                          return true;
                        },
                      })}
                      aria-invalid={errors.email ? 'true' : 'false'}
                      aria-describedby={errors.email ? 'email-error' : undefined}
                    />
                    {errors.email && (
                      <p id="email-error" className="text-sm text-red-600" role="alert">
                        {errors.email.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password-coordinador">Contraseña</Label>
                    <Input
                      id="password-coordinador"
                      type="password"
                      placeholder="••••••••"
                      {...register('password', {
                        required: 'La contraseña es requerida',
                        minLength: {
                          value: 3,
                          message: 'La contraseña debe tener al menos 3 caracteres'
                        }
                      })}
                      aria-invalid={errors.password ? 'true' : 'false'}
                      aria-describedby={errors.password ? 'password-error' : undefined}
                    />
                    {errors.password && (
                      <p id="password-error" className="text-sm text-red-600" role="alert">
                        {errors.password.message}
                      </p>
                    )}
                  </div>
                </TabsContent>

                <Button 
                  type="submit" 
                  className="w-full bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all" 
                  disabled={loading}
                  aria-live="polite"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <LoadingSpinner size="sm" />
                      Ingresando...
                    </span>
                  ) : (
                    `Ingresar como ${selectedRole === 'estudiante' ? 'Estudiante' : selectedRole === 'maestro' ? 'Maestro' : 'Coordinador'}`
                  )}
                </Button>
              </form>
            </Tabs>

            {/* Mensaje informativo */}
            <div className="mt-4 sm:mt-6 space-y-3">
              <Alert className="bg-blue-50 border-blue-200">
                <AlertDescription className="text-xs sm:text-sm text-gray-700">
                  <strong className="text-blue-700">Credenciales de prueba:</strong>
                  <ul className="mt-2 space-y-1 list-disc list-inside">
                    <li>Estudiante: estudiante@universidad.edu / password123</li>
                    <li>Maestro: maestro@universidad.edu / password123</li>
                  </ul>
                </AlertDescription>
              </Alert>
              
              <Alert className="bg-amber-50 border-amber-200">
                <AlertDescription className="text-xs sm:text-sm text-gray-700">
                  <strong className="text-amber-700">Nota:</strong> Asegúrate de que el backend esté corriendo en http://localhost:8080
                </AlertDescription>
              </Alert>
            </div>
          </CardContent>
        </Card>

        {/* Footer accesibilidad - Optimizado para móvil */}
        <footer className="text-center text-xs text-gray-600 mt-6 sm:mt-8 space-y-1 sm:space-y-2 px-4">
          <p>Cumpliendo con WCAG 2.1 AA • Sistema accesible por teclado</p>
          <p>© 2025 SENA - Centro de Formación Quimbaya</p>
        </footer>
      </div>
    </div>
  );
};
