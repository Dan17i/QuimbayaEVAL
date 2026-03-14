import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { BookOpen, User } from 'lucide-react';
import { usersService, UserProfile } from '../services/usersService';
import { useAuth } from '../contexts/AuthContext';
import { ROUTES } from '../constants/routes';
import { toast } from 'sonner';

function Iniciales({ name }: { name: string }) {
  const parts = name.trim().split(' ');
  const ini = parts.length >= 2
    ? parts[0][0] + parts[1][0]
    : parts[0].slice(0, 2);
  return (
    <div className="w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center text-white text-2xl font-bold select-none">
      {ini.toUpperCase()}
    </div>
  );
}

export const PerfilPage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [perfil, setPerfil] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Editar perfil
  const [nombre, setNombre] = useState('');
  const [fotoUrl, setFotoUrl] = useState('');
  const [savingPerfil, setSavingPerfil] = useState(false);

  // Cambiar contraseña
  const [passActual, setPassActual] = useState('');
  const [passNueva, setPassNueva] = useState('');
  const [passConfirm, setPassConfirm] = useState('');
  const [savingPass, setSavingPass] = useState(false);

  useEffect(() => {
    const cargar = async () => {
      setLoading(true);
      try {
        const data = await usersService.getMe();
        setPerfil(data);
        setNombre(data.name);
        setFotoUrl(data.fotoUrl ?? '');
      } catch {
        // manejado por interceptor
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, []);

  const handleGuardarPerfil = async () => {
    if (!nombre.trim()) {
      toast.error('El nombre no puede estar vacío');
      return;
    }
    setSavingPerfil(true);
    try {
      const actualizado = await usersService.updateMe({ name: nombre.trim(), fotoUrl: fotoUrl.trim() });
      setPerfil(actualizado);
      updateUser({ name: actualizado.name });
      toast.success('Perfil actualizado');
    } catch {
      // interceptor
    } finally {
      setSavingPerfil(false);
    }
  };

  const handleCambiarPassword = async () => {
    if (!passActual || !passNueva || !passConfirm) {
      toast.error('Completa todos los campos de contraseña');
      return;
    }
    if (passNueva !== passConfirm) {
      toast.error('Las contraseñas nuevas no coinciden');
      return;
    }
    if (passNueva.length < 8) {
      toast.error('La contraseña nueva debe tener al menos 8 caracteres');
      return;
    }
    setSavingPass(true);
    try {
      await usersService.changePassword(passActual, passNueva);
      toast.success('Contraseña actualizada');
      setPassActual('');
      setPassNueva('');
      setPassConfirm('');
    } catch {
      // interceptor
    } finally {
      setSavingPass(false);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const field = (setter: (v: string) => void) => (e: any) => setter(e.target.value);

  const rolLabel: Record<string, string> = {
    estudiante: 'Estudiante',
    maestro: 'Maestro',
    coordinador: 'Coordinador',
  };

  return (
    <ProtectedRoute>
      <Layout breadcrumbs={[{ label: 'Dashboard', href: ROUTES.DASHBOARD }, { label: 'Mi Perfil' }]}>
        {loading ? (
          <LoadingSpinner size="lg" text="Cargando perfil..." />
        ) : perfil ? (
          <div className="max-w-2xl space-y-6">

            {/* Encabezado */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-5">
                  {perfil.fotoUrl ? (
                    <img src={perfil.fotoUrl} alt="Foto de perfil"
                      className="w-20 h-20 rounded-full object-cover border-2 border-gray-200" />
                  ) : (
                    <Iniciales name={perfil.name} />
                  )}
                  <div>
                    <h2 className="text-xl">{perfil.name}</h2>
                    <p className="text-gray-500 text-sm">{perfil.email}</p>
                    <span className="inline-block mt-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full capitalize">
                      {rolLabel[perfil.role] ?? perfil.role}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Cursos */}
            {perfil.cursos && perfil.cursos.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    {perfil.role === 'maestro' ? 'Cursos que dicto' : 'Mis cursos'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="divide-y divide-gray-100">
                    {perfil.cursos.map(c => (
                      <li key={c.id} className="py-3 flex items-center gap-3">
                        <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded text-gray-600">{c.codigo}</span>
                        <span className="text-sm text-gray-800">{c.nombre}</span>
                        {c.descripcion && <span className="text-xs text-gray-400 hidden sm:block">{c.descripcion}</span>}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Editar perfil */}
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><User className="w-4 h-4" />Editar Perfil</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="p-nombre">Nombre Completo</Label>
                  <Input id="p-nombre" value={nombre} onChange={field(setNombre)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="p-foto">URL de Foto de Perfil</Label>
                  <Input id="p-foto" placeholder="https://i.imgur.com/abc.jpg" value={fotoUrl}
                    onChange={field(setFotoUrl)} />
                  <p className="text-xs text-gray-400">Pega una URL de imagen (Imgur, Gravatar, etc.). Deja vacío para usar las iniciales.</p>
                </div>
                {fotoUrl && (
                  <img src={fotoUrl} alt="Vista previa"
                    className="w-16 h-16 rounded-full object-cover border border-gray-200"
                    onError={e => { (e.currentTarget as any).style.display = 'none'; }}
                  />
                )}
                <Button onClick={handleGuardarPerfil} disabled={savingPerfil}>
                  {savingPerfil ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
              </CardContent>
            </Card>

            {/* Cambiar contraseña */}
            <Card>
              <CardHeader><CardTitle>Cambiar Contraseña</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="p-actual">Contraseña Actual</Label>
                  <Input id="p-actual" type="password" value={passActual} onChange={field(setPassActual)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="p-nueva">Nueva Contraseña</Label>
                  <Input id="p-nueva" type="password" placeholder="Mínimo 8 caracteres" value={passNueva} onChange={field(setPassNueva)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="p-confirm">Confirmar Nueva Contraseña</Label>
                  <Input id="p-confirm" type="password" value={passConfirm} onChange={field(setPassConfirm)} />
                </div>
                {passNueva && passConfirm && passNueva !== passConfirm && (
                  <p className="text-xs text-red-500">Las contraseñas no coinciden</p>
                )}
                <Button onClick={handleCambiarPassword} disabled={savingPass} variant="outline">
                  {savingPass ? 'Actualizando...' : 'Cambiar Contraseña'}
                </Button>
              </CardContent>
            </Card>

          </div>
        ) : null}
      </Layout>
    </ProtectedRoute>
  );
};
