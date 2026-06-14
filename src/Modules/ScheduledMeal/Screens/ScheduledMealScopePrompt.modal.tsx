import { Box } from '@components/Layout/Box';
import { Stack } from '@components/Layout/Stack';
import { Button } from '@components/Button';
import { DeferredModalContent, Modal } from '@components/Modal';
import { Typography } from '@components/Typography';
import { Checkbox } from '@components/Form/Checkbox';
import { Radio } from '@components/Form/Radio';
import { ArrowRightOutlined, FireOutlined, RestOutlined } from '@ant-design/icons';
import React, { useEffect, useMemo, useState } from 'react';

export type ScopeOption = { value: string; label: string; description?: string };

type ScheduledMealScopePromptProps = {
    open: boolean;
    mode: 'cook' | 'finish';
    slotLabel: string;
    options: ScopeOption[];
    onConfirm: (selectedValues: string[]) => void;
    onClose: () => void;
};

export const ScheduledMealScopePrompt: React.FC<ScheduledMealScopePromptProps> = ({ open, mode, slotLabel, options, onConfirm, onClose }) => {
    const [scope, setScope] = useState<'all' | 'specific'>('all');
    const [selected, setSelected] = useState<string[]>([]);

    const allValues = useMemo(() => options.map(option => option.value), [options]);

    useEffect(() => {
        if (!open) return;
        setScope('all');
        setSelected(allValues);
    }, [open, allValues]);

    const isCook = mode === 'cook';
    const tone = isCook ? '#fa8c16' : '#389e0d';
    const toneSoft = isCook ? '#fff7e6' : '#f6ffed';
    const toneBorder = isCook ? 'rgba(250,140,22,0.18)' : 'rgba(56,158,13,0.18)';
    const title = isCook ? `Bắt đầu nấu · ${slotLabel}` : `Hoàn tất · ${slotLabel}`;
    const allLabel = isCook ? 'Nấu tất cả món' : 'Hoàn tất cả bữa';
    const allHint = isCook ? `Bắt đầu nấu mọi món trong ${slotLabel}` : `Đánh dấu mọi kế hoạch trong ${slotLabel} đã xong`;
    const specificLabel = isCook ? 'Chọn món cụ thể' : 'Chọn kế hoạch cụ thể';
    const specificHint = isCook ? 'Chỉ nấu một vài món bạn chọn' : 'Chỉ hoàn tất một vài kế hoạch bạn chọn';
    const intro = isCook
        ? `Trước khi nấu, cho mình biết bạn muốn nấu phạm vi nào trong ${slotLabel} nhé.`
        : `Trước khi ghi nhận, cho mình biết bạn muốn hoàn tất phạm vi nào trong ${slotLabel} nhé.`;
    const specificEmpty = isCook ? 'Bữa này chưa có món nào để chọn.' : 'Bữa này chưa có kế hoạch nào để chọn.';

    const scopeOptions: Array<{ value: 'all' | 'specific'; label: string; hint: string }> = [
        { value: 'all', label: allLabel, hint: allHint },
        { value: 'specific', label: specificLabel, hint: specificHint },
    ];

    const _toggle = (value: string, checked: boolean) => {
        setSelected(current => checked ? [...current, value] : current.filter(item => item !== value));
    };

    const _confirm = () => {
        const result = scope === 'all' ? allValues : selected;
        if (result.length === 0) return;
        onConfirm(result);
    };

    const confirmDisabled = options.length === 0 || (scope === 'specific' && selected.length === 0);
    const selectedCount = scope === 'all' ? allValues.length : selected.length;

    return <Modal
        open={open}
        title={<Stack align="center" gap={8}>{isCook ? <FireOutlined style={{ color: tone }} /> : <RestOutlined style={{ color: tone }} />}<span>{title}</span></Stack>}
        onCancel={onClose}
        footer={<Stack justify="space-between" align="center" gap={8} style={{ width: '100%' }}>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                {selectedCount > 0 ? `Đã chọn ${selectedCount}` : 'Chưa chọn gì'}
            </Typography.Text>
            <Button type="primary" icon={<ArrowRightOutlined />} disabled={confirmDisabled} onClick={_confirm}>Tiếp tục</Button>
        </Stack>}
        destroyOnClose
    >
        <DeferredModalContent active={open} minHeight={200}>
            <Stack direction="column" align="stretch" gap={14}>
                <Box style={{ borderRadius: 12, border: `1px solid ${toneBorder}`, background: `linear-gradient(135deg, ${toneSoft} 0%, #ffffff 70%)`, padding: '14px 16px' }}>
                    <Stack align="center" gap={10}>
                        <span style={{ width: 38, height: 38, borderRadius: 12, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: '#fff', boxShadow: `0 8px 18px ${toneBorder}`, color: tone, fontSize: 19, flexShrink: 0 }}>{isCook ? <FireOutlined /> : <RestOutlined />}</span>
                        <Typography.Text style={{ minWidth: 0, color: '#3f3658', fontSize: 13, lineHeight: '19px' }}>{intro}</Typography.Text>
                    </Stack>
                </Box>

                <div>
                    <Typography.Text strong style={{ display: 'block', fontSize: 13, color: '#111827', marginBottom: 8 }}>1. Bạn muốn làm với phạm vi nào?</Typography.Text>
                    <Radio.Group value={scope} onChange={event => setScope(event.target.value as 'all' | 'specific')} style={{ width: '100%' }}>
                        <Stack direction="column" align="stretch" gap={8} style={{ width: '100%' }}>
                            {scopeOptions.map(option => {
                                const checked = scope === option.value;
                                return <Radio
                                    key={option.value}
                                    value={option.value}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'flex-start',
                                        width: '100%',
                                        margin: 0,
                                        padding: '10px 12px',
                                        borderRadius: 8,
                                        border: `1px solid ${checked ? tone : 'rgba(15,23,42,0.12)'}`,
                                        background: checked ? toneSoft : '#fff',
                                    }}
                                >
                                    <Typography.Text strong style={{ display: 'block', lineHeight: '18px' }}>{option.label}</Typography.Text>
                                    <Typography.Text type="secondary" style={{ display: 'block', fontSize: 12, lineHeight: '16px' }}>{option.hint}</Typography.Text>
                                </Radio>;
                            })}
                        </Stack>
                    </Radio.Group>
                </div>

                {scope === 'specific' && <div>
                    <Typography.Text strong style={{ display: 'block', fontSize: 13, color: '#111827', marginBottom: 4 }}>
                        2. {isCook ? 'Chọn món muốn nấu' : 'Chọn kế hoạch muốn hoàn tất'}
                    </Typography.Text>
                    <Typography.Text type="secondary" style={{ display: 'block', fontSize: 12, lineHeight: '17px', marginBottom: 8 }}>
                        Tích vào những mục bạn muốn xử lý lần này.
                    </Typography.Text>
                    <Stack direction="column" align="stretch" gap={8}>
                        {options.length === 0
                            ? <Typography.Text type="secondary" style={{ fontSize: 12 }}>{specificEmpty}</Typography.Text>
                            : options.map(option => {
                                const checked = selected.includes(option.value);
                                return <Box
                                    key={option.value}
                                    onClick={() => _toggle(option.value, !checked)}
                                    style={{ border: `1px solid ${checked ? tone : 'rgba(15,23,42,0.12)'}`, background: checked ? toneSoft : '#fff', borderRadius: 8, padding: '9px 11px', cursor: 'pointer' }}
                                >
                                    <Stack align="center" gap={9} style={{ minWidth: 0 }}>
                                        <Checkbox checked={checked} onChange={event => _toggle(option.value, event.target.checked)} onClick={event => event.stopPropagation()} />
                                        <div style={{ minWidth: 0 }}>
                                            <Typography.Text strong style={{ display: 'block', color: '#111827', lineHeight: '18px', overflowWrap: 'anywhere' }}>{option.label}</Typography.Text>
                                            {option.description && <Typography.Text type="secondary" style={{ display: 'block', fontSize: 12, lineHeight: '16px' }}>{option.description}</Typography.Text>}
                                        </div>
                                    </Stack>
                                </Box>;
                            })}
                    </Stack>
                </div>}
            </Stack>
        </DeferredModalContent>
    </Modal>;
};
