// AppCopy — the single source of truth for user-facing Vietnamese strings.
//
// Structure (locked this phase; phrasing is [ASSUMED] placeholder content
// pending Phase 5 household-user validation):
//   - common:      shared actions/messages reused across screens
//   - wizard:      seeds for the Phase 4 "what to cook" guided flow
//   - emptyStates: friendly empty-state scaffold for Phase 5
//
// Conventions (D-01..D-09):
//   - One PascalCase const object, declared `as const`, so every leaf is a
//     literal type and a typo'd key is a compile error (D-01, D-02).
//   - Interpolated strings are arrow functions taking a single required
//     named-arg object, so a dropped dynamic value is a TS2345 error (D-03, D-09).
//   - Screens read copy via direct object access (e.g. `AppCopy.wizard.heroPrompt`)
//     — no hook, no provider, no runtime lookup helper (D-07).
//   - Zero dependencies: no imports, no default export.
//
// `CopyKey` (below) is a build-time-safety proof and a type for any future
// helper — it is NOT used at screen call sites (D-02, D-07).

export const AppCopy = {
    common: {
        save: "Lưu",
        cancel: "Hủy",
        add: "Thêm",
        back: "Quay lại",
        skip: "Tùy bạn",
        error: "Lỗi hệ thống, vui lòng thử lại sau",
        success: "Xử lý thành công",
    },
    wizard: {
        heroPrompt: "Hôm nay ăn gì?",
        greeting: (args: { name: string }) => `Chào ${args.name}, nhà mình ăn gì nhỉ?`,
        stepIntro: "Cùng chọn món cho hôm nay nhé",
        skipLabel: "Tùy bạn",
        resultTitle: "Gợi ý cho nhà mình",
        addToToday: "Thêm vào hôm nay",
        addedToToday: (args: { dishName: string }) => `Đã thêm ${args.dishName} vào hôm nay`,
        // Ingredient step
        ingredientStepTitle: "Bạn có sẵn nguyên liệu gì?",
        ingredientPickerTrigger: "Chọn nguyên liệu",
        ingredientSheetTitle: "Chọn nguyên liệu",
        selectedIngredients: (args: { count: number }) => `Đã chọn ${args.count} nguyên liệu`,
        // Preference step
        preferenceStepTitle: "Bạn thích món kiểu nào?",
        preferencePickerTrigger: "Chọn sở thích",
        preferenceSheetTitle: "Sở thích",
        selectedPreferences: (args: { count: number }) => `Đã chọn ${args.count} sở thích`,
        // Shared step actions
        editAction: "Sửa",
        chooseAction: "Chọn",
        continueAction: "Tiếp tục",
        // Result step
        pickOtherDay: "Chọn ngày khác",
        daySheetTitle: "Chọn ngày khác",
        addToDay: "Thêm vào ngày này",
        finishAction: "Xong",
        matchFull: "Đủ đồ",
        matchPartial: "Gần đủ",
        matchLow: "Cần mua",
        ingredientMatchSummary: (args: { matched: number; missing: number }) => `${args.matched} đủ · ${args.missing} thiếu`,
        fullCatalogFallback: "Chưa có món khớp — đây là vài gợi ý từ toàn bộ món của bạn",
        addedToTodayToast: "Đã thêm vào thực đơn",
        progressStep: (args: { current: number; total: number }) => `Bước ${args.current}/${args.total}`,
    },
    shell: {
        // MasterPage chrome
        searchAriaLabel: "Tìm kiếm toàn cục",
        offlineBanner: "Không có mạng — Dữ liệu vẫn được lưu cục bộ",
        // SidebarDrawer — brand
        drawerTagline: "Bếp nhà hôm nay",
        // SidebarDrawer — nav group labels
        navGroupOverview: "Tổng quan",
        navGroupPlanning: "Lên thực đơn",
        navGroupLibrary: "Thư viện",
        navGroupHousehold: "Gia đình",
        // SidebarDrawer — nav item labels
        navDashboard: "Tổng quan",
        navAnalytics: "Phân tích",
        navDishSuggester: "Nấu gì?",
        navMeals: "Thực đơn",
        navDishFeedback: "Phản hồi món",
        navCookingHistory: "Lịch sử nấu ăn",
        navLeftovers: "Phần còn lại",
        navPrepTasks: "Việc chuẩn bị",
        navShoppingList: "Lịch mua sắm",
        navExpensePlanner: "Tính chi phí",
        navDishes: "Món ăn",
        navIngredients: "Nguyên liệu",
        navTemplates: "Mẫu dùng lại",
        navHousehold: "Nhà mình",
        navNutritionGoals: "Dinh dưỡng",
        // SidebarDrawer — data section
        dataSectionTitle: "Dữ liệu",
        dataBackupButton: "Dữ liệu & sao lưu",
        dataHealthButton: "Sức khỏe dữ liệu",
        dataSectionHint: "Đồng bộ dùng chung, sao lưu cá nhân và trạng thái backup được gom vào một nơi.",
        // SidebarDrawer — help section
        helpSectionTitle: "Trợ giúp",
        helpGuideButton: "Hướng dẫn sử dụng",
        // SidebarDrawer — account section
        accountSectionTitle: "Tài khoản",
        adminModeActive: "Đang ở chế độ Admin",
        lockButton: "Khoá",
        adminModeHint: 'Nhấn "Khoá" để thoát chế độ admin và ẩn các công cụ quản trị.',
        adminLoginButton: "Đăng nhập Admin",
        adminLoginHint: "Nhập mã PIN để mở quyền thêm / sửa / xoá nguyên liệu và món ăn.",
        // SidebarDrawer — PIN sheet
        pinTitle: "Nhập mã PIN",
        pinConfirm: "Xác nhận",
        pinPlaceholder: "Nhập PIN",
        pinWrong: "Sai mã PIN",
        // SidebarDrawer — backup sheet
        backupTitle: "Dữ liệu & sao lưu",
        backupSharedTitle: "Dữ liệu dùng chung",
        backupSharedDesc: "Cập nhật nguyên liệu, món ăn, mục tiêu dinh dưỡng và cấu hình tồn kho mới nhất được admin xuất bản.",
        backupSyncNow: "Đồng bộ mới",
        backupSharedUpToDate: "Dữ liệu dùng chung đã mới nhất",
        backupSyncFailed: (args: { reason: string }) => `Đồng bộ thất bại: ${args.reason}`,
        backupSyncSuccess: "Đồng bộ dữ liệu dùng chung thành công",
        // SidebarDrawer — inventory config
        inventoryConfigTitle: "Cấu hình tồn kho dùng chung",
        inventoryConfigDesc: "Thiết lập ngưỡng cảnh báo tồn kho và hạn dùng mặc định cho lô hàng chưa nhập ngày hết hạn riêng.",
        inventoryLowThreshold: "Ngưỡng thiếu hàng",
        inventoryLowThresholdHint: "Tồn kho lớn hơn 0 và nhỏ hơn hoặc bằng số này sẽ được xem là thấp.",
        inventoryExpirySoon: "Sắp hết hạn trong",
        inventoryExpirySoonHint: "Lô hàng còn trong khoảng ngày này sẽ được ưu tiên cảnh báo và gợi ý nấu trước.",
        inventoryExpiryDefaults: "Hạn dùng mặc định theo bảo quản",
        inventoryUseDefaults: "Dùng mặc định",
        inventorySaveConfig: "Lưu cấu hình",
        inventorySaved: "Đã lưu cấu hình tồn kho dùng chung",
        // SidebarDrawer — publish admin
        publishAdminTitle: "Quản trị xuất bản",
        publishAdminDesc: "Đẩy nguyên liệu, món ăn và cấu hình dùng chung hiện tại lên GitHub để các thiết bị khác đồng bộ thủ công.",
        publishTokenPlaceholder: "Token có quyền ghi repo contents",
        publishSaveToken: "Lưu token",
        publishTestToken: "Kiểm tra token",
        publishClearToken: "Xoá token",
        publishTokenSaved: "Đã lưu GitHub token xuất bản trên thiết bị này",
        publishTokenCleared: "Đã xoá GitHub token xuất bản trên thiết bị này",
        publishButton: "Xuất bản dữ liệu dùng chung",
        publishLastAt: (args: { when: string }) => `Xuất bản lần cuối: ${args.when}`,
        publishConfirmTitle: "Xác nhận xuất bản dữ liệu dùng chung",
        publishConfirmBody: "Thao tác này sẽ ghi nguyên liệu, món ăn và cấu hình dùng chung lên GitHub để các thiết bị khác đồng bộ. Bạn có chắc muốn xuất bản dữ liệu hiện tại?",
        publishConfirmOk: "Xuất bản",
        publishTokenStatusLocal: "Đang dùng token lưu trên thiết bị này.",
        publishTokenStatusBuild: "Đang dùng token cấu hình sẵn. Bạn có thể nhập token khác để ghi đè trên thiết bị này.",
        publishTokenStatusNone: "Chưa có token xuất bản. Token chỉ lưu trong trình duyệt của thiết bị này.",
        // SidebarDrawer — personal backup
        personalBackupTitle: "Sao lưu cá nhân",
        personalBackupDesc: "Sao lưu tồn kho, lịch mua sắm, thực đơn và mẫu dùng lại vào GitHub Gist.",
        personalBackupViewHealth: "Xem sức khỏe",
    },
    emptyStates: {
        noDishes: "Chưa có món nào — thêm món đầu tiên nhé",
        noSchedule: "Chưa có bữa nào được lên lịch — bắt đầu nhé",
        noInventory: "Chưa có nguyên liệu nào trong bếp",
        emptyCatalogTitle: "Chưa có món nào",
        emptyCatalogBody: "Thêm món đầu tiên để bắt đầu lên thực đơn.",
        emptyCatalogCta: "Thêm món đầu tiên",
        noPreferences: "Chưa có sở thích để chọn. Bạn có thể bỏ qua bước này.",
    },
} as const;

// Functions are treated as leaves (same as plain strings).
type Primitive = string | number | boolean | ((...args: any[]) => any);

// Recursive dot-path union over the copy object. Leaf-only variant
// (RESEARCH Open-Q1 default — marginally stricter): namespace tokens like
// "wizard" are not themselves valid keys, only their leaves are.
type CopyPath<T, Prefix extends string = ""> = {
    [K in keyof T & string]: T[K] extends Primitive
        ? `${Prefix}${K}`
        : CopyPath<T[K], `${Prefix}${K}.`>;
}[keyof T & string];

export type CopyKey = CopyPath<typeof AppCopy>;
