import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React, { createRef } from 'react';
import { PasswordInput } from './PasswordInput';

describe('PasswordInput Component', () => {
  it('renderiza como input de contraseña por defecto', () => {
    render(<PasswordInput placeholder="Ingresa tu clave" />);
    const input = screen.getByPlaceholderText('Ingresa tu clave') as HTMLInputElement;

    expect(input).toBeInTheDocument();
    expect(input.type).toBe('password');
    expect(screen.getByRole('button', { name: /mostrar contraseña/i })).toBeInTheDocument();
  });

  it('alterna la visibilidad de la contraseña al hacer clic en el botón', async () => {
    const user = userEvent.setup();
    render(<PasswordInput placeholder="Contraseña de prueba" defaultValue="Sena2026!" />);

    const input = screen.getByPlaceholderText('Contraseña de prueba') as HTMLInputElement;
    const toggleButton = screen.getByRole('button', { name: /mostrar contraseña/i });

    expect(input.type).toBe('password');

    // Clic para mostrar
    await user.click(toggleButton);
    expect(input.type).toBe('text');
    expect(screen.getByRole('button', { name: /ocultar contraseña/i })).toBeInTheDocument();

    // Clic para volver a ocultar
    await user.click(screen.getByRole('button', { name: /ocultar contraseña/i }));
    expect(input.type).toBe('password');
    expect(screen.getByRole('button', { name: /mostrar contraseña/i })).toBeInTheDocument();
  });

  it('permite escribir texto correctamente', async () => {
    const user = userEvent.setup();
    render(<PasswordInput placeholder="Escribe aquí" />);
    const input = screen.getByPlaceholderText('Escribe aquí') as HTMLInputElement;

    await user.type(input, 'MiPasswordSeguro123*');
    expect(input.value).toBe('MiPasswordSeguro123*');
  });

  it('reenvía la referencia ref al elemento input subyacente', () => {
    const ref = createRef<HTMLInputElement>();
    render(<PasswordInput ref={ref} placeholder="Con ref" />);

    expect(ref.current).not.toBeNull();
    expect(ref.current?.tagName).toBe('INPUT');
    expect(ref.current?.placeholder).toBe('Con ref');
  });

  it('aplica clases CSS personalizadas preservando el padding derecho para el icono', () => {
    render(<PasswordInput className="custom-input-class" placeholder="Custom" />);
    const input = screen.getByPlaceholderText('Custom');

    expect(input.className).toContain('pr-10');
    expect(input.className).toContain('custom-input-class');
  });
});
