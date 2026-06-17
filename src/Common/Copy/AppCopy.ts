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
    shoppingList: {
        // Shared small actions
        close: "Đóng",
        delete: "Xóa",
        zeroPrice: "0đ",
        noPriceYet: "Chưa có giá",
        // Detail widget — tabs + completion
        ingredientsTab: (args: { count: number }) => `Nguyên liệu (${args.count})`,
        costTab: "Chi phí",
        dishesTab: (args: { count: number }) => `Món ăn (${args.count})`,
        mealsTab: (args: { count: number }) => `Thực đơn (${args.count})`,
        completedAt: (args: { when: string }) => `Đã hoàn tất ${args.when}`,
        completeAction: "Hoàn tất",
        completedToast: "Đã hoàn tất lịch mua sắm",
        mealModalTitle: "Thực đơn",
        // Completion review
        completionReviewTitle: "Xác nhận hoàn tất mua sắm",
        completionReviewHint: "Kiểm tra hạn dùng và nơi bảo quản trước khi nhập kho.",
        completeAndImport: "Hoàn tất và nhập kho",
        irreversibleWarning: "Hành động này không thể hoàn tác",
        completionReviewBody: "Sau khi hoàn tất, danh sách mua sắm sẽ chuyển sang chỉ xem và các lô bên dưới sẽ được thêm vào kho.",
        batchesToImport: (args: { count: number }) => `${args.count} lô sẽ được nhập kho`,
        expiryEmptyHint: "Hạn dùng để trống sẽ dùng quy tắc bảo quản của nguyên liệu.",
        noBatchesToImport: "Không có nguyên liệu nào cần thêm vào kho. Danh sách vẫn sẽ được đánh dấu hoàn tất.",
        expiryPlaceholder: "Hạn dùng",
        storagePlaceholder: "Bảo quản",
        // Completion audit
        importHistoryTitle: "Lịch sử nhập kho",
        auditCompletedAt: (args: { when: string }) => `Hoàn tất ${args.when}`,
        batchCount: (args: { count: number }) => `${args.count} lô`,
        noImportedBatches: "Không có lô nguyên liệu nào được nhập khi hoàn tất.",
        batchLabel: (args: { id: string }) => `Lô ${args.id}`,
        expiresOn: (args: { date: string }) => `Hạn dùng ${args.date}`,
        // Cost summary
        missingPriceCount: (args: { count: number }) => `${args.count} mục chưa có giá`,
        costCalculating: "Đang tính chi phí mua sắm...",
        costEstimateTitle: "Ước tính mua sắm",
        costEstimateSubtitle: "Giá tham khảo theo khoảng giá nguyên liệu",
        costOverview: "Tổng quan chi phí",
        costRequiredLabel: "Cần mua ban đầu",
        costRequiredDesc: "Bắt buộc còn thiếu theo kho",
        costRecipeLabel: "Tổng công thức",
        costRecipeDesc: "Bao gồm bắt buộc và tùy chọn",
        costNeedMoreLabel: "Cần mua thêm",
        costNeedMoreDesc: "Sau khi trừ phần đã mua",
        costBoughtLabel: "Đã mua",
        costBoughtDesc: "Theo lượng đã đánh dấu",
        // Bought-info modal
        boughtModalTitle: "Mua thực tế",
        boughtNeed: (args: { amount: string; unit: string }) => `Cần ${args.amount}${args.unit}`,
        boughtInStockSuffix: (args: { amount: string; unit: string }) => ` · có ${args.amount}${args.unit}`,
        boughtAmountLabel: "Lượng đã mua",
        boughtAmountDesc: "Nhập đúng lượng thực tế để nhập kho và tính chi phí.",
        boughtEnoughNeed: (args: { amount: string; unit: string }) => `Đủ cần ${args.amount}${args.unit}`,
        boughtRecipeTotal: "Tổng công thức",
        boughtClearAmount: "Xóa lượng",
        priceTodayTitle: "Giá hôm nay",
        boughtPurchased: (args: { amount: string; unit: string }) => `${args.amount}${args.unit} đã mua`,
        enterAmountBeforePrice: "Nhập lượng đã mua trước khi lưu giá.",
        enterPriceAndAmountWarning: "Nhập giá và lượng đã mua trước khi lưu.",
        priceSavedToast: "Đã lưu giá mua gần nhất",
        editPrice: "Sửa giá",
        priceSavedFor: (args: { amount: string; unit: string }) => `Đã lưu cho ${args.amount}${args.unit}. Lần sau có thể chọn cùng giá hoặc cùng đơn giá.`,
        lastTime: (args: { detail: string }) => `Lần trước: ${args.detail}`,
        recentLabel: "gần nhất",
        samePrice: "Cùng giá",
        sameUnitPrice: "Cùng đơn giá",
        priceLow: "Giá thấp",
        priceHigh: "Giá cao",
        pricePaidPlaceholder: "Giá đã trả",
        priceHistoryTitle: "Lịch sử giá gần đây",
        currentPriceUnsaved: "Chưa lưu giá",
        // Ingredient status pills
        pillNeed: (args: { amount: string; unit: string }) => `Cần ${args.amount}${args.unit}`,
        pillAlwaysAvailable: "Luôn có",
        pillInStock: (args: { amount: string; unit: string }) => `Có ${args.amount}${args.unit}`,
        pillRemaining: (args: { amount: string; unit: string }) => `Còn ${args.amount}${args.unit}`,
        pillToBuy: (args: { amount: string; unit: string }) => `Mua ${args.amount}${args.unit}`,
        pillBought: (args: { amount: string; unit: string }) => `Đã mua ${args.amount}${args.unit}`,
        pillPrice: (args: { range: string }) => `Giá ${args.range}`,
        pillCovered: "Đủ hàng",
        pillEstimate: (args: { range: string }) => `~ ${args.range}`,
        priceShort: "Giá",
        buyShort: "Mua",
        neededPerDish: "Cần cho từng món",
        optional: "Tùy chọn",
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
