import React from 'react';

type ErrorBoundaryProps = { children: React.ReactNode };
type ErrorBoundaryState = { hasError: boolean; error?: any };

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, info: any) {
    console.error('❌ ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', color: '#c33', background: '#fee', border: '1px solid #f88', borderRadius: 8 }}>
          <strong>❌ Une erreur est survenue dans l’onglet.</strong>
          <div style={{ marginTop: 8, color: '#555' }}>Vérifie la console pour les détails. Tu peux réessayer la synchronisation.</div>
        </div>
      );
    }
    return this.props.children as any;
  }
}

export default ErrorBoundary;


