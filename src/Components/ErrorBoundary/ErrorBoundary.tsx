import React from "react";
import { ReloadOutlined } from "@ant-design/icons";
import { Result } from "@components/Result";
import { Button } from "@components/Button";

type ErrorBoundaryProps = React.PropsWithChildren<{ fallback?: React.ReactNode }>;
type ErrorBoundaryState = { hasError: boolean };

// Friendly Vietnamese recovery copy (UI-SPEC Copywriting Contract). Inline this
// phase; AppCopy migration is Phase 5 (COPY-03). Generic by design — never surface
// error.message/stack to users (V7 / threat T-02-IF).
const CRASH_TITLE = "Ứng dụng gặp chút trục trặc rồi";
const CRASH_BODY = "Nhà mình thử tải lại trang nhé, dữ liệu vẫn được giữ an toàn.";
const RELOAD_LABEL = "Tải lại trang";

const DefaultFallback: React.FunctionComponent = () => {
    return (
        <div
            style={{
                minHeight: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 24,
                background: "linear-gradient(180deg, #f5f0ff 0%, #ffffff 42%)",
            }}
        >
            <div style={{ width: "100%", maxWidth: 480 }}>
                <Result
                    status="warning"
                    title={CRASH_TITLE}
                    subTitle={CRASH_BODY}
                    extra={
                        <Button
                            type="primary"
                            icon={<ReloadOutlined />}
                            onClick={() => window.location.reload()}
                        >
                            {RELOAD_LABEL}
                        </Button>
                    }
                />
            </div>
        </div>
    );
};

// D-03: a class component is the only mechanism for getDerivedStateFromError /
// componentDidCatch. This is the documented one-class exception per CONVENTIONS.md.
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    state: ErrorBoundaryState = { hasError: false };

    static getDerivedStateFromError(): ErrorBoundaryState {
        return { hasError: true };
    }

    componentDidCatch(error: Error, info: React.ErrorInfo) {
        // App has no logger (CONVENTIONS.md). Side-effects only — never surface
        // error.message/stack to the UI and never log tokens/PII (V7 / T-02-IF).
        if (process.env.NODE_ENV !== "production") {
            console.error("ErrorBoundary caught a render error", error, info.componentStack);
        }
    }

    render() {
        if (this.state.hasError) {
            return this.props.fallback ?? <DefaultFallback />;
        }
        return this.props.children;
    }
}
