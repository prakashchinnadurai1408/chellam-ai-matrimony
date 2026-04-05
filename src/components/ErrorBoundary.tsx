import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, RotateCcw, Home } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = "/";
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
          <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mb-6">
            <AlertCircle className="w-10 h-10 text-destructive" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Oops! Something went wrong</h1>
          <p className="text-muted-foreground max-w-md mb-8">
            The application encountered an unexpected error. Don't worry, your data is safe.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 w-full max-w-xs">
            <Button variant="default" className="gap-2" onClick={() => window.location.reload()}>
              <RotateCcw className="w-4 h-4" /> Try Again
            </Button>
            <Button variant="outline" className="gap-2" onClick={this.handleReset}>
              <Home className="w-4 h-4" /> Go to Home
            </Button>
          </div>
          
          {import.meta.env.MODE === 'development' && (
            <div className="mt-12 p-4 bg-muted rounded-lg text-left max-w-2xl overflow-auto border border-border">
              <p className="text-xs font-mono text-destructive font-bold mb-2">DEBUG INFO:</p>
              <pre className="text-xs font-mono text-muted-foreground whitespace-pre-wrap">
                {this.state.error?.stack}
              </pre>
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
