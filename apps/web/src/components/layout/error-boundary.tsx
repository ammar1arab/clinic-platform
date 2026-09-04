'use client';

import { Component, ReactNode } from 'react';
import { useLanguage } from '@/providers';

import { ErrorState } from '@/components/primitives/states/error';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

function ErrorFallback({ message }: { message: string }) {
  const { t } = useLanguage();
  return (
    <div className="grid h-dvh place-items-center bg-background">
      <ErrorState 
        title={t.common.somethingWentWrong}
        description={message}
        onRetry={() => location.reload()}
      />
    </div>
  );
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback message={this.state.message} />;
    }
    return this.props.children;
  }
}
