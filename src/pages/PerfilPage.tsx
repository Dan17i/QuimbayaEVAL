import React, { useState, useEffect, useRef } from 'react';
import { Layout } from '../components/Layout';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { PasswordInput } from '../components/PasswordInput';
import {
  BookOpen, User, KeyRound, Shield, CheckCircle2,
  Image as ImageIcon, RefreshCw, AlertCircle, Sparkles, Camera
} from 'lucide-react';
import { usersService, UserProfile } from '../services/usersService';
import { useAuth } from '../contexts/AuthContext';
import { ROUTES } from '../constants/routes';
import { toast } from 'sonner';

function Iniciales({ name }: { name: string }) {
  const parts = name.trim().split(' ').filter(Boolean);
  const ini = parts.length >= 2
    ? parts[0][0] + parts[1][0]
    : parts[0]?.slice(0, 2) || 'US';
  return (
    <span
      translate="no"
      className="notranslate text-white font-bold text-lg select-none"
    >
      {ini.toUpperCase()}
    </span>
  );
}

export const PerfilPage: React.FC = () => {
  const { updateUser } = useAuth();
  const [perfil, setPerfil] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Formulario editar perfil
  const [nombre, setNombre] = useState('');
  const [fotoUrl, setFotoUrl] = useState('');
  const [imgError, setImgError] = useState(false);
  const [savingPerfil, setSavingPerfil] = useState(false);

  // Formulario cambiar contraseña
  const [passActual, setPassActual] = useState('');
  const [passNueva, setPassNueva] = useState('');
  const [passConfirm, setPassConfirm] = useState('');
  const [savingPass, setSavingPass] = useState(false);

  const cargarPerfil = async () => {
    setLoading(true);
    try {
      const data = await usersService.getMe();
      setPerfil(data);
      setNombre(data.name || '');
      setFotoUrl(data.fotoUrl || '');
      setImgError(false);
    } catch {
      // interceptor global maneja el error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarPerfil();
  }, []);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Por favor selecciona un archivo de imagen válido (JPG, PNG, WebP).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('La imagen no debe superar los 10MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const rawDataUrl = event.target?.result as string;
      if (!rawDataUrl) return;

      // Previsualización inmediata en el avatar
      setFotoUrl(rawDataUrl);
      setImgError(false);
      toast.success('Foto cargada en la vista previa. Haz clic en "Guardar Cambios" para confirmar.');

      // Optimizar a 256x256 en segundo plano para guardado ligero
      try {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const size = 256;
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            const minDim = Math.min(img.width, img.height);
            const sx = (img.width - minDim) / 2;
            const sy = (img.height - minDim) / 2;
            ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);
            const optimized = canvas.toDataURL('image/jpeg', 0.88);
            setFotoUrl(optimized);
          }
        };
        img.src = rawDataUrl;
      } catch {
        // En caso de que canvas no esté disponible, rawDataUrl ya está activo
      }
    };
    reader.readAsDataURL(file);

    e.target.value = '';
  };

  const handleFotoChange = (val: string) => {
    setFotoUrl(val);
    setImgError(false);
  };

  // ¿Hay cambios en el perfil?
  const hasPerfilChanges = perfil && (
    nombre.trim() !== perfil.name ||
    (fotoUrl.trim() || null) !== (perfil.fotoUrl || null)
  );

  const handleGuardarPerfil = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) {
      toast.error('El nombre no puede estar vacío');
      return;
    }
    setSavingPerfil(true);
    try {
      const cleanName = nombre.trim();
      const cleanFoto = fotoUrl.trim();
      const actualizado = await usersService.updateMe({
        name: cleanName,
        fotoUrl: cleanFoto,
      });

      if (actualizado && typeof actualizado === 'object') {
        setPerfil(actualizado);
        updateUser({
          name: actualizado.name,
          fotoUrl: actualizado.fotoUrl ?? undefined,
        });
      } else {
        setPerfil(prev => prev ? { ...prev, name: cleanName, fotoUrl: cleanFoto || null } : null);
        updateUser({
          name: cleanName,
          fotoUrl: cleanFoto || undefined,
        });
      }

      toast.success('Perfil actualizado exitosamente');
    } catch {
      // interceptor
    } finally {
      setSavingPerfil(false);
    }
  };

  const handleResetPerfil = () => {
    if (!perfil) return;
    setNombre(perfil.name);
    setFotoUrl(perfil.fotoUrl || '');
    setImgError(false);
  };

  const handleCambiarPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passActual || !passNueva || !passConfirm) {
      toast.error('Completa todos los campos de contraseña');
      return;
    }
    if (passNueva !== passConfirm) {
      toast.error('Las contraseñas nuevas no coinciden');
      return;
    }
    if (passNueva.length < 6) {
      toast.error('La contraseña nueva debe tener al menos 6 caracteres');
      return;
    }
    setSavingPass(true);
    try {
      await usersService.changePassword(passActual, passNueva);
      toast.success('Contraseña actualizada con éxito');
      setPassActual('');
      setPassNueva('');
      setPassConfirm('');
    } catch {
      // interceptor
    } finally {
      setSavingPass(false);
    }
  };

  const rolBadgeInfo: Record<string, { label: string; badge: string }> = {
    estudiante: {
      label: 'SENA — Aprendiz',
      badge: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    },
    maestro: {
      label: 'SENA — Instructor',
      badge: 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    },
    coordinador: {
      label: 'SENA — Coordinación Académica',
      badge: 'bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800',
    },
  };

  return (
    <ProtectedRoute>
      <Layout breadcrumbs={[{ label: 'Dashboard', href: ROUTES.DASHBOARD }, { label: 'Mi Perfil' }]}>
        <div className="p-4 sm:p-6 md:p-8 max-w-4xl mx-auto space-y-8">

          {/* Encabezado Principal */}
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <User className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              Mi Perfil Institucional
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Administra tu información personal, avatar institucional y credenciales de acceso seguro a QuimbayaEVAL.
            </p>
          </div>

          {loading ? (
            <div className="py-16">
              <LoadingSpinner size="lg" text="Cargando información del perfil..." />
            </div>
          ) : perfil ? (
            <div className="space-y-6">

              {/* Tarjeta de Resumen / Avatar y Métricas */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-sm overflow-hidden text-white">
                {/* Selector de archivos local oculto */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png, image/jpeg, image/jpg, image/webp, image/gif"
                  onChange={handleFileChange}
                  className="hidden"
                  data-testid="avatar-file-input"
                  aria-label="Seleccionar imagen de perfil"
                />

                {/* Estructura principal (Header de Perfil): Flex horizontal limpio */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 p-6">
                  {/* Avatar y datos del usuario */}
                  <div className="flex items-center gap-6">
                    {/* Avatar e Icono de edición */}
                    <div className="relative w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700 flex-shrink-0">
                      {fotoUrl && !imgError ? (
                        <img
                          src={fotoUrl}
                          alt={perfil.name}
                          onError={() => setImgError(true)}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <Iniciales name={perfil.name} />
                      )}

                      {/* Icono discreto de cámara flotando en la esquina inferior derecha */}
                      <button
                        type="button"
                        onClick={triggerFileInput}
                        title="Cambiar foto de perfil"
                        aria-label="Cambiar foto de perfil"
                        className="absolute bottom-0 right-0 p-1.5 bg-blue-600 rounded-full cursor-pointer hover:bg-blue-500 text-white border-2 border-slate-900 transition-transform active:scale-95 flex items-center justify-center shadow-sm"
                      >
                        <Camera className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Bloque de información del usuario */}
                    <div className="flex flex-col justify-center gap-1.5 min-w-0">
                      {/* Fila superior: Nombre + Insignia a la derecha con gap-3 */}
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="text-xl font-semibold text-white tracking-tight leading-tight">
                          {perfil.name}
                        </h2>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${rolBadgeInfo[perfil.role]?.badge || 'bg-slate-700 text-slate-200 border-slate-600'}`}>
                          {rolBadgeInfo[perfil.role]?.label || perfil.role}
                        </span>
                      </div>

                      {/* Fila inferior: Correo + Cuenta Activa en línea secundaria */}
                      <div className="flex flex-wrap items-center gap-2 text-sm text-slate-400">
                        <span>{perfil.email}</span>
                        <span className="text-slate-600">•</span>
                        <span className="inline-flex items-center gap-1.5 text-emerald-400 font-medium">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                          Cuenta Activa
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Botón Refrescar alineado a la derecha */}
                  <div className="flex items-center self-start sm:self-center flex-shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={cargarPerfil}
                      title="Actualizar datos"
                      className="text-xs bg-slate-800/80 hover:bg-slate-700 text-slate-200 border-slate-700 px-3 py-1.5 h-auto rounded-lg shadow-xs flex items-center gap-1.5"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Refrescar
                    </Button>
                  </div>
                </div>

                {/* Tarjetas de métricas (Abajo): 3 columnas, gap-4, p-5 con fondo oscuro */}
                <div className="p-6 pt-0 border-t border-slate-800/80">
                  <div className="grid grid-cols-3 gap-4 pt-6">
                    {/* Tarjeta 1: Estado de Cuenta */}
                    <div className="p-5 bg-slate-800/60 dark:bg-[#1e293b] border border-slate-700/50 rounded-xl flex flex-col justify-center text-left">
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider truncate">Estado de Cuenta</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block flex-shrink-0" />
                        <span className="text-base sm:text-lg font-bold text-emerald-400">Activo</span>
                      </div>
                    </div>

                    {/* Tarjeta 2: Cursos */}
                    <div className="p-5 bg-slate-800/60 dark:bg-[#1e293b] border border-slate-700/50 rounded-xl flex flex-col justify-center text-left">
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider truncate">
                        {perfil.role === 'maestro' ? 'Cursos a Cargo' : 'Cursos Inscritos'}
                      </p>
                      <p className="text-base sm:text-lg font-bold text-white mt-1.5">
                        {perfil.cursos?.length ?? 0} curso(s)
                      </p>
                    </div>

                    {/* Tarjeta 3: Identificador SENA */}
                    <div className="p-5 bg-slate-800/60 dark:bg-[#1e293b] border border-slate-700/50 rounded-xl flex flex-col justify-center text-left">
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider truncate">Identificador SENA</p>
                      <p className="text-base sm:text-lg font-bold font-mono text-white mt-1.5">
                        ID #{perfil.id}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Formulario Editar Perfil */}
              <Card className="border border-gray-200 dark:border-gray-800 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    Datos Personales
                  </CardTitle>
                  <CardDescription>
                    Actualiza tu nombre visible en las actas de evaluación y la URL de tu imagen de perfil.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleGuardarPerfil} className="space-y-4">
                    {/* Correo (Solo lectura) */}
                    <div className="space-y-1.5">
                      <Label htmlFor="perfil-email" className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                        Correo Electrónico Institucional
                      </Label>
                      <Input
                        id="perfil-email"
                        value={perfil.email}
                        disabled
                        className="bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-400 cursor-not-allowed text-sm"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        <Shield className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                        El correo institucional está gestionado y protegido por el centro formativo.
                      </p>
                    </div>

                    {/* Nombre */}
                    <div className="space-y-1.5">
                      <Label htmlFor="perfil-nombre" className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                        Nombre Completo
                      </Label>
                      <Input
                        id="perfil-nombre"
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                        placeholder="Ej. Juan Pérez"
                        className="text-sm"
                        required
                      />
                    </div>

                    {/* URL Foto o Archivo */}
                    <div className="space-y-1.5">
                      <Label htmlFor="perfil-foto" className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                        Foto de Perfil (URL pública o archivo local)
                      </Label>
                      <div className="flex gap-2 items-center flex-wrap sm:flex-nowrap">
                        <Input
                          id="perfil-foto"
                          value={fotoUrl}
                          onChange={(e) => handleFotoChange(e.target.value)}
                          placeholder="https://ejemplo.com/mi-foto.jpg o selecciona un archivo"
                          className="text-sm font-mono flex-1 min-w-[200px]"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={triggerFileInput}
                          className="text-xs flex items-center gap-1.5 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                        >
                          <Camera className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                          Subir archivo
                        </Button>
                        {fotoUrl && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleFotoChange('')}
                            className="text-xs text-gray-500 hover:text-red-600"
                          >
                            Limpiar
                          </Button>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        <ImageIcon className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        Puedes subir un archivo desde tu dispositivo o ingresar una URL pública. Si lo dejas vacío, se usarán tus iniciales.
                      </p>

                      {/* Vista previa de la foto */}
                      {fotoUrl && (
                        <div className="mt-3 flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
                          {imgError ? (
                            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs">
                              <AlertCircle className="w-5 h-5" />
                            </div>
                          ) : (
                            <img
                              src={fotoUrl}
                              alt="Vista previa"
                              onError={() => setImgError(true)}
                              className="w-12 h-12 rounded-full object-cover border border-gray-200 dark:border-gray-700"
                            />
                          )}
                          <div className="text-xs">
                            <p className="font-semibold text-gray-800 dark:text-gray-200">
                              {imgError ? 'No se pudo cargar la imagen' : 'Vista previa de avatar'}
                            </p>
                            <p className="text-gray-500 dark:text-gray-400">
                              {imgError ? 'Verifica que la URL sea pública y directa a un archivo JPG o PNG.' : 'Así se verá en la barra lateral y evaluaciones.'}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Botones de acción */}
                    <div className="flex items-center justify-end gap-3 pt-3">
                      {hasPerfilChanges && (
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={handleResetPerfil}
                          disabled={savingPerfil}
                          size="sm"
                        >
                          Descartar
                        </Button>
                      )}
                      <Button
                        type="submit"
                        disabled={savingPerfil || !hasPerfilChanges || !nombre.trim()}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-medium"
                      >
                        {savingPerfil ? (
                          <>
                            <LoadingSpinner size="sm" />
                            <span className="ml-2">Guardando...</span>
                          </>
                        ) : (
                          'Guardar Cambios'
                        )}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>

              {/* Formulario Cambiar Contraseña */}
              <Card className="border border-gray-200 dark:border-gray-800 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    Seguridad y Contraseña
                  </CardTitle>
                  <CardDescription>
                    Mantén tu cuenta protegida renovando tu contraseña periódicamente. Debe contener al menos 6 caracteres.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCambiarPassword} className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="pass-actual" className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                        Contraseña Actual
                      </Label>
                      <PasswordInput
                        id="pass-actual"
                        value={passActual}
                        onChange={(e) => setPassActual(e.target.value)}
                        placeholder="Ingresa tu clave actual"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="pass-nueva" className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                          Nueva Contraseña
                        </Label>
                        <PasswordInput
                          id="pass-nueva"
                          value={passNueva}
                          onChange={(e) => setPassNueva(e.target.value)}
                          placeholder="Mínimo 6 caracteres"
                          required
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="pass-confirm" className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                          Confirmar Nueva Contraseña
                        </Label>
                        <PasswordInput
                          id="pass-confirm"
                          value={passConfirm}
                          onChange={(e) => setPassConfirm(e.target.value)}
                          placeholder="Repite la contraseña"
                          required
                        />
                      </div>
                    </div>

                    {/* Validación visual de coincidencia */}
                    {passNueva && passConfirm && (
                      <div className={`p-2.5 rounded-lg text-xs flex items-center gap-2 ${
                        passNueva === passConfirm
                          ? 'bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800'
                          : 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
                      }`}>
                        {passNueva === passConfirm ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                            <span>Las contraseñas coinciden correctamente.</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                            <span>Las contraseñas no coinciden.</span>
                          </>
                        )}
                      </div>
                    )}

                    <div className="flex justify-end pt-2">
                      <Button
                        type="submit"
                        disabled={savingPass || !passActual || !passNueva || !passConfirm || passNueva !== passConfirm || passNueva.length < 6}
                        variant="outline"
                        className="font-medium hover:bg-amber-50 dark:hover:bg-amber-950 hover:text-amber-700 border-amber-300 dark:border-amber-800"
                      >
                        {savingPass ? (
                          <>
                            <LoadingSpinner size="sm" />
                            <span className="ml-2">Actualizando...</span>
                          </>
                        ) : (
                          'Actualizar Contraseña'
                        )}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>

              {/* Cursos Vinculados */}
              {perfil.cursos && perfil.cursos.length > 0 && (
                <Card className="border border-gray-200 dark:border-gray-800 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      {perfil.role === 'maestro' ? 'Cursos Asignados para Dictar' : 'Mis Cursos Matriculados'}
                    </CardTitle>
                    <CardDescription>
                      Asignaturas vinculadas a tu cuenta en la plataforma institucional.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {perfil.cursos.map((c) => (
                        <div
                          key={c.id}
                          className="p-3.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl flex items-start gap-3 hover:border-indigo-300 transition-colors"
                        >
                          <span className="px-2 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-indigo-700 dark:text-indigo-300 text-xs font-mono font-bold rounded-lg shadow-2xs">
                            {c.codigo}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                              {c.nombre}
                            </p>
                            {c.descripcion && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mt-0.5">
                                {c.descripcion}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

            </div>
          ) : null}

        </div>
      </Layout>
    </ProtectedRoute>
  );
};
