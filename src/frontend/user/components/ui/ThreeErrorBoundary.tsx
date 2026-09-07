import { Component, ReactNode } from 'react'

interface Props {
  /** Rendered when WebGL / Three.js throws. Defaults to null (invisible fallback). */
  fallback?: ReactNode
  children: ReactNode
}

interface State {
  hasError: boolean
}

/**
 * ErrorBoundary specifically designed for Three.js / WebGL components.
 *
 * When the browser can't create a WebGL context (headless env, GPU disabled,
 * hardware limits reached) Three.js throws during render / useEffect.
 * Without this boundary that exception propagates up and kills the entire
 * React tree, leaving div#root blank.
 *
 * Wrap any Three.js component with <ThreeErrorBoundary> so failures are
 * contained and the rest of the page still renders.
 */
export class ThreeErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Surface the error in dev; silent in production
    if (import.meta.env.DEV) {
      console.warn('[ThreeErrorBoundary] 3D component failed — rendering without WebGL.', error, info)
    }
  }

  render() {
    if (this.state.hasError) {
      // Default: transparent no-op so the layout is unaffected
      return this.props.fallback ?? null
    }
    return this.props.children
  }
}
