import React, { useState } from 'react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Eye, EyeOff } from 'lucide-react';

interface PasswordInputProps extends React.ComponentProps<'input'> {
  id?: string;
}

export const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, ...props }, ref) => {
    const [visible, setVisible] = useState(false);

    return (
      <div className="relative">
        <Input
          {...props}
          ref={ref}
          type={visible ? 'text' : 'password'}
          className={`pr-10 ${className ?? ''}`}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-0 top-0 h-full px-3 text-gray-400 hover:text-gray-600"
          onClick={() => setVisible(v => !v)}
          tabIndex={-1}
          aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        >
          {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </Button>
      </div>
    );
  }
);

PasswordInput.displayName = 'PasswordInput';
