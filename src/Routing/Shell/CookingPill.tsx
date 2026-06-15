import { FireOutlined } from "@ant-design/icons";
import { Space } from "@components/Layout/Space";
import { DeferredModalContent, Modal } from "@components/Modal";
import { Typography } from "@components/Typography";
import { CookingSessionWidget } from "@modules/Dishes/Screens/CookingSession.widget";
import { selectCookingSessions, selectDishesById } from "@store/Selectors";
import { Flex } from "antd";
import React from "react";
import { useSelector } from "react-redux";

export const CookingPill = () => {
    const sessions = useSelector(selectCookingSessions);
    const dishesById = useSelector(selectDishesById);
    const activeSessions = React.useMemo(() => sessions.filter(s => s.status === "cooking"), [sessions]);

    const [sessionListOpen, setSessionListOpen] = React.useState(false);
    const [focusedSessionId, setFocusedSessionId] = React.useState<string | null>(null);
    const [cookingModalOpen, setCookingModalOpen] = React.useState(false);

    if (activeSessions.length === 0) return null;

    const focusedSession = activeSessions.find(s => s.id === focusedSessionId) ?? activeSessions[0];
    const focusedDish = dishesById.get(focusedSession?.dishId);

    const _onPillClick = () => {
        if (activeSessions.length === 1) {
            setFocusedSessionId(activeSessions[0].id);
            setCookingModalOpen(true);
        } else {
            setSessionListOpen(true);
        }
    };

    const _onSelectSession = (sessionId: string) => {
        setFocusedSessionId(sessionId);
        setSessionListOpen(false);
        setCookingModalOpen(true);
    };

    const displaySession = activeSessions[0];

    return <React.Fragment>
        {/* ── Floating pill ── */}
        <div
            onClick={_onPillClick}
            onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    _onPillClick();
                }
            }}
            role="button"
            tabIndex={0}
            data-testid="active-cooking-floating-button"
            style={{
                position: 'fixed',
                bottom: 76,
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'linear-gradient(135deg, #1f1f1f 0%, #3b2a1d 48%, #d46b08 100%)',
                color: '#fff',
                borderRadius: 999,
                padding: '9px 16px 9px 10px',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                minHeight: 52,
                border: '1px solid rgba(255,255,255,0.72)',
                boxShadow: '0 10px 28px rgba(31,31,31,0.26), 0 0 0 4px rgba(250,140,22,0.16)',
                cursor: 'pointer',
                zIndex: 1000,
                userSelect: 'none',
                whiteSpace: 'nowrap',
                maxWidth: 'calc(100vw - 32px)',
            }}
        >
            <span style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.18)",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.24)",
                flexShrink: 0,
            }}>
                <FireOutlined style={{ fontSize: 18 }} />
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                <span style={{ fontSize: 11, fontWeight: 750, letterSpacing: 0, opacity: 0.86, lineHeight: "14px" }}>
                    Đang nấu
                </span>
                <span style={{ fontSize: 14, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: "18px" }}>
                    {activeSessions.length > 1
                        ? `${activeSessions.length} món đang nấu`
                        : displaySession.dishName}
                </span>
                {activeSessions.length === 1 && displaySession.steps?.length > 0 && (
                    <span style={{ fontSize: 11, opacity: 0.88, lineHeight: "15px" }}>
                        Bước {(displaySession.currentStepIndex ?? 0) + 1}/{displaySession.steps.length}
                        {displaySession.steps[displaySession.currentStepIndex ?? 0]
                            ? ` - ${displaySession.steps[displaySession.currentStepIndex ?? 0].length > 30
                                ? displaySession.steps[displaySession.currentStepIndex ?? 0].slice(0, 30) + "…"
                                : displaySession.steps[displaySession.currentStepIndex ?? 0]}`
                            : ""}
                    </span>
                )}
                {activeSessions.length === 1 && !displaySession.steps?.length && (
                    <span style={{ fontSize: 11, opacity: 0.88, lineHeight: "15px" }}>Nhấn để hoàn thành</span>
                )}
                {activeSessions.length > 1 && (
                    <span style={{ fontSize: 11, opacity: 0.88, lineHeight: "15px" }}>Nhấn để chuyển món</span>
                )}
            </div>
        </div>

        {/* ── Session switcher sheet (multi-session) ── */}
        <Modal
            open={sessionListOpen}
            onCancel={() => setSessionListOpen(false)}
            footer={null}
            title={<Space><FireOutlined style={{ color: "#fa8c16" }} />{activeSessions.length} món đang nấu</Space>}
            style={{ top: 80 }}
            destroyOnClose={false}
        >
            <DeferredModalContent active={sessionListOpen} minHeight={120}>
                {sessionListOpen ? <Flex vertical gap={10}>
                {activeSessions.map(s => {
                    const progress = s.steps?.length > 0
                        ? Math.round(((s.currentStepIndex ?? 0) + 1) / s.steps.length * 100)
                        : null;
                    return (
                        <div
                            key={s.id}
                            onClick={() => _onSelectSession(s.id)}
                            style={{
                                padding: '12px 16px',
                                borderRadius: 12,
                                border: '1.5px solid #ffd591',
                                background: '#fffbe6',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: 12,
                            }}
                        >
                            <Flex vertical gap={4} style={{ minWidth: 0, flex: 1 }}>
                                <Typography.Text strong style={{ fontSize: 14 }}>{s.dishName}</Typography.Text>
                                {s.steps?.length > 0 ? (
                                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                                        Bước {(s.currentStepIndex ?? 0) + 1} / {s.steps.length}
                                        {s.steps[s.currentStepIndex ?? 0]
                                            ? ` — ${s.steps[s.currentStepIndex ?? 0].slice(0, 40)}${s.steps[s.currentStepIndex ?? 0].length > 40 ? '…' : ''}`
                                            : ''}
                                    </Typography.Text>
                                ) : (
                                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>Sẵn sàng hoàn thành</Typography.Text>
                                )}
                                {progress !== null && (
                                    <div style={{
                                        height: 4, borderRadius: 4, background: '#ffe7ba',
                                        marginTop: 4, overflow: 'hidden',
                                    }}>
                                        <div style={{
                                            height: '100%', borderRadius: 4,
                                            background: progress === 100 ? '#52c41a' : '#fa8c16',
                                            width: `${progress}%`,
                                            transition: 'width 0.3s',
                                        }} />
                                    </div>
                                )}
                            </Flex>
                            <FireOutlined style={{ color: '#fa8c16', fontSize: 18, flexShrink: 0 }} />
                        </div>
                    );
                })}
                </Flex> : null}
            </DeferredModalContent>
        </Modal>

        {/* ── Single session cooking modal ── */}
        <Modal
            open={cookingModalOpen}
            title={<Space><FireOutlined style={{ color: "#fa8c16" }} />Đang nấu — {focusedSession?.dishName}</Space>}
            destroyOnClose
            onCancel={() => setCookingModalOpen(false)}
            footer={null}
            width="min(760px, calc(100vw - 24px))"
        >
            <DeferredModalContent active={cookingModalOpen} minHeight={220}>
                {cookingModalOpen && focusedDish ? (
                    <CookingSessionWidget
                        dish={focusedDish}
                        onDone={() => setCookingModalOpen(false)}
                    />
                ) : null}
            </DeferredModalContent>
        </Modal>
    </React.Fragment>;
};
