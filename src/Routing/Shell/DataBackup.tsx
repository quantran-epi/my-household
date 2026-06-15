import { CloudDownloadOutlined, ExportOutlined, ImportOutlined } from "@ant-design/icons";
import { ObjectPropertyHelper } from "@common/Helpers/ObjectProperty";
import { getStorageString, setStorageString } from "@common/Storage/AppStorage";
import { ActionButton, Button } from "@components/Button";
import { TextArea } from "@components/Form/Input";
import { Box } from "@components/Layout/Box";
import { Space } from "@components/Layout/Space";
import { Stack } from "@components/Layout/Stack";
import { useMessage } from "@components/Message";
import { DeferredModalContent, Modal } from "@components/Modal";
import { SmartForm, useSmartForm } from "@components/SmartForm";
import { useToggle } from "@hooks";
import React, { useState } from "react";
import { CopyToClipboard } from 'react-copy-to-clipboard';

// CURRENTLY UNUSED (D-06): this export has no in-app caller. It is preserved
// verbatim from MasterPage.tsx (not deleted) during the Phase 2 shell extraction
// so the personal export/import/cloud-restore surface stays available for a future
// re-wiring. Two pre-existing concerns are flagged here for a separate follow-up
// (Deferred Ideas) and intentionally NOT changed this phase:
//   1. `_onImportCloud` fetches a HARDCODED GitHub raw URL
//      (raw.githubusercontent.com/quantran-epi/my-recipes/.../docs/data.txt) and
//      overwrites the `persist:personal` storage root with the response — a
//      tampering / supply-chain surface (threat T-02-DB).
//   2. Restore uses reload-as-recovery (`window.location.reload()`), kept as-is.
export const DataBackup = ({ onImportCloud }: { onImportCloud?: () => Promise<void> }) => {
    const toggleShowData = useToggle();
    const toggleImportData = useToggle();
    const [exportedData, setExportedData] = useState<string>("");
    const message = useMessage();
    const toggleImportingCloud = useToggle();

    // Restore personal data from a raw or base64-encoded persisted personal root.
    const _restorePersonalFromText = async (text: string) => {
        try {
            const trimmed = text.trim();
            let decoded = trimmed;
            try {
                decoded = decodeURIComponent(escape(atob(trimmed)));
            } catch { }
            JSON.parse(decoded);
            await setStorageString("persist:personal", decoded);
            message.success("Khôi phục thành công! Đang tải lại...");
            setTimeout(() => window.location.reload(), 1200);
        } catch (ex) {
            message.error("Khôi phục thất bại: dữ liệu không hợp lệ");
        }
    };

    const _onImportCloud = async () => {
        if (onImportCloud) return onImportCloud();
        toggleImportingCloud.show();
        try {
            // FLAG (D-06 / threat T-02-DB): hardcoded GitHub raw URL — do NOT change this phase.
            const res = await fetch(
                "https://raw.githubusercontent.com/quantran-epi/my-recipes/refs/heads/main/docs/data.txt?t=" + Date.now()
            );
            const text = await res.text();
            await _restorePersonalFromText(text);
        } catch (ex: any) {
            message.error("Import thất bại: " + ex?.message);
        } finally {
            toggleImportingCloud.hide();
        }
    };

    const importDataForm = useSmartForm({
        defaultValues: { data: "" },
        onSubmit: (values) => {
            _restorePersonalFromText(values.transformValues.data);
        },
        itemDefinitions: defaultValues => ({
            data: { name: ObjectPropertyHelper.nameof(defaultValues, e => e.data), label: "Data (base64)" }
        })
    });

    return <React.Fragment>
        <Space>
            <Button icon={<ExportOutlined />} onClick={async () => {
                setExportedData(await getStorageString("persist:personal") ?? "");
                toggleShowData.show();
            }}>Export</Button>

            <Button icon={<ImportOutlined />} onClick={toggleImportData.show}>Import</Button>

            <Button loading={toggleImportingCloud.value} icon={<CloudDownloadOutlined />} onClick={_onImportCloud}>Import cloud</Button>
        </Space>

        <Modal title="Export — dữ liệu cá nhân" open={toggleShowData.value} onCancel={toggleShowData.hide} footer={null}>
            <DeferredModalContent active={toggleShowData.value} minHeight={320}>
                {toggleShowData.value ? <React.Fragment>
                    <Box style={{ height: 300, overflowY: "auto", wordBreak: "break-all", fontSize: 12 }}>
                        {exportedData}
                    </Box>
                    <br />
                    <CopyToClipboard text={exportedData} onCopy={() => message.success("Copied")}>
                        <Stack justify="flex-end"><ActionButton>Copy</ActionButton></Stack>
                    </CopyToClipboard>
                </React.Fragment> : null}
            </DeferredModalContent>
        </Modal>

        <Modal title="Import — dữ liệu cá nhân" open={toggleImportData.value} onCancel={toggleImportData.hide} footer={null}>
            <DeferredModalContent active={toggleImportData.value} minHeight={240}>
                {toggleImportData.value ? <React.Fragment>
                    <SmartForm {...importDataForm.defaultProps}>
                        <SmartForm.Item {...importDataForm.itemDefinitions.data}>
                            <TextArea rows={10} />
                        </SmartForm.Item>
                    </SmartForm>
                </React.Fragment> : null}
            </DeferredModalContent>
            <ActionButton onClick={importDataForm.submit}>Khôi phục</ActionButton>
        </Modal>
    </React.Fragment>
}
