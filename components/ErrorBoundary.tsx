
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Logger } from '../services/LoggerService';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = { hasError: false };

  constructor(props: Props) {
    super(props);
  }

  public static getDerivedStateFromError(_: Error): State {
    // 更新状态，以便下一次渲染将显示回退UI。
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error in component:", error, errorInfo);
    // Log to internal telemetry system
    Logger.error('UI:UncaughtError', error, { componentStack: errorInfo.componentStack });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-center m-4">
          <div className="flex items-center justify-center">
             <AlertTriangle className="mr-2" />
             <h3 className="font-bold">组件加载失败</h3>
          </div>
          <p className="text-sm mt-1">系统已记录此错误。请尝试刷新页面。</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-3 px-4 py-1.5 bg-red-100 hover:bg-red-200 rounded text-xs font-bold transition-colors"
          >
            刷新页面
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
