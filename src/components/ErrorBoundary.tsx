import React, { ReactNode, ErrorInfo, Component } from 'react';
import { AlertCircle, RotateCcw, Home } from 'lucide-react';
import { Button } from './ui/button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleGoHome = () => {
    this.handleReset();
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
            {/* Error Icon */}
            <div className="flex justify-center mb-6">
              <div className="bg-red-100 p-4 rounded-full">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
            </div>

            {/* Error Message */}
            <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">
              Oops, algo salió mal
            </h1>
            <p className="text-gray-600 text-center mb-6">
              La aplicación encontró un error inesperado. Intenta recargar o vuelve al inicio.
            </p>

            {/* Error Details (Development) */}
            {import.meta.env.VITE_ENABLE_DEV_TOOLS === 'true' && this.state.error && (
              <details className="mb-6 p-4 bg-gray-50 rounded border border-gray-200 text-sm">
                <summary className="cursor-pointer font-semibold text-gray-700 mb-2">
                  Detalles técnicos
                </summary>
                <pre className="overflow-auto text-xs text-gray-600 whitespace-pre-wrap break-words">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col gap-3">
              <Button
                onClick={this.handleReset}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700"
              >
                <RotateCcw className="w-4 h-4" />
                Reintentar
              </Button>
              <Button
                onClick={this.handleGoHome}
                variant="outline"
                className="w-full flex items-center justify-center gap-2"
              >
                <Home className="w-4 h-4" />
                Ir al Inicio
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
