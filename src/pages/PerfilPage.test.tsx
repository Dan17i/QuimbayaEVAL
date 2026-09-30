import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { PerfilPage } from './PerfilPage';
import { usersService, UserProfile } from '../services/usersService';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

// Mocks
vi.mock('../components/ProtectedRoute', () => ({
  ProtectedRoute: ({ children }: { children: React.ReactNode }) => <div data-testid="protected-route">{children}</div>,
}));

vi.mock('../components/Layout', () => ({
  Layout: ({ children }: { children: React.ReactNode }) => <div data-testid="layout-wrapper">{children}</div>,
}));

vi.mock('../services/usersService', () => ({
  usersService: {
    getMe: vi.fn(),
    updateMe: vi.fn(),
    changePassword: vi.fn(),
  },
}));

vi.mock('../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('PerfilPage Component', () => {
  const mockUser: UserProfile = {
    id: 1,
    name: 'Daniel Jurado',
    email: 'daniel@sena.edu.co',
    role: 'estudiante',
    fotoUrl: 'https://example.com/avatar.jpg',
    cursos: [
      {
        id: 101,
        codigo: 'ADSO-2026',
        nombre: 'Análisis y Desarrollo de Software',
        descripcion: 'Formación profesional',
        profesorId: 2,
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
    ],
  };

  const mockUpdateUser = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({
      user: {
        id: '1',
        name: 'Daniel Jurado',
        email: 'daniel@sena.edu.co',
        role: 'estudiante',
      },
      isAuthenticated: true,
      login: vi.fn(),
      logout: vi.fn(),
      updateUser: mockUpdateUser,
    });
  });

  it('muestra spinner mientras carga el perfil y luego presenta los datos del usuario', async () => {
    vi.mocked(usersService.getMe).mockResolvedValue(mockUser);

    render(<PerfilPage />);

    expect(screen.getByText(/cargando información del perfil/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByText(/cargando información del perfil/i)).not.toBeInTheDocument();
    });

    expect(screen.getByText('Mi Perfil Institucional')).toBeInTheDocument();
    expect(screen.getByText('SENA — Aprendiz')).toBeInTheDocument();
    expect(screen.getByText('daniel@sena.edu.co')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Daniel Jurado')).toBeInTheDocument();
    expect(screen.getByText('1 curso(s)')).toBeInTheDocument();
    expect(screen.getByText('ADSO-2026')).toBeInTheDocument();
  });

  it('habilita el botón guardar cuando hay cambios y llama a updateMe al enviar el formulario', async () => {
    const user = userEvent.setup();
    vi.mocked(usersService.getMe).mockResolvedValue(mockUser);
    vi.mocked(usersService.updateMe).mockResolvedValue({
      ...mockUser,
      name: 'Daniel Jurado Castro',
    });

    render(<PerfilPage />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('Daniel Jurado')).toBeInTheDocument();
    });

    const submitBtn = screen.getByRole('button', { name: /guardar cambios/i });
    expect(submitBtn).toBeDisabled();

    // Modificar nombre
    const nameInput = screen.getByLabelText(/nombre completo/i);
    await user.clear(nameInput);
    await user.type(nameInput, 'Daniel Jurado Castro');

    expect(submitBtn).not.toBeDisabled();

    // Enviar formulario
    await user.click(submitBtn);

    await waitFor(() => {
      expect(usersService.updateMe).toHaveBeenCalledWith({
        name: 'Daniel Jurado Castro',
        fotoUrl: 'https://example.com/avatar.jpg',
      });
      expect(mockUpdateUser).toHaveBeenCalledWith({
        name: 'Daniel Jurado Castro',
        fotoUrl: 'https://example.com/avatar.jpg',
      });
      expect(toast.success).toHaveBeenCalledWith('Perfil actualizado exitosamente');
    });
  });

  it('valida que las contraseñas coincidan y tengan mínimo 6 caracteres', async () => {
    const user = userEvent.setup();
    vi.mocked(usersService.getMe).mockResolvedValue(mockUser);

    render(<PerfilPage />);

    await waitFor(() => {
      expect(screen.getByText('Seguridad y Contraseña')).toBeInTheDocument();
    });

    const passActual = screen.getByPlaceholderText('Ingresa tu clave actual');
    const passNueva = screen.getByPlaceholderText('Mínimo 6 caracteres');
    const passConfirm = screen.getByPlaceholderText('Repite la contraseña');
    const updatePassBtn = screen.getByRole('button', { name: /actualizar contraseña/i });

    // Inicialmente deshabilitado
    expect(updatePassBtn).toBeDisabled();

    // Llenar actual y nueva diferente a confirm
    await user.type(passActual, 'ClaveVieja123*');
    await user.type(passNueva, 'ClaveNueva123*');
    await user.type(passConfirm, 'ClaveDistinta999*');

    // Debe mostrar advertencia visual y botón deshabilitado
    expect(screen.getByText(/las contraseñas no coinciden/i)).toBeInTheDocument();
    expect(updatePassBtn).toBeDisabled();

    // Corregir confirmación para que coincida
    await user.clear(passConfirm);
    await user.type(passConfirm, 'ClaveNueva123*');

    expect(screen.getByText(/las contraseñas coinciden correctamente/i)).toBeInTheDocument();
    expect(updatePassBtn).not.toBeDisabled();
  });

  it('llama a changePassword y limpia los campos al actualizar la contraseña exitosamente', async () => {
    const user = userEvent.setup();
    vi.mocked(usersService.getMe).mockResolvedValue(mockUser);
    vi.mocked(usersService.changePassword).mockResolvedValue({ success: true } as any);

    render(<PerfilPage />);

    await waitFor(() => {
      expect(screen.getByText('Seguridad y Contraseña')).toBeInTheDocument();
    });

    const passActual = screen.getByPlaceholderText('Ingresa tu clave actual');
    const passNueva = screen.getByPlaceholderText('Mínimo 6 caracteres');
    const passConfirm = screen.getByPlaceholderText('Repite la contraseña');
    const updatePassBtn = screen.getByRole('button', { name: /actualizar contraseña/i });

    await user.type(passActual, 'Actual123*');
    await user.type(passNueva, 'NuevaSuper123*');
    await user.type(passConfirm, 'NuevaSuper123*');

    await user.click(updatePassBtn);

    await waitFor(() => {
      expect(usersService.changePassword).toHaveBeenCalledWith('Actual123*', 'NuevaSuper123*');
      expect(toast.success).toHaveBeenCalledWith('Contraseña actualizada con éxito');
    });

    expect((passActual as HTMLInputElement).value).toBe('');
    expect((passNueva as HTMLInputElement).value).toBe('');
    expect((passConfirm as HTMLInputElement).value).toBe('');
  });

  it('muestra el avatar con fallback e iniciales cuando no hay foto guardada', async () => {
    const userSinFoto: UserProfile = {
      ...mockUser,
      fotoUrl: null,
    };
    vi.mocked(usersService.getMe).mockResolvedValue(userSinFoto);

    render(<PerfilPage />);

    await waitFor(() => {
      expect(screen.getByText('Mi Perfil Institucional')).toBeInTheDocument();
    });

    // Debe mostrar las iniciales "DJ"
    const initials = screen.getByText('DJ');
    expect(initials).toBeInTheDocument();
    expect(initials.className).toContain('text-white');
    expect(initials.className).toContain('font-bold');

    const avatarContainer = initials.closest('div');
    expect(avatarContainer?.className).toContain('w-16');
    expect(avatarContainer?.className).toContain('h-16');
    expect(avatarContainer?.className).toContain('rounded-full');
    expect(avatarContainer?.className).toContain('bg-slate-800');
    expect(avatarContainer?.className).toContain('border-slate-700');

    // Debe contener el botón flotante para cambiar foto
    const changeBtn = screen.getByRole('button', { name: 'Cambiar foto de perfil' });
    expect(changeBtn).toBeInTheDocument();
  });

  it('abre el selector de archivos al interactuar con el avatar o botón de cambiar foto', async () => {
    vi.mocked(usersService.getMe).mockResolvedValue(mockUser);

    render(<PerfilPage />);

    await waitFor(() => {
      expect(screen.getByText('Mi Perfil Institucional')).toBeInTheDocument();
    });

    const fileInput = screen.getByTestId('avatar-file-input') as HTMLInputElement;
    expect(fileInput).toBeInTheDocument();
    expect(fileInput.type).toBe('file');

    const clickSpy = vi.spyOn(fileInput, 'click');
    const changeBtn = screen.getByRole('button', { name: 'Cambiar foto de perfil' });
    changeBtn.click();

    expect(clickSpy).toHaveBeenCalled();
  });

  it('permite seleccionar un archivo de imagen y actualiza la foto en el avatar dinámicamente', async () => {
    const userSinFoto: UserProfile = {
      ...mockUser,
      fotoUrl: null,
    };
    vi.mocked(usersService.getMe).mockResolvedValue(userSinFoto);

    render(<PerfilPage />);

    await waitFor(() => {
      expect(screen.getByText('Mi Perfil Institucional')).toBeInTheDocument();
    });

    const fileInput = screen.getByTestId('avatar-file-input') as HTMLInputElement;
    const file = new File(['test-image'], 'avatar.png', { type: 'image/png' });

    const mockDataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA';
    vi.spyOn(FileReader.prototype, 'readAsDataURL').mockImplementation(function (this: FileReader) {
      setTimeout(() => {
        Object.defineProperty(this, 'result', { value: mockDataUrl, writable: false });
        this.onload?.({ target: { result: mockDataUrl } } as any);
      }, 10);
    });

    await userEvent.upload(fileInput, file);

    await waitFor(() => {
      const img = screen.getByAltText(userSinFoto.name) as HTMLImageElement;
      expect(img).toBeInTheDocument();
      expect(img.className).toContain('rounded-full');
      expect(img.className).toContain('object-cover');
    });
  });
});

