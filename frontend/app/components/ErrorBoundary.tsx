"use client";

import React, { Component, ReactNode } from 'react';

/**
 * ErrorBoundary component catches JavaScript errors anywhere in its child component tree,
 * logs those errors, and displays a fallback UI instead of the crashed component tree.
 *
 * Why: Prevent the entire dashboard from unmounting due to a single component error.
 * This improves user experience by showing a graceful error message and allowing
 * the rest of the UI to remain functional.
 */
export default class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; errorInfo: string | null }> {
    constructor(props: any) {
        super(props);
        this.state = { hasError: false, errorInfo: null };
    }

    static getDerivedStateFromError(_: Error) {
        // Update state so the next render shows the fallback UI.
        return { hasError: true, errorInfo: null };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        // Log error details for debugging.
        console.error('ErrorBoundary caught an error', error, errorInfo);
        // componentStack may be null/undefined — store as string or null to satisfy strict types
        this.setState({ errorInfo: errorInfo.componentStack ?? null });
    }

    render() {
        if (this.state.hasError) {
            // Fallback UI – can be styled to match the app's premium look.
            return (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#ef4444' }}>
                    <h2>Something went wrong.</h2>
                    <p>Please try refreshing the page. If the problem persists, contact support.</p>
                </div>
            );
        }
        return this.props.children;
    }
}
