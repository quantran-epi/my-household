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
        // Screen — header / page actions
        screenTitle: "Lịch mua sắm",
        addModalTitle: "Thêm lịch mua sắm",
        searchPlaceholder: "Tìm kiếm",
        loadedCount: (args: { loaded: number; total: number }) => `Đã tải ${args.loaded}/${args.total}`,
        actionCreateFromTemplate: "Tạo từ mẫu",
        // Screen — status filter chips + per-item status pills
        statusAll: "Tất cả",
        statusBuying: "Đang mua",
        statusOverdue: "Quá hạn",
        statusChecklistDone: "Checklist xong",
        statusCompleted: "Đã hoàn tất",
        statusEmptyChecklist: "Chưa checklist",
        statusNoChecklist: "Chưa có checklist",
        // Screen — per-item summary
        dishCount: (args: { count: number }) => `${args.count} món`,
        scheduledMealCount: (args: { count: number }) => `${args.count} thực đơn`,
        completedShortLabel: (args: { when: string }) => `Xong ${args.when}`,
        plannedDateLabel: "Ngày mua",
        createdDateLabel: "Ngày tạo",
        plannedDateUnset: "Chưa đặt",
        checklistLabel: "Checklist",
        ingredientProgress: (args: { done: number; total: number }) => `${args.done}/${args.total} nguyên liệu`,
        // Screen — row primary + dropdown actions
        openAction: "Mở",
        generateAction: "Tạo",
        openDetailPageAction: "Mở trang chi tiết",
        exportAction: "Xuất danh sách",
        regenerateMenuAction: "Tải lại",
        editDishesAction: "Sửa món ăn",
        editListAction: "Sửa lịch mua sắm",
        // Screen — regenerate confirm + toast
        reloadConfirmContent: "Tải lại danh sách nguyên liệu?",
        reloadConfirmOk: "Đồng ý",
        regenerateSuccessToast: "Đã tạo lại checklist nguyên liệu",
        // Screen — apply-template Sheet
        templateModalTitle: "Tạo lịch mua từ mẫu",
        templateCreateAction: "Tạo lịch mua",
        templateLabel: "Mẫu mua sắm",
        templatePlaceholder: "Chọn mẫu mua sắm",
        templateNoneHint: "Chưa có mẫu mua sắm. Vào trang Mẫu dùng lại để tạo mẫu trước.",
        templatePreview: (args: { dishCount: number }) => `Mẫu này có ${args.dishCount} món. App sẽ tạo checklist nguyên liệu ngay sau khi tạo lịch mua.`,
        // Screen — delete-confirm Sheet
        deleteConfirmTitle: "Xác nhận xóa",
        deleteConfirmBody: (args: { name: string }) => `Bạn có chắc muốn xóa lịch ${args.name} không? Hành động này không thể hoàn tác.`,
    },
    scheduledMeal: {
        // Screen header
        screenTitle: "Thực đơn",
        screenSubtitle: "Lên kế hoạch bữa ăn theo ngày, theo dõi nấu nướng, phần dư và phản hồi của cả nhà.",        // Day navigator
        prevDayAria: "Ngày trước",
        nextDayAria: "Ngày sau",
        showCalendarAria: "Chọn ngày",
        hideCalendarAria: "Ẩn lịch",
        todayLabel: "Hôm nay",
        statusToday: "Hôm nay",
        statusPast: "Đã qua",
        statusUpcoming: "Sắp tới",
        mealsCount: (args: { count: number }) => `${args.count} thực đơn`,
        // Page actions
        actionSmartPlanner: "Gợi ý thực đơn",
        actionTemplate: "Tạo từ mẫu",
        actionRangeShopping: "Tạo giỏ theo khoảng ngày",
        actionCookDay: "Nấu cả ngày",
        actionAddMeal: "Thêm thực đơn",
        addMenuLabel: "Thêm thực đơn",
        // Empty + plan-list toggle
        emptyDay: "Chưa có thực đơn trong ngày này",
        hidePlanListLabel: "Ẩn danh sách kế hoạch",
        showPlanListLabel: (args: { count: number }) => `Xem theo kế hoạch (${args.count})`,
        // Slot summary card
        slotMorning: "Sáng",
        slotNoon: "Trưa",
        slotEvening: "Tối",
        slotSummary: (args: { dishCount: number; planCount: number }) => `${args.dishCount} món · ${args.planCount} kế hoạch`,
        slotEmptyDish: "Chưa có món",
        slotServingsPlanned: (args: { available: number; planned: number }) => `${args.available}/${args.planned} phần`,
        slotServingsAvailable: (args: { available: number }) => `còn ${args.available} phần`,
        slotFinishedNote: "Đã hoàn tất bữa này. Mở để xem lại hoặc gửi phản hồi.",
        startCooking: "Bắt đầu nấu",
        finishMeal: "Hoàn tất bữa",
        // Plan row
        mealActionAria: "Thao tác thực đơn",
        wholeFamily: "Cả nhà",
        slotSkippedShort: "không nấu",
        slotDishCountShort: (args: { count: number }) => `${args.count} món`,
        actionDetail: "Chi tiết",
        actionCopy: "Sao chép",
        actionEdit: "Sửa",
        actionDelete: "Xóa",
        // Day cooking modal title (passed through to ScheduledMealCookingModal)
        dayCookingTitle: (args: { date: string }) => `Nấu cả ngày - ${args.date}`,
        // Template apply Sheet
        templateModalTitle: "Tạo thực đơn từ mẫu",
        templateCreateAction: "Tạo",
        templateScopeLabel: "Tạo cho",
        templateScopeDay: "Một ngày",
        templateScopeWeek: "Một tuần",
        templateWeekLabel: "Tuần áp dụng",
        templateLabel: "Mẫu",
        templatePlaceholderDay: "Chọn mẫu ngày",
        templatePlaceholderWeek: "Chọn mẫu tuần",
        templateNoneHint: (args: { scope: string }) => `Chưa có mẫu phù hợp. Vào trang Mẫu dùng lại để tạo mẫu ${args.scope}.`,
        templateScopeWordDay: "ngày",
        templateScopeWordWeek: "tuần",
        templateCreatedToast: (args: { count: number }) => `Đã tạo ${args.count} thực đơn từ mẫu`,
        // Range picker Sheet
        rangeModalTitle: "Chọn khoảng ngày để tạo giỏ hàng",
        rangeCreateAction: "Tạo giỏ hàng",
        rangeFromPlaceholder: "Từ ngày",
        rangeToPlaceholder: "Đến ngày",
        rangePreset7Days: "7 ngày tới",
        rangePresetThisWeek: "Tuần này",
        rangePresetNextWeek: "Tuần tới",
        rangeFoundCount: (args: { count: number }) => `Tìm thấy ${args.count} thực đơn trong khoảng ngày đã chọn`,
        // Range shopping Sheet
        rangeShoppingTitle: "Tạo lịch mua sắm",
        rangeShoppingEmpty: "Không có thực đơn nào trong khoảng ngày đã chọn",
        // Helper: localized week-of-month shopping list name
        weekShoppingListName: (args: { weekOfMonth: number; date: string }) => `Tuần ${args.weekOfMonth}, ${args.date}`,
        // Plan-row Sheets
        editTitle: "Sửa thực đơn",
        mealDetailTitle: "Thực đơn",
        copyTitle: "Sao chép sang ngày khác",
        copyAction: "Sao chép",
        copyDatePlaceholder: "Chọn ngày",
        copyHint: (args: { name: string }) => `Chọn ngày muốn sao chép thực đơn "${args.name}" sang:`,
        // Delete confirm Sheet
        deleteConfirmTitle: "Xác nhận xóa",
        deleteConfirmBody: (args: { name: string }) => `Bạn có chắc muốn xóa thực đơn ${args.name} không? Hành động này không thể hoàn tác.`,
        // Add widget — form fields, slots, summary, save
        defaultMenuName: "Thực đơn chưa đặt tên",
        createdToast: "Đã tạo thực đơn",
        nameLabel: "Tên gợi nhớ",
        namePlaceholder: "Nhập tên",
        plannedDateLabel: "Ngày kế hoạch",
        plannedDatePlaceholder: "Chọn ngày",
        forWhomLabel: "Cho ai ăn? (để trống = cả nhà)",
        forWhom: "Cho ai ăn?",
        existingMealsTitle: "Thực đơn đã có trong ngày này",
        emptyMealLine: "Chưa có món",
        estimateTitle: "Ước tính ngày này",
    },
    dishSuggester: {
        // Header / hosts
        title: "Nấu gì hôm nay?",
        openPageAriaLabel: "Mở trang Nấu gì riêng",
        backAriaLabel: "Quay lại",
        // Mode tabs
        modeIngredients: "Nguyên liệu",
        modeInventory: "Tủ lạnh",
        modeDuration: "Thời gian",
        modeNutrition: "Dinh dưỡng",
        // Primary CTA + actions menu
        cookAction: "Nấu",
        cookCountAriaLabel: (args: { count: number }) => `Bắt đầu nấu ${args.count} món`,
        moreActionsAriaLabel: (args: { count: number }) => `Thao tác khác cho ${args.count} món`,
        actionShopping: "Tạo lịch mua",
        actionExpense: "Kế hoạch chi phí",
        actionSuitability: "Độ hợp nhà mình",
        actionNutrition: "Tính dinh dưỡng",
        // Toasts
        startedCookingOne: (args: { name: string }) => `Đã bắt đầu nấu ${args.name}`,
        startedCookingMany: (args: { count: number }) => `Đã bắt đầu nấu ${args.count} món`,
        // Pending labels
        pendingIngredient: "Đang tính gợi ý món...",
        pendingInventory: "Đang tính món phù hợp với tủ lạnh...",
        pendingDuration: "Đang lọc món theo thời gian...",
        pendingNutrition: "Đang tính gợi ý dinh dưỡng...",
        // Empty / no-match states
        emptyNoMatch: "Không tìm thấy món phù hợp",
        inventoryEmpty: "Tủ lạnh trống — hãy cập nhật tồn kho trước",
        noMatchInFilter: "Không có món nào chứa đủ các nguyên liệu đã chọn",
        noMatchWithInventory: "Không tìm thấy món phù hợp với nguyên liệu hiện có",
        nutritionEmpty: "Chưa có món nào hợp mục tiêu. Bạn có thể bổ sung dinh dưỡng cho món sau.",
        nutritionGoalEmpty: "Chưa có mục tiêu dinh dưỡng. Hãy tạo mục tiêu trước.",
        durationNotFound: (args: { minutes: number }) => `Không có món nào nấu được trong ${args.minutes} phút`,
        // Filters
        ingredientFilterPlaceholder: "Lọc món chứa nguyên liệu...",
        durationDishesFoundOf: (args: { filtered: number; total: number; minutes: number }) => `${args.filtered} / ${args.total} món nấu được trong ≤ ${args.minutes} phút`,
        durationDishesFound: (args: { count: number; minutes: number }) => `${args.count} món nấu được trong ≤ ${args.minutes} phút`,
        findInMinutes: (args: { minutes: number }) => `Tìm món ≤ ${args.minutes} phút`,
        minutesUnit: (args: { minutes: number }) => `${args.minutes} phút`,
        // Ingredients step 0 + duration prompt
        suggestDishesCount: (args: { count: number }) => `Gợi ý món (${args.count})`,
        durationPrompt: "⏱ Bạn có bao nhiêu thời gian để nấu?",
        // Inventory summary
        inventoryCountSummary: (args: { count: number }) => `🧊 ${args.count} nguyên liệu trong tủ lạnh — bấm để xem`,
        // Nutrition mode
        nutritionGoalTitle: "Chọn mục tiêu dinh dưỡng",
        nutritionGoalManage: "Quản lý",
        nutritionGoalCriteriaCount: (args: { count: number }) => `${args.count} điều cần theo`,
        nutritionGoalLabel: (args: { name: string; count: number }) => `${args.name} - ${args.count} điều`,
        nutritionGoalReasonPrefix: "Gợi ý theo mục tiêu",
        nutritionMatchPhrase: (args: { matched: number; total: number }) => `${args.matched}/${args.total} điều hợp`,
        suggestByGoal: (args: { name: string }) => `Gợi ý theo ${args.name}`,
        suggestByNutrition: "Gợi ý theo dinh dưỡng",
        nutritionMissingInfo: (args: { count: number }) => `Cần bổ sung thông tin cho ${args.count} nguyên liệu.`,
        expandNutritionAriaLabel: (args: { name: string }) => `Xem dinh dưỡng của ${args.name}`,
        collapseNutritionAriaLabel: (args: { name: string }) => `Ẩn dinh dưỡng của ${args.name}`,
        nutritionCalories: "kcal",
        nutritionProtein: "đạm",
        nutritionFat: "béo",
        nutritionFiber: "xơ",
        viewGoals: "Xem mục tiêu",
        // Results footer
        enoughForAll: "🎉 Đủ nguyên liệu cho tất cả món đã chọn!",
        needMoreIngredientsPrefix: "Cần mua thêm",
        needMoreIngredientsSuffix: "nguyên liệu:",
        moreSuffix: (args: { count: number }) => `+${args.count} khác`,
        // Duration row inline labels
        availableOf: (args: { available: number; total: number }) => `${args.available}/${args.total} có sẵn`,
        needLabel: (args: { amount: number; unit: string }) => `(cần ${args.amount}${args.unit})`,
        // Sheet/Modal-host titles
        shoppingListAddTitle: "Tạo lịch mua sắm",
        expensePlannerTitle: "Tính chi phí",
        nutritionCalculatorTitle: "Máy tính dinh dưỡng",
        suitabilityTitle: "Độ phù hợp với nhà mình",
        // Suitability content
        suitabilityNoMembers: "Chưa có hồ sơ thành viên để đánh giá.",
        openHouseholdAction: "Mở Nhà mình",
        suitabilityNoSelection: "Chọn ít nhất một món để đánh giá.",
        suitabilityMembersTitle: "Thành viên dùng để đánh giá",
        allMembersPlaceholder: "Tất cả thành viên",
        suitabilityScoreSummary: (args: { positives: number; warnings: number }) => `${args.positives} điểm hợp · ${args.warnings} lưu ý`,
    },
    dishes: {
        // Screen header / page-level
        screenTitle: "Món ăn",
        searchPlaceholder: "Tìm kiếm",
        filteringHint: "Đang lọc danh sách...",
        loadedCount: (args: { loaded: number; total: number }) => `Đã tải ${args.loaded}/${args.total}`,
        // Status filter chips
        statusAll: "Tất cả",
        statusReady: "Hoàn thiện",
        statusNeedsUpdate: "Cần cập nhật",
        statusHasIngredients: "Có nguyên liệu",
        statusHasSteps: "Có bước nấu",
        // Tag filter
        allTagsLabel: "Tất cả tag",
        // Add modal
        addModalTitle: "Thêm món ăn",
        // Duration popover
        durationPopoverTitle: "Thời lượng",
        durationEmpty: "Chưa nhập thời lượng cho món này.",
        durationOwnDishLabel: "Món chính",
        durationIncludedDishesLabel: "Món bao gồm",
        // Row badges
        durationBadgeEmpty: "Chưa có",
        statusComplete: "Hoàn thiện",
        statusNeedsUpdateBadge: "Cần cập nhật",
        servingsTag: (args: { count: number }) => `${args.count} phần`,
        // Row dropdown menu
        menuStartCooking: "Bắt đầu nấu",
        menuExport: "Xuất dữ liệu",
        menuEdit: "Sửa món ăn",
        menuDuration: "Thời lượng",
        menuDuplicate: "Nhân bản",
        menuDelete: "Xóa",
        // Row metric cards
        ingredientsLabel: "Nguyên liệu",
        ingredientsCount: (args: { count: number }) => `${args.count} nguyên liệu`,
        emptyShort: "Chưa có",
        optionalCount: (args: { count: number }) => `${args.count} tùy chọn`,
        stepsLabel: "Quy trình",
        stepsCount: (args: { count: number }) => `${args.count} bước`,
        includedDishCount: (args: { count: number }) => `${args.count} món kèm`,
        // Row footer status
        readyShort: "Sẵn sàng",
        needsUpdateShort: "Cần cập nhật",
        requiredIngredientCount: (args: { count: number }) => `${args.count} nguyên liệu bắt buộc`,
        rowCookAction: "Nấu",
        rowNutritionAction: "Dinh dưỡng",
        // Detail modal
        detailFooterClose: "Đóng",
        detailFooterOpenPage: "Mở trang chi tiết",
        // Edit / duration / cooking modals
        editModalTitle: "Chỉnh sửa món ăn",
        durationModalTitle: "Thời lượng",
        cookingModalSuffix: "Bắt đầu nấu",
        // Toasts / inline messages
        savedCookTimeToast: "Đã lưu thời gian món ăn",
        cannotDeleteUsedIn: (args: { dishNames: string }) => `Không thể xóa! Món ăn này đang được dùng trong: ${args.dishNames}.`,
        // Delete confirm Sheet
        deleteConfirmTitle: "Xác nhận xóa",
        deleteConfirmBody: (args: { name: string }) => `Bạn có chắc muốn xóa món ${args.name} không? Hành động này không thể hoàn tác.`,
    },
    ingredient: {
        // Screen header / page-level
        screenTitle: "Nguyên liệu",
        searchPlaceholder: "Tìm kiếm",
        filteringHint: "Đang lọc danh sách...",
        loadedCount: (args: { loaded: number; total: number }) => `Đã tải ${args.loaded}/${args.total}`,
        // Stock filter chips
        stockAll: "Tất cả",
        stockInStock: "Đang có",
        stockNeedStock: "Cần nhập",
        stockLowStock: "Sắp hết",
        stockUrgent: "Sắp hết hạn",
        stockAlwaysAvailable: "Luôn có",
        // Category filter
        allCategoriesLabel: "Tất cả nhóm",
        // Page actions (toolkit)
        actionUseFirst: "Dùng trước hết hạn",
        actionStats: "Thống kê nguyên liệu",
        // Add modal
        addModalTitle: "Thêm nguyên liệu",
        // Inventory modal
        inventoryModalTitle: (args: { name: string }) => `Tồn kho - ${args.name}`,
        // Row inventory status states
        statusAlwaysAvailable: "Luôn có",
        statusAlwaysAvailableDetail: "Không cần quản lý tồn kho",
        statusNoInventory: "Chưa có tồn kho",
        statusNoInventoryDetail: "Bấm để nhập lô đầu tiên",
        statusOutOfStock: "Hết khả dụng",
        statusOutOfStockDetail: "Không còn lô dùng được",
        statusLowDetail: "Tồn kho thấp",
        statusOkDetail: "Tồn kho ổn",
        // Row aria + tooltip
        aria_viewNutrition: "Xem dinh dưỡng",
        aria_viewNutritionDetail: "Xem chi tiết dinh dưỡng",
        aria_rowMenu: "Thao tác nguyên liệu",
        rowOriginUnit: (args: { unit: string }) => `Gốc: ${args.unit}`,
        // Row dropdown
        menuEdit: "Sửa",
        menuDelete: "Xóa",
        // Row metric cards
        labelUsableInventory: "Tồn kho khả dụng",
        labelRecipeUnits: "Đơn vị công thức",
        labelInventoryUnits: (args: { units: string }) => `Nhập kho: ${args.units}`,
        latestBatch: (args: { label: string }) => `Lô gần nhất: ${args.label}`,
        // Edit / nutrition modal titles
        editModalTitle: "Chỉnh sửa nguyên liệu",
        nutritionModalTitle: (args: { name: string }) => `Dinh dưỡng - ${args.name}`,
        nutritionModalClose: "Đóng",
        // Delete confirm Sheet
        deleteConfirmTitle: "Xác nhận xóa",
        deleteConfirmBody: (args: { name: string }) => `Bạn có chắc muốn xóa nguyên liệu ${args.name} không? Hành động này không thể hoàn tác.`,
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
