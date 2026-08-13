'use strict';

var obsidian = require('obsidian');

function _interopNamespace(e) {
    if (e && e.__esModule) return e;
    var n = Object.create(null);
    if (e) {
        Object.keys(e).forEach(function (k) {
            if (k !== 'default') {
                var d = Object.getOwnPropertyDescriptor(e, k);
                Object.defineProperty(n, k, d.get ? d : {
                    enumerable: true,
                    get: function () { return e[k]; }
                });
            }
        });
    }
    n["default"] = e;
    return Object.freeze(n);
}

var obsidian__namespace = /*#__PURE__*/_interopNamespace(obsidian);

/******************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */

function __awaiter(thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
}

typeof SuppressedError === "function" ? SuppressedError : function (error, suppressed, message) {
    var e = new Error(message);
    return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
};

const DEFAULT_COLOR_PRESETS = [
    "#3b82f6",
    "#8b5cf6",
    "#10b981",
    "#f59e0b",
    "#f43f5e",
    "#06b6d4",
    "#6366f1",
];

/**
 * 英文翻譯
 */
const en = {
    common: {
        save: "Save",
        restore: "Restore",
        cancel: "Cancel",
        delete: "Delete",
        rename: "Rename",
        confirm: "Confirm",
        success: "Success",
        error: "Error",
        warning: "Warning",
        loading: "Loading",
        close: "Close",
        ok: "OK",
        layoutLabel: "Window Space",
        noLayout: "No space applied",
        newWindow: "New Window",
        edit: "Edit",
        windowLayouts: "Window Spaces",
        openAsPanel: "Panel location",
    },
    commands: {
        saveLayout: "Save current Space",
        openLayouts: "Open switcher",
        openLayoutsRibbon: "Open Window Spaces switcher",
        openLayoutsPanel: "Open as tab panel",
        openLayoutsPanelLeft: "Open in left sidebar",
        openLayoutsPanelRight: "Open in right sidebar",
        toggleLeftActivityBar: "Toggle left Activity Bar",
        toggleRightActivityBar: "Toggle right Activity Bar",
        toggleCurrentPaneGroup: "Toggle current pane group",
    },
    saveModal: {
        title: "Space Settings",
        nameLabel: "Space Name",
        namePlaceholder: "Enter space name...",
        descriptionLabel: "Description (optional)",
        descriptionPlaceholder: "Enter space description...",
        infoSection: "Space Details",
        windowSize: "Window Size",
        includePosition: "Include Window Position",
        includePositionDesc: "Save the window position coordinates on screen",
        includeWindowSize: "Include window size",
        includeWindowSizeDesc: "Save the window width and height",
        includeGeometry: "Include window position & size",
        includeGeometryDesc: "Save the window coordinates and dimensions on screen",
        andOthers: "and others",
        overwriteNotice: "Will overwrite existing space",
        saveButton: "Save Space",
        cancelButton: "Cancel",
        emptyNameError: "Space name cannot be empty",
        duplicateNameError: "A space with this name already exists",
        iconLabel: "Icon / Emoji",
        iconPlaceholder: "e.g. 🚀 or star",
        colorLabel: "Window Frame Color",
        colorPresetLabel: "Color Swatches",
        clearColor: "Clear Color",
        saveSuccess: "Space saved successfully",
        autoSaveToggle: "Enable auto-save for this space",
        borderInset: "Frame inset thickness",
        borderInsetDesc: "Set a value to draw a custom frame; leave unchanged to keep Obsidian's native accent border",
        foldedCorner: "Show folded corner",
        foldedCornerDesc: "Leave unchanged to follow the global default",
        activityBarsSection: "Activity Bars",
        showActivityBar: "Show",
        showActivityBarTitle: "Show Activity Bar",
        showActivityBarDesc: "When enabled, this space will display this side Activity Bar in popout windows",
        showLeftActivityBar: "Show Left Activity Bar",
        showRightActivityBar: "Show Right Activity Bar",
        activityBarViewButtons: "View buttons",
        spaceSection: "Space",
        windowAppearanceSection: "Window Appearance",
        behaviorSection: "Space Behavior",
        sectionsSection: "Sections",
    },
    restoreModal: {
        title: "Restore Space",
        selectLayout: "Select a space to restore:",
        noLayoutsMessage: "No saved spaces found.",
        restoreButton: "Restore Space",
        restoreHint: "Restore space (click or Enter for a new window; long-press the item or Restore button, Shift+click, or Shift+Enter for the current window)",
        cancelButton: "Cancel",
        restoreSuccess: "Space restored successfully",
        restoreError: "Failed to restore space",
        includedFiles: "Included files",
        restoringLayout: "Restoring space",
    },
    manageModal: {
        title: "Manage Window Spaces",
        noLayoutsMessage: "No saved spaces found.",
        searchPlaceholder: "Find or create a space...",
        enterToCreate: "Enter to create",
        clearSearch: "Clear search",
        saveCurrentButton: "Save",
        layoutName: "Space Name",
        createdDate: "Created",
        updatedDate: "Updated",
        fileCount: "Files",
        tabCount: "Tabs",
        actions: "Actions",
        renameButton: "Rename",
        deleteButton: "Delete",
        confirmDeleteTitle: "Delete Space",
        confirmDeleteMessage: "Are you sure you want to delete this space? This action cannot be undone.",
        deleteSuccess: "Space deleted successfully",
        renameSuccess: "Space renamed successfully",
        sortDateDesc: "Updated (Newest)",
        sortDateAsc: "Updated (Oldest)",
        sortUpdatedDesc: "Updated (Newest)",
        sortUpdatedAsc: "Updated (Oldest)",
        sortCreatedDesc: "Created (Newest)",
        sortCreatedAsc: "Created (Oldest)",
        sortNameAsc: "Name (A to Z)",
        sortNameDesc: "Name (Z to A)",
        autoSaveEnabled: "Auto-save enabled",
        autoSaveDisabled: "Auto-save disabled",
        windowOpenBadge: "Active",
        viewOptions: "View Options",
        groupBySection: "Group by Section",
        flatView: "Flat List",
        showArchived: "Show Archived",
        hideArchived: "Hide Archived",
        uncategorized: "Uncategorized",
        archivedGroup: "Archived",
        archiveSpace: "Archive Space",
        unarchiveSpace: "Unarchive Space",
        archiveSuccess: "Space archived",
        unarchiveSuccess: "Space unarchived",
        renameSection: "Rename Section",
        sectionsLabel: "Sections",
        sectionsPlaceholder: "Type section name and press Enter...",
        sectionHeaderHint: "Click to collapse/expand · Double-click to rename · Drag to reorder",
        sectionHeaderHintStatic: "Click to collapse/expand",
    },
    settings: {
        title: "Window Spaces Settings",
        description: "Manage your Window Spaces and configure auto-save options.",
        autoSaveSection: "General & Auto-Save Settings",
        autoSaveDescription: "Automatically save Window Spaces at regular intervals.",
        autoSaveEnabled: "Enable auto-save",
        showNotifications: "Show notifications",
        showNotificationsDesc: "Display notice toasts on saving or restoring spaces",
        layoutDisplaySection: "Popout space display",
        showLayoutStatusBar: "Show space status bar",
        showLayoutStatusBarDesc: "Display the current space name and a Save button in a status-style bar at the bottom-left of every Popout window",
        showWindowLayoutsRibbonIcon: "Show 'Window Spaces' ribbon icon",
        showWindowLayoutsRibbonIconDesc: "Display one quick-access icon for restoring and managing Window Spaces",
        autoSaveInterval: "Auto-save interval",
        minutes: "minutes",
        resetSettings: "Reset Settings",
        resetSettingsDescription: "Reset all settings to default values.",
        resetButton: "Reset Settings",
        resetConfirmTitle: "Confirm Reset",
        resetConfirmMessage: "Are you sure you want to reset all settings? This will not delete your saved spaces.",
        resetSuccess: "Settings reset successfully",
        popoutSidebarSection: "Popout Window Views",
        enableInterceptor: "Route views to their popout windows",
        enableInterceptorDesc: "When opening a view from a popout window—whether in a sidebar or editor tab area—keep it in that popout instead of routing it to the main window.",
        leftBar: "Left Activity Bar",
        rightBar: "Right Activity Bar",
        addView: "Add view",
        removeView: "Remove",
        viewTypePlaceholder: "View type (e.g. file-explorer)",
        pickIcon: "Choose icon",
        restoreDefaultButtons: "Restore default buttons",
        restoreDefaultIcon: "Restore default icon",
        accentSection: "Window Accent & Icons",
        defaultIcon: "Default Popout Icon",
        defaultIconDesc: "Icon to use when a Space does not specify a custom icon",
        defaultBorderInset: "Default frame inset thickness",
        defaultBorderInsetDesc: "Set to 0 to hide the Popout frame border",
        defaultFoldedCorner: "Show default folded corner",
        defaultFoldedCornerDesc: "Show the folded-corner decoration in the top-left of Popout windows",
        defaultActivityBarVisibility: "Show this Activity Bar by default for new Spaces",
        defaultActivityBarVisibilityDesc: "Controls whether the entire Activity Bar is shown",
        dragToReorder: "Drag to reorder",
        keepOneActivityBarView: "Keep at least one Activity Bar view button when another view is available",
    },
    notifications: {
        layoutSaved: "Space saved successfully",
        layoutOverwritten: "Space overwritten successfully",
        layoutRestored: "Space restored successfully",
        layoutDeleted: "Space deleted successfully",
        layoutRenamed: "Space renamed successfully",
        settingsReset: "Settings reset successfully",
        errorOccurred: "An error occurred",
        invalidLayout: "Invalid space data",
        cannotRestore: "Cannot restore space",
        missingFilesNotice: "missing files",
        switchedToOpenWindow: "Switched to active window for space \"{{name}}\"",
    },
    errors: {
        failedToSave: "Failed to save space",
        failedToRestore: "Failed to restore space",
        failedToDelete: "Failed to delete space",
        failedToRename: "Failed to rename space",
        layoutNotFound: "Space not found",
        invalidData: "Invalid data format",
        permissionDenied: "Permission denied",
        notInPopoutWindow: "Please execute this command inside a popout window.",
        unknownError: "An unknown error occurred",
    },
    instructions: {
        navigate: "to navigate",
        use: "to use",
        useNewWindow: "in new window",
        dismiss: "to dismiss",
    },
    activityBar: {
        toggleColumn: "Toggle sidebar",
        toggleGroup: "Toggle current pane group",
        cannotHideLastPane: "Cannot hide the last visible pane",
        onlyInPopout: "This command only works inside a Popout window",
        openSettings: "Open Window Spaces settings",
    },
};

/**
 * 繁體中文翻譯
 */
const zhTW = {
    common: {
        save: "儲存",
        restore: "恢復",
        cancel: "取消",
        delete: "刪除",
        rename: "重新命名",
        confirm: "確認",
        success: "成功",
        error: "錯誤",
        warning: "警告",
        loading: "載入中",
        close: "關閉",
        ok: "確定",
        layoutLabel: "空間",
        noLayout: "尚未套用空間",
        newWindow: "新視窗",
        edit: "編輯",
        windowLayouts: "Window Spaces",
        openAsPanel: "面板位置",
    },
    commands: {
        saveLayout: "儲存目前空間",
        saveLayoutDirect: "直接儲存目前空間",
        openLayouts: "開啟切換器",
        openLayoutsRibbon: "開啟 Window Spaces 切換器",
        openLayoutsPanel: "開啟為標籤面板",
        openLayoutsPanelLeft: "開啟在左側邊欄",
        openLayoutsPanelRight: "開啟在右側邊欄",
        toggleLeftActivityBar: "切換左側 Activity Bar",
        toggleRightActivityBar: "切換右側 Activity Bar",
        toggleCurrentPaneGroup: "切換目前分頁群組",
    },
    saveModal: {
        title: "空間設定",
        nameLabel: "空間名稱",
        namePlaceholder: "輸入空間名稱...",
        descriptionLabel: "描述（選填）",
        descriptionPlaceholder: "輸入空間描述...",
        infoSection: "空間資訊",
        windowSize: "視窗大小",
        includePosition: "包含視窗位置",
        includePositionDesc: "儲存視窗在螢幕上的位置",
        includeWindowSize: "包含視窗大小",
        includeWindowSizeDesc: "儲存視窗的寬度和高度",
        includeGeometry: "包含視窗位置與大小",
        includeGeometryDesc: "保存並還原視窗在螢幕上的座標位置與寬高尺寸",
        andOthers: "及其他",
        overwriteNotice: "將覆蓋更新既有空間",
        saveButton: "儲存空間",
        cancelButton: "取消",
        emptyNameError: "空間名稱不能為空",
        duplicateNameError: "此名稱的空間已經存在",
        iconLabel: "圖示 / Emoji",
        iconPlaceholder: "例如：🚀 或 star",
        colorLabel: "視窗邊框顏色",
        colorPresetLabel: "快捷調色盤",
        clearColor: "清除顏色",
        saveSuccess: "空間儲存成功",
        autoSaveToggle: "啟用此空間的自動保存",
        borderInset: "邊框 inset 厚度",
        borderInsetDesc: "設定數值時繪製自訂邊框；未修改時保留 Obsidian 原生 accent 邊框",
        foldedCorner: "顯示左上角折頁裝飾",
        foldedCornerDesc: "未修改時跟隨全域預設值",
        activityBarsSection: "Activity Bars",
        showActivityBar: "顯示",
        showActivityBarTitle: "顯示此側 Activity Bar",
        showActivityBarDesc: "開啟時，此空間會在 Popout 視窗顯示該側 Activity Bar",
        showLeftActivityBar: "顯示左側 Activity Bar",
        showRightActivityBar: "顯示右側 Activity Bar",
        activityBarViewButtons: "View 按鈕",
        spaceSection: "空間",
        windowAppearanceSection: "視窗外觀",
        behaviorSection: "空間行為",
        sectionsSection: "Section 分組",
    },
    restoreModal: {
        title: "復原空間",
        selectLayout: "選擇要復原的空間：",
        noLayoutsMessage: "沒有找到已儲存的空間。",
        restoreButton: "復原空間",
        restoreHint: "復原空間（點擊或按 Enter 在新視窗開啟；長按空間項目或 Restore 按鈕、按住 Shift 點擊或按 Shift+Enter 套用至目前視窗）",
        cancelButton: "取消",
        restoreSuccess: "空間復原成功",
        restoreError: "復原空間失敗",
        includedFiles: "收錄檔案",
        restoringLayout: "正在復原空間",
    },
    manageModal: {
        title: "管理 Window Spaces",
        noLayoutsMessage: "沒有找到已儲存的空間。",
        searchPlaceholder: "尋找或建立空間...",
        enterToCreate: "Enter 鍵以建立",
        clearSearch: "清除搜尋",
        saveCurrentButton: "Save",
        layoutName: "空間名稱",
        createdDate: "建立時間",
        updatedDate: "更新時間",
        fileCount: "檔案數",
        tabCount: "分頁數",
        actions: "操作",
        renameButton: "重命名",
        deleteButton: "刪除",
        confirmDeleteTitle: "刪除空間",
        confirmDeleteMessage: "您確定要刪除這個空間嗎？此操作無法復原。",
        deleteSuccess: "空間刪除成功",
        renameSuccess: "空間重新命名成功",
        sortDateDesc: "更新時間 (最新)",
        sortDateAsc: "更新時間 (較舊)",
        sortUpdatedDesc: "更新時間 (最新)",
        sortUpdatedAsc: "更新時間 (較舊)",
        sortCreatedDesc: "建立時間 (最新)",
        sortCreatedAsc: "建立時間 (較舊)",
        sortNameAsc: "名稱 (A-Z)",
        sortNameDesc: "名稱 (Z-A)",
        autoSaveEnabled: "自動保存已啟用",
        autoSaveDisabled: "自動保存已停用",
        windowOpenBadge: "視窗開啟中",
        viewOptions: "顯示選項",
        groupBySection: "依 Section 分組",
        flatView: "不分組清單",
        showArchived: "顯示封存空間",
        hideArchived: "隱藏封存空間",
        uncategorized: "未分類",
        archivedGroup: "📦 封存空間",
        archiveSpace: "封存空間",
        unarchiveSpace: "取消封存",
        archiveSuccess: "已封存空間",
        unarchiveSuccess: "已取消封存空間",
        renameSection: "重命名 Section",
        sectionsLabel: "Section 分組標籤",
        sectionsPlaceholder: "輸入 Section 名稱後按 Enter...",
        sectionHeaderHint: "點擊摺疊/展開 · 雙擊重新命名 · 拖曳排序",
        sectionHeaderHintStatic: "點擊摺疊/展開",
    },
    settings: {
        title: "Window Spaces 設定",
        description: "管理您的 Window Spaces 並設定自動儲存選項。",
        autoSaveSection: "一般與自動儲存設定",
        autoSaveDescription: "定期自動儲存 Window Spaces。",
        autoSaveEnabled: "啟用自動儲存",
        showNotifications: "顯示通知",
        showNotificationsDesc: "在儲存或恢復空間時顯示通知快訊",
        layoutDisplaySection: "Popout 空間顯示",
        showLayoutStatusBar: "顯示空間狀態列",
        showLayoutStatusBarDesc: "在每個 Popout 視窗左下方以狀態列樣式顯示目前空間名稱與儲存按鈕",
        showWindowLayoutsRibbonIcon: "顯示「Window Spaces」側邊欄圖示",
        showWindowLayoutsRibbonIconDesc: "在主視窗左側邊欄顯示恢復與管理 Window Spaces 的單一入口",
        autoSaveInterval: "自動儲存間隔",
        minutes: "分鐘",
        resetSettings: "重設設定",
        resetSettingsDescription: "將所有設定重設為預設值。",
        resetButton: "重設設定",
        resetConfirmTitle: "確認重設",
        resetConfirmMessage: "您確定要重設所有設定嗎？這不會刪除您已儲存的空間。",
        resetSuccess: "設定重設成功",
        popoutSidebarSection: "Popout 視窗 View 設定",
        enableInterceptor: "將 View 路由至所屬的 Popout 視窗",
        enableInterceptorDesc: "當從 Popout 視窗開啟 View 時，不論目標是側欄或 editor tab area，都將 View 保留在該 Popout，而不是路由回主視窗。",
        leftBar: "左側 Activity Bar",
        rightBar: "右側 Activity Bar",
        addView: "新增 View",
        removeView: "移除",
        viewTypePlaceholder: "View type（例如 file-explorer）",
        pickIcon: "選擇圖示",
        restoreDefaultButtons: "還原預設按鈕",
        restoreDefaultIcon: "還原預設圖示",
        accentSection: "視窗外觀與圖示",
        defaultIcon: "預設 Popout 圖示",
        defaultIconDesc: "當 Space 未指定自訂 Icon 時使用的預設圖示",
        defaultBorderInset: "預設邊框 inset 厚度",
        defaultBorderInsetDesc: "設定為 0 時不顯示 Popout 視窗邊框",
        defaultFoldedCorner: "預設顯示左上角折頁裝飾",
        defaultFoldedCornerDesc: "在 Popout 視窗左上角顯示折頁裝飾",
        defaultActivityBarVisibility: "新建 Window Space 時預設顯示此 Activity Bar",
        defaultActivityBarVisibilityDesc: "控制是否顯示整個 Activity Bar",
        dragToReorder: "拖曳排序",
        keepOneActivityBarView: "仍有其他可用 View 時，Activity Bar 至少要保留一個按鈕",
    },
    notifications: {
        layoutSaved: "空間儲存成功",
        layoutOverwritten: "已覆蓋更新空間",
        layoutRestored: "空間復原成功",
        layoutDeleted: "空間刪除成功",
        layoutRenamed: "空間重新命名成功",
        settingsReset: "設定重設成功",
        errorOccurred: "發生錯誤",
        invalidLayout: "無效的空間資料",
        cannotRestore: "無法復原空間",
        missingFilesNotice: "包含不存在的檔案",
        switchedToOpenWindow: "已切換至「{{name}}」之已開啟空間",
    },
    errors: {
        failedToSave: "儲存空間失敗",
        failedToRestore: "恢復空間失敗",
        failedToDelete: "刪除空間失敗",
        failedToRename: "重新命名空間失敗",
        layoutNotFound: "找不到空間",
        invalidData: "無效的資料格式",
        permissionDenied: "權限被拒絕",
        notInPopoutWindow: "請在彈出視窗（Popout Window）中執行此命令。",
        unknownError: "發生未知錯誤",
    },
    instructions: {
        navigate: "選擇項目",
        use: "套用",
        useNewWindow: "在新視窗開啟",
        dismiss: "關閉",
    },
    activityBar: {
        toggleColumn: "切換側欄",
        toggleGroup: "切換目前分頁群組",
        cannotHideLastPane: "無法隱藏最後一個可見的分頁",
        onlyInPopout: "此命令僅可在 Popout 視窗內使用",
        openSettings: "開啟 Window Spaces 設定",
    },
};

/**
 * 简体中文翻译
 */
const zhCN = {
    common: {
        save: "保存",
        restore: "恢复",
        cancel: "取消",
        delete: "删除",
        rename: "重命名",
        confirm: "确认",
        success: "成功",
        error: "错误",
        warning: "警告",
        loading: "加载中",
        close: "关闭",
        ok: "确定",
        layoutLabel: "空间",
        noLayout: "尚未应用空间",
        newWindow: "新窗口",
        edit: "编辑",
        windowLayouts: "Window Spaces",
        openAsPanel: "面板位置",
    },
    commands: {
        saveLayout: "保存当前空间",
        saveLayoutDirect: "直接保存当前空间",
        openLayouts: "打开切换器",
        openLayoutsRibbon: "打开 Window Spaces 切换器",
        openLayoutsPanel: "作为标签页面板打开",
        openLayoutsPanelLeft: "在左侧边栏打开",
        openLayoutsPanelRight: "在右侧边栏打开",
        toggleLeftActivityBar: "切换左侧 Activity Bar",
        toggleRightActivityBar: "切换右侧 Activity Bar",
        toggleCurrentPaneGroup: "切换当前标签组",
    },
    saveModal: {
        title: "空间设置",
        nameLabel: "空间名称",
        namePlaceholder: "输入空间名称...",
        descriptionLabel: "描述（可选）",
        descriptionPlaceholder: "输入空间描述...",
        infoSection: "空间信息",
        windowSize: "窗口大小",
        includePosition: "包含窗口位置",
        includePositionDesc: "保存窗口在屏幕上的位置坐标",
        includeWindowSize: "包含窗口大小",
        includeWindowSizeDesc: "保存窗口的宽度与高度",
        includeGeometry: "包含窗口位置与大小",
        includeGeometryDesc: "保存并恢复窗口在屏幕上的坐标位置与宽高尺寸",
        andOthers: "及其他",
        overwriteNotice: "将覆盖更新现有空间",
        saveButton: "保存空间",
        cancelButton: "取消",
        emptyNameError: "空间名称不能为空",
        duplicateNameError: "此名称的空间已存在",
        iconLabel: "图标 / Emoji",
        iconPlaceholder: "例如：🚀 或 star",
        colorLabel: "窗口边框颜色",
        colorPresetLabel: "快捷调色盘",
        clearColor: "清除颜色",
        saveSuccess: "空间保存成功",
        autoSaveToggle: "启用此空间的自动保存",
        borderInset: "边框 inset 厚度",
        borderInsetDesc: "设置数值时绘制自定义边框；未修改时保留 Obsidian 原生 accent 边框",
        foldedCorner: "显示左上角折页装饰",
        foldedCornerDesc: "未修改时跟随全局默认值",
        activityBarsSection: "Activity Bars",
        showActivityBar: "显示",
        showActivityBarTitle: "显示此侧 Activity Bar",
        showActivityBarDesc: "开启时，此空间会在 Popout 窗口显示该侧 Activity Bar",
        showLeftActivityBar: "显示左侧 Activity Bar",
        showRightActivityBar: "显示右侧 Activity Bar",
        activityBarViewButtons: "View 按钮",
        spaceSection: "空间",
        windowAppearanceSection: "窗口外观",
        behaviorSection: "空间行为",
        sectionsSection: "Section 分组",
    },
    restoreModal: {
        title: "恢复空间",
        selectLayout: "选择要恢复的空间：",
        noLayoutsMessage: "没有找到已保存的空间。",
        restoreButton: "恢复空间",
        restoreHint: "恢复空间（点击或按 Enter 在新窗口打开；长按空间项或恢复按钮、按住 Shift 点击或按 Shift+Enter 应用至当前窗口）",
        cancelButton: "取消",
        restoreSuccess: "空间恢复成功",
        restoreError: "恢复空间失败",
        includedFiles: "包含文件",
        restoringLayout: "正在恢复空间",
    },
    manageModal: {
        title: "管理 Window Spaces",
        noLayoutsMessage: "没有找到已保存的空间。",
        searchPlaceholder: "查找或创建空间...",
        enterToCreate: "Enter 键以创建",
        clearSearch: "清除搜索",
        saveCurrentButton: "Save",
        layoutName: "空间名称",
        createdDate: "创建时间",
        updatedDate: "更新时间",
        fileCount: "文件数",
        tabCount: "标签页数",
        actions: "操作",
        renameButton: "重命名",
        deleteButton: "删除",
        confirmDeleteTitle: "删除空间",
        confirmDeleteMessage: "您确定要删除这个空间吗？此操作无法撤销。",
        deleteSuccess: "空间删除成功",
        renameSuccess: "空间重命名成功",
        sortDateDesc: "更新时间 (最新)",
        sortDateAsc: "更新时间 (较旧)",
        sortUpdatedDesc: "更新时间 (最新)",
        sortUpdatedAsc: "更新时间 (较旧)",
        sortCreatedDesc: "创建时间 (最新)",
        sortCreatedAsc: "创建时间 (较旧)",
        sortNameAsc: "名称 (A-Z)",
        sortNameDesc: "名称 (Z-A)",
        autoSaveEnabled: "自动保存已启用",
        autoSaveDisabled: "自动保存已禁用",
        windowOpenBadge: "窗口已打开",
        viewOptions: "显示选项",
        groupBySection: "按 Section 分组",
        flatView: "不分组列表",
        showArchived: "显示归档空间",
        hideArchived: "隐藏归档空间",
        uncategorized: "未分类",
        archivedGroup: "📦 归档空间",
        archiveSpace: "归档空间",
        unarchiveSpace: "取消归档",
        archiveSuccess: "已归档空间",
        unarchiveSuccess: "已取消归档空间",
        renameSection: "重命名 Section",
        sectionsLabel: "Section 分组标签",
        sectionsPlaceholder: "输入 Section 名称后按 Enter...",
        sectionHeaderHint: "点击折叠/展开 · 双击重命名 · 拖拽排序",
        sectionHeaderHintStatic: "点击折叠/展开",
    },
    settings: {
        title: "Window Spaces 设置",
        description: "管理您的 Window Spaces 并配置自动保存选项。",
        autoSaveSection: "常规与自动保存设置",
        autoSaveDescription: "定期自动保存 Window Spaces。",
        autoSaveEnabled: "启用自动保存",
        showNotifications: "显示通知",
        showNotificationsDesc: "在保存或恢复空间时显示通知消息",
        layoutDisplaySection: "Popout 空间显示",
        showLayoutStatusBar: "显示空间状态栏",
        showLayoutStatusBarDesc: "在每个 Popout 窗口左下方以状态栏样式显示当前空间名称与保存按钮",
        showWindowLayoutsRibbonIcon: "显示“Window Spaces”侧边栏图标",
        showWindowLayoutsRibbonIconDesc: "在主窗口左侧边栏显示恢复与管理 Window Spaces 的单一入口",
        autoSaveInterval: "自动保存间隔",
        minutes: "分钟",
        resetSettings: "重置设置",
        resetSettingsDescription: "将所有设置重置为默认值。",
        resetButton: "重置设置",
        resetConfirmTitle: "确认重置",
        resetConfirmMessage: "您确定要重置所有设置吗？这不会删除您已保存的空间。",
        resetSuccess: "设置重置成功",
        popoutSidebarSection: "Popout 窗口 View 设置",
        enableInterceptor: "将 View 路由至所属的 Popout 窗口",
        enableInterceptorDesc: "从 Popout 窗口打开 View 时，无论目标是侧栏还是 editor tab area，都会保留在该 Popout，而不是路由回主窗口。",
        leftBar: "左侧 Activity Bar",
        rightBar: "右侧 Activity Bar",
        addView: "添加 View",
        removeView: "移除",
        viewTypePlaceholder: "View type（例如 file-explorer）",
        pickIcon: "选择图标",
        restoreDefaultButtons: "还原默认按钮",
        restoreDefaultIcon: "还原默认图标",
        accentSection: "窗口外观与图标",
        defaultIcon: "默认 Popout 图标",
        defaultIconDesc: "当 Space 未指定自定义 Icon 时使用的默认图标",
        defaultBorderInset: "默认边框 inset 厚度",
        defaultBorderInsetDesc: "设置为 0 时不显示 Popout 窗口边框",
        defaultFoldedCorner: "默认显示左上角折页装饰",
        defaultFoldedCornerDesc: "在 Popout 窗口左上角显示折页装饰",
        defaultActivityBarVisibility: "新建 Window Space 时默认显示此 Activity Bar",
        defaultActivityBarVisibilityDesc: "控制是否显示整个 Activity Bar",
        dragToReorder: "拖放排序",
        keepOneActivityBarView: "仍有其他可用 View 时，Activity Bar 至少要保留一个按钮",
    },
    notifications: {
        layoutSaved: "空间保存成功",
        layoutOverwritten: "已覆盖更新空间",
        layoutRestored: "空间恢复成功",
        layoutDeleted: "空间删除成功",
        layoutRenamed: "空间重命名成功",
        settingsReset: "设置重置成功",
        errorOccurred: "发生错误",
        invalidLayout: "无效的空间数据",
        cannotRestore: "无法恢复空间",
        missingFilesNotice: "包含不存在的文件",
        switchedToOpenWindow: "已切换至「{{name}}」的已打开空间",
    },
    errors: {
        failedToSave: "保存空间失败",
        failedToRestore: "恢复空间失败",
        failedToDelete: "删除空间失败",
        failedToRename: "重命名空间失败",
        layoutNotFound: "找不到空间",
        invalidData: "无效的数据格式",
        permissionDenied: "权限被拒绝",
        notInPopoutWindow: "请在弹出窗口（Popout Window）中执行此命令。",
        unknownError: "发生未知错误",
    },
    instructions: {
        navigate: "选择",
        use: "应用",
        useNewWindow: "在新窗口打开",
        dismiss: "关闭",
    },
    activityBar: {
        toggleColumn: "切换侧栏",
        toggleGroup: "切换当前标签组",
        cannotHideLastPane: "无法隐藏最后一个可见的标签",
        onlyInPopout: "此命令只能在 Popout 窗口内使用",
        openSettings: "打开 Window Spaces 设置",
    },
};

/**
 * 國際化管理器
 */
class I18nManager {
    constructor(app) {
        this.currentLocale = "en";
        this.translations = {
            en: en,
            "zh-TW": zhTW,
            "zh-CN": zhCN,
        };
        this.app = app;
        this.currentLocale = this.detectLocale();
    }
    /**
     * 檢測當前語言環境 (多重源實時動態求值)
     */
    detectLocale() {
        var _a, _b, _c;
        try {
            // 1. 優先讀取 window.localStorage.getItem("language") (Obsidian 官方語言切換儲存位置)
            const langStorage = typeof window !== "undefined" ? window.localStorage.getItem("language") : null;
            // 2. 讀取 Obsidian 內建 moment.locale()
            const momentLocale = typeof window !== "undefined" && ((_a = window.moment) === null || _a === void 0 ? void 0 : _a.locale) ? window.moment.locale() : null;
            // 3. 讀取 app.vault.config
            const vaultConfig = (_c = (_b = this.app) === null || _b === void 0 ? void 0 : _b.vault) === null || _c === void 0 ? void 0 : _c.config;
            const vaultLocale = (vaultConfig === null || vaultConfig === void 0 ? void 0 : vaultConfig.locale) || (vaultConfig === null || vaultConfig === void 0 ? void 0 : vaultConfig.userLanguage);
            const rawLocale = String(langStorage || momentLocale || vaultLocale || "en").toLowerCase();
            if (rawLocale.startsWith("zh")) {
                if (rawLocale.includes("tw") ||
                    rawLocale.includes("hk") ||
                    rawLocale.includes("mo") ||
                    rawLocale.includes("hant") ||
                    rawLocale === "zh-cht") {
                    return "zh-TW";
                }
                return "zh-CN";
            }
        }
        catch (e) {
            console.warn("[Window Spaces] Failed to detect locale, fallback to en:", e);
        }
        return "en";
    }
    /**
     * 獲取當前語言環境
     */
    getCurrentLocale() {
        return this.detectLocale();
    }
    /**
     * 設置語言環境
     */
    setLocale(locale) {
        this.currentLocale = locale;
    }
    /**
     * 獲取翻譯字符串 (實時動態取得當前最新語系)
     */
    t(key) {
        const activeLocale = this.detectLocale();
        const keys = key.split(".");
        let value = this.translations[activeLocale];
        for (const k of keys) {
            if (value && typeof value === "object" && k in value) {
                value = value[k];
            }
            else {
                // 如果找不到翻譯，回退到英文
                value = this.translations["en"];
                for (const fallbackKey of keys) {
                    if (value && typeof value === "object" && fallbackKey in value) {
                        value = value[fallbackKey];
                    }
                    else {
                        return key; // 如果連英文都沒有，返回 key
                    }
                }
                break;
            }
        }
        return typeof value === "string" ? value : key;
    }
    /**
     * 獲取帶參數的翻譯字符串
     */
    tWithParams(key, params) {
        let translation = this.t(key);
        // 替換參數 {{param}}
        for (const [param, value] of Object.entries(params)) {
            translation = translation.replace(new RegExp(`{{${param}}}`, "g"), String(value));
        }
        return translation;
    }
    /**
     * 獲取所有支持的語言
     */
    getSupportedLocales() {
        return Object.keys(this.translations);
    }
    /**
     * 獲取語言的顯示名稱
     */
    getLocaleDisplayName(locale) {
        const displayNames = {
            en: "English",
            "zh-TW": "繁體中文",
            "zh-CN": "简体中文",
        };
        return displayNames[locale] || locale;
    }
    /**
     * 檢查是否為從右到左的語言
     */
    isRTL() {
        // 目前支持的語言都不是 RTL
        return false;
    }
    /**
     * 格式化日期
     */
    formatDate(date) {
        const localeMap = {
            en: "en-US",
            "zh-TW": "zh-TW",
            "zh-CN": "zh-CN",
        };
        try {
            return date.toLocaleDateString(localeMap[this.detectLocale()], {
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
            });
        }
        catch (error) {
            // 如果格式化失敗，回退到 ISO 格式
            return date.toISOString();
        }
    }
    /**
     * 格式化數字
     */
    formatNumber(num) {
        const localeMap = {
            en: "en-US",
            "zh-TW": "zh-TW",
            "zh-CN": "zh-CN",
        };
        try {
            return num.toLocaleString(localeMap[this.detectLocale()]);
        }
        catch (error) {
            return String(num);
        }
    }
}
/**
 * 全域 i18n 實例
 */
let i18nInstance = null;
/**
 * 初始化國際化系統
 */
function initI18n(app) {
    i18nInstance = new I18nManager(app);
    return i18nInstance;
}
/**
 * 獲取 i18n 實例
 */
function getI18n() {
    if (!i18nInstance) {
        throw new Error("I18n not initialized. Call initI18n() first.");
    }
    return i18nInstance;
}
/**
 * 便捷的翻譯函數
 */
function t(key) {
    return getI18n().t(key);
}
/**
 * 便捷的帶參數翻譯函數
 */
function tWithParams(key, params) {
    return getI18n().tWithParams(key, params);
}

/**
 * View type 列舉與解析工具。
 *
 * 三層組合（設計書 §4.3）：
 * 1. 內建精選清單（固定、可離線）。
 * 2. 防禦式讀取 `app.viewRegistry.viewByType`（非公開 API，try/catch）。
 * 3. 自訂 type 輸入（由設定頁處理）。
 */
/** 內建側欄可用的精選 View（icon 為 Lucide icon 名稱）。 */
const BUILTIN_SIDEBAR_VIEWS = [
    { viewType: "file-explorer", label: "File explorer", icon: "folder", side: "left" },
    { viewType: "search", label: "Search", icon: "search", side: "left" },
    { viewType: "outline", label: "Outline", icon: "list-tree", side: "left" },
    { viewType: "window-spaces-layouts", label: "Window Spaces", icon: "layout", side: "left" },
    { viewType: "bookmarks", label: "Bookmarks", icon: "bookmark", side: "right" },
    { viewType: "backlink", label: "Backlinks", icon: "link", side: "right" },
    { viewType: "tag", label: "Tags", icon: "tag", side: "right" },
    { viewType: "all-properties", label: "Properties", icon: "list", side: "right" },
    { viewType: "canvas", label: "Canvas", icon: "frame", side: "right" },
];
/** 已知非側欄可嵌入的 View type（列舉時排除）。 */
const EXCLUDED_VIEW_TYPES = new Set([
    "empty",
    "markdown",
    "pdf",
    "image",
    "audio",
    "video",
    "release-notes",
    "sync",
]);
function getViewRegistry(app) {
    var _a;
    return (_a = app === null || app === void 0 ? void 0 : app.viewRegistry) !== null && _a !== void 0 ? _a : {};
}
/** 從 viewRegistry 動態取得 view type 清單（防禦式）。 */
function getRegistryViewTypes(app) {
    try {
        const registry = getViewRegistry(app);
        const viewByType = registry.viewByType;
        if (!viewByType || typeof viewByType !== "object")
            return [];
        return Object.keys(viewByType).filter((type) => !EXCLUDED_VIEW_TYPES.has(type));
    }
    catch (_a) {
        return [];
    }
}
/** 設定 icon 並驗證是否成功渲染（無效名稱會產生空 svg）。 */
function setIconWithCheck(el, name) {
    try {
        el.empty();
        obsidian.setIcon(el, name);
        const svg = el.querySelector("svg");
        return !!svg && svg.children.length > 0;
    }
    catch (_a) {
        return false;
    }
}
/** 檔案類型 view 的固定 icon（Obsidian 無公開的文件類型 icon API）。 */
const FILE_VIEW_ICONS = {
    markdown: "file-text",
    pdf: "file-text",
    image: "image",
    audio: "audio",
    video: "video",
    canvas: "frame",
};
/** 取得某 view type 的 icon（檔案固定 icon → 快取 → 內建清單 → fallback）。 */
function resolveViewIcon(_app, viewType) {
    var _a, _b;
    const fixedFileIcon = FILE_VIEW_ICONS[viewType];
    if (fixedFileIcon)
        return fixedFileIcon;
    const cached = iconCache.get(viewType);
    if (cached === null || cached === void 0 ? void 0 : cached.icon)
        return cached.icon;
    const builtin = BUILTIN_SIDEBAR_VIEWS.find((item) => item.viewType === viewType);
    const icon = (_a = builtin === null || builtin === void 0 ? void 0 : builtin.icon) !== null && _a !== void 0 ? _a : null;
    iconCache.set(viewType, { icon, dynamicAttempted: (_b = cached === null || cached === void 0 ? void 0 : cached.dynamicAttempted) !== null && _b !== void 0 ? _b : false });
    return icon !== null && icon !== void 0 ? icon : "layout";
}
/**
 * 把 view 的 icon 套用到按鈕上：
 * - 0：檔案類型 view 使用固定 icon。
 * - 快取/內建硬編碼 icon。
 * - 兜底："layout"。
 * 若 `opts.allowDynamicIcon`（activity bar 中的 view 且無自訂 icon），在一般路徑都找不到
 * icon 時，會以非同步觸發動態偵測（掃描全部視窗已開啟的 leaf → 動態建立不可見實體），
 * 找到後直接更新按鈕。
 */
function applyViewIcon(btn, app, viewType, opts) {
    var _a, _b, _c;
    // 0：檔案類型 view 使用固定 icon
    const fixedFileIcon = FILE_VIEW_ICONS[viewType];
    if (fixedFileIcon && setIconWithCheck(btn, fixedFileIcon))
        return;
    const cached = iconCache.get(viewType);
    const icon = (_c = (_a = cached === null || cached === void 0 ? void 0 : cached.icon) !== null && _a !== void 0 ? _a : (_b = BUILTIN_SIDEBAR_VIEWS.find((item) => item.viewType === viewType)) === null || _b === void 0 ? void 0 : _b.icon) !== null && _c !== void 0 ? _c : null;
    if (icon) {
        setIconWithCheck(btn, icon);
    }
    else {
        obsidian.setIcon(btn, "layout");
    }
    // 動態偵測（gated）：僅在「無固定/內建 icon」且「此 view 位於 activity bar」且「尚未嘗試過」時進行，
    // 避免為無關 view 浪費掃描 / 建立實體的開銷。
    if (!icon && (opts === null || opts === void 0 ? void 0 : opts.allowDynamicIcon) && !(cached === null || cached === void 0 ? void 0 : cached.dynamicAttempted)) {
        iconCache.set(viewType, { icon: null, dynamicAttempted: true });
        void detectViewIcon(app, viewType).then((dynamicIcon) => {
            if (!dynamicIcon)
                return;
            iconCache.set(viewType, { icon: dynamicIcon, dynamicAttempted: true });
            if (btn.isConnected)
                setIconWithCheck(btn, dynamicIcon);
        });
    }
}
/**
 * 套用 ActivityBarItem 的 icon：若有自訂 icon 先用自訂，否則走 applyViewIcon
 * （並允許動態偵測，因為這是 activity bar 中已設定的 view）。
 */
function applyItemIcon(btn, app, item) {
    if (item.icon && setIconWithCheck(btn, item.icon))
        return;
    applyViewIcon(btn, app, item.viewType, { allowDynamicIcon: true });
}
const iconCache = new Map();
/** 掃描全部視窗已開啟的 leaf，找該 view 的實體並取其 `view.getIcon()`。 */
function findIconFromOpenLeaves(app, viewType) {
    let found = null;
    const ws = app.workspace;
    if (typeof ws.iterateAllLeaves !== "function")
        return null;
    ws.iterateAllLeaves((leaf) => {
        if (found)
            return;
        const view = leaf === null || leaf === void 0 ? void 0 : leaf.view;
        if (!view)
            return;
        try {
            const vt = typeof view.getViewType === "function" ? view.getViewType() : "";
            if (vt !== viewType)
                return;
            const icon = typeof view.getIcon === "function" ? view.getIcon() : "";
            if (icon && typeof icon === "string")
                found = icon;
        }
        catch (_a) {
            // skip this leaf
        }
    });
    return found;
}
/** 以多種內部存取方式取得 view creator（registry 方法 → entry 欄位）。 */
function getViewCreatorForType(app, viewType) {
    var _a;
    const registry = getViewRegistry(app);
    let creator = null;
    if (typeof registry.getViewCreator === "function") {
        const c = registry.getViewCreator(viewType);
        if (typeof c === "function")
            creator = c;
    }
    if (!creator) {
        const entry = ((_a = registry.viewByType) !== null && _a !== void 0 ? _a : {})[viewType];
        // 情況 A：viewByType[type] 本身就是 view creator function
        if (typeof entry === "function") {
            creator = entry;
        }
        else if (entry && typeof entry === "object") {
            // 情況 B：entry 物件內含 creator 欄位
            for (const key of ["creator", "view", "viewCreator"]) {
                const candidate = entry[key];
                if (typeof candidate === "function") {
                    creator = candidate;
                    break;
                }
            }
        }
    }
    return creator;
}
/** 嘗試直接呼叫 registry entry 上的 getIcon（若 Obsidian 內部有提供）。 */
function getIconFromRegistryEntry(app, viewType) {
    var _a;
    const entry = (_a = getViewRegistry(app).viewByType) === null || _a === void 0 ? void 0 : _a[viewType];
    if (entry && typeof entry.getIcon === "function") {
        try {
            const icon = entry.getIcon();
            if (icon && typeof icon === "string")
                return icon;
        }
        catch (_b) {
            // fallthrough
        }
    }
    return null;
}
/** 動態建立該 view 的一個不可見實體（detached container）並取其 `getIcon()`。 */
function getIconFromEphemeralView(app, viewType) {
    return __awaiter(this, void 0, void 0, function* () {
        const creator = getViewCreatorForType(app, viewType);
        if (!creator)
            return null;
        const host = document.createElement("div");
        host.style.display = "none";
        try {
            document.body.appendChild(host);
            // 提供完整點的 fake leaf（Obsidian View 建構子會讀 leaf.app / viewState / history 等）
            const leaf = {
                app,
                containerEl: host,
                view: null,
                viewState: { type: viewType, state: {}, eState: {} },
                // View 基底建構子建立導覽按鈕時會讀 leaf.history.backHistory / forwardHistory
                history: { backHistory: [], forwardHistory: [] },
                parent: null,
                getViewState: () => ({ type: viewType, state: {}, eState: {} }),
                setViewState: () => Promise.resolve(),
                getRoot: () => null,
                detach: () => undefined,
            };
            const view = creator(leaf);
            leaf.view = view;
            const icon = typeof view.getIcon === "function" ? view.getIcon() : "";
            return icon && typeof icon === "string" ? icon : null;
        }
        catch (error) {
            console.debug(`[Window Spaces] Ephemeral view creation failed for "${viewType}"`, error);
            return null;
        }
        finally {
            host.remove();
        }
    });
}
/** 以真實 leaf（getLeaf + setViewState）建立實體取 icon，讀取後立即 detach。 */
function getIconFromRealLeaf(app, viewType) {
    return __awaiter(this, void 0, void 0, function* () {
        const workspace = app.workspace;
        if (typeof workspace.getLeaf !== "function")
            return null;
        let leaf = null;
        try {
            leaf = workspace.getLeaf("tab");
            // 先隱藏 leaf 容器再開 view，避免 tab 開啟觸發版面計算（forced reflow）
            const container = leaf.containerEl;
            if (container instanceof HTMLElement) {
                container.style.display = "none";
            }
            yield leaf.setViewState({ type: viewType, active: false, state: {} });
            const view = leaf.view;
            const icon = view && typeof view.getIcon === "function" ? view.getIcon() : "";
            return icon && typeof icon === "string" ? icon : null;
        }
        catch (_a) {
            return null;
        }
        finally {
            if (leaf && typeof leaf.detach === "function") {
                try {
                    leaf.detach();
                }
                catch (_b) {
                    // ignore
                }
            }
        }
    });
}
/** 動態偵測 view icon：掃全部視窗 → registry entry → 不可見實體 → 真實 leaf 兜底。 */
function detectViewIcon(app, viewType) {
    return __awaiter(this, void 0, void 0, function* () {
        const openIcon = findIconFromOpenLeaves(app, viewType);
        if (openIcon)
            return openIcon;
        const entryIcon = getIconFromRegistryEntry(app, viewType);
        if (entryIcon)
            return entryIcon;
        const ephemeralIcon = yield getIconFromEphemeralView(app, viewType);
        if (ephemeralIcon)
            return ephemeralIcon;
        return getIconFromRealLeaf(app, viewType);
    });
}
/**
 * 重新進行動態 icon 偵測（掃描全部視窗 + 動態建立不可見實體）。
 * 用於使用者從 View type list 選定新的 view、且該 view 尚未解析到 icon 時。
 * 已有 icon 時直接回傳快取結果。
 */
function ensureViewIcon(app, viewType) {
    return __awaiter(this, void 0, void 0, function* () {
        const cached = iconCache.get(viewType);
        if (cached === null || cached === void 0 ? void 0 : cached.icon)
            return cached.icon;
        const icon = yield detectViewIcon(app, viewType);
        iconCache.set(viewType, { icon, dynamicAttempted: true });
        return icon;
    });
}
/** 設定頁 icon 選擇器提供的候選 icon 清單。 */
const ICON_CHOICES = [
    "folder", "search", "list-tree", "bookmark", "link", "tag", "list",
    "layout", "frame", "canvas", "history", "star", "hash", "file-text",
    "image", "audio", "video", "calendar", "mail", "message-square",
    "command", "terminal", "code", "pen", "pencil", "note", "copy",
    "settings", "sliders-horizontal", "filter", "globe", "eye",
    "eye-off", "check", "x", "plus", "minus", "arrow-right", "arrow-left",
    "arrow-up", "arrow-down", "chevron-up", "chevron-down", "chevron-left",
    "chevron-right", "panel-left", "panel-right", "panel-top", "panel-bottom",
    "columns", "rows", "layout-grid", "layout-list", "grid", "inbox",
    "archive", "trash", "refresh-cw", "more-horizontal", "more-vertical",
];
/**
 * 將 viewType ID 美化為標題大小寫（如 "folder-spaces-explorer" -> "Folder Spaces Explorer"）。
 */
function formatViewTypeId(viewType) {
    if (!viewType)
        return "";
    return viewType
        .split(/[-_]+/)
        .filter(Boolean)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
}
/** 取得某 view type 的顯示名稱（registry → 內建清單 → 美化 viewType）。 */
function resolveViewLabel(app, viewType) {
    // 1. 優先取 view 自己在 viewRegistry 註冊的 display text
    try {
        const registry = getViewRegistry(app);
        const label = typeof registry.getDisplayText === "function" ? registry.getDisplayText(viewType) : "";
        if (label)
            return label;
    }
    catch (_a) {
        // fallthrough
    }
    // 2. 取內建清單
    const builtin = BUILTIN_SIDEBAR_VIEWS.find((item) => item.viewType === viewType);
    if (builtin === null || builtin === void 0 ? void 0 : builtin.label)
        return builtin.label;
    // 3. Fallback：純粹將 ID 的 '-' 替換為空格，單詞首字母大寫
    return formatViewTypeId(viewType);
}
/** 依 view 的顯示名稱排序，名稱相同時以 view type 作穩定排序。 */
function sortViewTypesByLabel(app, viewTypes) {
    return [...viewTypes].sort((a, b) => {
        const labelOrder = resolveViewLabel(app, a).localeCompare(resolveViewLabel(app, b), undefined, { sensitivity: "base" });
        return labelOrder || a.localeCompare(b);
    });
}
/**
 * 將內建精選 + 動態 registry view 合併為「可用 view type」清單（去重）。
 * 回傳 items 已依照 `side` 分派至 left / right。
 */
function enumerateAvailableViews(app) {
    const seen = new Set();
    const left = [];
    const right = [];
    const push = (item) => {
        if (seen.has(item.viewType))
            return;
        seen.add(item.viewType);
        if (item.side === "right")
            right.push(item);
        else
            left.push(item);
    };
    BUILTIN_SIDEBAR_VIEWS.forEach(push);
    const registryTypes = getRegistryViewTypes(app);
    for (const type of registryTypes) {
        if (!seen.has(type)) {
            push({
                viewType: type,
                side: "left",
            });
        }
    }
    return { left, right };
}

/** The neutral icon used when a Space has no custom icon or emoji. */
const DEFAULT_SPACE_ICON = "square";
function resolveSpaceIcon(icon, configuredDefaultIcon) {
    return (icon === null || icon === void 0 ? void 0 : icon.trim()) || (configuredDefaultIcon === null || configuredDefaultIcon === void 0 ? void 0 : configuredDefaultIcon.trim()) || DEFAULT_SPACE_ICON;
}
function isSpaceEmoji(value) {
    return /\p{Extended_Pictographic}/u.test(value) || !/^[a-zA-Z0-9-]+$/.test(value);
}

/**
 * 統一的 Window Layouts 視窗：搜尋、恢復與管理都在同一個入口完成。
 */
class WindowLayoutsModal extends obsidian.Modal {
    static renderAllInstances() {
        for (const instance of WindowLayoutsModal.activeInstances) {
            instance.renderLayouts();
        }
    }
    constructor(app, plugin, targetWindow) {
        super(app);
        this.filteredLayouts = [];
        this.selectedIndex = 0;
        this.panelMode = false;
        this.renderedLayoutEntries = [];
        this.plugin = plugin;
        this.targetWindow = targetWindow;
    }
    onOpen() {
        var _a, _b;
        try {
            WindowLayoutsModal.activeInstances.add(this);
            this.modalEl.addClass("window-layouts-modal");
            const modalWindow = (_a = this.modalEl.ownerDocument) === null || _a === void 0 ? void 0 : _a.defaultView;
            const modalBody = (_b = modalWindow === null || modalWindow === void 0 ? void 0 : modalWindow.document) === null || _b === void 0 ? void 0 : _b.body;
            if (modalWindow &&
                modalBody &&
                (modalBody.classList.contains("is-popout-window") ||
                    modalBody.classList.contains("mod-popout"))) {
                this.targetWindow = modalWindow;
            }
            this.setTitle(t("common.windowLayouts"));
            const titleHeader = this.containerEl.querySelector(".modal-title");
            if (titleHeader) {
                this.createHeaderActions(titleHeader);
            }
            this.renderContent();
        }
        catch (err) {
            console.error("[WindowSpaces] Error during WindowLayoutsModal onOpen:", err);
            WindowLayoutsModal.activeInstances.delete(this);
            this.removeKeydownListener();
            // Keep the native Modal alive and visibly report the failure. Closing a
            // Modal while Obsidian is still running Modal.open()/onOpen() can leave
            // its keyboard scope above the Command Palette scope.
            const message = err instanceof Error ? err.message : String(err);
            this.contentEl.empty();
            this.contentEl.createEl("p", {
                text: `Error loading Window Spaces: ${message}`,
            });
        }
    }
    /**
     * Render this modal's content inside an ItemView (or another host).
     * The modal instance is intentionally kept as the controller so the panel
     * and modal always expose the same layout actions and keyboard behavior.
     */
    mountInContainer(rootEl, isSidebar, isPanelActive) {
        WindowLayoutsModal.activeInstances.add(this);
        this.panelRootEl = rootEl;
        this.isPanelActive = isPanelActive;
        this.panelMode = true;
        this.renderContent();
    }
    /**
     * Mount the shared picker inside a plain native Obsidian Modal.
     *
     * This deliberately avoids calling WindowLayoutsModal.open(): Obsidian
     * 1.13 can fail while opening a subclass with a complex onOpen lifecycle,
     * while a native Modal plus mounted content remains reliable.
     */
    mountInModalContainer(rootEl, closeHost) {
        WindowLayoutsModal.activeInstances.add(this);
        this.panelRootEl = rootEl;
        this.isPanelActive = undefined;
        this.panelMode = false;
        this.externalHostClose = closeHost;
        this.renderContent();
    }
    unmountFromContainer() {
        var _a;
        WindowLayoutsModal.activeInstances.delete(this);
        this.removeKeydownListener();
        (_a = this.panelRootEl) === null || _a === void 0 ? void 0 : _a.empty();
        this.panelRootEl = undefined;
        this.isPanelActive = undefined;
        this.panelMode = false;
        this.externalHostClose = undefined;
    }
    getRootEl() {
        return this.panelRootEl || this.contentEl;
    }
    /**
     * Find the .modal-container that hosts this instance, if any. Panels hosted
     * in sidebars or editor tabs return null; popup pickers mounted inside a
     * native Modal return that modal's container so stacked modals (rename
     * dialog, Command Palette, ...) can be told apart from the picker itself.
     */
    getOwnModalContainer() {
        var _a;
        let el = this.getRootEl();
        const doc = el === null || el === void 0 ? void 0 : el.ownerDocument;
        while (el && doc && el !== doc.documentElement) {
            if (typeof ((_a = el.classList) === null || _a === void 0 ? void 0 : _a.contains) === "function" && el.classList.contains("modal-container")) {
                return el;
            }
            el = el.parentElement;
        }
        return null;
    }
    closeHost() {
        if (this.externalHostClose) {
            this.externalHostClose();
        }
        else if (!this.panelMode) {
            this.close();
        }
    }
    renderContent() {
        var _a, _b, _c, _d;
        const contentEl = this.getRootEl();
        contentEl.empty();
        // This is the shared content component's root class. It must be present
        // on both the Modal content and the ItemView content so the same layout
        // item styles are applied in every host.
        contentEl.addClass("window-layouts-modal");
        contentEl.addClass("window-spaces-modal");
        if (this.panelMode)
            contentEl.addClass("window-layouts-panel");
        // The panel header is intentionally recreated after empty() so it is
        // part of the same root that owns the toolbar and list.
        if (this.panelMode) {
            const panelHeader = contentEl.createDiv("nav-header window-layouts-panel-header");
            this.createHeaderActions(panelHeader);
        }
        const toolbar = contentEl.createDiv("window-layouts-toolbar");
        const searchContainer = toolbar.createDiv("window-layouts-search-container search-input-container");
        this.searchInput = searchContainer.createEl("input");
        this.searchInput.type = "search";
        this.searchInput.placeholder = t("manageModal.searchPlaceholder");
        this.searchInput.setAttribute("aria-label", t("manageModal.searchPlaceholder"));
        if (this.initialSearchQuery !== undefined) {
            this.searchInput.value = this.initialSearchQuery;
            this.initialSearchQuery = undefined;
        }
        this.clearSearchBtn = searchContainer.createDiv("window-layouts-search-clear");
        obsidian.setTooltip(this.clearSearchBtn, t("manageModal.clearSearch") || "Clear search");
        this.clearSearchBtn.onclick = (e) => {
            e.stopPropagation();
            if (this.searchInput) {
                this.searchInput.value = "";
                this.searchInput.focus();
            }
            this.selectedIndex = 0;
            this.renderLayouts();
        };
        this.searchInput.addEventListener("input", () => {
            this.selectedIndex = 0;
            this.renderLayouts();
        });
        this.listEl = contentEl.createDiv("window-layouts-list");
        this.listEl.setAttribute("role", "listbox");
        this.renderLayouts();
        const instructionsEl = contentEl.createDiv("prompt-instructions window-layouts-instructions");
        const navInst = instructionsEl.createDiv("prompt-instruction");
        navInst.createSpan({ text: "↑ ↓", cls: "prompt-instruction-command" });
        navInst.createSpan({ text: t("instructions.navigate") });
        const useInst = instructionsEl.createDiv("prompt-instruction");
        useInst.createSpan({ text: "Shift ↵", cls: "prompt-instruction-command" });
        useInst.createSpan({ text: t("instructions.use") });
        const newWinInst = instructionsEl.createDiv("prompt-instruction");
        newWinInst.createSpan({ text: "↵", cls: "prompt-instruction-command" });
        newWinInst.createSpan({ text: t("instructions.useNewWindow") });
        const dismissInst = instructionsEl.createDiv("prompt-instruction");
        dismissInst.createSpan({ text: "esc", cls: "prompt-instruction-command" });
        dismissInst.createSpan({ text: t("instructions.dismiss") });
        const targetDoc = contentEl.ownerDocument || document;
        const targetWindow = targetDoc.defaultView || window;
        this.removeKeydownListener();
        this.keydownListener = (event) => {
            var _a, _b, _c, _d, _e, _f;
            if (event.key !== "ArrowDown" && event.key !== "ArrowUp" && event.key !== "Enter") {
                return;
            }
            const activeEl = targetDoc.activeElement;
            const ownRootEl = this.getRootEl();
            // 當焦點位於 ownRootEl 之外的輸入框、編輯器或彈出對話框（如 Command Palette, Quick Switcher, Rename dialog 等）時，絕對不攔截按鍵
            if (activeEl && !ownRootEl.contains(activeEl)) {
                const tagName = (_a = activeEl.tagName) === null || _a === void 0 ? void 0 : _a.toUpperCase();
                if (tagName === "INPUT" ||
                    tagName === "TEXTAREA" ||
                    tagName === "SELECT" ||
                    activeEl.isContentEditable ||
                    ((_b = activeEl.classList) === null || _b === void 0 ? void 0 : _b.contains("cm-content")) ||
                    Boolean(activeEl.closest(".modal-container, .modal, .prompt, .prompt-container, .menu"))) {
                    return;
                }
            }
            let focusedInstance = null;
            for (const instance of WindowLayoutsModal.activeInstances) {
                const root = instance.getRootEl();
                if (activeEl && root && root.ownerDocument === targetDoc && root.contains(activeEl)) {
                    focusedInstance = instance;
                    break;
                }
            }
            // A panel or popup must never answer keys while the user is actually
            // typing in a DIFFERENT window (a popout). Obsidian forwards key events
            // between windows so core shortcuts keep working, so check the event's
            // origin window, the event target's document, and whether THIS document
            // currently holds OS focus. A forwarded event either keeps its original
            // window/document (caught by the first two checks) or is rebuilt in the
            // focused window (caught by document.hasFocus()).
            const eventView = event.view;
            const eventFromThisWindow = eventView == null || eventView === targetWindow;
            const eventTargetDoc = (_d = (_c = event.target) === null || _c === void 0 ? void 0 : _c.ownerDocument) !== null && _d !== void 0 ? _d : null;
            const eventTargetsThisDocument = eventTargetDoc == null || eventTargetDoc === targetDoc;
            const thisDocumentFocused = targetDoc.hasFocus();
            // 檢查畫面中是否有 Command Palette (.prompt), Quick Switcher, Menu 或 Stacked Modals
            const ownModalContainer = this.getOwnModalContainer();
            const overlays = Array.from(targetDoc.querySelectorAll(".modal-container, .modal, .prompt, .prompt-container, .menu"));
            const otherModalOpen = overlays.some((el) => {
                var _a;
                if (ownModalContainer && (el === ownModalContainer || ownModalContainer.contains(el))) {
                    return false;
                }
                if (ownRootEl.contains(el)) {
                    return false;
                }
                const style = (_a = targetDoc.defaultView) === null || _a === void 0 ? void 0 : _a.getComputedStyle(el);
                return (!el.classList.contains("is-hidden") &&
                    (style === null || style === void 0 ? void 0 : style.display) !== "none" &&
                    (style === null || style === void 0 ? void 0 : style.visibility) !== "hidden");
            });
            const menuOpen = Boolean(targetDoc.querySelector(".menu:not(.is-hidden)"));
            const anyPopupOpen = Array.from(WindowLayoutsModal.activeInstances).some((instance) => !instance.panelMode);
            const shouldHandle = eventFromThisWindow &&
                eventTargetsThisDocument &&
                thisDocumentFocused &&
                (this.panelMode
                    ? !otherModalOpen &&
                        !menuOpen &&
                        (focusedInstance === this ||
                            (!anyPopupOpen && ((_e = this.isPanelActive) === null || _e === void 0 ? void 0 : _e.call(this)) === true))
                    : !otherModalOpen && !menuOpen);
            if (!shouldHandle)
                return;
            if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                event.preventDefault();
                event.stopImmediatePropagation();
                this.handleArrowKey(event.key === "ArrowDown" ? 1 : -1);
                return;
            }
            if (activeEl && activeEl.tagName === "BUTTON")
                return;
            event.preventDefault();
            event.stopImmediatePropagation();
            const rawQuery = ((_f = this.searchInput) === null || _f === void 0 ? void 0 : _f.value.trim()) || "";
            // 高亮（方向鍵）是以 renderedLayoutEntries 的渲染順序移動；分組檢視下
            // 該順序與 filteredLayouts（排序順序）不同，必須以渲染順序取選中的 layout。
            const entry = this.renderedLayoutEntries[this.selectedIndex >= 0 ? this.selectedIndex : 0];
            const selectedLayout = entry ? entry.layout : this.filteredLayouts[0];
            if (selectedLayout) {
                void this.restoreLayout(selectedLayout, !event.shiftKey);
            }
            else if (rawQuery) {
                void this.createAndSaveLayout(rawQuery, !event.shiftKey);
            }
        };
        // Listen on Window capture so Obsidian's document/workspace keymap cannot
        // consume ArrowUp/ArrowDown before an active Window Spaces panel sees it.
        this.keydownTarget = targetWindow;
        this.keydownTarget.addEventListener("keydown", this.keydownListener, true);
        if (this.initialFocusTimer !== undefined) {
            const timerWindow = ((_b = (_a = this.modalEl) === null || _a === void 0 ? void 0 : _a.ownerDocument) === null || _b === void 0 ? void 0 : _b.defaultView) || window;
            timerWindow.clearTimeout(this.initialFocusTimer);
        }
        const focusWindow = ((_d = (_c = this.modalEl) === null || _c === void 0 ? void 0 : _c.ownerDocument) === null || _d === void 0 ? void 0 : _d.defaultView) || window;
        this.initialFocusTimer = focusWindow.setTimeout(() => {
            this.initialFocusTimer = undefined;
            if (this.searchInput && this.searchInput.isConnected !== false) {
                this.searchInput.focus();
            }
        }, 50);
    }
    createPanelButton(parentEl) {
        const panelButton = parentEl.createEl("button", {
            cls: "clickable-icon nav-action-button window-layouts-panel-btn",
            attr: { "aria-label": t("common.openAsPanel") },
        });
        obsidian.setIcon(panelButton, "layout");
        obsidian.setTooltip(panelButton, t("common.openAsPanel"));
        panelButton.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.showPanelMenu(e);
        };
    }
    createHeaderActions(parentEl) {
        const isPanelHeader = parentEl.classList.contains("window-layouts-panel-header");
        const actionsEl = parentEl.createDiv(isPanelHeader
            ? "nav-buttons-container window-layouts-header-actions"
            : "window-layouts-header-actions");
        // 1. 顯示選項按鈕 (View Options Dropdown)
        const viewOptionsButton = actionsEl.createEl("button", {
            cls: "clickable-icon nav-action-button window-layouts-view-options-btn",
            attr: { "aria-label": t("manageModal.viewOptions") || "View Options" },
        });
        obsidian.setIcon(viewOptionsButton, "eye");
        obsidian.setTooltip(viewOptionsButton, t("manageModal.viewOptions") || "View Options");
        viewOptionsButton.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.showViewOptionsMenu(e);
        };
        // 2. 排序按鈕 (Sort Dropdown)
        const sortButton = actionsEl.createEl("button", {
            cls: "clickable-icon nav-action-button window-layouts-sort-btn",
            attr: { "aria-label": t("manageModal.sortDateDesc") },
        });
        obsidian.setIcon(sortButton, "sort-asc");
        obsidian.setTooltip(sortButton, t("manageModal.sortDateDesc"));
        sortButton.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.showSortMenu(e);
        };
        this.createPanelButton(actionsEl);
    }
    /**
     * Mount the shared header action buttons (view options, sort, panel menu)
     * into a native modal's title bar so popup windows expose the same three
     * toolbar actions as the persistent panels.
     */
    mountHeaderActions(titleEl) {
        titleEl.classList.add("has-header-actions");
        if (titleEl.querySelector(".window-layouts-header-actions"))
            return;
        this.createHeaderActions(titleEl);
    }
    showViewOptionsMenu(event) {
        var _a;
        const menu = new obsidian.Menu();
        const settings = ((_a = this.plugin) === null || _a === void 0 ? void 0 : _a.settings) || {};
        const isGrouped = settings.groupBySection !== false;
        const isShowArchived = settings.showArchived === true;
        // 依 Section 分組切換
        menu.addItem((item) => {
            item
                .setTitle(isGrouped ? (t("manageModal.groupBySection") || "Group by Section") : (t("manageModal.flatView") || "Flat List"))
                .setIcon(isGrouped ? "check" : "grid")
                .onClick(() => __awaiter(this, void 0, void 0, function* () {
                var _a;
                settings.groupBySection = !isGrouped;
                yield ((_a = this.plugin) === null || _a === void 0 ? void 0 : _a.saveSettings());
                WindowLayoutsModal.renderAllInstances();
            }));
        });
        menu.addSeparator();
        // 顯示/隱藏封存空間切換
        menu.addItem((item) => {
            item
                .setTitle(isShowArchived ? (t("manageModal.hideArchived") || "Hide Archived") : (t("manageModal.showArchived") || "Show Archived"))
                .setIcon(isShowArchived ? "check" : "box")
                .onClick(() => __awaiter(this, void 0, void 0, function* () {
                var _a;
                settings.showArchived = !isShowArchived;
                yield ((_a = this.plugin) === null || _a === void 0 ? void 0 : _a.saveSettings());
                WindowLayoutsModal.renderAllInstances();
            }));
        });
        const target = event.currentTarget;
        const rect = target.getBoundingClientRect();
        menu.showAtPosition({ x: rect.left, y: rect.bottom + 4 });
    }
    handleArrowKey(direction) {
        if (this.renderedLayoutEntries.length === 0)
            return;
        if (this.selectedIndex < 0) {
            this.selectedIndex = direction > 0 ? 0 : this.renderedLayoutEntries.length - 1;
        }
        else {
            this.selectedIndex =
                (this.selectedIndex + direction + this.renderedLayoutEntries.length) % this.renderedLayoutEntries.length;
        }
        this.updateSelectedItemHighlight();
        this.scrollSelectedIntoView();
    }
    updateSelectedItemHighlight() {
        this.renderedLayoutEntries.forEach((entry, idx) => {
            const isSelected = idx === this.selectedIndex;
            entry.element.setAttribute("aria-selected", String(isSelected));
            entry.element.classList.toggle("is-selected", isSelected);
        });
    }
    updateSearchUI() {
        var _a;
        const rawQuery = ((_a = this.searchInput) === null || _a === void 0 ? void 0 : _a.value.trim()) || "";
        if (this.clearSearchBtn) {
            this.clearSearchBtn.style.display = rawQuery ? "flex" : "none";
        }
    }
    createAndSaveLayout(name, forceNewWindow = true) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o;
        return __awaiter(this, void 0, void 0, function* () {
            const cleanName = name.trim();
            if (!cleanName)
                return;
            try {
                const isPopout = (win) => {
                    var _a;
                    if (!win || !((_a = win.document) === null || _a === void 0 ? void 0 : _a.body))
                        return false;
                    const cl = win.document.body.classList;
                    return cl.contains("is-popout-window") || cl.contains("mod-popout");
                };
                const activeWin = typeof ((_a = this.plugin.manager) === null || _a === void 0 ? void 0 : _a.getActiveWindow) === "function"
                    ? this.plugin.manager.getActiveWindow()
                    : (this.targetWindow || (typeof activeWindow !== "undefined" ? activeWindow : window));
                const popoutWin = isPopout(activeWin) ? activeWin : (isPopout(this.targetWindow) ? this.targetWindow : null);
                if (popoutWin) {
                    // 紀錄來源 Popout 視窗原本的佈局名稱，避免 Clone 到新視窗時將原視窗誤重命名
                    const originalName = typeof ((_b = this.plugin.manager) === null || _b === void 0 ? void 0 : _b.getLayoutNameForWindow) === "function"
                        ? this.plugin.manager.getLayoutNameForWindow(popoutWin)
                        : null;
                    // 情境 1：在 Popout 視窗內執行 -> 複製 (Clone) 當前 Popout 視窗的活動佈局與檔案
                    const layout = yield this.plugin.manager.captureCurrentLayout({ name: cleanName }, popoutWin);
                    layout.name = cleanName;
                    // 當要在新視窗開啟時，切斷此 layout 與原視窗的存取對應，避免 saveLayout 將原視窗改名
                    if (forceNewWindow && ((_c = this.plugin.manager) === null || _c === void 0 ? void 0 : _c.layoutWindows)) {
                        this.plugin.manager.layoutWindows.delete(layout);
                    }
                    yield this.plugin.manager.saveLayout(layout);
                    if (forceNewWindow) {
                        // 恢復原 Popout 視窗原本的狀態列名稱
                        if (originalName && typeof ((_d = this.plugin.manager) === null || _d === void 0 ? void 0 : _d.setLayoutLabelForWindow) === "function") {
                            this.plugin.manager.setLayoutLabelForWindow(popoutWin, originalName);
                        }
                        // 先關閉 Modal，防止 Modal 關閉生命週期奪回原視窗的焦點
                        this.closeHost();
                        // 預設 (Enter / Click)：Clone 佈局後在「新 Popout 視窗」開啟該佈局 (傳入 targetWindow 作為排除目標)
                        yield this.plugin.manager.restoreLayout(layout, { forceNewWindow: true, targetWindow: popoutWin });
                        const newTargetWin = typeof ((_e = this.plugin.manager) === null || _e === void 0 ? void 0 : _e.getWindowForLayout) === "function"
                            ? this.plugin.manager.getWindowForLayout(layout)
                            : null;
                        if (newTargetWin && newTargetWin !== popoutWin && typeof newTargetWin.focus === "function") {
                            try {
                                newTargetWin.focus();
                            }
                            catch ( /* Ignore focus error */_p) { /* Ignore focus error */ }
                            newTargetWin.setTimeout(() => {
                                try {
                                    newTargetWin.focus();
                                }
                                catch ( /* Ignore focus error */_a) { /* Ignore focus error */ }
                            }, 100);
                            newTargetWin.setTimeout(() => {
                                try {
                                    newTargetWin.focus();
                                }
                                catch ( /* Ignore focus error */_a) { /* Ignore focus error */ }
                            }, 300);
                        }
                    }
                    else {
                        // 修飾鍵 (Shift+Enter / Shift+Click)：直接在「當前 Popout 視窗」套用與更新狀態列標籤
                        if ((_f = this.plugin.manager) === null || _f === void 0 ? void 0 : _f.layoutWindows) {
                            this.plugin.manager.layoutWindows.set(layout, popoutWin);
                        }
                        if (typeof ((_g = this.plugin.manager) === null || _g === void 0 ? void 0 : _g.setLayoutLabelForWindow) === "function") {
                            this.plugin.manager.setLayoutLabelForWindow(popoutWin, cleanName);
                        }
                        this.closeHost();
                    }
                }
                else {
                    // 情境 2：在主視窗中執行 -> 建立全新的 0 檔案 Popout 佈局，並開啟新 Popout 視窗
                    const newWin = yield this.plugin.manager.openNewPopoutWindow({ initializeDefaults: true });
                    if (!newWin) {
                        throw new Error(t("errors.cannotRestore"));
                    }
                    const emptyLayout = {
                        id: typeof ((_h = this.plugin.manager) === null || _h === void 0 ? void 0 : _h.generateId) === "function"
                            ? this.plugin.manager.generateId()
                            : `layout_${Date.now()}`,
                        name: cleanName,
                        timestamp: Date.now(),
                        windowState: {
                            size: { width: 800, height: 600 },
                            position: undefined,
                        },
                        workspace: {
                            layout: {
                                type: "leaf",
                                id: `leaf_${Date.now()}`,
                                state: { type: "empty", state: {} },
                            },
                            activeFile: undefined,
                            leaves: [],
                        },
                        activityBars: (_j = this.plugin.activityBars) === null || _j === void 0 ? void 0 : _j.getDefaultSettingsForNewSpace(),
                        metadata: {
                            fileCount: 0,
                            tabCount: 0,
                            splitCount: 0,
                            createdAt: new Date().toISOString(),
                            obsidianVersion: this.app.version || "unknown",
                            pluginVersion: ((_l = (_k = this.plugin) === null || _k === void 0 ? void 0 : _k.manifest) === null || _l === void 0 ? void 0 : _l.version) || "1.0.0",
                        },
                    };
                    yield this.plugin.manager.saveLayout(emptyLayout);
                    if (newWin) {
                        if ((_m = this.plugin.manager) === null || _m === void 0 ? void 0 : _m.layoutWindows) {
                            this.plugin.manager.layoutWindows.set(emptyLayout, newWin);
                        }
                        if (typeof ((_o = this.plugin.manager) === null || _o === void 0 ? void 0 : _o.setLayoutLabelForWindow) === "function") {
                            this.plugin.manager.setLayoutLabelForWindow(newWin, cleanName);
                            newWin.setTimeout(() => {
                                this.plugin.manager.setLayoutLabelForWindow(newWin, cleanName);
                            }, 50);
                            newWin.setTimeout(() => {
                                this.plugin.manager.setLayoutLabelForWindow(newWin, cleanName);
                            }, 300);
                        }
                        this.closeHost();
                        if (typeof newWin.focus === "function") {
                            try {
                                newWin.focus();
                            }
                            catch (_q) {
                                // Ignore focus error
                            }
                            newWin.setTimeout(() => {
                                try {
                                    newWin.focus();
                                }
                                catch (_a) {
                                    // Ignore focus error
                                }
                            }, 100);
                        }
                    }
                    else {
                        this.closeHost();
                    }
                }
                if (this.plugin.settings.showNotifications !== false) {
                    new obsidian.Notice(`${t("saveModal.saveSuccess")}: ${cleanName}`);
                }
                if (this.searchInput) {
                    this.searchInput.value = "";
                }
                this.selectedIndex = 0;
                WindowLayoutsModal.renderAllInstances();
            }
            catch (err) {
                this.closeHost();
                const message = err instanceof Error ? err.message : String(err);
                new obsidian.Notice(message);
            }
        });
    }
    renderLayouts() {
        var _a, _b, _c, _d;
        if (!this.listEl)
            return;
        this.listEl.empty();
        this.renderedLayoutEntries = [];
        const rawQuery = ((_a = this.searchInput) === null || _a === void 0 ? void 0 : _a.value.trim()) || "";
        const query = rawQuery.toLowerCase();
        const allSpaces = ((_c = (_b = this.plugin) === null || _b === void 0 ? void 0 : _b.manager) === null || _c === void 0 ? void 0 : _c.getSavedLayouts()) || [];
        const settings = ((_d = this.plugin) === null || _d === void 0 ? void 0 : _d.settings) || {};
        const showArchived = settings.showArchived === true;
        const groupBySection = settings.groupBySection !== false;
        // 搜尋與封存過濾
        const searchFiltered = allSpaces.filter((layout) => {
            if (!showArchived && layout.archived === true)
                return false;
            if (!query)
                return true;
            const matchName = layout.name.toLowerCase().includes(query);
            const matchSec = (layout.sections || []).some((s) => s.toLowerCase().includes(query));
            return matchName || matchSec;
        });
        this.filteredLayouts = searchFiltered;
        if (this.filteredLayouts.length > 0) {
            if (this.selectedIndex < 0 || this.selectedIndex >= this.filteredLayouts.length) {
                this.selectedIndex = 0;
            }
        }
        else {
            this.selectedIndex = -1;
        }
        this.updateSearchUI();
        if (this.filteredLayouts.length === 0) {
            if (rawQuery) {
                const createItem = this.listEl.createDiv("suggestion-item window-layout-item is-selected");
                const content = createItem.createDiv("suggestion-content qsp-content");
                const title = content.createDiv("suggestion-title qsp-title");
                title.createSpan({ text: rawQuery });
                const aux = createItem.createDiv("suggestion-aux qsp-aux");
                aux.createSpan({
                    text: t("manageModal.enterToCreate") || "Enter to create",
                    cls: "suggestion-flair",
                });
                createItem.onclick = (e) => {
                    void this.createAndSaveLayout(rawQuery, !e.shiftKey);
                };
            }
            else {
                this.listEl.createEl("p", {
                    text: t("manageModal.noLayoutsMessage"),
                    cls: "setting-item-description",
                });
            }
            return;
        }
        // 平舖清單 (Flat View 或搜尋狀態下)
        if (!groupBySection || rawQuery) {
            const activeSpaces = this.filteredLayouts.filter((l) => !l.archived);
            const archivedSpaces = this.filteredLayouts.filter((l) => l.archived === true);
            activeSpaces.forEach((layout) => {
                this.renderLayoutItem(this.listEl, layout);
            });
            if (showArchived) {
                archivedSpaces.forEach((layout) => {
                    this.renderLayoutItem(this.listEl, layout);
                });
            }
            this.updateSelectedItemHighlight();
            return;
        }
        // 分組清單 (Grouped View)
        const knownSectionsOrder = Array.from(settings.sectionsOrder || []);
        const presentSectionsSet = new Set();
        this.filteredLayouts.forEach((space) => {
            (space.sections || []).forEach((sec) => presentSectionsSet.add(sec));
        });
        presentSectionsSet.forEach((sec) => {
            if (!knownSectionsOrder.includes(sec)) {
                knownSectionsOrder.push(sec);
            }
        });
        knownSectionsOrder.forEach((secName) => {
            const matchingSpaces = this.filteredLayouts.filter((s) => (s.sections || []).includes(secName));
            const activeInSec = matchingSpaces.filter((s) => !s.archived);
            const archivedInSec = showArchived ? matchingSpaces.filter((s) => s.archived === true) : [];
            const totalCount = activeInSec.length + archivedInSec.length;
            if (totalCount === 0)
                return;
            this.renderSectionHeader(this.listEl, secName, totalCount, knownSectionsOrder, true);
            const isCollapsed = WindowLayoutsModal.collapsedSections.has(secName);
            if (!isCollapsed) {
                const secContainer = this.listEl.createDiv("space-section-container");
                activeInSec.forEach((layout) => {
                    this.renderLayoutItem(secContainer, layout);
                });
                archivedInSec.forEach((layout) => {
                    this.renderLayoutItem(secContainer, layout);
                });
            }
        });
        // 未分類 (Uncategorized)
        const uncategorizedSpaces = this.filteredLayouts.filter((s) => !s.sections || s.sections.length === 0);
        const activeUncat = uncategorizedSpaces.filter((s) => !s.archived);
        const archivedUncat = showArchived ? uncategorizedSpaces.filter((s) => s.archived === true) : [];
        const totalUncat = activeUncat.length + archivedUncat.length;
        if (totalUncat > 0) {
            const uncatTitle = t("manageModal.uncategorized") || "Uncategorized";
            this.renderSectionHeader(this.listEl, uncatTitle, totalUncat, null, false);
            const isCollapsed = WindowLayoutsModal.collapsedSections.has(uncatTitle);
            if (!isCollapsed) {
                const secContainer = this.listEl.createDiv("space-section-container");
                activeUncat.forEach((layout) => {
                    this.renderLayoutItem(secContainer, layout);
                });
                archivedUncat.forEach((layout) => {
                    this.renderLayoutItem(secContainer, layout);
                });
            }
        }
        this.updateSelectedItemHighlight();
    }
    renderSectionHeader(parentEl, secName, count, allSectionsOrder, isReorderable = true) {
        const headerEl = parentEl.createDiv(isReorderable ? "space-section-header" : "space-section-header is-static");
        if (isReorderable && allSectionsOrder) {
            headerEl.setAttribute("draggable", "true");
            headerEl.ondragstart = (e) => {
                var _a;
                (_a = e.dataTransfer) === null || _a === void 0 ? void 0 : _a.setData("text/plain", secName);
                headerEl.addClass("is-dragging");
            };
            headerEl.ondragend = () => {
                headerEl.removeClass("is-dragging");
            };
            headerEl.ondragover = (e) => {
                e.preventDefault();
            };
            headerEl.ondrop = (e) => __awaiter(this, void 0, void 0, function* () {
                var _a;
                e.preventDefault();
                const draggedSec = (_a = e.dataTransfer) === null || _a === void 0 ? void 0 : _a.getData("text/plain");
                if (draggedSec && draggedSec !== secName && allSectionsOrder.includes(draggedSec)) {
                    const fromIdx = allSectionsOrder.indexOf(draggedSec);
                    const toIdx = allSectionsOrder.indexOf(secName);
                    if (fromIdx !== -1 && toIdx !== -1) {
                        const newOrder = [...allSectionsOrder];
                        newOrder.splice(fromIdx, 1);
                        newOrder.splice(toIdx, 0, draggedSec);
                        yield this.plugin.manager.reorderSections(newOrder);
                    }
                }
            });
        }
        const isCollapsed = WindowLayoutsModal.collapsedSections.has(secName);
        // Hint 放在整個 section bar 上（與 toolbar 的 View Options 一致，用
        // Obsidian 原生 setTooltip）；不可排序的 section（如 Uncategorized）
        // 提示不包含 drag to reorder。
        const headerHint = isReorderable
            ? t("manageModal.sectionHeaderHint")
            : t("manageModal.sectionHeaderHintStatic");
        obsidian.setTooltip(headerEl, headerHint);
        // 左側：Section 名稱、計數與更名按鈕
        const leftEl = headerEl.createDiv("space-section-header-left");
        // 前方拖曳指示圖示：可排序的 section 顯示 grip（表示可拖曳移動）；
        // 不可排序的（Uncategorized）顯示低調 lock 占位（表示不可移動）。
        const dragIndicator = leftEl.createSpan({
            cls: isReorderable
                ? "space-section-drag-indicator"
                : "space-section-drag-indicator is-static",
        });
        obsidian.setIcon(dragIndicator, isReorderable ? "grip-vertical" : "lock");
        const titleSpan = leftEl.createSpan({
            text: secName,
            cls: "space-section-title",
        });
        leftEl.createSpan({ text: `(${count})`, cls: "space-section-count" });
        const triggerInlineRename = () => {
            const input = headerEl.createEl("input", {
                type: "text",
                value: secName,
                cls: "space-section-rename-input",
            });
            titleSpan.replaceWith(input);
            input.focus();
            const commitRename = () => __awaiter(this, void 0, void 0, function* () {
                const newName = input.value.trim();
                if (newName && newName !== secName) {
                    yield this.plugin.manager.renameSection(secName, newName);
                }
                else {
                    WindowLayoutsModal.renderAllInstances();
                }
            });
            input.onblur = () => { void commitRename(); };
            input.onkeydown = (ke) => {
                if (ke.key === "Enter") {
                    ke.preventDefault();
                    input.blur();
                }
                else if (ke.key === "Escape") {
                    WindowLayoutsModal.renderAllInstances();
                }
            };
        };
        if (isReorderable) {
            // 雙擊整列群組標頭觸發更名 (Double click group header to rename)
            headerEl.ondblclick = (e) => {
                e.stopPropagation();
                triggerInlineRename();
            };
            // 右鍵選單觸發更名
            headerEl.oncontextmenu = (e) => {
                e.preventDefault();
                e.stopPropagation();
                const menu = new obsidian.Menu();
                menu.addItem((item) => {
                    item
                        .setTitle(t("manageModal.renameSection") || "Rename Section")
                        .setIcon("pencil")
                        .onClick(() => triggerInlineRename());
                });
                menu.showAtMouseEvent(e);
            };
        }
        // 右側：展開 / 收合箭頭 (最右端，無高亮背景輕量化)
        const rightEl = headerEl.createDiv("space-section-header-right");
        const arrowIcon = rightEl.createSpan({ cls: "clickable-icon space-section-arrow" });
        obsidian.setIcon(arrowIcon, isCollapsed ? "chevron-right" : "chevron-down");
        headerEl.onclick = (e) => {
            if (e.detail > 1)
                return; // 雙擊時不觸發單擊的展開/收合
            const target = e.target;
            if (target.tagName === "INPUT")
                return;
            if (WindowLayoutsModal.collapsedSections.has(secName)) {
                WindowLayoutsModal.collapsedSections.delete(secName);
            }
            else {
                WindowLayoutsModal.collapsedSections.add(secName);
            }
            this.renderLayouts();
        };
    }
    renderLayoutItem(containerEl, layout) {
        var _a, _b, _c, _d, _e, _f, _g;
        const layoutEl = containerEl.createDiv("suggestion-item window-layout-item");
        const itemIndex = this.renderedLayoutEntries.length;
        this.renderedLayoutEntries.push({ layout, element: layoutEl });
        const isSelected = itemIndex === this.selectedIndex;
        layoutEl.setAttribute("role", "option");
        layoutEl.setAttribute("aria-selected", String(isSelected));
        if (isSelected)
            layoutEl.addClass("is-selected");
        if (layout.archived === true) {
            layoutEl.addClass("is-archived");
        }
        // 顯示設定 follow Space Settings：
        // - has-window-space-accent：只要有 accent color，icon 就用該色上色
        // - has-window-space-accent-fold：左上角折疊標示需 color + Show fold corner 設定
        if ((_a = layout.color) === null || _a === void 0 ? void 0 : _a.trim()) {
            layoutEl.style.setProperty("--window-space-color", layout.color.trim());
            layoutEl.addClass("has-window-space-accent");
            const showFold = (_b = layout.showFoldedCorner) !== null && _b !== void 0 ? _b : this.plugin.settings.defaultShowFoldedCorner !== false;
            if (showFold) {
                layoutEl.addClass("has-window-space-accent-fold");
            }
        }
        this.setFilesTooltipForLayout(layoutEl, layout);
        let holdTimer = null;
        let isLongPress = false;
        const isActionButtonTarget = (target) => { var _a; return Boolean((_a = target === null || target === void 0 ? void 0 : target.closest) === null || _a === void 0 ? void 0 : _a.call(target, "button")); };
        const cancelHold = () => {
            if (holdTimer !== null) {
                window.clearTimeout(holdTimer);
                holdTimer = null;
            }
        };
        layoutEl.addEventListener("click", (e) => {
            if (isActionButtonTarget(e.target))
                return;
            this.selectedIndex = itemIndex;
            this.updateSelectedItemHighlight();
        });
        const itemContentEl = layoutEl.createDiv("suggestion-content qsp-content");
        const titleEl = itemContentEl.createDiv({
            cls: "suggestion-title qsp-title",
        });
        const visualEl = titleEl.createSpan({ cls: "window-space-title-visual" });
        const iconSpan = visualEl.createSpan({ cls: "window-space-item-icon" });
        const val = resolveSpaceIcon(layout.icon, (_c = this.plugin.settings) === null || _c === void 0 ? void 0 : _c.defaultIcon);
        if (isSpaceEmoji(val)) {
            iconSpan.setText(val);
        }
        else {
            const iconDiv = iconSpan.createDiv();
            if (!setIconWithCheck(iconDiv, val)) {
                obsidian.setIcon(iconDiv, "square");
            }
        }
        titleEl.createSpan({ text: layout.name });
        if (layout.archived === true) {
            const archivedBadge = titleEl.createSpan({
                cls: "layout-archived-badge",
            });
            archivedBadge.setText("📦");
            obsidian.setTooltip(archivedBadge, t("manageModal.archivedGroup") || "Archived");
        }
        if (layout.autoSave) {
            const autoSaveBadge = titleEl.createSpan({
                cls: "layout-auto-save-badge",
            });
            obsidian.setIcon(autoSaveBadge, "refresh-cw");
            obsidian.setTooltip(autoSaveBadge, t("manageModal.autoSaveEnabled"));
        }
        const noteEl = itemContentEl.createDiv("suggestion-note qsp-note");
        const pathEl = noteEl.createDiv("qsp-path");
        const totalTabs = ((_d = layout.metadata) === null || _d === void 0 ? void 0 : _d.tabCount) || ((_f = (_e = layout.workspace) === null || _e === void 0 ? void 0 : _e.leaves) === null || _f === void 0 ? void 0 : _f.length) || 0;
        pathEl.createSpan({
            text: `${t("manageModal.tabCount")}: ${totalTabs}`,
            cls: "layout-files",
        });
        const openWin = typeof ((_g = this.plugin.manager) === null || _g === void 0 ? void 0 : _g.getOpenWindowForLayout) === "function"
            ? this.plugin.manager.getOpenWindowForLayout(layout)
            : null;
        if (openWin) {
            pathEl.createSpan({
                text: `🟢 ${t("manageModal.windowOpenBadge") || "視窗開啟中"}`,
                cls: "layout-open-status",
            });
        }
        const actionsEl = layoutEl.createDiv("suggestion-aux qsp-aux layout-actions");
        const restoreButton = actionsEl.createEl("button", {
            text: t("common.restore"),
            cls: "layout-restore-btn mod-cta",
        });
        obsidian.setTooltip(restoreButton, t("restoreModal.restoreHint"));
        restoreButton.addEventListener("mousedown", (e) => {
            if (e.button !== 0)
                return;
            isLongPress = false;
            holdTimer = window.setTimeout(() => {
                isLongPress = true;
                void this.restoreLayout(layout, false);
            }, 450);
        });
        restoreButton.addEventListener("mouseup", cancelHold);
        restoreButton.addEventListener("mouseleave", cancelHold);
        restoreButton.onclick = (e) => {
            e.stopPropagation();
            if (isLongPress)
                return;
            const forceNewWindow = !e.shiftKey;
            void this.restoreLayout(layout, forceNewWindow);
        };
        const moreButton = actionsEl.createEl("button", {
            cls: "layout-more-btn mod-cta",
        });
        obsidian.setIcon(moreButton, "chevron-down");
        obsidian.setTooltip(moreButton, t("manageModal.actions"));
        moreButton.onclick = (e) => {
            e.stopPropagation();
            this.showLayoutItemMenu(e, layout);
        };
    }
    restoreLayout(layout, forceNewWindow = false) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                this.closeHost();
                yield this.plugin.manager.restoreLayout(layout, {
                    // forceNewWindow 只控制 restore 的目標是否新建；仍需傳入來源視窗，
                    // 讓 manager 能保留該 popout 原本的 layout 名稱與狀態列。
                    // focusExistingWindow：若該 space 已在某個 Popout 開啟，直接聚焦
                    // 既有視窗，避免重複 restore 產生重複視窗 (clone 流程不傳此旗標)。
                    targetWindow: this.targetWindow,
                    forceNewWindow,
                    forceReload: !forceNewWindow,
                    focusExistingWindow: true,
                });
            }
            catch (error) {
                const message = error instanceof Error ? error.message : String(error);
                new obsidian.Notice(`${t("errors.failedToRestore")}: ${message}`);
            }
        });
    }
    scrollSelectedIntoView() {
        var _a;
        const entry = this.renderedLayoutEntries[this.selectedIndex];
        if (entry && entry.element && typeof entry.element.scrollIntoView === "function") {
            entry.element.scrollIntoView({ block: "nearest" });
        }
        else {
            const selected = (_a = this.listEl) === null || _a === void 0 ? void 0 : _a.querySelector(".window-layout-item.is-selected");
            if (selected && typeof selected.scrollIntoView === "function") {
                selected.scrollIntoView({ block: "nearest" });
            }
        }
    }
    showRenameDialog(layout) {
        const modal = new obsidian.Modal(this.app);
        modal.setTitle(t("manageModal.renameButton"));
        modal.onOpen = () => {
            let input;
            const setting = new obsidian.Setting(modal.contentEl)
                .setName(t("saveModal.nameLabel"))
                .addText((text) => {
                input = text.inputEl;
                input.value = layout.name;
                input.focus();
                input.select();
                input.addEventListener("keydown", (e) => {
                    if (e.key === "Enter") {
                        e.preventDefault();
                        void submit();
                    }
                });
            });
            setting.settingEl.addClass("window-spaces-setting-full-width");
            const buttonContainer = modal.contentEl.createDiv("ws-dialog-actions");
            const cancelButton = buttonContainer.createEl("button", {
                text: t("common.cancel"),
            });
            cancelButton.onclick = () => modal.close();
            const saveButton = buttonContainer.createEl("button", {
                text: t("common.save"),
                cls: "mod-cta",
            });
            const submit = () => __awaiter(this, void 0, void 0, function* () {
                const newName = input.value.trim();
                if (!newName) {
                    new obsidian.Notice(t("saveModal.emptyNameError"));
                    input.focus();
                    return;
                }
                const duplicate = this.plugin.settings.spaces.some((item) => item.id !== layout.id && item.name === newName);
                if (duplicate) {
                    new obsidian.Notice(t("saveModal.duplicateNameError"));
                    input.focus();
                    return;
                }
                layout.name = newName;
                yield this.plugin.saveSettings();
                modal.close();
                WindowLayoutsModal.renderAllInstances();
                if (this.plugin.settings.showNotifications !== false) {
                    new obsidian.Notice(t("notifications.layoutRenamed"));
                }
            });
            saveButton.onclick = () => void submit();
        };
        modal.onClose = () => modal.contentEl.empty();
        modal.open();
    }
    showDeleteDialog(layout) {
        void this.showConfirmDialog(`${t("manageModal.confirmDeleteMessage")}\n\n${layout.name}`, t("manageModal.confirmDeleteTitle")).then((confirmed) => __awaiter(this, void 0, void 0, function* () {
            if (!confirmed)
                return;
            try {
                yield this.plugin.manager.deleteLayout(layout.id);
                WindowLayoutsModal.renderAllInstances();
            }
            catch (error) {
                const message = error instanceof Error ? error.message : String(error);
                new obsidian.Notice(`${t("errors.failedToDelete")}: ${message}`);
            }
        }));
    }
    showConfirmDialog(message, title = t("common.confirm")) {
        return new Promise((resolve) => {
            const modal = new obsidian.Modal(this.app);
            modal.setTitle(title);
            modal.onOpen = () => {
                modal.contentEl.createEl("p", { text: message });
                const buttonContainer = modal.contentEl.createDiv("ws-dialog-actions");
                const cancelButton = buttonContainer.createEl("button", {
                    text: t("common.cancel"),
                });
                cancelButton.onclick = () => {
                    resolve(false);
                    modal.close();
                };
                const confirmButton = buttonContainer.createEl("button", {
                    text: t("common.confirm"),
                    cls: "mod-warning",
                });
                confirmButton.onclick = () => {
                    resolve(true);
                    modal.close();
                };
            };
            modal.onClose = () => modal.contentEl.empty();
            modal.open();
        });
    }
    setFilesTooltipForLayout(element, layout) {
        var _a;
        const leaves = ((_a = this.plugin) === null || _a === void 0 ? void 0 : _a.manager) ? this.plugin.manager.getSavedViewStates(layout) : [];
        const files = [];
        leaves.forEach((leaf) => {
            var _a;
            const filePath = ((_a = this.plugin) === null || _a === void 0 ? void 0 : _a.manager) ? this.plugin.manager.getFilePathFromLeafState(leaf) : null;
            if (filePath) {
                const fileName = filePath.split("/").pop() || filePath;
                if (!files.includes(fileName)) {
                    files.push(fileName);
                }
            }
        });
        if (files.length > 0) {
            const displayFiles = files.slice(0, 15);
            let tooltipText = `${t("restoreModal.includedFiles")} (${files.length}):\n` +
                displayFiles.map((f) => `• ${f}`).join("\n");
            if (files.length > 15) {
                tooltipText += `\n... (+${files.length - 15})`;
            }
            obsidian.setTooltip(element, tooltipText);
        }
    }
    showSortMenu(event) {
        var _a, _b;
        const menu = new obsidian.Menu();
        const currentSort = ((_b = (_a = this.plugin) === null || _a === void 0 ? void 0 : _a.settings) === null || _b === void 0 ? void 0 : _b.sortBy) || "updated-desc";
        const addSortItem = (id, label, icon) => {
            menu.addItem((item) => {
                item
                    .setTitle(label)
                    .setIcon(icon)
                    .setChecked(currentSort === id)
                    .onClick(() => __awaiter(this, void 0, void 0, function* () {
                    this.plugin.settings.sortBy = id;
                    yield this.plugin.saveSettings();
                    WindowLayoutsModal.renderAllInstances();
                }));
            });
        };
        addSortItem("updated-desc", t("manageModal.sortUpdatedDesc"), "history");
        addSortItem("updated-asc", t("manageModal.sortUpdatedAsc"), "history");
        addSortItem("created-desc", t("manageModal.sortCreatedDesc"), "calendar-days");
        addSortItem("created-asc", t("manageModal.sortCreatedAsc"), "calendar");
        addSortItem("name-asc", t("manageModal.sortNameAsc"), "sort-asc");
        addSortItem("name-desc", t("manageModal.sortNameDesc"), "sort-desc");
        menu.showAtMouseEvent(event);
    }
    showPanelMenu(event) {
        const menu = new obsidian.Menu();
        const openPanel = (location) => {
            var _a;
            this.closeHost();
            const targetWin = this.targetWindow ||
                (typeof ((_a = this.plugin.manager) === null || _a === void 0 ? void 0 : _a.getActiveWindow) === "function"
                    ? this.plugin.manager.getActiveWindow()
                    : undefined);
            void this.plugin.openWindowLayoutsPanel(location, targetWin);
        };
        // 與命令面板的開啟命令共用相同名稱，確保兩處內容一致。
        // 「彈出視窗」直接使用 ribbon/命令的 openWindowLayoutsModal 入口。
        menu.addItem((item) => {
            item.setTitle(t("commands.openLayoutsPanel")).setIcon("layout").onClick(() => openPanel("tab"));
        });
        menu.addItem((item) => {
            item.setTitle(t("commands.openLayouts")).setIcon("layout").onClick(() => {
                var _a;
                this.closeHost();
                const targetWin = this.targetWindow ||
                    (typeof ((_a = this.plugin.manager) === null || _a === void 0 ? void 0 : _a.getActiveWindow) === "function"
                        ? this.plugin.manager.getActiveWindow()
                        : undefined);
                this.plugin.openWindowLayoutsModal(targetWin);
            });
        });
        menu.addItem((item) => {
            item.setTitle(t("commands.openLayoutsPanelLeft")).setIcon("panel-left").onClick(() => openPanel("left"));
        });
        menu.addItem((item) => {
            item.setTitle(t("commands.openLayoutsPanelRight")).setIcon("panel-right").onClick(() => openPanel("right"));
        });
        menu.showAtMouseEvent(event);
    }
    showLayoutItemMenu(event, layout) {
        const menu = new obsidian.Menu();
        // 1. Auto-save (自動保存狀態切換)
        menu.addItem((item) => {
            item
                .setTitle(layout.autoSave
                ? t("manageModal.autoSaveEnabled")
                : t("manageModal.autoSaveDisabled"))
                .setIcon("refresh-cw")
                .setChecked(!!layout.autoSave)
                .onClick(() => __awaiter(this, void 0, void 0, function* () {
                layout.autoSave = !layout.autoSave;
                yield this.plugin.saveSettings();
                if (this.plugin.settings.showNotifications !== false) {
                    new obsidian.Notice(layout.autoSave
                        ? `${layout.name}: ${t("manageModal.autoSaveEnabled")}`
                        : `${layout.name}: ${t("manageModal.autoSaveDisabled")}`);
                }
                WindowLayoutsModal.renderAllInstances();
            }));
        });
        menu.addSeparator();
        // 2. Rename (重新命名)
        menu.addItem((item) => {
            item
                .setTitle(t("common.rename"))
                .setIcon("pencil")
                .onClick(() => {
                this.showRenameDialog(layout);
            });
        });
        // 3. Edit (編輯佈局與設定：開啟 Save Layout Modal)
        menu.addItem((item) => {
            item
                .setTitle(t("common.edit"))
                .setIcon("edit-3")
                .onClick(() => {
                this.closeHost();
                this.plugin.openSaveLayoutModal(layout);
            });
        });
        // 3.5 Archive / Unarchive (封存 / 取消封存)
        menu.addItem((item) => {
            const isArchived = layout.archived === true;
            item
                .setTitle(isArchived ? (t("manageModal.unarchiveSpace") || "Unarchive Space") : (t("manageModal.archiveSpace") || "Archive Space"))
                .setIcon("box")
                .onClick(() => {
                void this.plugin.manager.toggleArchiveSpace(layout.id);
            });
        });
        menu.addSeparator();
        // 4. Delete (刪除)
        menu.addItem((item) => {
            item
                .setTitle(t("common.delete"))
                .setIcon("trash-2")
                .setWarning(true)
                .onClick(() => {
                this.showDeleteDialog(layout);
            });
        });
        menu.showAtMouseEvent(event);
    }
    onClose() {
        var _a, _b;
        WindowLayoutsModal.activeInstances.delete(this);
        this.removeKeydownListener();
        if (this.initialFocusTimer !== undefined) {
            const timerWindow = ((_b = (_a = this.modalEl) === null || _a === void 0 ? void 0 : _a.ownerDocument) === null || _b === void 0 ? void 0 : _b.defaultView) || window;
            timerWindow.clearTimeout(this.initialFocusTimer);
            this.initialFocusTimer = undefined;
        }
        this.contentEl.empty();
    }
    removeKeydownListener() {
        var _a, _b;
        if (this.keydownListener) {
            const target = this.keydownTarget || ((_a = this.panelRootEl) === null || _a === void 0 ? void 0 : _a.ownerDocument) || ((_b = this.modalEl) === null || _b === void 0 ? void 0 : _b.ownerDocument) || document;
            target.removeEventListener("keydown", this.keydownListener, true);
            target.removeEventListener("keydown", this.keydownListener, false);
            this.keydownListener = undefined;
            this.keydownTarget = undefined;
        }
    }
}
WindowLayoutsModal.activeInstances = new Set();
WindowLayoutsModal.collapsedSections = new Set();

class WindowLayoutManager {
    constructor(plugin) {
        this.layoutWindows = new WeakMap();
        this.popoutWindows = new Set();
        this.layoutNames = new Map();
        this.layoutLabels = new Map();
        this.activeRestorePromise = null;
        this.isMatchingUnlabeled = false;
        this.isRestoringLayout = false;
        this.renderAttemptedLeaves = new WeakSet();
        this.deferredViewLoads = new WeakMap();
        this.autoSaveTimers = new Map();
        this.lastValidSnapshots = new Map();
        this.plugin = plugin;
        this.app = plugin.app;
    }
    /** 記錄 Obsidian 建立的 Popout，供 label 與 title 生命週期管理使用。 */
    registerPopoutWindow(targetWin) {
        if (!targetWin)
            return;
        this.popoutWindows.add(targetWin);
        this.matchUnlabeledPopoutWindows();
        this.refreshLayoutStatusBar(targetWin);
        this.hookPopoutWindowTitle(targetWin);
        this.schedulePopoutViewRendering(targetWin);
        // window-open 觸發時 Popout DOM 可能仍在建立中，再補多次確保狀態列與視窗標題 100% 正確反映。
        targetWin.setTimeout(() => {
            this.matchUnlabeledPopoutWindows();
            this.refreshLayoutStatusBar(targetWin);
            this.hookPopoutWindowTitle(targetWin);
        }, 0);
        targetWin.setTimeout(() => {
            this.matchUnlabeledPopoutWindows();
            this.refreshLayoutStatusBar(targetWin);
            this.hookPopoutWindowTitle(targetWin);
        }, 100);
        targetWin.setTimeout(() => {
            this.matchUnlabeledPopoutWindows();
            this.refreshLayoutStatusBar(targetWin);
            this.hookPopoutWindowTitle(targetWin);
        }, 300);
        targetWin.setTimeout(() => {
            this.matchUnlabeledPopoutWindows();
            this.refreshLayoutStatusBar(targetWin);
            this.hookPopoutWindowTitle(targetWin);
        }, 800);
    }
    /**
     * 在 Popout 建立/重新註冊後，以延遲生命週期工作重建尚未渲染的非檔案 view。
     * 不可掛在 active-leaf-change：File Explorer 的 mousedown/mouseup 期間重建
     * view 會阻止 Chromium 產生 click，造成使用者必須點兩次。
     */
    schedulePopoutViewRendering(targetWin) {
        const render = () => {
            if (targetWin.closed)
                return;
            this.getLeavesForWindow(targetWin).forEach((leaf) => {
                // ensureViewRendered 會先檢查 .view-content 是否已有子元素，只有
                // 空的非檔案 view 才會進行 rebuild。
                this.ensureViewRendered(leaf);
            });
        };
        targetWin.setTimeout(render, 150);
        targetWin.setTimeout(render, 400);
        targetWin.setTimeout(render, 900);
    }
    /** 插件重新載入時，補註冊已經存在的 Popout。 */
    registerExistingPopoutWindows() {
        this.app.workspace.iterateAllLeaves((leaf) => {
            var _a, _b;
            const extLeaf = leaf;
            const targetWin = (_b = (_a = extLeaf.containerEl) === null || _a === void 0 ? void 0 : _a.ownerDocument) === null || _b === void 0 ? void 0 : _b.defaultView;
            if (targetWin && this.isPopoutDocument(targetWin.document)) {
                this.registerPopoutWindow(targetWin);
            }
        });
        this.matchUnlabeledPopoutWindows();
    }
    /** Popout 關閉時移除對應的 layout label 與追蹤狀態。 */
    unregisterPopoutWindow(targetWin) {
        if (!targetWin)
            return;
        this.unhookPopoutWindowTitle(targetWin);
        this.removeLayoutLabel(targetWin);
        this.popoutWindows.delete(targetWin);
        this.layoutNames.delete(targetWin);
    }
    /** Plugin 卸載時清除所有由本 plugin 建立的 Popout label 與 Title hook。 */
    clearLayoutLabels() {
        var _a;
        for (const [targetWin, labels] of this.layoutLabels) {
            this.unhookPopoutWindowTitle(targetWin);
            (_a = labels.statusBar) === null || _a === void 0 ? void 0 : _a.remove();
            this.popoutWindows.delete(targetWin);
        }
        this.layoutNames.clear();
        this.layoutLabels.clear();
        this.popoutWindows.clear();
    }
    /**
     * 針對 Popout 視窗進行標題 Hook（雙重防護：DOM document.title setter 劫持 + WorkspaceWindow.setTitle）
     */
    hookPopoutWindowTitle(targetWin) {
        var _a, _b;
        if (!targetWin || !targetWin.document)
            return;
        const targetDoc = targetWin.document;
        const docRecord = targetDoc;
        // 1. DOM document.title Setter 劫持
        if (!docRecord._hasWindowSpacesTitlePatch) {
            const originalDescriptor = Object.getOwnPropertyDescriptor(Document.prototype, "title") ||
                Object.getOwnPropertyDescriptor(targetDoc, "title");
            if (originalDescriptor && originalDescriptor.set) {
                const originalSet = originalDescriptor.set;
                const originalGet = originalDescriptor.get;
                const self = this;
                docRecord._hasWindowSpacesTitlePatch = true;
                docRecord._originalTitleSet = originalSet;
                Object.defineProperty(targetDoc, "title", {
                    configurable: true,
                    enumerable: true,
                    get() {
                        try {
                            return originalGet ? originalGet.call(targetDoc) : "";
                        }
                        catch (_a) {
                            return "";
                        }
                    },
                    set(newTitle) {
                        const spaceName = self.getLayoutNameForWindow(targetWin);
                        if (spaceName) {
                            let formattedTitle = newTitle;
                            if (newTitle && !newTitle.startsWith(spaceName)) {
                                formattedTitle = `${spaceName} - ${newTitle}`;
                            }
                            else if (!newTitle) {
                                formattedTitle = spaceName;
                            }
                            originalSet.call(targetDoc, formattedTitle);
                        }
                        else {
                            originalSet.call(targetDoc, newTitle);
                        }
                    },
                });
            }
        }
        // 2. 針對 WorkspaceWindow 實例上的 setTitle API 劫持（若存在）
        const extApp = this.app;
        const floatingSplit = (_a = extApp.workspace) === null || _a === void 0 ? void 0 : _a.floatingSplit;
        const workspaceWindow = (_b = floatingSplit === null || floatingSplit === void 0 ? void 0 : floatingSplit.children) === null || _b === void 0 ? void 0 : _b.find((child) => child.win === targetWin);
        if (workspaceWindow && typeof workspaceWindow.setTitle === "function") {
            if (!workspaceWindow._originalSetTitle) {
                workspaceWindow._originalSetTitle = workspaceWindow.setTitle;
                const self = this;
                workspaceWindow.setTitle = function (originalTitle) {
                    const spaceName = self.getLayoutNameForWindow(targetWin);
                    const origFn = this._originalSetTitle;
                    if (spaceName && typeof origFn === "function") {
                        let formattedTitle = originalTitle;
                        if (originalTitle && !originalTitle.startsWith(spaceName)) {
                            formattedTitle = `${spaceName} - ${originalTitle}`;
                        }
                        else if (!originalTitle) {
                            formattedTitle = spaceName;
                        }
                        return origFn.call(this, formattedTitle);
                    }
                    if (typeof origFn === "function") {
                        return origFn.call(this, originalTitle);
                    }
                };
            }
        }
        // 3. 若已有名稱，主動觸發標題寫入以更新 DOM
        try {
            const spaceName = this.getLayoutNameForWindow(targetWin);
            if (spaceName && targetDoc.title) {
                const currentTitle = targetDoc.title;
                targetDoc.title = currentTitle;
            }
        }
        catch (_c) {
            // safe fallback for non-standard DOM environments
        }
    }
    unhookPopoutWindowTitle(targetWin) {
        var _a, _b;
        if (!targetWin || !targetWin.document)
            return;
        const targetDoc = targetWin.document;
        const docRecord = targetDoc;
        // 還原 document.title
        if (docRecord._hasWindowSpacesTitlePatch && typeof docRecord._originalTitleSet === "function") {
            const originalSet = docRecord._originalTitleSet;
            delete docRecord._hasWindowSpacesTitlePatch;
            delete docRecord._originalTitleSet;
            Object.defineProperty(targetDoc, "title", {
                configurable: true,
                enumerable: true,
                get() {
                    var _a, _b, _c;
                    return (_c = (_b = (_a = Object.getOwnPropertyDescriptor(Document.prototype, "title")) === null || _a === void 0 ? void 0 : _a.get) === null || _b === void 0 ? void 0 : _b.call(targetDoc)) !== null && _c !== void 0 ? _c : "";
                },
                set(newTitle) {
                    originalSet.call(targetDoc, newTitle);
                },
            });
        }
        // 還原 WorkspaceWindow.setTitle
        const extApp = this.app;
        const floatingSplit = (_a = extApp.workspace) === null || _a === void 0 ? void 0 : _a.floatingSplit;
        const workspaceWindow = (_b = floatingSplit === null || floatingSplit === void 0 ? void 0 : floatingSplit.children) === null || _b === void 0 ? void 0 : _b.find((child) => child.win === targetWin);
        if (workspaceWindow && workspaceWindow._originalSetTitle) {
            workspaceWindow.setTitle = workspaceWindow._originalSetTitle;
            delete workspaceWindow._originalSetTitle;
        }
    }
    /**
     * 在指定 Popout 的內容區顯示目前套用的 layout 名稱，
     * 並呼叫 hookPopoutWindowTitle 覆寫視窗標題。
     */
    setLayoutLabelForWindow(targetWin, layoutName) {
        var _a;
        if (!targetWin || !(layoutName === null || layoutName === void 0 ? void 0 : layoutName.trim()))
            return;
        this.registerPopoutWindow(targetWin);
        this.layoutNames.set(targetWin, layoutName);
        const targetDocument = targetWin.document;
        const body = targetDocument === null || targetDocument === void 0 ? void 0 : targetDocument.body;
        if (body) {
            body.setAttribute("data-layout-name", layoutName);
            body.querySelectorAll(".window-spaces-layout-label").forEach((element) => element.remove());
        }
        this.refreshLayoutStatusBar(targetWin);
        this.hookPopoutWindowTitle(targetWin);
        (_a = this.plugin.activityBars) === null || _a === void 0 ? void 0 : _a.renderWindow(targetWin);
        // 延遲再次觸發標題寫入，確保與 Obsidian 異步載入的 View 標題完成同步
        targetWin.setTimeout(() => this.hookPopoutWindowTitle(targetWin), 50);
        targetWin.setTimeout(() => this.hookPopoutWindowTitle(targetWin), 200);
        targetWin.setTimeout(() => this.hookPopoutWindowTitle(targetWin), 500);
    }
    getLayoutNameForWindow(targetWin) {
        var _a, _b;
        if (!targetWin)
            return null;
        const nameFromMap = this.layoutNames.get(targetWin);
        if (nameFromMap)
            return nameFromMap;
        const nameFromDOM = typeof ((_b = (_a = targetWin.document) === null || _a === void 0 ? void 0 : _a.body) === null || _b === void 0 ? void 0 : _b.getAttribute) === "function"
            ? targetWin.document.body.getAttribute("data-layout-name")
            : null;
        if (nameFromDOM) {
            this.layoutNames.set(targetWin, nameFromDOM);
            return nameFromDOM;
        }
        if (!this.isMatchingUnlabeled && this.isPopoutDocument(targetWin.document)) {
            this.matchUnlabeledPopoutWindows();
            return this.layoutNames.get(targetWin) || null;
        }
        return null;
    }
    /**
     * 當 Obsidian 啟動或多個 Popout 視窗重開時，若 Popout 視窗尚未標籤 space name，
     * 自動比對該視窗現有的 Leaves / 檔案與已儲存的 Layout (spaces)，
     * 為無標籤 Popout 視窗一對一辨識還原其 space name 及狀態列 / 側欄樣式。
     */
    /**
     * 把視窗目前的 live leaf id 集合回寫為該 layout 的識別記號（leafIdMarker）。
     * Obsidian 重啟後 floating 視窗的 leaf id 穩定保留，因此下次重啟可直接
     * 核對此記號識別 space，不需內容比對。靜默保存（不發通知、不拋錯）。
     */
    syncWindowLeafMarker(targetWin, layout) {
        if (!layout || !targetWin || targetWin.closed)
            return;
        try {
            const ids = this.getLeavesForWindow(targetWin)
                .map((leaf) => leaf.id)
                .filter((id) => !!id);
            if (ids.length === 0)
                return;
            const current = layout.leafIdMarker;
            const same = Array.isArray(current) &&
                current.length === ids.length &&
                current.every((id, i) => id === ids[i]);
            if (same)
                return;
            layout.leafIdMarker = ids;
            void this.plugin.saveSettings().catch(() => {
                // 靜默：識別記號同步失敗不影響主流程
            });
        }
        catch (_a) {
            // Ignore marker sync errors
        }
    }
    matchUnlabeledPopoutWindows() {
        var _a, _b;
        if (this.isMatchingUnlabeled)
            return;
        this.isMatchingUnlabeled = true;
        try {
            const workspace = this.app.workspace;
            if (!workspace || typeof workspace.iterateAllLeaves !== "function")
                return;
            const allPopouts = new Set();
            const claimedLayoutNames = new Set();
            workspace.iterateAllLeaves((leaf) => {
                var _a, _b;
                const win = this.getWindowForLeaf(leaf);
                if (win && !win.closed && this.isPopoutDocument(win.document)) {
                    allPopouts.add(win);
                    const name = this.layoutNames.get(win) ||
                        (typeof ((_b = (_a = win.document) === null || _a === void 0 ? void 0 : _a.body) === null || _b === void 0 ? void 0 : _b.getAttribute) === "function"
                            ? win.document.body.getAttribute("data-layout-name")
                            : null);
                    if (name) {
                        claimedLayoutNames.add(name);
                    }
                }
            });
            const unlabeledWindows = Array.from(allPopouts).filter((win) => {
                var _a, _b;
                const name = this.layoutNames.get(win) ||
                    (typeof ((_b = (_a = win.document) === null || _a === void 0 ? void 0 : _a.body) === null || _b === void 0 ? void 0 : _b.getAttribute) === "function"
                        ? win.document.body.getAttribute("data-layout-name")
                        : null);
                return !name;
            });
            if (unlabeledWindows.length === 0)
                return;
            const availableSpaces = (this.plugin.settings.spaces || []).filter((space) => space && space.name && !claimedLayoutNames.has(space.name));
            if (availableSpaces.length === 0)
                return;
            for (const win of unlabeledWindows) {
                const existingName = this.layoutNames.get(win) ||
                    (typeof ((_b = (_a = win.document) === null || _a === void 0 ? void 0 : _a.body) === null || _b === void 0 ? void 0 : _b.getAttribute) === "function"
                        ? win.document.body.getAttribute("data-layout-name")
                        : null);
                if (existingName)
                    continue;
                const winLeaves = this.getLeavesForWindow(win);
                if (winLeaves.length === 0)
                    continue;
                const winLeafIds = new Set(winLeaves.map((leaf) => leaf.id).filter(Boolean));
                const winFiles = new Set(winLeaves
                    .map((leaf) => {
                    var _a;
                    const state = typeof leaf.getViewState === "function"
                        ? (_a = leaf.getViewState()) === null || _a === void 0 ? void 0 : _a.state
                        : null;
                    return this.getFilePathFromLeafState({ state: state || {} });
                })
                    .filter((f) => !!f));
                // folder-spaces-explorer 等 view 的 panelId 跨 session 穩定，
                // 作為「無檔案 space」的比對特徵（leaf id 重啟後可能重建）。
                const winPanelIds = new Set(winLeaves
                    .map((leaf) => {
                    var _a;
                    const state = typeof leaf.getViewState === "function"
                        ? (_a = leaf.getViewState()) === null || _a === void 0 ? void 0 : _a.state
                        : null;
                    const panelId = state === null || state === void 0 ? void 0 : state.panelId;
                    return typeof panelId === "string" && panelId ? panelId : null;
                })
                    .filter((pid) => !!pid));
                let bestSpace = null;
                let bestScore = 0;
                for (const space of availableSpaces) {
                    if (claimedLayoutNames.has(space.name))
                        continue;
                    const savedLeaves = this.getSavedViewStates(space);
                    if (savedLeaves.length === 0)
                        continue;
                    const savedLeafIds = new Set(savedLeaves.map((l) => l.id).filter(Boolean));
                    const savedFiles = new Set(savedLeaves
                        .map((l) => this.getFilePathFromLeafState(l))
                        .filter((f) => !!f));
                    const savedPanelIds = new Set(savedLeaves
                        .map((l) => {
                        var _a;
                        const panelId = (_a = l.state) === null || _a === void 0 ? void 0 : _a.panelId;
                        return typeof panelId === "string" && panelId ? panelId : null;
                    })
                        .filter((pid) => !!pid));
                    let score = 0;
                    // (0) 視窗識別記號（leafIdMarker）比對：上次識別/restore 時回寫的
                    // live leaf id 集合，重啟後視窗 leaf id 穩定 → 直接命中，最高權重。
                    if (Array.isArray(space.leafIdMarker) && space.leafIdMarker.length > 0) {
                        let markerHit = 0;
                        for (const id of winLeafIds) {
                            if (space.leafIdMarker.includes(id))
                                markerHit++;
                        }
                        score += markerHit * 200;
                    }
                    // (a) Leaf ID 匹配 (+100/leaf)
                    for (const id of winLeafIds) {
                        if (savedLeafIds.has(id))
                            score += 100;
                    }
                    // (b) 檔案路徑匹配 (+10/file)
                    let matchingFilesCount = 0;
                    for (const file of winFiles) {
                        if (savedFiles.has(file))
                            matchingFilesCount++;
                    }
                    score += matchingFilesCount * 10;
                    // (e) view state 特徵比對：folder-spaces-explorer 等 view 的 panelId
                    // 跨 session 穩定，補足無檔案 space 的辨識（leaf id 重啟後可能重建）。
                    for (const pid of winPanelIds) {
                        if (savedPanelIds.has(pid))
                            score += 100;
                    }
                    // (c) 檔案完全吻合（Popout 中所有檔案與 space 中所有檔案一致）時大幅加分 (+50)
                    if (winFiles.size > 0 && winFiles.size === savedFiles.size && matchingFilesCount === winFiles.size) {
                        score += 50;
                    }
                    // (d) 視窗幾何尺寸與位置相似度 (已有內容匹配時才作為加分項 +5)
                    const savedWindow = space.windowState;
                    if (score > 0 && savedWindow && savedWindow.size) {
                        const widthDiff = Math.abs(win.outerWidth - savedWindow.size.width);
                        const heightDiff = Math.abs(win.outerHeight - savedWindow.size.height);
                        if (widthDiff < 50 && heightDiff < 50) {
                            score += 5;
                        }
                    }
                    if (score > bestScore) {
                        bestScore = score;
                        bestSpace = space;
                    }
                }
                // 嚴格門檻：必須至少有一項 Leaf / 檔案內容 match (score >= 10)
                if (bestSpace && bestScore >= 10) {
                    claimedLayoutNames.add(bestSpace.name);
                    this.setLayoutLabelForWindow(win, bestSpace.name);
                    this.layoutWindows.set(bestSpace, win);
                    // 回寫識別記號：使下次重啟直接命中 leafIdMarker，不再依賴內容比對
                    this.syncWindowLeafMarker(win, bestSpace);
                }
            }
        }
        finally {
            this.isMatchingUnlabeled = false;
        }
    }
    refreshLayoutLabels() {
        for (const targetWin of this.popoutWindows) {
            this.refreshLayoutStatusBar(targetWin);
        }
    }
    refreshLayoutStatusBar(targetWin) {
        var _a;
        const targetDocument = targetWin.document;
        const body = targetDocument === null || targetDocument === void 0 ? void 0 : targetDocument.body;
        if (!body || !this.isPopoutDocument(targetDocument))
            return;
        const labels = this.layoutLabels.get(targetWin) || { statusBar: null };
        this.layoutLabels.set(targetWin, labels);
        const layoutName = this.getLayoutNameForWindow(targetWin);
        if (this.plugin.settings.showLayoutStatusBar === true) {
            labels.statusBar = this.ensureLayoutLabelElement(targetDocument, body, labels.statusBar, "window-spaces-layout-status");
            this.updateLayoutLabelElement(labels.statusBar, layoutName || t("common.noLayout"), targetWin);
        }
        else {
            (_a = labels.statusBar) === null || _a === void 0 ? void 0 : _a.remove();
            labels.statusBar = null;
        }
    }
    ensureLayoutLabelElement(targetDocument, body, current, className) {
        if (current && current.ownerDocument === targetDocument) {
            if (!current.isConnected)
                body.appendChild(current);
            return current;
        }
        const existing = body.querySelector(`.${className}`);
        if (existing)
            return existing;
        const element = body.createDiv({ cls: className });
        return element;
    }
    updateLayoutLabelElement(element, layoutName, targetWin) {
        const iconElement = element.querySelector(".window-spaces-layout-icon");
        if (iconElement) {
            iconElement.remove();
        }
        let nameElement = element.querySelector(".window-spaces-layout-name");
        if (!nameElement) {
            nameElement = element.createSpan({ cls: "window-spaces-layout-name" });
        }
        let actionsElement = element.querySelector(".window-spaces-layout-actions");
        if (!actionsElement) {
            actionsElement = element.createDiv({ cls: "window-spaces-layout-actions" });
        }
        const ensureActionButton = (className, icon, label, onClick) => {
            let button = actionsElement ? actionsElement.querySelector(`.${className}`) : null;
            if (!button && actionsElement) {
                button = actionsElement.createEl("button", {
                    cls: `window-spaces-layout-action ${className} clickable-icon`,
                    attr: { type: "button" },
                });
                obsidian.setIcon(button, icon);
            }
            button.onclick = (event) => {
                event.preventDefault();
                event.stopPropagation();
                onClick(event);
            };
            button.setAttribute("aria-label", label);
            button.title = label;
            return button;
        };
        nameElement.textContent = layoutName;
        const currentLayout = this.plugin.settings.spaces.find((l) => l.name === layoutName);
        const isAutoSave = !!(currentLayout === null || currentLayout === void 0 ? void 0 : currentLayout.autoSave);
        // 移除舊版 window-spaces-layout-save 按鈕（若存在）
        const oldSaveBtn = actionsElement === null || actionsElement === void 0 ? void 0 : actionsElement.querySelector(".window-spaces-layout-save");
        if (oldSaveBtn)
            oldSaveBtn.remove();
        // 1. 直接儲存 Space (不開啟對話框)
        ensureActionButton("window-spaces-layout-direct-save", "save", t("commands.saveLayoutDirect") || t("commands.saveLayout"), () => void this.saveLayoutDirectFromWindow(targetWin));
        // 2. 空間設定對話框 (Pencil icon, 開啟 Space Setting 對話框)
        ensureActionButton("window-spaces-layout-edit-settings", "pencil", t("saveModal.title"), () => void this.saveLayoutFromWindow(targetWin));
        const autoSaveBtn = ensureActionButton("window-spaces-layout-auto-save", "refresh-cw", isAutoSave ? t("manageModal.autoSaveEnabled") : t("manageModal.autoSaveDisabled"), () => {
            void (() => __awaiter(this, void 0, void 0, function* () {
                const targetLayout = this.plugin.settings.spaces.find((l) => l.name === layoutName);
                if (targetLayout) {
                    targetLayout.autoSave = !targetLayout.autoSave;
                    yield this.plugin.saveSettings();
                    new obsidian.Notice(targetLayout.autoSave
                        ? `${layoutName}: ${t("manageModal.autoSaveEnabled")}`
                        : `${layoutName}: ${t("manageModal.autoSaveDisabled")}`);
                    this.updateLayoutLabelElement(element, layoutName, targetWin);
                }
                else {
                    void this.saveLayoutFromWindow(targetWin);
                }
            }))();
        });
        if (isAutoSave) {
            autoSaveBtn.classList.add("is-active");
        }
        else {
            autoSaveBtn.classList.remove("is-active");
        }
        ensureActionButton("window-spaces-layout-open", "layout", t("commands.openLayoutsRibbon"), () => this.plugin.openWindowLayoutsModal(targetWin));
        ensureActionButton("window-spaces-layout-settings", "settings", t("activityBar.openSettings"), () => this.openPluginSettings());
        element.setAttribute("aria-label", `${t("common.layoutLabel")}: ${layoutName}`);
        element.setAttribute("title", layoutName);
        element.dataset.layoutName = layoutName;
    }
    /** 開啟 Window Spaces 設定頁面。 */
    openPluginSettings() {
        void (() => __awaiter(this, void 0, void 0, function* () {
            try {
                const setting = this.app.setting;
                if (!setting)
                    return;
                // 需先開啟設定 Modal，再切換到指定 tab（obsidian 內部 API）
                if (typeof setting.open === "function") {
                    yield setting.open();
                }
                if (typeof setting.openTabById === "function") {
                    setting.openTabById("window-spaces");
                }
            }
            catch (e) {
                console.warn("Failed to open Window Spaces settings:", e);
            }
        }))();
    }
    /** 開啟全新的 Popout 視窗（等待 leaf 與 DOM 都完成掛載後再回傳視窗物件） */
    openNewPopoutWindow(options = {}) {
        var _a, _b, _c, _d;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const workspace = this.app.workspace;
                const leaf = (_a = workspace.openPopoutLeaf) === null || _a === void 0 ? void 0 : _a.call(workspace);
                if (!leaf)
                    return null;
                // openPopoutLeaf() 同步回傳 leaf，但 setViewState() 會非同步完成
                // view/container 的建立。若不等待這個 Promise，下面讀到的 ownerDocument
                // 可能仍是空值或尚未切換到真正的 Popout Window。
                const extLeaf = leaf;
                yield Promise.resolve(extLeaf.setViewState({ type: "empty" }));
                let targetWin = null;
                for (let attempt = 0; attempt < 40; attempt++) {
                    const candidate = (_c = (_b = extLeaf.containerEl) === null || _b === void 0 ? void 0 : _b.ownerDocument) === null || _c === void 0 ? void 0 : _c.defaultView;
                    if (candidate && this.isPopoutDocument(candidate.document)) {
                        targetWin = candidate;
                        break;
                    }
                    yield new Promise((resolve) => window.setTimeout(resolve, 50));
                }
                if (!targetWin) {
                    console.warn("Popout leaf was created, but its Window was not mounted in time.");
                    return null;
                }
                if (typeof targetWin.focus === "function") {
                    try {
                        targetWin.focus();
                    }
                    catch (e) {
                        console.warn("Failed to focus new popout window:", e);
                    }
                }
                if (options.initializeDefaults) {
                    yield ((_d = this.plugin.activityBars) === null || _d === void 0 ? void 0 : _d.initializeNewWindow(targetWin));
                }
                return targetWin;
            }
            catch (e) {
                console.warn("Failed to open new popout window:", e);
            }
            return null;
        });
    }
    saveLayoutFromWindow(targetWin) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const layoutName = this.layoutNames.get(targetWin) || "";
                const existing = this.plugin.settings.spaces.find((l) => l.name === layoutName);
                const layout = yield this.captureCurrentLayout({ name: layoutName }, targetWin);
                if (existing) {
                    layout.autoSave = existing.autoSave;
                    layout.icon = existing.icon;
                    layout.color = existing.color;
                    layout.borderInset = existing.borderInset;
                    layout.showFoldedCorner = existing.showFoldedCorner;
                    layout.activityBars = existing.activityBars;
                }
                this.plugin.openSaveLayoutModal(layout, targetWin);
            }
            catch (error) {
                console.error("Failed to capture layout from Popout:", error);
                const message = error instanceof Error ? error.message : String(error);
                new obsidian.Notice(`${t("errors.failedToSave")}: ${message}`);
            }
        });
    }
    saveLayoutDirectFromWindow(targetWin) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const layoutName = this.layoutNames.get(targetWin) || "";
                const existing = this.plugin.settings.spaces.find((l) => l.name === layoutName);
                const layout = yield this.captureCurrentLayout({ name: layoutName }, targetWin);
                if (existing) {
                    layout.id = existing.id;
                    layout.autoSave = existing.autoSave;
                    layout.icon = existing.icon;
                    layout.color = existing.color;
                    layout.borderInset = existing.borderInset;
                    layout.showFoldedCorner = existing.showFoldedCorner;
                    layout.activityBars = existing.activityBars;
                    layout.sections = existing.sections;
                    layout.archived = existing.archived;
                }
                yield this.saveLayout(layout);
                if (this.plugin.settings.showNotifications !== false) {
                    new obsidian.Notice(`${t("notifications.layoutSaved")}: ${layout.name}`);
                }
            }
            catch (error) {
                console.error("Failed to direct save layout from Popout:", error);
                const message = error instanceof Error ? error.message : String(error);
                new obsidian.Notice(`${t("errors.failedToSave")}: ${message}`);
            }
        });
    }
    /**
     * 檢查並發動所有已開啟自動保存的 Popout 視窗的 5 秒 Debounced 自動儲存
     */
    checkAndDebouncedAutoSaveAll() {
        this.layoutNames.forEach((layoutName, targetWin) => {
            const existing = this.plugin.settings.spaces.find((l) => l.name === layoutName);
            if (existing && existing.autoSave === true) {
                // 1. 視窗存活期間，嘗試備份當前合法的 Layout 快照
                void this.captureCurrentLayout({ name: layoutName }, targetWin)
                    .then((snapshot) => {
                    var _a, _b;
                    if (((_a = snapshot.metadata) === null || _a === void 0 ? void 0 : _a.fileCount) > 0 || (((_b = snapshot.workspace) === null || _b === void 0 ? void 0 : _b.leaves) && snapshot.workspace.leaves.length > 0)) {
                        snapshot.autoSave = true;
                        snapshot.id = existing.id;
                        this.lastValidSnapshots.set(targetWin, snapshot);
                    }
                })
                    .catch(() => { });
                // 2. 設置 5 秒 Debounce 定時器
                const existingTimer = this.autoSaveTimers.get(targetWin);
                if (existingTimer !== undefined) {
                    window.clearTimeout(existingTimer);
                }
                const timer = window.setTimeout(() => {
                    this.autoSaveTimers.delete(targetWin);
                    void this.autoSaveWindowLayout(targetWin);
                }, 5000); // 固定的 5 秒 Debounce 機制
                this.autoSaveTimers.set(targetWin, timer);
            }
        });
    }
    /**
     * 實時自動保存指定的 Popout 視窗佈局 (包含 0 檔案清空防呆保護)
     */
    autoSaveWindowLayout(targetWin) {
        var _a, _b, _c, _d;
        return __awaiter(this, void 0, void 0, function* () {
            const layoutName = this.layoutNames.get(targetWin);
            if (!layoutName)
                return;
            const existing = this.plugin.settings.spaces.find((l) => l.name === layoutName);
            if (!existing || !existing.autoSave)
                return;
            try {
                let captured = null;
                // 1. 嘗試進行現場 capture
                try {
                    const liveCaptured = yield this.captureCurrentLayout({ name: layoutName }, targetWin);
                    if (((_a = liveCaptured.metadata) === null || _a === void 0 ? void 0 : _a.fileCount) > 0 || (((_b = liveCaptured.workspace) === null || _b === void 0 ? void 0 : _b.leaves) && liveCaptured.workspace.leaves.length > 0)) {
                        captured = liveCaptured;
                        captured.autoSave = true;
                        captured.id = existing.id;
                        captured.includeGeometry = existing.includeGeometry;
                        captured.icon = existing.icon;
                        captured.color = existing.color;
                        captured.borderInset = existing.borderInset;
                        captured.showFoldedCorner = existing.showFoldedCorner;
                        captured.activityBars = existing.activityBars;
                        this.lastValidSnapshots.set(targetWin, captured);
                    }
                }
                catch (_e) {
                    // 視窗已被摧毀時 capture 可能出錯
                }
                // 2. 防呆門檻：若現場 capture 為空/失敗（例如視窗正被關閉），退回使用關閉前最後一次合法的快照
                if (!captured) {
                    captured = this.lastValidSnapshots.get(targetWin) || null;
                }
                // 3. 嚴格防呆門檻：若依然為空，或者快照中的檔案數為 0，且原本既有佈局含有檔案，堅決拒絕覆寫！
                if (!captured || (((_c = captured.metadata) === null || _c === void 0 ? void 0 : _c.fileCount) === 0 && ((_d = existing.metadata) === null || _d === void 0 ? void 0 : _d.fileCount) > 0)) {
                    console.warn(`[Window Spaces] Suppressed auto-save for layout "${layoutName}" to prevent empty file list overwrite.`);
                    return;
                }
                const now = Date.now();
                captured.createdAt = existing.createdAt || existing.timestamp || now;
                captured.updatedAt = now;
                captured.timestamp = now;
                // 4. 安全靜默覆寫更新設定檔
                const index = this.plugin.settings.spaces.findIndex((l) => l.id === existing.id);
                if (index !== -1) {
                    this.plugin.settings.spaces[index] = captured;
                }
                else {
                    this.plugin.settings.spaces.push(captured);
                }
                yield this.plugin.saveSettings();
                WindowLayoutsModal.renderAllInstances();
            }
            catch (e) {
                console.warn(`[Window Spaces] Auto-save on close/change failed for "${layoutName}":`, e);
            }
        });
    }
    removeLayoutLabel(targetWin) {
        var _a;
        // 1. 若有待發動的 5 秒 Debounce 定時器，將其清除
        const timer = this.autoSaveTimers.get(targetWin);
        if (timer !== undefined) {
            window.clearTimeout(timer);
            this.autoSaveTimers.delete(targetWin);
        }
        // 2. 視窗關閉時發動最終安全自動存檔
        void this.autoSaveWindowLayout(targetWin);
        // 3. 釋放快照與綁定
        this.lastValidSnapshots.delete(targetWin);
        const labels = this.layoutLabels.get(targetWin);
        (_a = labels === null || labels === void 0 ? void 0 : labels.statusBar) === null || _a === void 0 ? void 0 : _a.remove();
        this.layoutNames.delete(targetWin);
        this.layoutLabels.delete(targetWin);
    }
    isPopoutDocument(targetDocument) {
        const body = targetDocument === null || targetDocument === void 0 ? void 0 : targetDocument.body;
        return !!body && (body.classList.contains("is-popout-window") ||
            body.classList.contains("mod-popout"));
    }
    /**
     * 檢查指定 Layout 是否目前已在某個存活的 Popout 視窗中開啟。
     */
    getOpenWindowForLayout(layout) {
        if (!layout)
            return null;
        // 1. 先查記憶體對映的 layoutWindows
        const mappedWin = this.layoutWindows.get(layout);
        if (mappedWin && !mappedWin.closed && this.isPopoutDocument(mappedWin.document)) {
            if (this.getLeavesForWindow(mappedWin).length > 0) {
                return mappedWin;
            }
        }
        // 2. 遍歷目前所有存活的 Popout 視窗，依名稱與標籤比對
        const liveWindows = new Set();
        const workspace = this.app.workspace;
        if (typeof workspace.iterateAllLeaves === "function") {
            workspace.iterateAllLeaves((leaf) => {
                const win = this.getWindowForLeaf(leaf);
                if (win && !win.closed && this.isPopoutDocument(win.document)) {
                    liveWindows.add(win);
                }
            });
        }
        for (const win of Array.from(liveWindows)) {
            const label = this.getLayoutNameForWindow(win);
            if (label && label === layout.name) {
                return win;
            }
        }
        // 3. 多級比對：比對檔案與 Leaves (必須有高精確度 matchScore > 0，嚴禁盲目 fallback 單一視窗)
        const savedLeaves = this.getSavedViewStates(layout);
        if (savedLeaves.length > 0) {
            const matchedWin = this.findWindowForSavedLeaves(savedLeaves, undefined, null, new Set(), true);
            if (matchedWin && !matchedWin.closed && this.isPopoutDocument(matchedWin.document)) {
                return matchedWin;
            }
        }
        return null;
    }
    getWindowForLayout(layout) {
        return this.getOpenWindowForLayout(layout) ||
            this.layoutWindows.get(layout) ||
            this.findWindowForSavedLeaves(this.getSavedViewStates(layout));
    }
    /** 確認 Popout 仍持有原生焦點，避免延遲重試搶回主視窗焦點。 */
    isWindowFocused(targetWin) {
        var _a;
        try {
            const hasFocus = (_a = targetWin.document) === null || _a === void 0 ? void 0 : _a.hasFocus;
            return typeof hasFocus === "function" ? hasFocus.call(targetWin.document) : true;
        }
        catch (_b) {
            return true;
        }
    }
    /** 確認主視窗 (plugin realm) 是否持有原生焦點。 */
    isMainWindowFocused() {
        var _a;
        try {
            const hasFocus = (_a = window.document) === null || _a === void 0 ? void 0 : _a.hasFocus;
            return typeof hasFocus === "function" ? hasFocus.call(window.document) : true;
        }
        catch (_b) {
            return true;
        }
    }
    /**
     * 聚焦 (Focus) 指定 Popout 視窗並啟用合適的 Leaf (顯式呼叫 revealLeaf 確保分頁真實切換為可見)
     */
    focusTargetWindow(targetWin, preferredLeaf) {
        if (!targetWin || targetWin.closed)
            return;
        const doFocusAndReveal = (focusWindow) => __awaiter(this, void 0, void 0, function* () {
            try {
                if (focusWindow && typeof targetWin.focus === "function") {
                    targetWin.focus();
                }
                if (!focusWindow && !this.isWindowFocused(targetWin))
                    return;
                const freshLeaves = this.getLeavesForWindow(targetWin);
                if (freshLeaves.length === 0)
                    return;
                let targetLeaf = null;
                if (preferredLeaf && freshLeaves.includes(preferredLeaf)) {
                    targetLeaf = preferredLeaf;
                }
                else {
                    // 若無指定 preferredLeaf，優先保留當前視窗原有的 activeLeaf
                    const activeLeaf = typeof this.app.workspace.getMostRecentLeaf === "function"
                        ? this.app.workspace.getMostRecentLeaf()
                        : this.app.workspace.activeLeaf;
                    if (activeLeaf && freshLeaves.includes(activeLeaf)) {
                        targetLeaf = activeLeaf;
                    }
                    else {
                        targetLeaf = freshLeaves[0];
                    }
                }
                if (targetLeaf) {
                    yield this.app.workspace.revealLeaf(targetLeaf);
                    // revealLeaf() is asynchronous; the user may have switched to the
                    // main window while it was pending. Never steal that focus back.
                    if (!this.isWindowFocused(targetWin))
                        return;
                    this.app.workspace.setActiveLeaf(targetLeaf, { focus: focusWindow });
                }
            }
            catch (_a) {
                // Ignore focus error
            }
        });
        void doFocusAndReveal(true);
        targetWin.setTimeout(() => { void doFocusAndReveal(false); }, 50);
        targetWin.setTimeout(() => { void doFocusAndReveal(false); }, 200);
    }
    /**
     * 取得指定視窗內「目前 active 的 tab」leaf（依 tab header 的 is-active class）。
     * 全域 activeLeaf 可能指向其他視窗（例如使用者已切回主視窗），此時不該
     * fallback 到視窗內第一個 leaf，以免把第一個 tab 搶成 active。
     */
    getActiveLeafInWindow(targetWin) {
        const workspace = this.app.workspace;
        if (typeof workspace.iterateAllLeaves !== "function")
            return null;
        let found = null;
        workspace.iterateAllLeaves((leaf) => {
            var _a, _b;
            if (found)
                return;
            const extLeaf = leaf;
            if (((_b = (_a = extLeaf.containerEl) === null || _a === void 0 ? void 0 : _a.ownerDocument) === null || _b === void 0 ? void 0 : _b.defaultView) !== targetWin)
                return;
            const tabEl = extLeaf.tabHeaderEl;
            if (tabEl && tabEl.classList.contains("is-active")) {
                found = leaf;
            }
        });
        return found;
    }
    /**
     * 獲取目前活動視窗 (activeWindow) 中真正的 activeLeaf
     */
    getActiveLeafForCurrentWindow(targetWindow) {
        var _a, _b;
        const currentWin = targetWindow || (typeof activeWindow !== "undefined" ? activeWindow : window);
        const globalActiveLeaf = this.app.workspace.getMostRecentLeaf();
        // 1. 若全域 activeLeaf 的 ownerWindow 就是 currentWin，直接返回
        if (globalActiveLeaf && ((_b = (_a = globalActiveLeaf.containerEl) === null || _a === void 0 ? void 0 : _a.ownerDocument) === null || _b === void 0 ? void 0 : _b.defaultView) === currentWin) {
            return globalActiveLeaf;
        }
        // 2. 若全域 activeLeaf 不在 currentWin（例如 Command Palette modal 搶焦），遍歷尋找屬於 currentWin 的 leaf
        let windowLeaf = null;
        this.app.workspace.iterateAllLeaves((leaf) => {
            var _a, _b;
            const extLeaf = leaf;
            if (!windowLeaf && ((_b = (_a = extLeaf.containerEl) === null || _a === void 0 ? void 0 : _a.ownerDocument) === null || _b === void 0 ? void 0 : _b.defaultView) === currentWin) {
                windowLeaf = leaf;
            }
        });
        return windowLeaf || globalActiveLeaf;
    }
    /**
     * 獲取指定 DOM Window 中所有的 WorkspaceLeaves
     */
    getLeavesForWindow(targetWin) {
        const leaves = [];
        this.app.workspace.iterateAllLeaves((leaf) => {
            var _a, _b;
            const extLeaf = leaf;
            if (((_b = (_a = extLeaf.containerEl) === null || _a === void 0 ? void 0 : _a.ownerDocument) === null || _b === void 0 ? void 0 : _b.defaultView) === targetWin) {
                leaves.push(leaf);
            }
        });
        return leaves;
    }
    /** 保存指定 Window 的 live leaf 狀態，供 changeLayout 後重新辨識視窗。 */
    getViewStatesForWindow(targetWin) {
        return this.getLeavesForWindow(targetWin).map((leaf) => {
            var _a, _b;
            const extLeaf = leaf;
            const viewState = typeof extLeaf.getViewState === "function"
                ? extLeaf.getViewState()
                : { id: "", type: ((_a = leaf.view) === null || _a === void 0 ? void 0 : _a.getViewType()) || "unknown", state: {} };
            return {
                id: extLeaf.id || this.generateId(),
                type: viewState.type || ((_b = leaf.view) === null || _b === void 0 ? void 0 : _b.getViewType()) || "unknown",
                state: viewState.state || {},
            };
        });
    }
    /** 快照目前所有已套用 layout 的 live popout，供新視窗 restore 後復原標籤。 */
    capturePreservedWindowLayouts() {
        const liveWindows = new Set();
        this.app.workspace.iterateAllLeaves((leaf) => {
            const targetWin = this.getWindowForLeaf(leaf);
            if (targetWin && this.isPopoutDocument(targetWin.document)) {
                liveWindows.add(targetWin);
            }
        });
        const snapshots = [];
        liveWindows.forEach((targetWin) => {
            const layoutName = this.getLayoutNameForWindow(targetWin);
            if (!layoutName)
                return;
            snapshots.push({
                window: targetWin,
                layoutName,
                leaves: this.getViewStatesForWindow(targetWin),
                windowState: this.getWindowState(targetWin),
            });
        });
        return snapshots;
    }
    /**
     * 捕獲當前活動視窗的佈局
     */
    captureCurrentLayout(options = {}, targetWindow) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const workspace = this.app.workspace;
                const fullLayout = workspace.getLayout();
                const activeLeaf = this.getActiveLeafForCurrentWindow(targetWindow);
                const currentWin = targetWindow || (typeof activeWindow !== "undefined" ? activeWindow : window);
                // 取得當前活動 DOM 視窗中所有真實開著的 Leaves
                const windowLeaves = this.getLeavesForWindow(currentWin);
                // 只提取當前浮動視窗的佈局資訊
                let floatingLayout = this.extractCurrentFloatingLayout(fullLayout, activeLeaf);
                if (!floatingLayout) {
                    const extActiveLeaf = activeLeaf;
                    const rootInfo = extActiveLeaf && typeof extActiveLeaf.getRoot === "function" ? (_b = (_a = extActiveLeaf.getRoot()) === null || _a === void 0 ? void 0 : _a.constructor) === null || _b === void 0 ? void 0 : _b.name : "no-leaf";
                    const isPopout = this.isCurrentlyInPopoutWindow(activeLeaf);
                    console.warn("[WindowSpaces Debug]", { rootInfo, isPopout, fullLayout });
                    throw new Error(`${t("errors.notInPopoutWindow")} (root: ${rootInfo}, isPopout: ${isPopout})`);
                }
                // 若視窗包含多個 Leaves，但 layout 僅被抓為單一 leaf，將其包裝為包含全數 leaves 的 split 容器
                if (windowLeaves.length > 1 && floatingLayout.type === "leaf") {
                    floatingLayout = {
                        type: "split",
                        id: this.generateId(),
                        direction: "vertical",
                        children: windowLeaves.map((leaf) => {
                            var _a;
                            const extLeaf = leaf;
                            return {
                                id: this.generateId(),
                                type: "tabs",
                                children: [{
                                        id: extLeaf.id || this.generateId(),
                                        type: "leaf",
                                        state: typeof extLeaf.getViewState === "function" ? extLeaf.getViewState() : { type: ((_a = leaf.view) === null || _a === void 0 ? void 0 : _a.getViewType()) || "markdown", state: {} }
                                    }]
                            };
                        })
                    };
                }
                const windowInfo = this.getCurrentWindowState();
                // Layout tree 才是目前視窗的完整來源。iterateAllLeaves 在某些
                // Obsidian 版本/Popout 狀態下只會回傳 active leaf，因此不能只用
                // windowLeaves 建立檔案列表。
                const layoutLeaves = this.extractLeavesFromLayout(floatingLayout);
                const liveLeavesById = new Map();
                windowLeaves.forEach((leaf) => {
                    const id = leaf.id;
                    if (id)
                        liveLeavesById.set(id, leaf);
                });
                const leaves = layoutLeaves.map((layoutLeaf) => {
                    var _a, _b;
                    const liveLeaf = liveLeavesById.get(layoutLeaf.id);
                    if (!liveLeaf)
                        return layoutLeaf;
                    const extLiveLeaf = liveLeaf;
                    const viewState = typeof extLiveLeaf.getViewState === "function"
                        ? extLiveLeaf.getViewState()
                        : { id: "", type: ((_a = liveLeaf.view) === null || _a === void 0 ? void 0 : _a.getViewType()) || layoutLeaf.type, state: {} };
                    return {
                        id: layoutLeaf.id,
                        type: viewState.type || ((_b = liveLeaf.view) === null || _b === void 0 ? void 0 : _b.getViewType()) || layoutLeaf.type,
                        state: viewState.state || layoutLeaf.state || {},
                    };
                });
                // 若 layout tree 缺少 leaf（例如 Obsidian 正在完成 Popout layout），
                // 仍保留即時找到的 leaf，避免保存時遺失其他檔案。
                const capturedIds = new Set(leaves.map((leaf) => leaf.id));
                windowLeaves.forEach((leaf) => {
                    var _a, _b;
                    const extLeaf = leaf;
                    const id = extLeaf.id || this.generateId();
                    if (capturedIds.has(id))
                        return;
                    const viewState = typeof extLeaf.getViewState === "function"
                        ? extLeaf.getViewState()
                        : { id: "", type: ((_a = leaf.view) === null || _a === void 0 ? void 0 : _a.getViewType()) || "unknown", state: {} };
                    leaves.push({
                        id,
                        type: viewState.type || ((_b = leaf.view) === null || _b === void 0 ? void 0 : _b.getViewType()) || "unknown",
                        state: viewState.state || {},
                    });
                });
                const capturedLayout = {
                    id: this.generateId(),
                    name: (_d = (_c = options.name) !== null && _c !== void 0 ? _c : this.layoutNames.get(currentWin)) !== null && _d !== void 0 ? _d : "",
                    timestamp: Date.now(),
                    windowState: {
                        size: options.includeWindowSize !== false
                            ? windowInfo.size
                            : { width: 0, height: 0 },
                        position: options.includePosition !== false ? windowInfo.position : undefined,
                    },
                    workspace: {
                        layout: floatingLayout,
                        activeFile: (_f = (_e = activeLeaf === null || activeLeaf === void 0 ? void 0 : activeLeaf.view) === null || _e === void 0 ? void 0 : _e.file) === null || _f === void 0 ? void 0 : _f.path,
                        leaves,
                    },
                    metadata: {
                        fileCount: this.countOpenFiles(leaves),
                        tabCount: leaves.length,
                        splitCount: 0,
                        createdAt: new Date().toISOString(),
                        obsidianVersion: this.app.version || "unknown",
                        pluginVersion: ((_h = (_g = this.plugin) === null || _g === void 0 ? void 0 : _g.manifest) === null || _h === void 0 ? void 0 : _h.version) || "1.0.0",
                    },
                    windowInfo: {
                        firstLeafId: leaves.length > 0 ? leaves[0].id : undefined,
                    },
                };
                const existingLayout = (_k = (_j = this.plugin.settings) === null || _j === void 0 ? void 0 : _j.spaces) === null || _k === void 0 ? void 0 : _k.find((l) => l.name === capturedLayout.name);
                if (existingLayout) {
                    if (existingLayout.includeGeometry !== undefined) {
                        capturedLayout.includeGeometry = existingLayout.includeGeometry;
                    }
                    if (existingLayout.icon !== undefined) {
                        capturedLayout.icon = existingLayout.icon;
                    }
                    if (existingLayout.color !== undefined) {
                        capturedLayout.color = existingLayout.color;
                    }
                    if (existingLayout.borderInset !== undefined) {
                        capturedLayout.borderInset = existingLayout.borderInset;
                    }
                    if (existingLayout.showFoldedCorner !== undefined) {
                        capturedLayout.showFoldedCorner = existingLayout.showFoldedCorner;
                    }
                    if (existingLayout.activityBars !== undefined) {
                        capturedLayout.activityBars = existingLayout.activityBars;
                    }
                }
                // 紀錄該視窗目前隱藏的側欄/分頁群組（Activity Bar 與 Pane 隱藏功能持久化）
                try {
                    capturedLayout.hidden = this.plugin.popoutLayout.captureHiddenState(currentWin);
                }
                catch (_l) {
                    capturedLayout.hidden = undefined;
                }
                // 儲存對話框開啟後 activeWindow 可能已經切回主視窗，
                // 因此保存 capture 當下的 DOM Window，供 saveLayout 使用。
                this.layoutWindows.set(capturedLayout, currentWin);
                return capturedLayout;
            }
            catch (error) {
                console.error("Failed to capture layout:", error);
                throw error;
            }
        });
    }
    /**
     * 恢復指定的佈局 (忠實還原 Tabs, Horizontal/Vertical Splits 與檔案狀態)
     */
    restoreLayout(layout, options = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            // A layout can be visible in both the persistent panel and a popout
            // dialog. Coalesce overlapping restore events so one click cannot create
            // two popout windows (one of them appearing blank during reconstruction).
            if (this.activeRestorePromise)
                return this.activeRestorePromise;
            const restorePromise = this.restoreLayoutInternal(layout, options);
            this.activeRestorePromise = restorePromise;
            try {
                yield restorePromise;
            }
            finally {
                if (this.activeRestorePromise === restorePromise) {
                    this.activeRestorePromise = null;
                }
            }
        });
    }
    restoreLayoutInternal(layout, options = {}) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
        return __awaiter(this, void 0, void 0, function* () {
            this.isRestoringLayout = true;
            try {
                // 驗證佈局數據
                if (!this.validateLayout(layout)) {
                    throw new Error(t("errors.invalidData"));
                }
                // 0. 若此 space 已在某個存活的 Popout 視窗中開啟，直接聚焦該視窗，
                // 避免重複 restore 相同的 space。
                // - forceReload (Shift 套用至目前視窗) 是明確的覆寫動作，仍繼續走既有流程。
                // - clone 流程 (forceNewWindow 但無 focusExistingWindow) 刻意要開新視窗。
                if (!options.forceReload &&
                    (!options.forceNewWindow || options.focusExistingWindow === true)) {
                    const existingWin = this.getOpenWindowForLayout(layout);
                    if (existingWin && !existingWin.closed && this.isPopoutDocument(existingWin.document)) {
                        // 聚焦已開啟的視窗時，保留視窗內目前的 active tab，
                        // 避免 active 被搶回第一個 tab。
                        this.focusTargetWindow(existingWin, this.getActiveLeafInWindow(existingWin));
                        this.setLayoutLabelForWindow(existingWin, layout.name);
                        this.refreshLayoutLabels();
                        if (options.showNotifications !== false && this.plugin.settings.showNotifications !== false) {
                            new obsidian.Notice(tWithParams("notifications.switchedToOpenWindow", { name: layout.name }));
                        }
                        return;
                    }
                }
                // changeLayout 可能重建任一既有 WorkspaceWindow。所有 restore 都先
                // 保存 live popout；普通 Enter restore 不保留將被取代的目標名稱。
                const preservedWindowLayouts = this.capturePreservedWindowLayouts()
                    .filter((snapshot) => options.forceNewWindow || snapshot.window !== options.targetWindow);
                const savedLeaves = this.getSavedViewStates(layout);
                const savedLeafId = ((_a = layout.windowInfo) === null || _a === void 0 ? void 0 : _a.firstLeafId) || ((_b = savedLeaves[0]) === null || _b === void 0 ? void 0 : _b.id);
                const workspace = this.app.workspace;
                let currentLayout = workspace.getLayout();
                let floatingWindows = this.getFloatingWindows(currentLayout);
                // 1. 嘗試尋找目標現有視窗
                let targetIndex = -1;
                let targetWin = null;
                // 標記目標是否為本次 restore 才建立的全新 Popout（可走 leaf 層級重建）
                let isNewlyCreatedWindow = false;
                if (options.forceNewWindow) {
                    // 強制在新 Popout 視窗開啟
                    targetIndex = -1;
                }
                else if (options.targetWindow && this.isPopoutDocument(options.targetWindow.document)) {
                    // 優先還原至傳入的當前 Popout 視窗 (取代當前視窗)
                    targetWin = options.targetWindow;
                    targetIndex = this.findFloatingWindowIndexForWindow(targetWin, floatingWindows);
                }
                else if (savedLeafId && floatingWindows.length > 0) {
                    for (let i = 0; i < floatingWindows.length; i++) {
                        if (this.floatingWindowContainsLeaf(floatingWindows[i], savedLeafId)) {
                            targetIndex = i;
                            break;
                        }
                    }
                    const existingTargetLeaf = this.findLeafById(savedLeafId);
                    targetWin = this.getWindowForLeaf(existingTargetLeaf);
                }
                // 2. 若找不到現有視窗，且非明確指定取代的 Popout 視窗，建立一個新 Popout 視窗
                if (targetIndex < 0) {
                    if (!options.forceNewWindow && options.targetWindow && this.isPopoutDocument(options.targetWindow.document)) {
                        // 最終仍以 live popout 的 DOM/容器順序定位，不因 runtime root
                        // 沒有序列化 ID 而中止正常 Enter restore。
                        targetWin = options.targetWindow;
                        targetIndex = this.findPopoutOrdinal(targetWin, floatingWindows.length);
                        if (targetIndex < 0) {
                            throw new Error(t("errors.cannotRestore"));
                        }
                    }
                    else {
                        // 記錄開啟前的 Popout 視窗集合
                        const popoutWinsBefore = new Set(this.getLivePopoutWindows());
                        // 呼叫 openPopoutLeaf 建立新 Popout 分頁
                        isNewlyCreatedWindow = true;
                        const extWs = this.app.workspace;
                        // 【幾何前置】openPopoutLeaf 接受 WorkspaceWindowInitData（x/y/size），
                        // 直接帶入 saved 幾何，讓新視窗在誕生瞬間就是正確位置與尺寸。
                        // 若不帶，Obsidian 會以預設幾何（Electron 預設 1025x801@螢幕中央）
                        // 建立，之後 restoreWindowGeometry 再校正會產生「先錯誤位置、
                        // 約 1 秒後才跳正」的兩階段跳動。
                        const popoutInitData = layout.includeGeometry !== false && layout.windowState
                            ? {
                                x: (_c = layout.windowState.position) === null || _c === void 0 ? void 0 : _c.x,
                                y: (_d = layout.windowState.position) === null || _d === void 0 ? void 0 : _d.y,
                                size: layout.windowState.size
                                    ? {
                                        width: layout.windowState.size.width,
                                        height: layout.windowState.size.height,
                                    }
                                    : undefined,
                            }
                            : undefined;
                        const popoutLeaf = (_e = extWs.openPopoutLeaf) === null || _e === void 0 ? void 0 : _e.call(extWs, popoutInitData);
                        // 輪詢等待全新的 Live Popout Window 在 Electron 中被正式掛載建立（最多等待 2 秒）
                        let newlyCreatedWin = null;
                        for (let attempt = 0; attempt < 40; attempt++) {
                            yield new Promise((resolve) => window.setTimeout(resolve, 50));
                            const currentPopoutWins = this.getLivePopoutWindows();
                            newlyCreatedWin = currentPopoutWins.find((w) => !popoutWinsBefore.has(w)) || null;
                            if (newlyCreatedWin)
                                break;
                        }
                        const extPopoutLeaf = popoutLeaf;
                        targetWin = newlyCreatedWin || ((_g = (_f = extPopoutLeaf === null || extPopoutLeaf === void 0 ? void 0 : extPopoutLeaf.containerEl) === null || _f === void 0 ? void 0 : _f.ownerDocument) === null || _g === void 0 ? void 0 : _g.defaultView) || null;
                        if (targetWin) {
                            // 【幾何前置】新視窗一誕生立即進行座標移動與尺寸縮放，消弭兩階段鋸齒 jump
                            this.restoreWindowGeometry(targetWin, layout.windowState, layout.includeGeometry, true);
                        }
                        // 重新讀取最新的 Layout
                        currentLayout = workspace.getLayout();
                        floatingWindows = this.getFloatingWindows(currentLayout);
                        // 以新開視窗的 ID 或在 floating 陣列末尾精確定位 targetIndex
                        if (targetWin) {
                            targetIndex = this.findFloatingWindowIndexForWindow(targetWin, floatingWindows);
                        }
                        if (targetIndex < 0) {
                            targetIndex = floatingWindows.length - 1;
                        }
                    }
                }
                // 3. 結構建立。新建的目標視窗若為簡單結構（單層 split / 單 tabs 群組），
                // 直接以 leaf 層級 API 重建，完全不觸發全域 changeLayout——主視窗與其他
                // popout 的 DOM/view 一律不受影響（changeLayout 內部會 clearLayout：
                // 關閉所有 floating window、detach 主視窗與全部 popout 的 DOM 後重建，
                // 代價極高）。巢狀 split 或取代既有視窗等複雜情境才 fallback 到 changeLayout。
                let builtLeaves = null;
                if (targetIndex >= 0 && ((_h = layout.workspace) === null || _h === void 0 ? void 0 : _h.layout)) {
                    const rootNode = this.extractLayoutRootNode(layout.workspace.layout);
                    if (isNewlyCreatedWindow && targetWin && this.isSimpleLayoutStructure(rootNode)) {
                        builtLeaves = yield this.buildSimpleWindowStructure(targetWin, rootNode);
                        // 【方案 C】leaf 層級建立完成後、開啟檔案前，立即隱藏側欄。
                        // 側欄收合不依賴 leaf id（由 root split 的頂層欄位定位），
                        // 提前到這裡可避免「先顯示展開側欄、開檔後才收合」的二次跳動。
                        // 巢狀 split fallback（changeLayout）路徑仍在下方套用。
                        if (layout.hidden && targetWin) {
                            try {
                                if (layout.hidden.leftSidebar) {
                                    this.plugin.popoutLayout.hideColumn(targetWin, "left");
                                }
                                if (layout.hidden.rightSidebar) {
                                    this.plugin.popoutLayout.hideColumn(targetWin, "right");
                                }
                            }
                            catch (_o) {
                                // Ignore DOM not ready error during early apply
                            }
                        }
                    }
                    else {
                        const currentFloatingWindow = floatingWindows[targetIndex];
                        const restoredWindow = this.prepareFloatingWindowForRestore(layout.workspace.layout, currentFloatingWindow, layout.includeGeometry, layout.windowState);
                        const livePopoutsBeforeLayout = this.getLivePopoutWindows();
                        const floatingObj = currentLayout.floating;
                        if (typeof floatingObj === "object" && floatingObj !== null && "type" in floatingObj && floatingObj.type === "floating" && Array.isArray(floatingObj.children)) {
                            floatingObj.children = floatingObj.children.map((child, idx) => {
                                if (idx === targetIndex)
                                    return restoredWindow;
                                const liveWin = livePopoutsBeforeLayout.find((w) => this.findFloatingWindowIndexForWindow(w, floatingWindows) === idx) || livePopoutsBeforeLayout[idx];
                                if (liveWin && !liveWin.closed && this.isPopoutDocument(liveWin.document)) {
                                    return this.syncLiveWindowBoundsToFloatingChild(child, liveWin);
                                }
                                return child;
                            });
                        }
                        else if (Array.isArray(floatingObj)) {
                            floatingObj[targetIndex] = restoredWindow;
                        }
                        yield workspace.changeLayout(currentLayout);
                    }
                }
                // 4. 取得目標 Popout 視窗最新活體 DOM Window。changeLayout 會關閉並
                // 重建所有 floating window（含 openPopoutLeaf 剛建立的目標窗），因此
                // 必須在 changeLayout 完成後立即重新解析目標視窗，並立刻套用保存的
                // 幾何，避免新視窗停留在預設位置直到檔案開啟完成後才被移動
                // （兩階段位置跳動）。
                const livePopouts = this.getLivePopoutWindows();
                let liveTargetWin = null;
                if (options.forceNewWindow) {
                    if (options.targetWindow) {
                        const nonSourceWins = livePopouts.filter((w) => w !== options.targetWindow);
                        if (nonSourceWins.length > 0) {
                            liveTargetWin = nonSourceWins[nonSourceWins.length - 1];
                        }
                    }
                    else {
                        liveTargetWin = livePopouts[livePopouts.length - 1] || targetWin;
                    }
                }
                else if (targetIndex >= 0 && targetIndex < livePopouts.length) {
                    liveTargetWin = livePopouts[targetIndex];
                }
                targetWin = liveTargetWin || this.findWindowForSavedLeaves(savedLeaves, options.targetWindow, targetWin) || targetWin;
                // 【幾何立即套用】changeLayout 以 window.open features 重建視窗，其
                // x/y 不一定被 Electron 採用；立即用 windowState 強制校正，再開始
                // 開啟檔案，消除「先偏位、開檔後才回正」的位移感。
                if (targetWin) {
                    this.restoreWindowGeometry(targetWin, layout.windowState, layout.includeGeometry, true);
                }
                yield new Promise((resolve) => window.setTimeout(resolve, 150));
                let missingFiles = [];
                if (options.validateFiles !== false && savedLeaves.length > 0) {
                    missingFiles = yield this.restoreFileStatesForWindow(targetWin, savedLeaves, (_j = layout.workspace) === null || _j === void 0 ? void 0 : _j.activeFile);
                }
                // leaf 層級建立情境：saved leaf 與 live leaf 的 id 不同，需以「先序
                // 順序」對應套用 pinned，並把 hidden leaf id 轉換成 live id。
                if (builtLeaves && builtLeaves.length > 0) {
                    this.applyPinnedStateToBuiltLeaves(builtLeaves, savedLeaves);
                    if (((_l = (_k = layout.hidden) === null || _k === void 0 ? void 0 : _k.hiddenLeafIds) === null || _l === void 0 ? void 0 : _l.length) && targetWin) {
                        const hiddenIds = new Set(layout.hidden.hiddenLeafIds);
                        layout.hidden.hiddenLeafIds = builtLeaves
                            .filter((_, i) => { var _a; return hiddenIds.has((_a = savedLeaves[i]) === null || _a === void 0 ? void 0 : _a.id); })
                            .map((leaf) => leaf.id || "");
                    }
                }
                this.setLayoutLabelForWindow(targetWin, layout.name);
                // 回寫視窗識別記號：下次重啟可直接核對 leafIdMarker 識別此 space
                this.syncWindowLeafMarker(targetWin, layout);
                this.restorePreservedWindowLabels(preservedWindowLayouts, targetWin);
                this.refreshLayoutLabels();
                // 先套用隱藏的側欄/分頁群組，避免幾何對齊後再縮放側欄觸發橫向位移
                if (targetWin && layout.hidden) {
                    this.applyHiddenStateAfterRestore(targetWin, layout.hidden);
                }
                // 5. 調整視窗尺寸與座標，並聚焦視窗
                if (targetWin) {
                    this.layoutWindows.set(layout, targetWin);
                    (_m = this.plugin.activityBars) === null || _m === void 0 ? void 0 : _m.renderWindow(targetWin);
                    // 幾何已在 changeLayout 後立即套用；此處僅以差異驗證（force=false）
                    // 校正檔案開啟期間可能出現的微幅偏移，避免無謂地移動已就位的視窗。
                    this.restoreWindowGeometry(targetWin, layout.windowState, layout.includeGeometry, false);
                    // 若使用者在 restore 的非同步等待期間已切回主視窗，就不能再把全域
                    // activeLeaf 指到 popout leaf，否則下一次主視窗 File Explorer 點擊
                    // note 會被導向 popout（需點兩下才切換）。僅當 popout 仍持有焦點、
                    // 或主視窗也未持有焦點（Obsidian 在背景）時才啟動 popout。
                    const canActivatePopout = this.isWindowFocused(targetWin) || !this.isMainWindowFocused();
                    const winLeaves = this.getLeavesForWindow(targetWin);
                    if (winLeaves.length > 0 && canActivatePopout) {
                        // restoreFileStatesForWindow 已把 active 設到 layout 保存時選中的
                        // tab（activeFile 對應的 leaf，fallback 第一個 leaf）。此處只在全域
                        // activeLeaf 尚未指向此 popout 時才設定，避免把 active 搶到第一個
                        // column 的第一個 tab，導致原本選中的 tab 失去 active。
                        const activeLeaf = typeof this.app.workspace.getMostRecentLeaf === "function"
                            ? this.app.workspace.getMostRecentLeaf()
                            : this.app.workspace.activeLeaf;
                        if (!activeLeaf || !winLeaves.includes(activeLeaf)) {
                            try {
                                this.app.workspace.setActiveLeaf(winLeaves[0], { focus: true });
                            }
                            catch (_p) {
                                // Ignore focus error
                            }
                        }
                    }
                    if (typeof targetWin.focus === "function" && canActivatePopout) {
                        try {
                            targetWin.focus();
                        }
                        catch (e) {
                            console.warn("Failed to focus target window:", e);
                        }
                    }
                }
                // 視窗已顯示：補載仍為空的 deferred view（file-explorer / search 等）。
                // leaf 層級路徑的 view 在視窗未顯示時建立會變成 DeferredView，需在
                // 視窗顯示後（containerEl 可見）重新 loadIfDeferred 才會載入真實內容。
                if (targetWin) {
                    this.ensureDeferredViewsLoaded(targetWin);
                }
                WindowLayoutsModal.renderAllInstances();
                if (options.showNotifications !== false && this.plugin.settings.showNotifications !== false) {
                    if (missingFiles.length > 0) {
                        const missingList = missingFiles.slice(0, 3).join(", ") + (missingFiles.length > 3 ? "..." : "");
                        new obsidian.Notice(`⚠️ ${t("notifications.layoutRestored")}: ${layout.name} (${t("notifications.missingFilesNotice")}: ${missingList})`, 8000);
                    }
                    else {
                        new obsidian.Notice(`${t("notifications.layoutRestored")}: ${layout.name}`);
                    }
                }
            }
            catch (error) {
                console.error("Failed to restore layout:", error);
                const message = error instanceof Error ? error.message : String(error);
                throw new Error(`${t("errors.failedToRestore")}: ${message}`);
            }
            finally {
                this.isRestoringLayout = false;
            }
        });
    }
    /**
     * 獲取所有保存的佈局 (按建立時間降序排列，最新儲存的在最上面)
     */
    getSavedLayouts() {
        const settings = this.plugin.settings || {};
        const spaces = settings.spaces || [];
        return [...spaces].sort((a, b) => {
            const mode = settings.sortBy || "updated-desc";
            const getTimestamp = (l, field) => { var _a, _b; return (_b = (_a = l[field]) !== null && _a !== void 0 ? _a : l.timestamp) !== null && _b !== void 0 ? _b : 0; };
            switch (mode) {
                case "updated-desc":
                    return getTimestamp(b, "updatedAt") - getTimestamp(a, "updatedAt");
                case "updated-asc":
                    return getTimestamp(a, "updatedAt") - getTimestamp(b, "updatedAt");
                case "created-desc":
                    return getTimestamp(b, "createdAt") - getTimestamp(a, "createdAt");
                case "created-asc":
                    return getTimestamp(a, "createdAt") - getTimestamp(b, "createdAt");
                case "name-asc":
                    return (a.name || "").localeCompare(b.name || "", undefined, { sensitivity: "base" });
                case "name-desc":
                    return (b.name || "").localeCompare(a.name || "", undefined, { sensitivity: "base" });
                default:
                    return getTimestamp(b, "updatedAt") - getTimestamp(a, "updatedAt");
            }
        });
    }
    /**
     * 保存新佈局或覆蓋既有佈局
     */
    saveLayout(layout) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const settings = this.plugin.settings;
                if (!settings.spaces) {
                    settings.spaces = [];
                }
                const now = Date.now();
                const existingIndex = settings.spaces.findIndex((l) => l.name === layout.name);
                const isOverwrite = existingIndex >= 0;
                if (isOverwrite) {
                    const existing = settings.spaces[existingIndex];
                    layout.id = existing.id;
                    layout.createdAt = existing.createdAt || existing.timestamp || now;
                    layout.updatedAt = now;
                    layout.timestamp = now;
                    if (layout.includeGeometry === undefined && existing.includeGeometry !== undefined) {
                        layout.includeGeometry = existing.includeGeometry;
                    }
                    if (layout.borderInset === undefined && existing.borderInset !== undefined) {
                        layout.borderInset = existing.borderInset;
                    }
                    if (layout.showFoldedCorner === undefined && existing.showFoldedCorner !== undefined) {
                        layout.showFoldedCorner = existing.showFoldedCorner;
                    }
                    if (layout.activityBars === undefined && existing.activityBars !== undefined) {
                        layout.activityBars = existing.activityBars;
                    }
                    settings.spaces[existingIndex] = layout;
                }
                else {
                    // 全新建立 (由 A 複製/改名另存為 B 時，重設 B 的 createdAt 為當時時間)
                    layout.createdAt = now;
                    layout.updatedAt = now;
                    layout.timestamp = now;
                    settings.spaces.push(layout);
                }
                yield this.plugin.saveSettings();
                WindowLayoutsModal.renderAllInstances();
                const sourceWindow = this.getWindowForLayout(layout);
                this.setLayoutLabelForWindow(sourceWindow, layout.name);
                if (sourceWindow) {
                    (_a = this.plugin.activityBars) === null || _a === void 0 ? void 0 : _a.renderWindow(sourceWindow);
                }
                else {
                    (_b = this.plugin.activityBars) === null || _b === void 0 ? void 0 : _b.refreshAll();
                }
                if (this.plugin.settings.showNotifications !== false) {
                    const noticeMsg = isOverwrite
                        ? `${t("notifications.layoutOverwritten")}: ${layout.name}`
                        : `${t("notifications.layoutSaved")}: ${layout.name}`;
                    new obsidian.Notice(noticeMsg);
                }
            }
            catch (error) {
                console.error("Failed to save layout:", error);
                throw new Error(t("errors.failedToSave"));
            }
        });
    }
    /**
     * 刪除指定佈局
     */
    deleteLayout(layoutId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const settings = this.plugin.settings;
                const index = settings.spaces.findIndex((l) => l.id === layoutId);
                if (index >= 0) {
                    const deletedLayout = settings.spaces[index];
                    settings.spaces.splice(index, 1);
                    yield this.plugin.saveSettings();
                    WindowLayoutsModal.renderAllInstances();
                    if (this.plugin.settings.showNotifications !== false) {
                        new obsidian.Notice(`${t("notifications.layoutDeleted")}: ${deletedLayout.name}`);
                    }
                }
            }
            catch (error) {
                console.error("Failed to delete layout:", error);
                throw new Error(t("errors.failedToDelete"));
            }
        });
    }
    /**
     * 重命名 Section 名稱並同步更新所有帶有該標籤的 Space 與 sectionsOrder
     */
    renameSection(oldName, newName) {
        return __awaiter(this, void 0, void 0, function* () {
            const cleanOld = oldName.trim();
            const cleanNew = newName.trim();
            if (!cleanOld || !cleanNew || cleanOld === cleanNew)
                return;
            const settings = this.plugin.settings;
            if (!settings.sectionsOrder)
                settings.sectionsOrder = [];
            // 1. 更新 sectionsOrder
            const orderIndex = settings.sectionsOrder.indexOf(cleanOld);
            if (orderIndex !== -1) {
                settings.sectionsOrder[orderIndex] = cleanNew;
            }
            // 2. 批量更新所有 Space 中的 sections 陣列
            (settings.spaces || []).forEach((space) => {
                if (space.sections && Array.isArray(space.sections)) {
                    const secIndex = space.sections.indexOf(cleanOld);
                    if (secIndex !== -1) {
                        space.sections[secIndex] = cleanNew;
                        // 去重
                        space.sections = Array.from(new Set(space.sections));
                    }
                }
            });
            yield this.plugin.saveSettings();
            WindowLayoutsModal.renderAllInstances();
        });
    }
    /**
     * 切換指定 Space 的封存狀態
     */
    toggleArchiveSpace(spaceId, archiveStatus) {
        return __awaiter(this, void 0, void 0, function* () {
            const settings = this.plugin.settings;
            const space = (settings.spaces || []).find((s) => s.id === spaceId);
            if (!space)
                return;
            const newStatus = archiveStatus !== undefined ? archiveStatus : !space.archived;
            space.archived = newStatus;
            yield this.plugin.saveSettings();
            WindowLayoutsModal.renderAllInstances();
            if (this.plugin.settings.showNotifications !== false) {
                let noticeText = newStatus ? "Space archived" : "Space unarchived";
                try {
                    noticeText = newStatus ? t("manageModal.archiveSuccess") : t("manageModal.unarchiveSuccess");
                }
                catch (_a) {
                    // Fallback if i18n not initialized
                }
                new obsidian.Notice(`${noticeText}: ${space.name}`);
            }
        });
    }
    /**
     * 更新 Section 排序順序
     */
    reorderSections(newOrder) {
        return __awaiter(this, void 0, void 0, function* () {
            this.plugin.settings.sectionsOrder = newOrder;
            yield this.plugin.saveSettings();
            WindowLayoutsModal.renderAllInstances();
        });
    }
    /**
     * 獲取所有目前開啟中的活體 Popout DOM Window (按 Workspace 順序)
     */
    getLivePopoutWindows() {
        const wins = [];
        this.app.workspace.iterateAllLeaves((leaf) => {
            var _a, _b;
            const extLeaf = leaf;
            const win = (_b = (_a = extLeaf.containerEl) === null || _a === void 0 ? void 0 : _a.ownerDocument) === null || _b === void 0 ? void 0 : _b.defaultView;
            if (win && this.isPopoutDocument(win.document) && !wins.includes(win)) {
                wins.push(win);
            }
        });
        return wins;
    }
    /**
     * 獲取當前活發對應的 DOM Window (包含當前命令發起所在 Popout 視窗)
     */
    getActiveWindow() {
        var _a;
        const activeLeaf = this.getActiveLeafForCurrentWindow();
        if (activeLeaf) {
            const extLeaf = activeLeaf;
            const ownerDocument = (_a = extLeaf.containerEl) === null || _a === void 0 ? void 0 : _a.ownerDocument;
            if (ownerDocument === null || ownerDocument === void 0 ? void 0 : ownerDocument.defaultView) {
                return ownerDocument.defaultView;
            }
        }
        return typeof activeWindow !== "undefined" ? activeWindow : window;
    }
    /**
     * 獲取當前視窗狀態
     */
    getCurrentWindowState() {
        var _a;
        const activeLeaf = this.getActiveLeafForCurrentWindow();
        let currentWindow = typeof activeWindow !== "undefined" ? activeWindow : window;
        if (activeLeaf) {
            const extLeaf = activeLeaf;
            const ownerDocument = (_a = extLeaf.containerEl) === null || _a === void 0 ? void 0 : _a.ownerDocument;
            if (ownerDocument === null || ownerDocument === void 0 ? void 0 : ownerDocument.defaultView) {
                currentWindow = ownerDocument.defaultView;
            }
        }
        return this.getWindowState(currentWindow);
    }
    /**
     * 使用 outer dimensions，與 Window.resizeTo() 的參數語意一致。
     * innerWidth/innerHeight 是內容區大小，不能直接拿來恢復整個視窗。
     */
    getWindowState(targetWin) {
        return {
            size: {
                width: targetWin.outerWidth || targetWin.innerWidth,
                height: targetWin.outerHeight || targetWin.innerHeight,
            },
            position: targetWin.screenX !== undefined
                ? {
                    x: targetWin.screenX,
                    y: targetWin.screenY,
                }
                : undefined,
        };
    }
    /**
     * 檢查當前活動上下文是否位於 Popout 視窗
     */
    isCurrentlyInPopoutWindow(activeLeaf) {
        // 1. 檢查官方 API activeWindow (Obsidian 1.0+)
        if (typeof activeWindow !== "undefined" && activeWindow !== window) {
            return true;
        }
        // 2. 檢查 activeLeaf containerEl 所在 document
        if (activeLeaf && activeLeaf.containerEl) {
            const doc = activeLeaf.containerEl.ownerDocument;
            if (doc && doc.defaultView && doc.defaultView !== window) {
                return true;
            }
            if (doc && this.isPopoutDocument(doc)) {
                return true;
            }
        }
        // 3. 檢查目前 document 的 body class
        if (typeof document !== "undefined" && this.isPopoutDocument(document)) {
            return true;
        }
        return false;
    }
    /**
     * 檢查 floating 視窗佈局中是否包含開啟指定的檔案
     */
    floatingLayoutContainsFile(layout, filePath) {
        var _a, _b;
        if (!layout)
            return false;
        if (layout.type === "leaf") {
            return ((_b = (_a = layout.state) === null || _a === void 0 ? void 0 : _a.state) === null || _b === void 0 ? void 0 : _b.file) === filePath;
        }
        else if (Array.isArray(layout.children)) {
            for (let child of layout.children) {
                if (this.floatingLayoutContainsFile(child, filePath)) {
                    return true;
                }
            }
        }
        return false;
    }
    /**
     * 只提取當前活動視窗的浮動佈局資訊 (完美支援新開 Popout 視窗)
     */
    extractCurrentFloatingLayout(fullLayout, activeLeaf) {
        var _a, _b, _c;
        const isPopout = this.isCurrentlyInPopoutWindow(activeLeaf);
        // 策略 A: 優先使用完整 workspace layout 中的 floating tree。
        // 這是 Obsidian 實際使用的 schema（split -> tabs -> leaf），比從
        // active leaf 的 root 取得的局部 layout 更可靠。
        const floatingWindows = this.getFloatingWindows(fullLayout);
        if (floatingWindows.length > 0) {
            // 1. 透過 activeLeafId 比對
            const activeLeafId = (activeLeaf === null || activeLeaf === void 0 ? void 0 : activeLeaf.id) || null;
            if (activeLeafId) {
                for (let floatingItem of floatingWindows) {
                    if (this.floatingWindowContainsLeaf(floatingItem, activeLeafId)) {
                        return floatingItem;
                    }
                }
            }
            // 2. 透過檔案路徑比對
            const activeFilePath = (_b = (_a = activeLeaf === null || activeLeaf === void 0 ? void 0 : activeLeaf.view) === null || _a === void 0 ? void 0 : _a.file) === null || _b === void 0 ? void 0 : _b.path;
            if (activeFilePath) {
                for (let floatingItem of floatingWindows) {
                    if (this.floatingLayoutContainsFile(floatingItem, activeFilePath)) {
                        return floatingItem;
                    }
                }
            }
            // 3. 傳回 floating 陣列中的第一個
            if (isPopout || floatingWindows.length === 1) {
                return floatingWindows[0];
            }
        }
        // 策略 B: 只有在完整 layout 無法辨識時，才向 activeLeaf 的獨立
        // root 取得 layout。
        if (activeLeaf && typeof activeLeaf.getRoot === "function") {
            const root = activeLeaf.getRoot();
            if (root && typeof root.getLayout === "function") {
                const ws = this.app.workspace;
                if (root !== ws.rootSplit && root !== ws.leftSplit && root !== ws.rightSplit) {
                    const rootLayout = root.getLayout();
                    if (rootLayout)
                        return rootLayout;
                }
            }
        }
        // 策略 C: 只要確認當前確實在 Popout 視窗內 (isPopout = true)
        if (isPopout && activeLeaf) {
            const viewState = typeof activeLeaf.getViewState === "function"
                ? activeLeaf.getViewState()
                : { type: ((_c = activeLeaf.view) === null || _c === void 0 ? void 0 : _c.getViewType()) || "empty", state: {} };
            return {
                id: activeLeaf.id || this.generateId(),
                type: "leaf",
                state: viewState,
            };
        }
        return null;
    }
    /** 取得 Obsidian floating container 內的實際 WorkspaceWindow 陣列。 */
    getFloatingWindows(layout) {
        const floating = layout === null || layout === void 0 ? void 0 : layout.floating;
        if (Array.isArray(floating))
            return floating;
        if ((floating === null || floating === void 0 ? void 0 : floating.type) === "floating" && Array.isArray(floating.children)) {
            return floating.children;
        }
        return [];
    }
    /**
     * 以 live leaf 的 WorkspaceWindow root ID 精確定位 floating index。
     * Leaf ID 可能在多個 restored layout 中重複，因此只接受唯一 leaf 匹配。
     */
    findFloatingWindowIndexForWindow(targetWin, floatingWindows) {
        const windowLeaves = this.getLeavesForWindow(targetWin);
        for (const leaf of windowLeaves) {
            const extLeaf = leaf;
            const root = typeof extLeaf.getRoot === "function"
                ? extLeaf.getRoot()
                : null;
            const rootLayout = root && typeof root.getLayout === "function"
                ? root.getLayout()
                : null;
            const rootIds = new Set([root === null || root === void 0 ? void 0 : root.id, rootLayout === null || rootLayout === void 0 ? void 0 : rootLayout.id].filter((id) => !!id));
            if (rootIds.size === 0)
                continue;
            const index = floatingWindows.findIndex((floatingWindow) => rootIds.has(floatingWindow === null || floatingWindow === void 0 ? void 0 : floatingWindow.id));
            if (index >= 0)
                return index;
        }
        const matchingIndices = new Set();
        windowLeaves.forEach((leaf) => {
            const leafId = leaf.id;
            if (!leafId)
                return;
            floatingWindows.forEach((floatingWindow, index) => {
                if (this.floatingWindowContainsLeaf(floatingWindow, leafId)) {
                    matchingIndices.add(index);
                }
            });
        });
        return matchingIndices.size === 1
            ? Array.from(matchingIndices)[0]
            : this.findPopoutOrdinal(targetWin, floatingWindows.length);
    }
    /**
     * 以 live WorkspaceWindow container 的順序對應 serialized floating children。
     * Obsidian 公開 API 不保證 WorkspaceWindow 帶有 serialized window ID。
     */
    findPopoutOrdinal(targetWin, floatingCount) {
        var _a, _b;
        const workspace = this.app.workspace;
        const floatingChildren = ((_a = workspace.floatingSplit) === null || _a === void 0 ? void 0 : _a.children) ||
            ((_b = workspace.floating) === null || _b === void 0 ? void 0 : _b.children) ||
            [];
        if (Array.isArray(floatingChildren)) {
            const directIndex = floatingChildren.findIndex((container) => { var _a; return (container === null || container === void 0 ? void 0 : container.win) === targetWin || ((_a = container === null || container === void 0 ? void 0 : container.doc) === null || _a === void 0 ? void 0 : _a.defaultView) === targetWin; });
            if (directIndex >= 0 && directIndex < floatingCount) {
                return directIndex;
            }
        }
        const livePopoutWindows = [];
        this.app.workspace.iterateAllLeaves((leaf) => {
            const container = typeof leaf.getContainer === "function"
                ? leaf.getContainer()
                : null;
            const leafWindow = (container === null || container === void 0 ? void 0 : container.win) || this.getWindowForLeaf(leaf);
            if (leafWindow &&
                this.isPopoutDocument(leafWindow.document) &&
                !livePopoutWindows.includes(leafWindow)) {
                livePopoutWindows.push(leafWindow);
            }
        });
        const ordinal = livePopoutWindows.indexOf(targetWin);
        return ordinal >= 0 && ordinal < floatingCount ? ordinal : -1;
    }
    /**
     * 以目前 WorkspaceWindow 的 id/容器為基礎，只替換其 children。
     * Obsidian 1.12 的 layout schema 是 floating -> window -> split/tabs/leaf。
     */
    /**
     * 以 windowState（screenX/screenY、outerWidth/outerHeight）覆寫 floating
     * window 節點的序列化幾何，統一 changeLayout 建立視窗時使用的座標來源，
     * 避免 Obsidian 序列化幾何與 screen 座標不一致造成 restore 後的位移。
     */
    applyWindowStateGeometry(node, windowState) {
        if (!node || !windowState)
            return;
        const size = windowState.size;
        if (size && size.width > 0 && size.height > 0) {
            node.width = size.width;
            node.height = size.height;
        }
        if (windowState.position) {
            node.x = windowState.position.x;
            node.y = windowState.position.y;
        }
    }
    /**
     * 取得實際的根結構節點。保留 window/floating 包裝：多 child 的 window
     * （如 Professional：tabs + tabs + split）也可由 leaf 層級重建，是否可行
     * 交由 isSimpleLayoutStructure 遞迴判定。
     */
    extractLayoutRootNode(layout) {
        return layout !== null && layout !== void 0 ? layout : null;
    }
    /**
     * 判斷 layout 結構是否可用 leaf 層級 API 重建：
     * - leaf / tabs：可。
     * - split：children 皆為 tabs/leaf（無巢狀 split）。
     * - window / floating：children 皆為 tabs/leaf/split，且其中的 split
     *   本身無巢狀。
     * 其餘（巢狀 split、未知節點）一律回傳 false，交由全域 changeLayout fallback。
     */
    isSimpleLayoutStructure(node, parentDirection) {
        if (!node)
            return false;
        if (node.type === "leaf" || node.type === "tabs")
            return true;
        if (node.type === "split") {
            if (!Array.isArray(node.children) || node.children.length === 0)
                return false;
            // 方向與父 split 相同時，createLeafBySplit 會扁平插入（無法包出巢狀
            // split），先序/佔位演算法都無法精確重建 → fallback。
            if (parentDirection && node.direction === parentDirection)
                return false;
            // 不支援 split 內再套 split（更深巢狀）
            for (const child of node.children) {
                if (!child)
                    return false;
                if (child.type !== "tabs" && child.type !== "leaf")
                    return false;
            }
            return true;
        }
        if (node.type === "window" || node.type === "floating") {
            if (!Array.isArray(node.children) || node.children.length === 0)
                return false;
            const dir = node.direction || "vertical";
            for (const child of node.children) {
                if (!child)
                    return false;
                if (child.type === "split") {
                    if (!this.isSimpleLayoutStructure(child, dir))
                        return false;
                }
                else if (child.type !== "tabs" && child.type !== "leaf") {
                    return false;
                }
            }
            return true;
        }
        return false;
    }
    /**
     * 在目標視窗內以 leaf 層級 API 重建結構（不觸發全域 changeLayout）。
     *
     * 使用「兩階段」演算法以正確支援單層巢狀 split（如 FET-Migration 的
     * window > [hSplit, tabs, tabs]）：
     * 1. 階段一：先為頂層每個單位建立「佔位 leaf」（同一層級，依序
     *    createLeafBySplit），確保外層分割結構完整。
     * 2. 階段二：逐個單位填充——tabs/leaf 直接填 leaf；split 則以其佔位
     *    leaf 為錨點遞迴展開（此時錨點位於外層正確層級，createLeafBySplit
     *    建立的新 split 會正確替換佔位位置）。
     *
     * 回傳依建立順序（= saved 樹先序）的 leaf 清單，供後續 openFile 配對。
     */
    buildSimpleWindowStructure(targetWin, rootNode) {
        return __awaiter(this, void 0, void 0, function* () {
            const workspace = this.app.workspace;
            const initialLeaves = this.getLeavesForWindow(targetWin);
            const built = [];
            const fillTabs = (leaf, node) => __awaiter(this, void 0, void 0, function* () {
                // 把 tabs/leaf 節點的 leaf 依序填入 leaf 所在的 tabs 群組，回傳最後 leaf
                const leafNodes = node.type === "leaf"
                    ? [node]
                    : Array.isArray(node.children)
                        ? node.children.filter((c) => (c === null || c === void 0 ? void 0 : c.type) === "leaf")
                        : [];
                const groupLeaves = [];
                let last = leaf;
                for (let i = 0; i < leafNodes.length; i++) {
                    if (i > 0) {
                        const parent = last.parent;
                        if (!parent)
                            break;
                        last = workspace.createLeafInParent(parent, -1);
                    }
                    yield this.applyBuiltLeafState(last, leafNodes[i]);
                    groupLeaves.push(last);
                    built.push(last);
                }
                // 恢復 saved layout 的 currentTab（該 tab group 保存時選中的 tab）。
                // leaf 層級重建預設會把 group 的 active tab 落在建立順序的預設值，
                // 造成「第一個 column 的第一個 tab 被特別 active、原本選中的 tab
                // lost active」；其他 split 的 tab group 同理一併恢復。
                if (node.type === "tabs" && typeof node.currentTab === "number" && groupLeaves.length > 0) {
                    const activeIndex = Math.max(0, Math.min(node.currentTab, groupLeaves.length - 1));
                    const groupActive = groupLeaves[activeIndex];
                    if (groupActive) {
                        try {
                            yield workspace.revealLeaf(groupActive);
                            workspace.setActiveLeaf(groupActive, { focus: false });
                        }
                        catch (_a) {
                            // Ignore focus/activation error during structure build
                        }
                    }
                }
                return last;
            });
            const expandSplit = (node, direction, placeholderLeaf) => __awaiter(this, void 0, void 0, function* () {
                // 在佔位 leaf 位置展開 split：children 依序建立；方向不同時
                // createLeafBySplit 會建立新 split 替換佔位位置（isSimpleLayoutStructure
                // 已保證每個 split 方向與其父不同，因此必然成立）。
                let anchor = placeholderLeaf;
                for (let i = 0; i < node.children.length; i++) {
                    const child = node.children[i];
                    if (i > 0) {
                        anchor = workspace.createLeafBySplit(anchor, direction === "horizontal" ? "horizontal" : "vertical");
                    }
                    anchor = yield fillTabs(anchor, child);
                }
                return anchor;
            });
            const isContainer = (rootNode === null || rootNode === void 0 ? void 0 : rootNode.type) === "window" || (rootNode === null || rootNode === void 0 ? void 0 : rootNode.type) === "floating";
            const topDirection = isContainer ? rootNode.direction || "vertical" : "vertical";
            const topUnits = isContainer ? rootNode.children || [] : [rootNode];
            // 階段一：建立頂層佔位 leaf（同層級依序分割）
            const placeholders = [];
            let anchor = initialLeaves[0] || null;
            for (let i = 0; i < topUnits.length; i++) {
                if (i > 0) {
                    if (!anchor)
                        break;
                    try {
                        anchor = workspace.createLeafBySplit(anchor, topDirection);
                    }
                    catch (e) {
                        console.warn("Failed to split leaf during restore:", e);
                        break;
                    }
                }
                if (!anchor)
                    break;
                placeholders.push(anchor);
            }
            // 階段二：填充 / 展開每個頂層單位
            for (let i = 0; i < topUnits.length && i < placeholders.length; i++) {
                const unit = topUnits[i];
                const placeholder = placeholders[i];
                if ((unit === null || unit === void 0 ? void 0 : unit.type) === "split") {
                    yield expandSplit(unit, unit.direction, placeholder);
                }
                else {
                    yield fillTabs(placeholder, unit);
                }
            }
            // 結構建立完成後，立即依 saved dimension 套用 flex-grow 權重
            // （與 Obsidian 原生 setDimension 語意一致）。createLeafBySplit 建立
            // 時每個分割都是 50/50 均分；此處用 saved 的 0~100 權重覆寫，讓視窗
            // 第一幀即為正確比例，restore 完成後不再需要 activityBar 以 flex-basis
            // 覆寫（避免兩階段跳動）。
            this.applySavedSplitDimensions(targetWin, rootNode);
            return built;
        });
    }
    /**
     * 依 saved layout 的 dimension（Obsidian flex-grow 權重，0~100）遞迴
     * 套用 split 比例。與 Obsidian 原生 `setDimension` 語意一致：
     * - flex-grow 權重在容器縮放時自動重新分配；
     * - display:none 隱藏側欄時，剩餘欄位自動填滿（不需 rebalance）。
     */
    applySavedSplitDimensions(win, rootNode) {
        var _a;
        if (!win || win.closed || !rootNode)
            return;
        const rootEl = (_a = win.document) === null || _a === void 0 ? void 0 : _a.querySelector(".workspace-split.mod-root");
        if (!rootEl)
            return;
        // 建立 containerEl → Obsidian WorkspaceItem 對應，以便用 setDimension()
        // 同時寫入 dimension 屬性（Obsidian serialize 會保存）與 flex-grow
        // （視覺比例）。只設 CSS flex-grow 會讓「restore 後重新儲存」時
        // dimension 丟失（Obsidian serialize 讀的是物件的 dimension 屬性）。
        const elToItem = new Map();
        try {
            this.app.workspace.iterateAllLeaves((leaf) => {
                if (!leaf || this.getWindowForLeaf(leaf) !== win)
                    return;
                let item = leaf.parent;
                let guard = 0;
                while (item && guard++ < 20) {
                    const itemEl = item.containerEl;
                    if (itemEl instanceof HTMLElement && !elToItem.has(itemEl)) {
                        elToItem.set(itemEl, item);
                    }
                    item = item.parent;
                }
            });
        }
        catch (_b) {
            // iterateAllLeaves 失敗時退回首選（僅 CSS）
        }
        const getSplitChildren = (el) => Array.from(el.children).filter((child) => child instanceof HTMLElement &&
            (child.classList.contains("workspace-tabs") ||
                child.classList.contains("workspace-split")));
        const setFlexGrow = (domEl, dimension) => {
            // 優先走 Obsidian setDimension：寫入 dimension 屬性 + flex-grow，
            // restore 後重新儲存時比例才不會丟失。
            const item = elToItem.get(domEl);
            if (item && typeof item.setDimension === "function") {
                // Obsidian setDimension 對 <=0 或 >=100 的值會設成 null（清除），
                // 因此僅在 (0,100) 區間使用；100 走純 CSS 避免被清除。
                if (dimension > 0 && dimension < 100) {
                    item.setDimension(dimension);
                    return;
                }
            }
            // fallback：僅設 CSS flex-grow（setCssProps 需 kebab-case key）
            const customEl = domEl;
            const flexGrow = String(dimension);
            if (typeof customEl.setCssProps === "function") {
                customEl.setCssProps({ "flex-grow": flexGrow });
            }
            else {
                domEl.style.setProperty("flex-grow", flexGrow);
            }
        };
        const applyNode = (node, domEl) => {
            if (!node || !domEl)
                return;
            const dimension = Number(node.dimension);
            if (Number.isFinite(dimension) && dimension > 0 && dimension <= 100) {
                setFlexGrow(domEl, dimension);
            }
            if (node.type === "split" && Array.isArray(node.children)) {
                const domChildren = getSplitChildren(domEl);
                node.children.forEach((child, index) => {
                    applyNode(child, domChildren[index]);
                });
            }
        };
        // window/floating 包裝：其 children 對應 rootEl 的頂層欄位
        if (rootNode.type === "window" || rootNode.type === "floating") {
            const domChildren = getSplitChildren(rootEl);
            (Array.isArray(rootNode.children) ? rootNode.children : []).forEach((child, index) => {
                applyNode(child, domChildren[index]);
            });
        }
        else {
            applyNode(rootNode, rootEl);
        }
    }
    /**
     * 為 leaf 層級建立的 leaf 設定 view state。
     * 檔案 leaf 交由 restoreFileStatesForWindow 的 openFile 處理（此處跳過）；
     * 非檔案 leaf 在此先建立 view，讓後續的 ensureViewRenderedWithRetries 能渲染。
     */
    applyBuiltLeafState(leaf, node) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            if (!leaf || !node)
                return;
            const filePath = this.getFilePathFromLeafState({
                type: node.type,
                state: ((_a = node.state) === null || _a === void 0 ? void 0 : _a.state) || {},
            });
            if (filePath)
                return;
            const nodeState = node.state || {};
            yield leaf.setViewState({
                type: nodeState.type || node.type || "empty",
                active: false,
                state: nodeState.state || {},
            });
            // 核心 view（file-explorer / search / outline 等）是 deferred view：
            // setViewState 只建立 tab 標題，內容需 loadIfDeferred() 才會載入。
            // 未載入時 content area 會是空的（先前 changeLayout 路徑由 Obsidian
            // 的 setLayout 自動 load；leaf 層級路徑需自行處理）。
            const extLeaf = leaf;
            if (extLeaf.isDeferred && typeof extLeaf.loadIfDeferred === "function") {
                try {
                    yield extLeaf.loadIfDeferred();
                }
                catch (e) {
                    console.warn("Failed to load deferred view during restore:", e);
                }
            }
        });
    }
    /**
     * leaf 層級建立後，依 saved 順序套用 pinned 狀態
     * （檔案 leaf 需於 openFile 之後才 toggle，避免 openFile 重置）。
     */
    applyPinnedStateToBuiltLeaves(built, saved) {
        built.forEach((leaf, i) => {
            var _a, _b;
            const savedLeaf = saved[i];
            if (!savedLeaf || savedLeaf.pinned !== true)
                return;
            const extLeaf = leaf;
            const isPinned = ((_b = (_a = extLeaf.getViewState) === null || _a === void 0 ? void 0 : _a.call(extLeaf)) === null || _b === void 0 ? void 0 : _b.pinned) === true;
            if (!isPinned && typeof extLeaf.togglePinned === "function") {
                try {
                    extLeaf.togglePinned();
                }
                catch (_c) {
                    // Ignore pinned toggle error
                }
            }
        });
    }
    prepareFloatingWindowForRestore(savedLayout, currentWindow, includeGeometry = true, windowState) {
        const saved = JSON.parse(JSON.stringify(savedLayout));
        if ((currentWindow === null || currentWindow === void 0 ? void 0 : currentWindow.type) === "window") {
            if (saved.type === "window") {
                const merged = Object.assign(Object.assign(Object.assign({}, currentWindow), saved), { id: currentWindow.id, children: Array.isArray(saved.children)
                        ? saved.children.map((child) => this.normalizeFloatingLayout(child))
                        : [] });
                if (includeGeometry === false) {
                    delete merged.x;
                    delete merged.y;
                    delete merged.width;
                    delete merged.height;
                    delete merged.dimension;
                    delete merged.zoom;
                    delete merged.isMaximized;
                    delete merged.isFullScreen;
                }
                else {
                    this.applyWindowStateGeometry(merged, windowState);
                }
                return merged;
            }
            const res = Object.assign(Object.assign({}, currentWindow), { children: [this.normalizeFloatingLayout(saved)] });
            if (includeGeometry === false) {
                delete res.x;
                delete res.y;
                delete res.width;
                delete res.height;
                delete res.dimension;
                delete res.zoom;
                delete res.isMaximized;
                delete res.isFullScreen;
            }
            else {
                this.applyWindowStateGeometry(res, windowState);
            }
            return res;
        }
        if (includeGeometry === false && (saved === null || saved === void 0 ? void 0 : saved.type) === "window") {
            delete saved.x;
            delete saved.y;
            delete saved.width;
            delete saved.height;
            delete saved.dimension;
            delete saved.zoom;
            delete saved.isMaximized;
            delete saved.isFullScreen;
        }
        else if ((saved === null || saved === void 0 ? void 0 : saved.type) === "window") {
            this.applyWindowStateGeometry(saved, windowState);
        }
        return saved.type === "window" ? saved : this.normalizeFloatingLayout(saved);
    }
    normalizeFloatingLayout(layout) {
        if (!layout)
            return layout;
        if (layout.type === "leaf") {
            return {
                type: "split",
                id: layout.id || this.generateId(),
                direction: "vertical",
                children: [{
                        type: "tabs",
                        id: this.generateId(),
                        children: [JSON.parse(JSON.stringify(layout))],
                    }],
            };
        }
        if (layout.type === "tabs") {
            return Object.assign(Object.assign({}, layout), { children: Array.isArray(layout.children)
                    ? layout.children.map((child) => JSON.parse(JSON.stringify(child)))
                    : [] });
        }
        if (layout.type === "window" || layout.type === "floating") {
            return Object.assign(Object.assign({}, layout), { children: Array.isArray(layout.children)
                    ? layout.children.map((child) => this.normalizeFloatingLayout(child))
                    : [] });
        }
        if (layout.type === "split") {
            return Object.assign(Object.assign({}, layout), { children: Array.isArray(layout.children)
                    ? layout.children.map((child) => {
                        if ((child === null || child === void 0 ? void 0 : child.type) === "leaf") {
                            return {
                                type: "tabs",
                                id: this.generateId(),
                                children: [JSON.parse(JSON.stringify(child))],
                            };
                        }
                        return this.normalizeFloatingLayout(child);
                    })
                    : [] });
        }
        return JSON.parse(JSON.stringify(layout));
    }
    /**
     * 檢查 floating 視窗是否包含指定的 leaf
     */
    floatingWindowContainsLeaf(layout, leafId) {
        if (!layout)
            return false;
        if (layout.type === "leaf") {
            return layout.id === leafId;
        }
        else if (Array.isArray(layout.children)) {
            for (let child of layout.children) {
                if (this.floatingWindowContainsLeaf(child, leafId)) {
                    return true;
                }
            }
        }
        return false;
    }
    /**
     * 從佈局數據中提取 leaf 信息
     */
    extractLeavesFromLayout(layout, leaves = []) {
        var _a, _b, _c;
        if (!layout)
            return leaves;
        if (layout.type === "leaf") {
            leaves.push({
                id: layout.id || this.generateId(),
                type: ((_a = layout.state) === null || _a === void 0 ? void 0 : _a.type) || "unknown",
                state: ((_b = layout.state) === null || _b === void 0 ? void 0 : _b.state) || {},
                pinned: layout.pinned === true || ((_c = layout.state) === null || _c === void 0 ? void 0 : _c.pinned) === true,
            });
        }
        else if (Array.isArray(layout.children)) {
            layout.children.forEach((child) => {
                this.extractLeavesFromLayout(child, leaves);
            });
        }
        return leaves;
    }
    /**
     * 嘗試從 FolderSpaces View 提取資料夾名稱 (最高優先級)
     */
    getFolderSpaceNameFromLeaf(leaf) {
        if (!leaf)
            return null;
        const typeStr = leaf.type ? String(leaf.type).toLowerCase() : "";
        const isFolderSpaceView = typeStr === "folder-space-explorer" ||
            typeStr === "folder-space" ||
            typeStr === "folder-spaces" ||
            typeStr.includes("folder-space") ||
            typeStr.includes("folderspace");
        const stateObj = leaf.state;
        if (!stateObj && !isFolderSpaceView)
            return null;
        let rawFolderPath = null;
        if (typeof (stateObj === null || stateObj === void 0 ? void 0 : stateObj.folder) === "string") {
            rawFolderPath = stateObj.folder;
        }
        else if (typeof (stateObj === null || stateObj === void 0 ? void 0 : stateObj.folderPath) === "string") {
            rawFolderPath = stateObj.folderPath;
        }
        else if (typeof (stateObj === null || stateObj === void 0 ? void 0 : stateObj.path) === "string" && (isFolderSpaceView || !stateObj.file)) {
            rawFolderPath = stateObj.path;
        }
        else if ((stateObj === null || stateObj === void 0 ? void 0 : stateObj.state) && typeof stateObj.state === "object") {
            const innerState = stateObj.state;
            if (typeof innerState.folder === "string") {
                rawFolderPath = innerState.folder;
            }
            else if (typeof innerState.folderPath === "string") {
                rawFolderPath = innerState.folderPath;
            }
            else if (typeof innerState.path === "string" && (isFolderSpaceView || !innerState.file)) {
                rawFolderPath = innerState.path;
            }
        }
        if (!rawFolderPath && !isFolderSpaceView)
            return null;
        if (!rawFolderPath || rawFolderPath === "/" || rawFolderPath === ".") {
            return this.app.vault.getName();
        }
        const normalized = rawFolderPath.replace(/\\/g, "/").replace(/\/+$/, "");
        const lastFolder = normalized.split("/").pop() || normalized;
        return lastFolder.trim() || this.app.vault.getName();
    }
    /**
     * 根據 Folder Space Explorer、Pinned 檔案、Active 檔案與數量自動產生智慧佈局名稱 (UX-006)
     */
    generateSmartLayoutName(layout) {
        var _a;
        const leaves = this.getSavedViewStates(layout);
        // 最高優先級：若包含 Folder Space Explorer，取第一個 Folder Space Explorer 的資料夾名稱
        for (const leaf of leaves) {
            const folderSpaceName = this.getFolderSpaceNameFromLeaf(leaf);
            if (folderSpaceName) {
                return folderSpaceName;
            }
        }
        const activeFile = (_a = layout.workspace) === null || _a === void 0 ? void 0 : _a.activeFile;
        const pinnedFileNames = [];
        const activeFileName = [];
        const otherFileNames = [];
        const getBaseName = (path) => {
            const name = path.split("/").pop() || path;
            return name.endsWith(".md") ? name.slice(0, -3) : name;
        };
        leaves.forEach((leaf) => {
            const filePath = this.getFilePathFromLeafState(leaf);
            if (!filePath)
                return;
            const baseName = getBaseName(filePath);
            if (leaf.pinned) {
                if (!pinnedFileNames.includes(baseName)) {
                    pinnedFileNames.push(baseName);
                }
            }
            else if (activeFile && filePath === activeFile) {
                if (!activeFileName.includes(baseName)) {
                    activeFileName.push(baseName);
                }
            }
            else {
                if (!otherFileNames.includes(baseName)) {
                    otherFileNames.push(baseName);
                }
            }
        });
        // 優先順序：Pinned 檔名 -> Active 檔名 -> 其他檔名
        const orderedNames = [];
        pinnedFileNames.forEach((n) => {
            if (!orderedNames.includes(n))
                orderedNames.push(n);
        });
        activeFileName.forEach((n) => {
            if (!orderedNames.includes(n))
                orderedNames.push(n);
        });
        otherFileNames.forEach((n) => {
            if (!orderedNames.includes(n))
                orderedNames.push(n);
        });
        if (orderedNames.length === 0) {
            const now = new Date(layout.timestamp || Date.now());
            const i18n = getI18n();
            return `${t("saveModal.title")} ${i18n.formatDate(now)}`;
        }
        let generatedName = "";
        if (orderedNames.length === 1) {
            generatedName = orderedNames[0];
        }
        else if (orderedNames.length === 2) {
            generatedName = `${orderedNames[0]} & ${orderedNames[1]}`;
        }
        else {
            generatedName = `${orderedNames[0]}, ${orderedNames[1]} ${t("saveModal.andOthers")}`;
        }
        if (generatedName.length > 55) {
            generatedName = generatedName.slice(0, 52) + "...";
        }
        return generatedName;
    }
    /**
     * 取得保存的所有 leaf 狀態。以 layout tree 為主，並補上舊版本資料
     * 中可能存在但未被寫入 layout tree 的 workspace.leaves。
     */
    getSavedViewStates(layout) {
        var _a, _b;
        const fromLayout = this.extractLeavesFromLayout((_a = layout.workspace) === null || _a === void 0 ? void 0 : _a.layout);
        const explicitLeaves = Array.isArray((_b = layout.workspace) === null || _b === void 0 ? void 0 : _b.leaves)
            ? layout.workspace.leaves
            : [];
        const explicitById = new Map(explicitLeaves.map((leaf) => [leaf.id, leaf]));
        const result = fromLayout.map((leaf) => {
            const explicit = explicitById.get(leaf.id);
            if (!explicit)
                return leaf;
            return Object.assign(Object.assign({}, leaf), { type: explicit.type || leaf.type, state: Object.assign(Object.assign({}, leaf.state), explicit.state) });
        });
        const resultIds = new Set(result.map((leaf) => leaf.id));
        explicitLeaves.forEach((leaf) => {
            if (!resultIds.has(leaf.id))
                result.push(leaf);
        });
        return result;
    }
    /**
     * 計算開啟的文件數量
     */
    countOpenFiles(leaves) {
        return leaves.filter((leaf) => leaf.state.file).length;
    }
    getFilePathFromLeafState(leafState) {
        var _a, _b, _c;
        if (!leafState)
            return null;
        if (typeof leafState === "string")
            return leafState;
        const stateObj = leafState;
        if (typeof ((_a = stateObj.state) === null || _a === void 0 ? void 0 : _a.file) === "string")
            return stateObj.state.file;
        if (typeof ((_c = (_b = stateObj.state) === null || _b === void 0 ? void 0 : _b.state) === null || _c === void 0 ? void 0 : _c.file) === "string")
            return stateObj.state.state.file;
        if (typeof stateObj.file === "string")
            return stateObj.file;
        return null;
    }
    /**
     * 恢復檔案狀態 (在對應現有分頁中安全開立檔案，尊重原生 Layout)
     */
    restoreFileStatesForWindow(targetWin, leaves, activeFilePath) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const currentWin = targetWin || (typeof activeWindow !== "undefined" ? activeWindow : window);
            const windowLeaves = yield this.waitForWindowLeaves(currentWin, leaves.length);
            const leavesById = new Map();
            windowLeaves.forEach((leaf) => {
                const id = leaf.id;
                if (id)
                    leavesById.set(id, leaf);
            });
            const missingFiles = [];
            let targetActiveLeaf = null;
            const totalFiles = leaves.filter((l) => !!this.getFilePathFromLeafState(l)).length;
            let progressNotice = null;
            if (totalFiles > 1 && this.plugin.settings.showNotifications !== false) {
                progressNotice = new obsidian.Notice(`🔄 ${t("restoreModal.restoringLayout")}... (0/${totalFiles})`, 0);
            }
            let processedCount = 0;
            const activeLeafForWindow = this.getActiveLeafForCurrentWindow(currentWin);
            for (let i = 0; i < leaves.length; i++) {
                const leafState = leaves[i];
                const filePath = this.getFilePathFromLeafState(leafState);
                if (!filePath) {
                    // 非檔案 leaf（file-explorer / search / tag / outline / bookmarks 等）：
                    // changeLayout 建立 leaf 後部分核心側欄 view 內容不會自動渲染（僅顯示 tab 標題）。
                    // 以「已渲染 flag」檢查 + 延遲重試強制重新渲染。
                    const targetLeaf = leavesById.get(leafState.id) ||
                        (i < windowLeaves.length ? windowLeaves[i] : null);
                    if (targetLeaf && targetLeaf !== activeLeafForWindow) {
                        this.ensureViewRenderedWithRetries(currentWin, targetLeaf);
                    }
                    continue;
                }
                processedCount++;
                if (progressNotice) {
                    progressNotice.setMessage(`🔄 ${t("restoreModal.restoringLayout")}... (${processedCount}/${totalFiles})`);
                }
                let targetLeaf = leavesById.get(leafState.id) || null;
                if (i < windowLeaves.length && !targetLeaf)
                    targetLeaf = windowLeaves[i];
                // 若該視窗現有分頁數少於所需分頁，自動為其切割建立新分頁容器
                if (!targetLeaf && windowLeaves.length > 0) {
                    try {
                        const baseLeaf = windowLeaves[windowLeaves.length - 1];
                        targetLeaf = this.app.workspace.createLeafBySplit(baseLeaf, "vertical");
                        if (targetLeaf)
                            windowLeaves.push(targetLeaf);
                    }
                    catch (e) {
                        console.warn("Failed to create leaf by split for target window:", e);
                    }
                }
                const file = this.app.vault.getAbstractFileByPath(filePath);
                if (file instanceof obsidian.TFile) {
                    if (targetLeaf) {
                        const stateObj = leafState.state;
                        const viewMode = (stateObj === null || stateObj === void 0 ? void 0 : stateObj.mode) || ((_a = stateObj === null || stateObj === void 0 ? void 0 : stateObj.state) === null || _a === void 0 ? void 0 : _a.mode);
                        const openOptions = { active: false };
                        if (viewMode) {
                            openOptions.state = { mode: viewMode };
                        }
                        yield targetLeaf.openFile(file, openOptions);
                        if (activeFilePath && filePath === activeFilePath) {
                            targetActiveLeaf = targetLeaf;
                        }
                    }
                }
                else {
                    const fileName = filePath.split("/").pop() || filePath;
                    missingFiles.push(fileName);
                    if (targetLeaf && typeof targetLeaf.setViewState === "function") {
                        try {
                            yield targetLeaf.setViewState({ type: "empty" });
                        }
                        catch (e) {
                            console.warn("Failed to set empty view state:", e);
                        }
                    }
                }
            }
            if (progressNotice) {
                progressNotice.hide();
            }
            const leafToFocus = targetActiveLeaf || null;
            if (leafToFocus) {
                try {
                    yield this.app.workspace.revealLeaf(leafToFocus);
                    this.app.workspace.setActiveLeaf(leafToFocus, { focus: true });
                    if ((leafToFocus === null || leafToFocus === void 0 ? void 0 : leafToFocus.containerEl) && typeof leafToFocus.containerEl.focus === "function") {
                        leafToFocus.containerEl.focus();
                    }
                }
                catch (e) {
                    console.warn("Failed to set active leaf:", e);
                }
            }
            else {
                // 無 activeFile 時不要 fallback 到 windowLeaves[0]：leaf 層級重建
                // （fillTabs 已恢復各 tab group 的 currentTab）或 changeLayout 已把
                // active 指到視窗內的 leaf。此處只在 active 完全未指向此視窗時才補指，
                // 避免把第一個 column 的第一個 tab 搶成 active（原本選中的 tab lost active）。
                const currentActive = typeof this.app.workspace.getMostRecentLeaf === "function"
                    ? this.app.workspace.getMostRecentLeaf()
                    : this.app.workspace.activeLeaf;
                if (!currentActive || !windowLeaves.includes(currentActive)) {
                    const fallbackLeaf = windowLeaves[0] || null;
                    if (fallbackLeaf) {
                        try {
                            yield this.app.workspace.revealLeaf(fallbackLeaf);
                            this.app.workspace.setActiveLeaf(fallbackLeaf, { focus: true });
                        }
                        catch (e) {
                            console.warn("Failed to set active leaf:", e);
                        }
                    }
                }
            }
            return missingFiles;
        });
    }
    /** 等待 changeLayout 完成 leaf 建立，避免只對第一個已建立的 leaf 開檔。 */
    waitForWindowLeaves(targetWin, expectedCount) {
        return __awaiter(this, void 0, void 0, function* () {
            let leaves = this.getLeavesForWindow(targetWin);
            for (let attempt = 0; attempt < 20 && leaves.length < expectedCount; attempt++) {
                yield new Promise((resolve) => window.setTimeout(resolve, 50));
                leaves = this.getLeavesForWindow(targetWin);
            }
            return leaves;
        });
    }
    /** 取得 leaf 所屬的 DOM Window。 */
    getWindowForLeaf(leaf) {
        var _a, _b;
        return ((_b = (_a = leaf === null || leaf === void 0 ? void 0 : leaf.containerEl) === null || _a === void 0 ? void 0 : _a.ownerDocument) === null || _b === void 0 ? void 0 : _b.defaultView) || null;
    }
    /** 根據保存的 leaf 集合辨識還原後的目標視窗。 */
    findWindowForSavedLeaves(leaves, excludedWindow, preferredWindow, claimedWindows = new Set(), requirePositiveScore = false) {
        var _a;
        if (leaves.length === 0)
            return null;
        const savedIds = new Set(leaves.map((leaf) => leaf.id));
        const savedFiles = new Set(leaves
            .map((leaf) => this.getFilePathFromLeafState(leaf))
            .filter((filePath) => !!filePath));
        const windows = new Map();
        // 追蹤各視窗的 leaf-id 命中數與被命中的 saved 檔案集合（供覆蓋率門檻使用），
        // 避免只靠通用檔名（如多個 space 共用的 Untitled.md）造成誤匹配。
        const idMatches = new Map();
        const matchedSavedFiles = new Map();
        let bestWindow = null;
        let bestScore = 0;
        this.app.workspace.iterateAllLeaves((leaf) => {
            const targetWindow = this.getWindowForLeaf(leaf);
            if (!targetWindow ||
                targetWindow === excludedWindow ||
                claimedWindows.has(targetWindow) ||
                !this.isPopoutDocument(targetWindow.document))
                return;
            const viewState = typeof leaf.getViewState === "function"
                ? leaf.getViewState()
                : null;
            const filePath = this.getFilePathFromLeafState({
                state: (viewState === null || viewState === void 0 ? void 0 : viewState.state) || {},
            });
            const idHit = savedIds.has(leaf.id) ? 1 : 0;
            const fileHit = filePath && savedFiles.has(filePath) ? 1 : 0;
            const score = (windows.get(targetWindow) || 0) +
                (idHit ? 100 : 0) +
                (fileHit ? 10 : 0);
            windows.set(targetWindow, score);
            idMatches.set(targetWindow, (idMatches.get(targetWindow) || 0) + idHit);
            if (fileHit) {
                const set = matchedSavedFiles.get(targetWindow) || new Set();
                set.add(filePath);
                matchedSavedFiles.set(targetWindow, set);
            }
            if (score > bestScore) {
                bestScore = score;
                bestWindow = targetWindow;
            }
        });
        // openPopoutLeaf() 回傳的 Window 若已確認仍是 live popout，優先使用，
        // 避免來源與新視窗共用 leaf ID 時形成平手。
        if (preferredWindow && windows.has(preferredWindow)) {
            return preferredWindow;
        }
        if (bestWindow) {
            // 當要求正分數 (requirePositiveScore) 時，leaf-id 命中視為高置信直接接受；
            // 純檔案匹配則需 saved 檔案覆蓋率 ≥ 50%，避免通用檔名（Untitled.md）誤判。
            if (requirePositiveScore && (idMatches.get(bestWindow) || 0) === 0) {
                const coverage = savedFiles.size > 0
                    ? (((_a = matchedSavedFiles.get(bestWindow)) === null || _a === void 0 ? void 0 : _a.size) || 0) / savedFiles.size
                    : 0;
                if (coverage < 0.5)
                    return null;
            }
            return bestWindow;
        }
        // 當要求正分數 (positive score) 時，若未匹配到任何 leaf/file (score 0)，禁止盲目 fallback 回傳唯一視窗
        if (requirePositiveScore)
            return null;
        // 首次 restore 時若 Obsidian 已重建 leaf ID，但目前只有一個 popout，
        // 該視窗就是唯一合法目標。
        return windows.size === 1 ? Array.from(windows.keys())[0] : null;
    }
    /**
     * 將 restore 前保存的所有 layout 名稱與視窗幾何座標，一對一重新套用至 restore 後的
     * live popout。避免跨螢幕/異質 DPI 下 changeLayout 導至既有視窗尺寸微幅縮小。
     */
    restorePreservedWindowLabels(snapshots, restoredTargetWindow) {
        const claimedWindows = new Set();
        if (restoredTargetWindow)
            claimedWindows.add(restoredTargetWindow);
        snapshots.forEach((snapshot) => {
            const currentWindow = this.findWindowForSavedLeaves(snapshot.leaves, restoredTargetWindow || undefined, snapshot.window, claimedWindows);
            if (!currentWindow)
                return;
            this.setLayoutLabelForWindow(currentWindow, snapshot.layoutName);
            if (snapshot.windowState) {
                this.restoreWindowGeometry(currentWindow, snapshot.windowState, true, true);
            }
            claimedWindows.add(currentWindow);
        });
    }
    /** 在 changeLayout 重建 popout 後恢復實際視窗尺寸與座標（僅在幾何有顯著差異或強制時呼叫，防止重複無謂位移與 OS 邊框重算）。 */
    restoreWindowGeometry(targetWin, windowState, includeGeometry = true, force = true) {
        if (!windowState || includeGeometry === false || !targetWin)
            return;
        const size = windowState.size;
        if (size &&
            size.width > 0 &&
            size.height > 0 &&
            typeof targetWin.resizeTo === "function") {
            const currentWidth = typeof targetWin.outerWidth === "number" ? targetWin.outerWidth : 0;
            const currentHeight = typeof targetWin.outerHeight === "number" ? targetWin.outerHeight : 0;
            if (force || currentWidth === 0 || Math.abs(currentWidth - size.width) > 2 || Math.abs(currentHeight - size.height) > 2) {
                targetWin.resizeTo(size.width, size.height);
            }
        }
        if (windowState.position && typeof targetWin.moveTo === "function") {
            const currentX = typeof targetWin.screenX === "number" ? targetWin.screenX : 0;
            const currentY = typeof targetWin.screenY === "number" ? targetWin.screenY : 0;
            if (force || currentX === 0 || Math.abs(currentX - windowState.position.x) > 2 || Math.abs(currentY - windowState.position.y) > 2) {
                targetWin.moveTo(windowState.position.x, windowState.position.y);
            }
        }
    }
    /**
     * 當發動 changeLayout 時，將非 Restore 目標之活體 Popout 視窗最新實際 outerWidth/outerHeight/screenX/screenY 帶入 floating schema，
     * 避免多螢幕異質 DPI 縮放率下呼叫全域 changeLayout 時，其他存活 Popout 視窗尺寸被重複縮放衰減。
     */
    syncLiveWindowBoundsToFloatingChild(child, liveWin) {
        if (!child || typeof child !== "object" || !liveWin || liveWin.closed)
            return child;
        try {
            const cloned = Object.assign({}, child);
            if (typeof liveWin.outerWidth === "number" && liveWin.outerWidth > 0) {
                cloned.width = liveWin.outerWidth;
            }
            if (typeof liveWin.outerHeight === "number" && liveWin.outerHeight > 0) {
                cloned.height = liveWin.outerHeight;
            }
            if (typeof liveWin.screenX === "number") {
                cloned.x = liveWin.screenX;
            }
            if (typeof liveWin.screenY === "number") {
                cloned.y = liveWin.screenY;
            }
            return cloned;
        }
        catch (_a) {
            return child;
        }
    }
    /** changeLayout 重建期間 DOM 尚未穩定，單次安全套用並於 200ms 做單次保險檢查。 */
    applyHiddenStateAfterRestore(targetWin, hidden) {
        const engine = this.plugin.popoutLayout;
        const apply = () => {
            try {
                engine.applyHiddenState(targetWin, hidden);
            }
            catch (_a) {
                // Ignore DOM not ready error
            }
        };
        apply();
        if (typeof targetWin.setTimeout === "function") {
            targetWin.setTimeout(apply, 200);
        }
    }
    /** 是否為檔案類 view（markdown / pdf / 圖片等），此類 view 不參與強制渲染。 */
    isFileView(leaf) {
        var _a;
        return !!leaf && !!((_a = leaf.view) === null || _a === void 0 ? void 0 : _a.file);
    }
    /** 檢查 leaf 是否已渲染出實際內容。 */
    hasRenderedContent(leaf) {
        var _a;
        if (!leaf)
            return false;
        const leafEl = leaf.containerEl ||
            ((_a = leaf.view) === null || _a === void 0 ? void 0 : _a.containerEl);
        if (!(leafEl instanceof HTMLElement))
            return false;
        // 標準 view：.view-content 有子元素即已渲染。
        const content = leafEl.querySelector(".view-content");
        if (content)
            return content.children.length > 0;
        // File Explorer 家族（原生 file-explorer 與 Folder Space 重用同一 DOM 結構，
        // 無 .view-content）：nav-files-container 有子元素即已渲染。
        // 避免 restore 後的 lifecycle retry 把已渲染的 folder tree 反覆 rebuild（抖動）。
        const navFiles = leafEl.querySelector(".nav-files-container");
        if (navFiles)
            return navFiles.children.length > 0;
        return false;
    }
    /** 強制重新渲染 leaf 的 view（重建視圖，重新執行 onOpen）。 */
    forceRenderView(leaf) {
        const extLeaf = leaf;
        if (typeof extLeaf.rebuildView === "function") {
            try {
                extLeaf.rebuildView();
                return;
            }
            catch (e) {
                console.warn("rebuildView failed, falling back to setViewState:", e);
            }
        }
        // fallback：同型別 setViewState 只會呼叫 setState，不會重建視圖；
        // 先切成 empty 再切回目標型別以強制重建。
        const current = typeof extLeaf.getViewState === "function" ? extLeaf.getViewState() : null;
        const type = current === null || current === void 0 ? void 0 : current.type;
        if (!type)
            return;
        void (() => __awaiter(this, void 0, void 0, function* () {
            try {
                yield extLeaf.setViewState({ type: "empty", active: false, state: {} });
                yield extLeaf.setViewState({ type, active: false, state: current.state || {} });
            }
            catch (e) {
                console.warn("Failed to force render view:", e);
            }
        }))();
    }
    /**
     * 單次檢查：先載入 deferred view，再於 DOM 仍為空時最多重建一次。
     * 多個 lifecycle retry 不得因 DOM 尚未及時更新而連續重建同一個 leaf。
     */
    ensureViewRendered(leaf) {
        if (!leaf || this.isFileView(leaf))
            return;
        if (this.hasRenderedContent(leaf)) {
            this.renderAttemptedLeaves.delete(leaf);
            return;
        }
        if (leaf.isDeferred) {
            if (this.deferredViewLoads.has(leaf))
                return;
            const pendingLoad = leaf
                .loadIfDeferred()
                .then(() => {
                this.deferredViewLoads.delete(leaf);
                if (!this.hasRenderedContent(leaf))
                    this.rebuildViewIfNeeded(leaf);
            })
                .catch(() => {
                this.deferredViewLoads.delete(leaf);
                this.rebuildViewIfNeeded(leaf);
            });
            this.deferredViewLoads.set(leaf, pendingLoad);
            return;
        }
        this.rebuildViewIfNeeded(leaf);
    }
    rebuildViewIfNeeded(leaf) {
        if (this.hasRenderedContent(leaf) || this.renderAttemptedLeaves.has(leaf))
            return;
        this.renderAttemptedLeaves.add(leaf);
        this.forceRenderView(leaf);
    }
    /**
     * 在 Popout tab 切換完成後延遲檢查 DOM，避免 active-leaf-change 的
     * mousedown/mouseup 階段重建 view 而吞掉原生 click 事件。
     */
    scheduleViewRenderAfterActivation(leaf, targetWin) {
        if (!leaf || !targetWin || targetWin.closed)
            return;
        targetWin.setTimeout(() => {
            if (targetWin.closed)
                return;
            const container = leaf.containerEl;
            if (!(container === null || container === void 0 ? void 0 : container.isConnected))
                return;
            this.ensureViewRendered(leaf);
        }, 150);
    }
    /** 以受管控方式確保非檔案 view 已渲染，所有重試皆通過 per-leaf guard 防止重複 DOM 重建。 */
    ensureViewRenderedWithRetries(targetWin, leaf) {
        if (!leaf || !targetWin || targetWin.closed)
            return;
        this.ensureViewRendered(leaf);
        if (typeof targetWin.setTimeout === "function") {
            targetWin.setTimeout(() => {
                if (targetWin.closed)
                    return;
                this.ensureViewRendered(leaf);
            }, 200);
        }
    }
    /**
     * 視窗已顯示後，對仍無內容的 deferred view（file-explorer / search 等）
     * 強制 loadIfDeferred——此時 containerEl 可見，setViewState 會建立真實
     * view（而非 DeferredView），內容即可渲染。300ms 後再確認一次，涵蓋
     * 視窗建立初期 onOpen 的非同步渲染延遲。
     */
    ensureDeferredViewsLoaded(targetWin) {
        if (!targetWin || targetWin.closed)
            return;
        const attempt = () => __awaiter(this, void 0, void 0, function* () {
            if (targetWin.closed)
                return;
            const leaves = this.getLeavesForWindow(targetWin);
            // 依序 await 處理，避免多個 rebuildView 並發互相衝突（working 標記會
            // 讓彼此的 setViewState 被跳過，導致停在半初始化空白）。
            for (const leaf of leaves) {
                if (this.isFileView(leaf) || this.hasRenderedContent(leaf))
                    continue;
                const extLeaf = leaf;
                if (extLeaf.isDeferred && typeof extLeaf.loadIfDeferred === "function") {
                    try {
                        yield extLeaf.loadIfDeferred();
                    }
                    catch (_a) {
                        // Ignore deferred load error
                    }
                    continue;
                }
                // 非 deferred 但內容仍空：視窗未顯示時建立的 view 停在半初始化
                // （open() 未完成，containerEl 空白）。視窗顯示後 rebuildView 可
                // 正確渲染；多階段 attempt 涵蓋視窗顯示時序的不確定性。
                this.renderAttemptedLeaves.delete(leaf);
                if (typeof extLeaf.rebuildView === "function") {
                    try {
                        yield extLeaf.rebuildView();
                    }
                    catch (_b) {
                        // Ignore rebuild error; 後續 attempt 會再試
                    }
                }
                else {
                    this.rebuildViewIfNeeded(leaf);
                }
            }
        });
        void attempt();
        if (typeof targetWin.setTimeout === "function") {
            [300, 1200, 2500].forEach((ms) => targetWin.setTimeout(() => void attempt(), ms));
        }
        // 視窗尚未顯示（Electron 顯示延遲）時，前面的 attempt 可能全部太早。
        // 視窗首次變為 visible 時再補載一次——此時 rebuildView 能正確渲染。
        const doc = targetWin.document;
        if (doc && typeof doc.addEventListener === "function") {
            doc.addEventListener("visibilitychange", () => {
                if (targetWin.closed)
                    return;
                if (doc.visibilityState === "visible")
                    void attempt();
            }, { once: true });
        }
    }
    /**
     * 根據 ID 查找 leaf
     */
    findLeafById(id) {
        if (!id)
            return null;
        let targetLeaf = null;
        this.app.workspace.iterateAllLeaves((leaf) => {
            if (!targetLeaf && leaf.id === id) {
                targetLeaf = leaf;
            }
        });
        return targetLeaf;
    }
    /**
     * 調整視窗位置
     */
    adjustWindowPosition(position) {
        try {
            // 這個功能在某些環境中可能受限
            if (window.moveTo) {
                window.moveTo(position.x, position.y);
            }
        }
        catch (error) {
            console.warn("Failed to adjust window position:", error);
        }
    }
    /**
     * 驗證佈局數據
     */
    validateLayout(layout) {
        return !!(layout &&
            layout.id &&
            layout.name &&
            layout.workspace &&
            layout.workspace.layout);
    }
    /**
     * 生成唯一 ID
     */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substring(2);
    }
}

const ACTIVITY_BAR_DRAG_DATA_TYPE = "application/x-window-spaces-view-type";
function isActivityBarItem$1(value) {
    return !!value && typeof value.viewType === "string" && value.viewType.trim().length > 0;
}
/**
 * Reorder activity-bar items by their stable view type rather than a DOM index.
 * A DOM index can become stale when the settings UI is rendered asynchronously.
 */
function reorderActivityBarItems(items, draggedViewType, targetViewType, placeAfter) {
    const fromIndex = items.findIndex((item) => isActivityBarItem$1(item) && item.viewType === draggedViewType);
    const targetIndex = items.findIndex((item) => isActivityBarItem$1(item) && item.viewType === targetViewType);
    if (fromIndex < 0 || targetIndex < 0 || fromIndex === targetIndex)
        return null;
    const reordered = [...items];
    const [moved] = reordered.splice(fromIndex, 1);
    if (!moved)
        return null;
    const adjustedTargetIndex = targetIndex > fromIndex ? targetIndex - 1 : targetIndex;
    const insertIndex = placeAfter ? adjustedTargetIndex + 1 : adjustedTargetIndex;
    reordered.splice(insertIndex, 0, moved);
    return reordered;
}
/**
 * Keep one configured button when there is another known view that can replace
 * it. An Activity Bar may still be empty when the side has no discoverable
 * views at all (for example in a minimal vault), so that case remains allowed.
 */
function canRemoveActivityBarItem(items, availableItems) {
    var _a;
    if (items.length !== 1)
        return true;
    const currentType = (_a = items[0]) === null || _a === void 0 ? void 0 : _a.viewType;
    return !availableItems.some((item) => item.viewType !== currentType);
}

function isActivityBarItem(value) {
    return !!value && typeof value.viewType === "string" && value.viewType.trim().length > 0;
}
/** Obsidian `SettingGroup` 建構式（1.12.7+；舊版為 undefined）。 */
const SettingGroupCtor$1 = obsidian__namespace.SettingGroup;
/** 多欄 + 捲軸的 icon 選擇器 Modal。 */
class IconPickerModal extends obsidian.Modal {
    constructor(app, onSelect) {
        super(app);
        this.onSelect = onSelect;
    }
    onOpen() {
        const { contentEl } = this;
        contentEl.addClass("window-spaces-icon-picker");
        contentEl.createEl("h3", { text: t("settings.pickIcon") });
        const grid = contentEl.createDiv({ cls: "window-spaces-icon-grid" });
        ICON_CHOICES.forEach((iconName) => {
            const btn = grid.createEl("button", {
                cls: "clickable-icon",
                attr: { type: "button", title: iconName },
            });
            obsidian.setIcon(btn, iconName);
            btn.onclick = () => {
                this.onSelect(iconName);
                this.close();
            };
        });
    }
    onClose() {
        this.contentEl.empty();
    }
}
class WindowSpacesSettingTab extends obsidian.PluginSettingTab {
    constructor(app, plugin) {
        super(app, plugin);
        this.autoSaveTimeout = null;
        this.plugin = plugin;
    }
    getSettingDefinitions() {
        return [];
    }
    /** 建立 SettingGroup（若當前 Obsidian 版本支援）；不支援則回傳 null。 */
    createGroup(containerEl) {
        if (SettingGroupCtor$1) {
            try {
                return new SettingGroupCtor$1(containerEl);
            }
            catch (_a) {
                return null;
            }
        }
        return null;
    }
    /** 在 SettingGroup 或 HTMLElement 容器中建立並設定一個 Setting。 */
    createSettingIn(container, configure) {
        const group = container;
        if (group && typeof group.addSetting === "function") {
            let result = null;
            group.addSetting((setting) => {
                result = setting;
                configure(setting);
            });
            return result;
        }
        const setting = new obsidian.Setting(container);
        configure(setting);
        return setting;
    }
    display() {
        var _a, _b, _c;
        const { containerEl } = this;
        containerEl.empty();
        // ===== 一般設定（單一 panel） =====
        new obsidian.Setting(containerEl).setName(t("settings.autoSaveSection")).setHeading();
        const generalGroup = (_a = this.createGroup(containerEl)) !== null && _a !== void 0 ? _a : containerEl;
        this.createSettingIn(generalGroup, (s) => {
            s.setName(t("settings.showNotifications")).setDesc(t("settings.showNotificationsDesc"));
            s.addToggle((toggle) => {
                toggle.setValue(this.plugin.settings.showNotifications !== false);
                toggle.onChange((value) => __awaiter(this, void 0, void 0, function* () {
                    this.plugin.settings.showNotifications = value;
                    yield this.plugin.saveSettings();
                }));
            });
        });
        this.createSettingIn(generalGroup, (s) => {
            s.setName(t("settings.autoSaveEnabled")).setDesc(t("settings.autoSaveDescription"));
            s.addToggle((toggle) => {
                toggle.setValue(this.plugin.settings.autoSave === true);
                toggle.onChange((value) => __awaiter(this, void 0, void 0, function* () {
                    this.plugin.settings.autoSave = value;
                    yield this.plugin.saveSettings();
                    if (value) {
                        this.setupAutoSave();
                    }
                    else {
                        this.removeAutoSave();
                    }
                }));
            });
        });
        // ===== Popout 空間顯示（單一 panel） =====
        new obsidian.Setting(containerEl).setName(t("settings.layoutDisplaySection")).setHeading();
        const displayGroup = (_b = this.createGroup(containerEl)) !== null && _b !== void 0 ? _b : containerEl;
        this.createSettingIn(displayGroup, (s) => {
            s.setName(t("settings.showLayoutStatusBar")).setDesc(t("settings.showLayoutStatusBarDesc"));
            s.addToggle((toggle) => {
                toggle.setValue(this.plugin.settings.showLayoutStatusBar === true);
                toggle.onChange((value) => __awaiter(this, void 0, void 0, function* () {
                    this.plugin.settings.showLayoutStatusBar = value;
                    yield this.plugin.saveSettings();
                    this.plugin.manager.refreshLayoutLabels();
                }));
            });
        });
        this.createSettingIn(displayGroup, (s) => {
            s.setName(t("settings.showWindowLayoutsRibbonIcon")).setDesc(t("settings.showWindowLayoutsRibbonIconDesc"));
            s.addToggle((toggle) => {
                toggle.setValue(this.plugin.settings.showWindowLayoutsRibbonIcon !== false);
                toggle.onChange((value) => __awaiter(this, void 0, void 0, function* () {
                    this.plugin.settings.showWindowLayoutsRibbonIcon = value;
                    yield this.plugin.saveSettings();
                    this.plugin.refreshRibbonIcons();
                }));
            });
        });
        this.createSettingIn(displayGroup, (s) => {
            s.setName(t("settings.defaultIcon")).setDesc(t("settings.defaultIconDesc"));
            s.controlEl.addClass("window-space-icon-setting-control");
            let currentIcon = this.plugin.settings.defaultIcon || DEFAULT_SPACE_ICON;
            let iconInputEl;
            s.addText((text) => {
                iconInputEl = text.inputEl;
                text.setPlaceholder(t("saveModal.iconPlaceholder"));
                text.setValue(currentIcon);
                text.onChange((val) => __awaiter(this, void 0, void 0, function* () {
                    currentIcon = val.trim() || DEFAULT_SPACE_ICON;
                    this.plugin.settings.defaultIcon = currentIcon;
                    yield this.plugin.saveSettings();
                    updatePreview();
                    this.plugin.activityBars.refreshAll();
                }));
            });
            const pickIconBtn = s.controlEl.createEl("button", {
                cls: "clickable-icon",
                attr: { type: "button", title: t("settings.pickIcon") },
            });
            obsidian.setIcon(pickIconBtn, "image");
            pickIconBtn.onclick = () => {
                new IconPickerModal(this.app, (selected) => __awaiter(this, void 0, void 0, function* () {
                    currentIcon = selected;
                    iconInputEl.value = selected;
                    this.plugin.settings.defaultIcon = selected;
                    yield this.plugin.saveSettings();
                    updatePreview();
                    this.plugin.activityBars.refreshAll();
                })).open();
            };
            const previewEl = s.controlEl.createDiv({ cls: "window-space-icon-preview" });
            const updatePreview = () => {
                previewEl.empty();
                const val = currentIcon || DEFAULT_SPACE_ICON;
                const isEmoji = isSpaceEmoji(val);
                if (isEmoji) {
                    previewEl.createSpan({ text: val });
                }
                else {
                    const iconDiv = previewEl.createDiv();
                    if (!setIconWithCheck(iconDiv, val)) {
                        obsidian.setIcon(iconDiv, "layout");
                    }
                }
            };
            updatePreview();
        });
        this.createSettingIn(displayGroup, (s) => {
            s.setName(t("settings.defaultBorderInset")).setDesc(t("settings.defaultBorderInsetDesc"));
            s.addSlider((slider) => {
                slider
                    .setLimits(0, 5, 1)
                    .setValue(this.getDefaultBorderInset())
                    .setDynamicTooltip()
                    .onChange((value) => __awaiter(this, void 0, void 0, function* () {
                    this.plugin.settings.defaultBorderInset = value;
                    yield this.plugin.saveSettings();
                    this.plugin.activityBars.refreshAll();
                }));
            });
        });
        this.createSettingIn(displayGroup, (s) => {
            s.setName(t("settings.defaultFoldedCorner")).setDesc(t("settings.defaultFoldedCornerDesc"));
            s.addToggle((toggle) => {
                toggle.setValue(this.plugin.settings.defaultShowFoldedCorner !== false);
                toggle.onChange((value) => __awaiter(this, void 0, void 0, function* () {
                    this.plugin.settings.defaultShowFoldedCorner = value;
                    yield this.plugin.saveSettings();
                    this.plugin.activityBars.refreshAll();
                }));
            });
        });
        this.createSettingIn(displayGroup, (s) => {
            s.setName(t("settings.enableInterceptor")).setDesc(t("settings.enableInterceptorDesc"));
            s.addToggle((toggle) => {
                toggle.setValue(this.plugin.settings.workspaceInterceptorEnabled !== false);
                toggle.onChange((value) => __awaiter(this, void 0, void 0, function* () {
                    this.plugin.settings.workspaceInterceptorEnabled = value;
                    this.plugin.workspaceInterceptor.enabled = value;
                    yield this.plugin.saveSettings();
                }));
            });
        });
        this.renderActivityBarSide(containerEl, "left", t("settings.leftBar"));
        this.renderActivityBarSide(containerEl, "right", t("settings.rightBar"));
        // ===== 危險操作（單一 panel） =====
        new obsidian.Setting(containerEl).setName(t("settings.resetSettings")).setHeading();
        const dangerGroup = (_c = this.createGroup(containerEl)) !== null && _c !== void 0 ? _c : containerEl;
        this.createSettingIn(dangerGroup, (s) => {
            s.setName(t("settings.resetSettings")).setDesc(t("settings.resetSettingsDescription"));
            s.addButton((button) => {
                button
                    .setButtonText(t("settings.resetButton"))
                    .setWarning()
                    .onClick(() => __awaiter(this, void 0, void 0, function* () {
                    const confirmed = yield this.showConfirmDialog(t("settings.resetConfirmMessage"), t("settings.resetConfirmTitle"));
                    if (confirmed) {
                        this.plugin.settings.spaces = [];
                        yield this.plugin.saveSettings();
                        this.display(); // 重新顯示設定頁面
                        new obsidian.Notice(t("settings.resetSuccess"));
                    }
                }));
            });
        });
    }
    getDefaultBorderInset() {
        const value = this.plugin.settings.defaultBorderInset;
        return typeof value === "number" && Number.isFinite(value) ? Math.max(0, Math.min(5, value)) : 1;
    }
    /** 渲染單一側欄 view 項目列，回傳用於 surgical 更新的 handle。 */
    renderSideItemRow(container, side, item, index, onChanged) {
        let iconBtn = null;
        const row = this.createSettingIn(container, (s) => {
            const resolvedLabel = resolveViewLabel(this.app, item.viewType);
            s.setName(item.label || resolvedLabel);
            s.addButton((button) => {
                iconBtn = button;
                button.setIcon(item.icon || resolveViewIcon(this.app, item.viewType)).setTooltip(t("settings.pickIcon"));
                button.onClick(() => {
                    const modal = new IconPickerModal(this.app, (iconName) => {
                        item.icon = iconName;
                        void this.plugin.saveSettings().then(() => {
                            this.plugin.activityBars.refreshAll();
                            iconBtn === null || iconBtn === void 0 ? void 0 : iconBtn.setIcon(iconName);
                        });
                    });
                    modal.open();
                });
            });
            s.addButton((button) => {
                button.setIcon("rotate-ccw").setTooltip(t("settings.restoreDefaultIcon"));
                button.onClick(() => {
                    item.icon = undefined;
                    void this.plugin.saveSettings().then(() => {
                        this.plugin.activityBars.refreshAll();
                        iconBtn === null || iconBtn === void 0 ? void 0 : iconBtn.setIcon(resolveViewIcon(this.app, item.viewType));
                        void ensureViewIcon(this.app, item.viewType).then((icon) => {
                            if (!icon || item.icon)
                                return;
                            iconBtn === null || iconBtn === void 0 ? void 0 : iconBtn.setIcon(icon);
                        });
                    });
                });
            });
            s.addButton((button) => {
                button.setButtonText(t("settings.removeView")).setWarning().onClick(() => {
                    var _a, _b, _c;
                    const current = (_b = (_a = this.plugin.settings.activityBars) === null || _a === void 0 ? void 0 : _a[side]) !== null && _b !== void 0 ? _b : [];
                    if (!canRemoveActivityBarItem(current, enumerateAvailableViews(this.app)[side])) {
                        new obsidian.Notice(t("settings.keepOneActivityBarView"));
                        return;
                    }
                    const idx = current.indexOf(item);
                    if (idx >= 0) {
                        current.splice(idx, 1);
                        this.plugin.settings.activityBars = (_c = this.plugin.settings.activityBars) !== null && _c !== void 0 ? _c : { left: [], right: [] };
                        this.plugin.settings.activityBars[side] = current;
                    }
                    void this.plugin.saveSettings().then(() => {
                        this.plugin.activityBars.refreshAll();
                        row.settingEl.remove();
                        onChanged === null || onChanged === void 0 ? void 0 : onChanged();
                    });
                });
            });
        });
        row.settingEl.setAttr("data-window-spaces-activity-item", side);
        row.settingEl.setAttr("data-drag-index", String(index));
        row.settingEl.setAttr("data-drag-view-type", item.viewType);
        row.settingEl.setAttr("draggable", "true");
        row.settingEl.addEventListener("dragstart", (e) => {
            row.settingEl.classList.add("drag-source");
            if (!e.dataTransfer)
                return;
            e.dataTransfer.effectAllowed = "move";
            e.dataTransfer.setData(ACTIVITY_BAR_DRAG_DATA_TYPE, item.viewType);
        });
        row.settingEl.addEventListener("dragend", () => {
            row.settingEl.classList.remove("drag-source");
        });
        row.settingEl.querySelectorAll("button, input, select, .checkbox-container, .slider").forEach((el) => {
            el.setAttribute("draggable", "false");
        });
        const gripEl = row.settingEl.createDiv({ cls: "window-spaces-activity-drag-handle" });
        gripEl.setAttr("aria-label", t("settings.dragToReorder"));
        obsidian.setIcon(gripEl, "grip-vertical");
        row.settingEl.insertBefore(gripEl, row.settingEl.firstChild);
        return { row, updateIcon: (icon) => iconBtn === null || iconBtn === void 0 ? void 0 : iconBtn.setIcon(icon) };
    }
    /** 重建「新增 view」下拉選單的選項（排除已加入的 view type）。 */
    rebuildViewSelect(selectEl, side) {
        var _a, _b;
        selectEl.empty();
        const available = enumerateAvailableViews(this.app);
        const allTypes = sortViewTypesByLabel(this.app, Array.from(new Set([...available.left, ...available.right].map((item) => item.viewType))));
        const current = (_b = (_a = this.plugin.settings.activityBars) === null || _a === void 0 ? void 0 : _a[side]) !== null && _b !== void 0 ? _b : [];
        allTypes.forEach((viewType) => {
            if (current.some((item) => item.viewType === viewType))
                return;
            const label = resolveViewLabel(this.app, viewType);
            const option = selectEl.createEl("option", {
                value: viewType,
                text: label,
            });
            option.setAttr("data-icon", resolveViewIcon(this.app, viewType));
        });
    }
    renderActivityBarSide(section, side, heading) {
        var _a, _b, _c, _d;
        new obsidian.Setting(section).setName(heading).setHeading();
        const group = (_a = this.createGroup(section)) !== null && _a !== void 0 ? _a : section;
        this.createSettingIn(group, (s) => {
            s.setName(t("settings.defaultActivityBarVisibility"));
            s.setDesc(t("settings.defaultActivityBarVisibilityDesc"));
            s.addToggle((toggle) => {
                var _a;
                toggle.setValue(((_a = this.plugin.settings.activityBarDefaults) === null || _a === void 0 ? void 0 : _a[side]) !== false);
                toggle.onChange((value) => __awaiter(this, void 0, void 0, function* () {
                    var _b;
                    this.plugin.settings.activityBarDefaults = (_b = this.plugin.settings.activityBarDefaults) !== null && _b !== void 0 ? _b : { left: true, right: true };
                    this.plugin.settings.activityBarDefaults[side] = value;
                    yield this.plugin.saveSettings();
                    this.plugin.activityBars.refreshAll();
                }));
            });
        });
        const items = (_c = (_b = this.plugin.settings.activityBars) === null || _b === void 0 ? void 0 : _b[side]) !== null && _c !== void 0 ? _c : [];
        if (items.length === 0) {
            this.createSettingIn(group, (s) => s.setDesc(t("settings.addView")));
        }
        // 先建立 add-row（capture selectEl 供 callback 使用），最後再移到底部
        let selectEl;
        let customInput;
        const addRow = this.createSettingIn(group, (s) => {
            selectEl = s.controlEl.createEl("select", {
                cls: "dropdown",
            });
            customInput = s.controlEl.createEl("input", {
                type: "text",
                placeholder: t("settings.viewTypePlaceholder"),
            });
            customInput.addClass("window-spaces-view-type-input");
            s.addButton((button) => {
                button.setButtonText(t("settings.addView")).onClick(() => {
                    var _a, _b, _c;
                    const selected = selectEl.value.trim();
                    const custom = customInput.value.trim();
                    const viewType = custom || selected;
                    if (!viewType)
                        return;
                    const current = (_b = (_a = this.plugin.settings.activityBars) === null || _a === void 0 ? void 0 : _a[side]) !== null && _b !== void 0 ? _b : [];
                    if (current.some((item) => item.viewType === viewType))
                        return;
                    const newItem = {
                        viewType,
                        side,
                        label: undefined,
                        icon: resolveViewIcon(this.app, viewType),
                    };
                    current.push(newItem);
                    this.plugin.settings.activityBars = (_c = this.plugin.settings.activityBars) !== null && _c !== void 0 ? _c : { left: [], right: [] };
                    this.plugin.settings.activityBars[side] = current;
                    void this.plugin.saveSettings().then(() => {
                        this.plugin.activityBars.refreshAll();
                        renderItemRows();
                        customInput.value = "";
                        if (newItem.icon === "layout") {
                            void ensureViewIcon(this.app, viewType).then((icon) => {
                                if (!icon || icon === newItem.icon)
                                    return;
                                newItem.icon = icon;
                                renderItemRows();
                                void this.plugin.saveSettings();
                            });
                        }
                    });
                });
            });
        });
        const refreshSelect = () => this.rebuildViewSelect(selectEl, side);
        const renderItemRows = () => {
            var _a, _b;
            const current = (_a = this.plugin.settings.activityBars) === null || _a === void 0 ? void 0 : _a[side];
            const items = Array.isArray(current) ? current : [];
            const validItems = items.filter(isActivityBarItem);
            // Repair malformed entries left by an interrupted/old reorder instead of
            // allowing one bad item to throw after the existing DOM is removed.
            if (validItems.length !== items.length) {
                this.plugin.settings.activityBars = (_b = this.plugin.settings.activityBars) !== null && _b !== void 0 ? _b : { left: [], right: [] };
                this.plugin.settings.activityBars[side] = validItems;
                void this.plugin.saveSettings().catch((error) => {
                    console.warn("Failed to repair activity bar settings:", error);
                });
            }
            const existingRows = new Map();
            section.querySelectorAll(`[data-window-spaces-activity-item="${side}"]`).forEach((el) => {
                const viewType = el.getAttribute("data-drag-view-type");
                if (viewType)
                    existingRows.set(viewType, el);
            });
            const activeTypes = new Set(validItems.map((item) => item.viewType));
            existingRows.forEach((row, viewType) => {
                if (!activeTypes.has(viewType))
                    row.remove();
            });
            // Reuse existing rows when reordering. This avoids a transient empty
            // SettingGroup DOM and prevents the whole list disappearing after drop.
            validItems.forEach((item, index) => {
                const existingRow = existingRows.get(item.viewType);
                if (existingRow) {
                    existingRow.setAttr("data-drag-index", String(index));
                    addRow.settingEl.before(existingRow);
                    return;
                }
                const handle = this.renderSideItemRow(group, side, item, index, () => {
                    renderItemRows();
                    refreshSelect();
                    this.plugin.activityBars.refreshAll();
                });
                addRow.settingEl.before(handle.row.settingEl);
            });
            refreshSelect();
        };
        renderItemRows();
        // 把 add-row 移到 items 之後（保持「view 列 → add-row」順序）
        (_d = addRow.settingEl.parentElement) === null || _d === void 0 ? void 0 : _d.appendChild(addRow.settingEl);
        section.addEventListener("dragover", (e) => {
            e.preventDefault();
            section.querySelectorAll(`[data-window-spaces-activity-item="${side}"].drag-over-top, [data-window-spaces-activity-item="${side}"].drag-over-bottom`).forEach((el) => { el.classList.remove("drag-over-top", "drag-over-bottom"); });
            const target = e.target.closest(`[data-window-spaces-activity-item="${side}"]`);
            if (!target)
                return;
            const rect = target.getBoundingClientRect();
            const isBottom = e.clientY > rect.top + rect.height / 2;
            target.classList.add(isBottom ? "drag-over-bottom" : "drag-over-top");
        });
        section.addEventListener("drop", (e) => {
            var _a, _b, _c, _d, _e, _f;
            e.preventDefault();
            const indicatorEl = section.querySelector(`[data-window-spaces-activity-item="${side}"].drag-over-top, [data-window-spaces-activity-item="${side}"].drag-over-bottom`);
            const isBottom = (_a = indicatorEl === null || indicatorEl === void 0 ? void 0 : indicatorEl.classList.contains("drag-over-bottom")) !== null && _a !== void 0 ? _a : false;
            section.querySelectorAll(`[data-window-spaces-activity-item="${side}"].drag-over-top, [data-window-spaces-activity-item="${side}"].drag-over-bottom`).forEach((el) => { el.classList.remove("drag-over-top", "drag-over-bottom"); });
            if (!indicatorEl)
                return;
            const draggedViewType = (_c = (_b = e.dataTransfer) === null || _b === void 0 ? void 0 : _b.getData(ACTIVITY_BAR_DRAG_DATA_TYPE)) !== null && _c !== void 0 ? _c : "";
            const targetViewType = (_d = indicatorEl.getAttribute("data-drag-view-type")) !== null && _d !== void 0 ? _d : "";
            if (!draggedViewType || !targetViewType)
                return;
            const current = (_e = this.plugin.settings.activityBars) === null || _e === void 0 ? void 0 : _e[side];
            if (!Array.isArray(current))
                return;
            const reordered = reorderActivityBarItems(current, draggedViewType, targetViewType, isBottom);
            if (!reordered)
                return;
            this.plugin.settings.activityBars = (_f = this.plugin.settings.activityBars) !== null && _f !== void 0 ? _f : { left: [], right: [] };
            this.plugin.settings.activityBars[side] = reordered;
            void this.plugin.saveSettings().then(() => {
                this.plugin.activityBars.refreshAll();
                renderItemRows();
            }).catch((error) => {
                console.warn("Failed to save activity bar order:", error);
            });
        });
    }
    setupAutoSave() {
        this.plugin.registerEvent(this.app.workspace.on("layout-change", () => {
            if (this.plugin.settings.autoSave) {
                if (this.autoSaveTimeout !== null) {
                    window.clearTimeout(this.autoSaveTimeout);
                }
                this.autoSaveTimeout = window.setTimeout(() => __awaiter(this, void 0, void 0, function* () {
                    try {
                        const layout = yield this.plugin.manager.captureCurrentLayout({
                            name: t("settings.autoSaveEnabled"),
                        });
                        yield this.plugin.manager.saveLayout(layout);
                    }
                    catch (error) {
                        console.warn("Auto save failed:", error);
                    }
                }), 2000);
            }
        }));
    }
    removeAutoSave() {
        if (this.autoSaveTimeout !== null) {
            window.clearTimeout(this.autoSaveTimeout);
            this.autoSaveTimeout = null;
        }
    }
    showConfirmDialog(message, title = t("common.confirm")) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve) => {
                const modal = new obsidian.Modal(this.app);
                modal.setTitle(title);
                modal.onOpen = () => {
                    modal.contentEl.createEl("p", { text: message });
                    const buttonContainer = modal.contentEl.createDiv("ws-dialog-actions");
                    const cancelBtn = buttonContainer.createEl("button", {
                        text: t("common.cancel"),
                        cls: "mod-cta",
                    });
                    cancelBtn.onclick = () => {
                        resolve(false);
                        modal.close();
                    };
                    const confirmBtn = buttonContainer.createEl("button", {
                        text: t("common.confirm"),
                        cls: "mod-warning",
                    });
                    confirmBtn.onclick = () => {
                        resolve(true);
                        modal.close();
                    };
                };
                modal.open();
            });
        });
    }
}

const SettingGroupCtor = obsidian__namespace.SettingGroup;
class SaveLayoutModal extends obsidian.Modal {
    constructor(app, plugin, layout, onSubmit) {
        super(app);
        this.plugin = plugin;
        this.layout = layout;
        this.onSubmit = onSubmit;
    }
    createGroup(containerEl) {
        if (!SettingGroupCtor)
            return null;
        try {
            return new SettingGroupCtor(containerEl);
        }
        catch (_a) {
            return null;
        }
    }
    createSettingIn(container, configure) {
        const group = container;
        if (typeof group.addSetting === "function") {
            let result = null;
            group.addSetting((setting) => {
                result = setting;
                configure(setting);
            });
            return result;
        }
        const setting = new obsidian.Setting(container);
        configure(setting);
        return setting;
    }
    /**
     * Obsidian's SettingGroup has changed its internal DOM property across
     * versions. Resolve the rendered panel from the group when possible and
     * fall back to the most recently-created panel in this modal.
     */
    getGroupElement(group, fallback) {
        var _a;
        const candidate = group.settingEl;
        if (candidate && typeof candidate.querySelectorAll === "function")
            return candidate;
        const groups = fallback.querySelectorAll(".setting-group");
        return (_a = groups[groups.length - 1]) !== null && _a !== void 0 ? _a : fallback;
    }
    onOpen() {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
        this.setTitle(t("saveModal.title"));
        const { contentEl } = this;
        contentEl.empty();
        this.modalEl.addClass("window-layouts-modal");
        let selectedSections = Array.from(this.layout.sections || []);
        const isExistingSpace = this.plugin.settings.spaces.some((space) => space.id === this.layout.id || (!!this.layout.name && space.name === this.layout.name));
        let borderInset = this.getEffectiveBorderInset();
        let borderInsetOverride = this.layout.borderInset;
        let showFoldedCorner = this.getEffectiveFoldedCorner();
        let showFoldedCornerOverride = this.layout.showFoldedCorner;
        const activityBarSettings = {
            left: this.createActivityBarDraft("left", isExistingSpace),
            right: this.createActivityBarDraft("right", isExistingSpace),
        };
        // 0. 置頂精簡佈局資訊 (在對話框標題正下方，無標題、無分隔線、不占空間)
        const i18n = getI18n();
        const totalTabs = ((_a = this.layout.metadata) === null || _a === void 0 ? void 0 : _a.tabCount) || ((_c = (_b = this.layout.workspace) === null || _b === void 0 ? void 0 : _b.leaves) === null || _c === void 0 ? void 0 : _c.length) || 0;
        const statsContainer = contentEl.createDiv("window-spaces-modal-top-stats");
        statsContainer.createDiv({
            cls: "window-spaces-stat-item",
            text: `${t("manageModal.tabCount")}: ${totalTabs}`,
        });
        statsContainer.createDiv({
            cls: "window-spaces-stat-item",
            text: `${t("manageModal.createdDate")}: ${i18n.formatDate(new Date(this.layout.timestamp))}`,
        });
        statsContainer.createDiv({
            cls: "window-spaces-stat-item",
            text: `${t("manageModal.updatedDate")}: ${i18n.formatDate(new Date(this.layout.updatedAt || this.layout.timestamp || this.layout.createdAt || Date.now()))}`,
        });
        statsContainer.createDiv({
            cls: "window-spaces-stat-item",
            text: `${t("saveModal.windowSize")}: ${this.layout.windowState.size.width} x ${this.layout.windowState.size.height}`,
        });
        // 1. 第一個 Group Panel (原本 Space Group 與 Sections 合併，無 Space 標題)
        const identityGroup = (_d = this.createGroup(contentEl)) !== null && _d !== void 0 ? _d : contentEl;
        // (1) 空間名稱輸入框
        let nameInput;
        const nameSetting = this.createSettingIn(identityGroup, (setting) => {
            setting.setName(t("saveModal.nameLabel"));
            setting.addText((text) => {
                nameInput = text.inputEl;
                text.inputEl.value = this.layout.name || this.generateDefaultName();
                text.inputEl.focus();
                text.inputEl.select();
                text.inputEl.addEventListener("keydown", (e) => {
                    if (e.key === "Enter") {
                        e.preventDefault();
                        void this.submitForm(nameInput, includeGeometry, autoSave, selectedSections, archived, currentIcon, currentColor, borderInsetOverride, showFoldedCornerOverride, activityBarSettings);
                    }
                });
            });
        });
        // (2) 覆蓋既有空間提示：精確放置在 Space Name 標籤 (infoEl) 正下方
        const noticeContainer = nameSetting.infoEl.createDiv("save-overwrite-notice");
        // (3) Sections 分組標籤選單 Setting
        const allSpaces = this.plugin.manager.getSavedLayouts();
        const existingSectionsSet = new Set();
        (((_e = this.plugin.settings) === null || _e === void 0 ? void 0 : _e.sectionsOrder) || []).forEach((s) => existingSectionsSet.add(s));
        allSpaces.forEach((s) => (s.sections || []).forEach((sec) => existingSectionsSet.add(sec)));
        const existingSections = Array.from(existingSectionsSet);
        const sectionsSetting = this.createSettingIn(identityGroup, (setting) => {
            setting.setName(t("manageModal.sectionsLabel") || "Sections");
            setting.addText((text) => {
                text.setPlaceholder(t("manageModal.sectionsPlaceholder") || "Add section...");
                text.inputEl.addEventListener("keydown", (e) => {
                    if (e.key === "Enter" || e.key === ",") {
                        e.preventDefault();
                        const val = text.inputEl.value.trim().replace(/^,+|,+$/g, "");
                        if (val && !selectedSections.includes(val)) {
                            selectedSections.push(val);
                            text.inputEl.value = "";
                            renderPills();
                        }
                    }
                });
            });
        });
        // (4) 既有的 Section 標籤 Pills：精確放置在 Sections 標籤 (infoEl) 正下方
        const pillsContainer = sectionsSetting.infoEl.createDiv("space-sections-pills");
        const renderPills = () => {
            pillsContainer.empty();
            selectedSections.forEach((sec) => {
                const pill = pillsContainer.createDiv("space-section-pill");
                pill.createSpan({ text: sec });
                const closeSpan = pill.createSpan({ text: "✖", cls: "space-section-pill-close" });
                closeSpan.onclick = (e) => {
                    e.stopPropagation();
                    selectedSections = selectedSections.filter((s) => s !== sec);
                    renderPills();
                };
            });
            existingSections.forEach((sec) => {
                if (selectedSections.includes(sec))
                    return;
                const unselectedPill = pillsContainer.createDiv("space-section-pill-unselected");
                unselectedPill.setText(`+ ${sec}`);
                unselectedPill.onclick = () => {
                    selectedSections.push(sec);
                    renderPills();
                };
            });
        };
        renderPills();
        // (5) Icon / Emoji 輸入框與預覽
        let currentIcon = this.layout.icon || "";
        let currentColor = this.layout.color || "";
        let iconInputEl;
        const iconSetting = this.createSettingIn(identityGroup, (setting) => {
            setting.setName(t("saveModal.iconLabel"));
            setting.addText((text) => {
                iconInputEl = text.inputEl;
                text.setPlaceholder(t("saveModal.iconPlaceholder"));
                text.setValue(currentIcon);
                text.onChange((val) => {
                    currentIcon = val.trim();
                    updateIconPreview();
                });
            });
        });
        iconSetting.controlEl.addClass("window-space-icon-setting-control");
        const pickIconBtn = iconSetting.controlEl.createEl("button", {
            cls: "clickable-icon",
            attr: { type: "button", title: t("settings.pickIcon") },
        });
        obsidian.setIcon(pickIconBtn, "image");
        pickIconBtn.onclick = () => {
            new IconPickerModal(this.app, (selected) => {
                currentIcon = selected;
                iconInputEl.value = selected;
                updateIconPreview();
            }).open();
        };
        const iconPreviewEl = iconSetting.controlEl.createDiv({ cls: "window-space-icon-preview" });
        const updateIconPreview = () => {
            iconPreviewEl.empty();
            const val = currentIcon || this.plugin.settings.defaultIcon || DEFAULT_SPACE_ICON;
            const isEmoji = isSpaceEmoji(val);
            if (isEmoji) {
                iconPreviewEl.createSpan({ text: val });
            }
            else {
                const iconDiv = iconPreviewEl.createDiv();
                if (!setIconWithCheck(iconDiv, val)) {
                    obsidian.setIcon(iconDiv, "layout");
                }
            }
        };
        updateIconPreview();
        // (6) 邊框顏色選擇器與 Swatches
        const presets = this.plugin.settings.colorPresets || DEFAULT_COLOR_PRESETS;
        const colorSetting = this.createSettingIn(identityGroup, (setting) => {
            setting.setName(t("saveModal.colorLabel"));
        });
        const colorPickerContainer = colorSetting.controlEl.createDiv({ cls: "window-space-color-picker-container" });
        const colorInput = colorPickerContainer.createEl("input", {
            attr: { type: "color" },
            value: currentColor || "#3b82f6",
        });
        const swatchesContainer = colorPickerContainer.createDiv({ cls: "window-space-color-swatches" });
        const renderSwatches = () => {
            swatchesContainer.empty();
            presets.forEach((hex) => {
                const swatch = swatchesContainer.createDiv({
                    cls: `window-space-color-swatch${currentColor === hex ? " is-selected" : ""}`,
                });
                swatch.style.backgroundColor = hex;
                swatch.onclick = () => {
                    currentColor = hex;
                    colorInput.value = hex;
                    renderSwatches();
                };
            });
            if (currentColor) {
                const clearBtn = swatchesContainer.createEl("button", {
                    text: "✖",
                    cls: "clickable-icon",
                    attr: { title: t("saveModal.clearColor") },
                });
                clearBtn.onclick = () => {
                    currentColor = "";
                    renderSwatches();
                };
            }
        };
        colorInput.onchange = () => {
            currentColor = colorInput.value;
            renderSwatches();
        };
        renderSwatches();
        // 2. 視窗外觀 Section / Group
        new obsidian.Setting(contentEl).setName(t("saveModal.windowAppearanceSection")).setHeading();
        const windowGroup = (_f = this.createGroup(contentEl)) !== null && _f !== void 0 ? _f : contentEl;
        let includeGeometry = (_g = this.layout.includeGeometry) !== null && _g !== void 0 ? _g : (this.layout.windowState.position !== undefined ||
            (this.layout.windowState.size && this.layout.windowState.size.width > 0));
        let geometryToggleComponent = null;
        let autoSave = (_h = this.layout.autoSave) !== null && _h !== void 0 ? _h : false;
        let autoSaveToggleComponent = null;
        this.createSettingIn(windowGroup, (setting) => {
            setting.setName(t("saveModal.includeGeometry")).setDesc(t("saveModal.includeGeometryDesc"));
            setting.addToggle((toggle) => {
                geometryToggleComponent = toggle;
                toggle.setValue(includeGeometry);
                toggle.onChange((value) => {
                    includeGeometry = value;
                });
            });
        });
        this.createSettingIn(windowGroup, (setting) => {
            setting.setName(t("saveModal.borderInset")).setDesc(t("saveModal.borderInsetDesc"));
            setting.addSlider((slider) => {
                slider
                    .setLimits(0, 5, 1)
                    .setValue(borderInset)
                    .setDynamicTooltip()
                    .onChange((value) => {
                    borderInset = value;
                    borderInsetOverride = value;
                });
            });
        });
        this.createSettingIn(windowGroup, (setting) => {
            setting.setName(t("saveModal.foldedCorner")).setDesc(t("saveModal.foldedCornerDesc"));
            setting.addToggle((toggle) => {
                toggle.setValue(showFoldedCorner);
                toggle.onChange((value) => {
                    showFoldedCorner = value;
                    showFoldedCornerOverride = value;
                });
            });
        });
        // 3. 空間行為 Section / Group
        new obsidian.Setting(contentEl).setName(t("saveModal.behaviorSection")).setHeading();
        const behaviorGroup = (_j = this.createGroup(contentEl)) !== null && _j !== void 0 ? _j : contentEl;
        let archived = (_k = this.layout.archived) !== null && _k !== void 0 ? _k : false;
        this.createSettingIn(behaviorGroup, (setting) => {
            setting.setName(t("saveModal.autoSaveToggle"));
            setting.addToggle((toggle) => {
                autoSaveToggleComponent = toggle;
                toggle.setValue(autoSave);
                toggle.onChange((value) => {
                    autoSave = value;
                });
            });
        });
        this.createSettingIn(behaviorGroup, (setting) => {
            setting.setName(t("manageModal.archiveSpace") || "Archive Space");
            setting.addToggle((toggle) => {
                toggle.setValue(archived);
                toggle.onChange((value) => {
                    archived = value;
                });
            });
        });
        // 4. Popout Activity Bars
        this.renderActivityBarSettings(contentEl, "left", activityBarSettings.left);
        this.renderActivityBarSettings(contentEl, "right", activityBarSettings.right);
        const checkDuplicateName = () => {
            const currentName = (nameInput === null || nameInput === void 0 ? void 0 : nameInput.value.trim()) || "";
            if (!currentName) {
                noticeContainer.setText("");
                return;
            }
            const existingLayouts = this.plugin.manager.getSavedLayouts();
            const match = existingLayouts.find((l) => l.name === currentName);
            if (match) {
                noticeContainer.setText(`ℹ️ ${t("saveModal.overwriteNotice")}「${currentName}」`);
                if (autoSaveToggleComponent && match.autoSave !== undefined) {
                    autoSave = !!match.autoSave;
                    autoSaveToggleComponent.setValue(autoSave);
                }
                if (geometryToggleComponent && match.includeGeometry !== undefined) {
                    includeGeometry = !!match.includeGeometry;
                    geometryToggleComponent.setValue(includeGeometry);
                }
                if (match.sections && Array.isArray(match.sections) && selectedSections.length === 0) {
                    selectedSections = Array.from(match.sections);
                    renderPills();
                }
            }
            else {
                noticeContainer.setText("");
            }
        };
        nameInput.addEventListener("input", checkDuplicateName);
        checkDuplicateName();
        // 按鈕區
        const buttonContainer = contentEl.createDiv("ws-dialog-actions");
        const cancelButton = buttonContainer.createEl("button", {
            text: t("common.cancel"),
        });
        cancelButton.onclick = () => this.close();
        const saveButton = buttonContainer.createEl("button", {
            text: t("common.save"),
            cls: "mod-cta",
        });
        saveButton.onclick = () => {
            void this.submitForm(nameInput, includeGeometry, autoSave, selectedSections, archived, currentIcon, currentColor, borderInsetOverride, showFoldedCornerOverride, activityBarSettings);
        };
        window.setTimeout(() => nameInput === null || nameInput === void 0 ? void 0 : nameInput.focus(), 50);
    }
    submitForm(nameInput, includeGeometry, autoSave, selectedSections, archived, icon, color, borderInset, showFoldedCorner, activityBars) {
        return __awaiter(this, void 0, void 0, function* () {
            const name = nameInput.value.trim();
            if (!name) {
                new obsidian.Notice(t("saveModal.emptyNameError"));
                nameInput.focus();
                return;
            }
            this.layout.name = name;
            this.layout.autoSave = autoSave;
            this.layout.includeGeometry = includeGeometry;
            this.layout.sections = selectedSections;
            this.layout.archived = archived;
            this.layout.icon = icon ? icon.trim() : undefined;
            this.layout.color = color ? color.trim() : undefined;
            this.layout.borderInset = borderInset;
            this.layout.showFoldedCorner = showFoldedCorner;
            this.layout.activityBars = activityBars;
            if (!includeGeometry) {
                this.layout.windowState.position = undefined;
            }
            this.onSubmit(this.layout);
            this.close();
        });
    }
    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
    generateDefaultName() {
        var _a;
        if ((_a = this.plugin.manager) === null || _a === void 0 ? void 0 : _a.generateSmartLayoutName) {
            return this.plugin.manager.generateSmartLayoutName(this.layout);
        }
        const now = new Date();
        const i18n = getI18n();
        const dateStr = i18n.formatDate(now);
        return `${t("saveModal.title")} ${dateStr}`;
    }
    getDefaultBorderInset() {
        const value = this.plugin.settings.defaultBorderInset;
        return typeof value === "number" && Number.isFinite(value)
            ? Math.max(0, Math.min(5, value))
            : 1;
    }
    getEffectiveBorderInset() {
        var _a;
        const value = (_a = this.layout.borderInset) !== null && _a !== void 0 ? _a : this.getDefaultBorderInset();
        return Math.max(0, Math.min(5, Number.isFinite(value) ? value : 1));
    }
    getEffectiveFoldedCorner() {
        var _a;
        return (_a = this.layout.showFoldedCorner) !== null && _a !== void 0 ? _a : this.plugin.settings.defaultShowFoldedCorner !== false;
    }
    createActivityBarDraft(side, isExistingSpace) {
        var _a, _b, _c, _d, _e;
        const globalItems = (_b = (_a = this.plugin.settings.activityBars) === null || _a === void 0 ? void 0 : _a[side]) !== null && _b !== void 0 ? _b : [];
        const saved = (_c = this.layout.activityBars) === null || _c === void 0 ? void 0 : _c[side];
        const savedItems = (saved === null || saved === void 0 ? void 0 : saved.items)
            ? saved.items
            : (saved === null || saved === void 0 ? void 0 : saved.viewTypes)
                ? globalItems.filter((item) => { var _a; return (_a = saved.viewTypes) === null || _a === void 0 ? void 0 : _a.includes(item.viewType); })
                : globalItems;
        return {
            show: (_d = saved === null || saved === void 0 ? void 0 : saved.show) !== null && _d !== void 0 ? _d : (isExistingSpace ? false : ((_e = this.plugin.settings.activityBarDefaults) === null || _e === void 0 ? void 0 : _e[side]) !== false),
            items: savedItems.map((item) => (Object.assign({}, item))),
        };
    }
    renderActivityBarSettings(contentEl, side, draft) {
        var _a, _b;
        new obsidian.Setting(contentEl).setName(side === "left" ? t("settings.leftBar") : t("settings.rightBar")).setHeading();
        const activityGroup = (_a = this.createGroup(contentEl)) !== null && _a !== void 0 ? _a : contentEl;
        const groupEl = this.getGroupElement(activityGroup, contentEl);
        this.createSettingIn(activityGroup, (setting) => {
            setting.setName(side === "left"
                ? (t("saveModal.showLeftActivityBar") || "顯示左側 Activity Bar")
                : (t("saveModal.showRightActivityBar") || "顯示右側 Activity Bar"));
            setting.setDesc(t("saveModal.showActivityBarDesc") || "開啟時，此空間會在 Popout 視窗顯示該側 Activity Bar");
            setting.addToggle((toggle) => {
                toggle.setValue(draft.show);
                toggle.onChange((value) => {
                    draft.show = value;
                });
            });
        });
        let selectEl;
        let customInput;
        const addRow = this.createSettingIn(activityGroup, (setting) => {
            selectEl = setting.controlEl.createEl("select", { cls: "dropdown" });
            customInput = setting.controlEl.createEl("input", {
                type: "text",
                placeholder: t("settings.viewTypePlaceholder"),
            });
            customInput.addClass("window-spaces-view-type-input");
        });
        addRow.addButton((button) => {
            button.setButtonText(t("settings.addView")).onClick(() => {
                var _a, _b;
                const viewType = customInput.value.trim() || selectEl.value.trim();
                if (!viewType || ((_a = draft.items) === null || _a === void 0 ? void 0 : _a.some((item) => item.viewType === viewType)))
                    return;
                draft.items = (_b = draft.items) !== null && _b !== void 0 ? _b : [];
                const newItem = { viewType, side, icon: resolveViewIcon(this.app, viewType) };
                draft.items.push(newItem);
                customInput.value = "";
                renderItems();
                if (newItem.icon === "layout") {
                    void ensureViewIcon(this.app, viewType).then((icon) => {
                        if (!icon || icon === newItem.icon)
                            return;
                        newItem.icon = icon;
                        renderItems();
                    });
                }
            });
        });
        // 為整個 groupEl 綁定 dragover 與 drop 監聽器
        groupEl.addEventListener("dragover", (e) => {
            e.preventDefault();
            groupEl.querySelectorAll(`[data-window-spaces-activity-item="${side}"].drag-over-top, [data-window-spaces-activity-item="${side}"].drag-over-bottom`).forEach((el) => { el.classList.remove("drag-over-top", "drag-over-bottom"); });
            const target = e.target.closest(`[data-window-spaces-activity-item="${side}"]`);
            if (!target)
                return;
            const rect = target.getBoundingClientRect();
            const isBottom = e.clientY > rect.top + rect.height / 2;
            target.classList.add(isBottom ? "drag-over-bottom" : "drag-over-top");
        });
        groupEl.addEventListener("drop", (e) => {
            var _a, _b, _c, _d, _e;
            e.preventDefault();
            const indicatorEl = groupEl.querySelector(`[data-window-spaces-activity-item="${side}"].drag-over-top, [data-window-spaces-activity-item="${side}"].drag-over-bottom`);
            const isBottom = (_a = indicatorEl === null || indicatorEl === void 0 ? void 0 : indicatorEl.classList.contains("drag-over-bottom")) !== null && _a !== void 0 ? _a : false;
            groupEl.querySelectorAll(`[data-window-spaces-activity-item="${side}"].drag-over-top, [data-window-spaces-activity-item="${side}"].drag-over-bottom`).forEach((el) => { el.classList.remove("drag-over-top", "drag-over-bottom"); });
            if (!indicatorEl)
                return;
            const draggedViewType = (_c = (_b = e.dataTransfer) === null || _b === void 0 ? void 0 : _b.getData(ACTIVITY_BAR_DRAG_DATA_TYPE)) !== null && _c !== void 0 ? _c : "";
            const targetViewType = (_d = indicatorEl.getAttribute("data-drag-view-type")) !== null && _d !== void 0 ? _d : "";
            if (!draggedViewType || !targetViewType)
                return;
            const current = (_e = draft.items) !== null && _e !== void 0 ? _e : [];
            const reordered = reorderActivityBarItems(current, draggedViewType, targetViewType, isBottom);
            if (!reordered)
                return;
            draft.items = reordered;
            renderItems();
        });
        const renderItems = () => {
            var _a;
            const existingRows = new Map();
            groupEl.querySelectorAll(`[data-window-spaces-activity-item="${side}"]`).forEach((el) => {
                const viewType = el.getAttribute("data-drag-view-type");
                if (viewType)
                    existingRows.set(viewType, el);
            });
            const items = (_a = draft.items) !== null && _a !== void 0 ? _a : [];
            const activeTypes = new Set(items.map((item) => item.viewType));
            existingRows.forEach((row, viewType) => {
                if (!activeTypes.has(viewType))
                    row.remove();
            });
            items.forEach((item, index) => {
                const existing = existingRows.get(item.viewType);
                if (existing) {
                    existing.setAttr("data-drag-index", String(index));
                    addRow.settingEl.before(existing);
                    return;
                }
                let iconButton = null;
                const row = this.createSettingIn(activityGroup, (setting) => {
                    setting.setName(item.label || resolveViewLabel(this.app, item.viewType));
                });
                row.settingEl.setAttr("data-window-spaces-activity-item", side);
                row.settingEl.setAttr("data-drag-index", String(index));
                row.settingEl.setAttr("data-drag-view-type", item.viewType);
                row.settingEl.setAttr("draggable", "true");
                row.settingEl.addEventListener("dragstart", (e) => {
                    row.settingEl.classList.add("drag-source");
                    if (!e.dataTransfer)
                        return;
                    e.dataTransfer.effectAllowed = "move";
                    e.dataTransfer.setData(ACTIVITY_BAR_DRAG_DATA_TYPE, item.viewType);
                });
                row.settingEl.addEventListener("dragend", () => {
                    row.settingEl.classList.remove("drag-source");
                });
                row.settingEl.querySelectorAll("button, input, select, .checkbox-container, .slider").forEach((el) => {
                    el.setAttribute("draggable", "false");
                });
                const gripEl = row.settingEl.createDiv({ cls: "window-spaces-activity-drag-handle" });
                gripEl.setAttr("aria-label", t("settings.dragToReorder"));
                obsidian.setIcon(gripEl, "grip-vertical");
                row.settingEl.insertBefore(gripEl, row.settingEl.firstChild);
                row.addButton((button) => {
                    iconButton = button;
                    button.setIcon(item.icon || resolveViewIcon(this.app, item.viewType)).setTooltip(t("settings.pickIcon"));
                    button.onClick(() => {
                        new IconPickerModal(this.app, (icon) => {
                            item.icon = icon;
                            iconButton === null || iconButton === void 0 ? void 0 : iconButton.setIcon(icon);
                        }).open();
                    });
                });
                row.addButton((button) => {
                    button.setIcon("rotate-ccw").setTooltip(t("settings.restoreDefaultIcon"));
                    button.onClick(() => {
                        item.icon = undefined;
                        iconButton === null || iconButton === void 0 ? void 0 : iconButton.setIcon(resolveViewIcon(this.app, item.viewType));
                    });
                });
                row.addButton((button) => {
                    button.setButtonText(t("settings.removeView")).setWarning().onClick(() => {
                        var _a;
                        const items = (_a = draft.items) !== null && _a !== void 0 ? _a : [];
                        if (!canRemoveActivityBarItem(items, enumerateAvailableViews(this.app)[side])) {
                            new obsidian.Notice(t("settings.keepOneActivityBarView"));
                            return;
                        }
                        draft.items = items.filter((entry) => entry !== item);
                        renderItems();
                    });
                });
                addRow.settingEl.before(row.settingEl);
            });
            selectEl.empty();
            const available = enumerateAvailableViews(this.app);
            const availableTypes = sortViewTypesByLabel(this.app, Array.from(new Set([...available.left, ...available.right].map((item) => item.viewType))));
            availableTypes.forEach((viewType) => {
                if (activeTypes.has(viewType))
                    return;
                selectEl.createEl("option", { value: viewType, text: resolveViewLabel(this.app, viewType) });
            });
        };
        renderItems();
        (_b = addRow.settingEl.parentElement) === null || _b === void 0 ? void 0 : _b.appendChild(addRow.settingEl);
    }
}

const WINDOW_LAYOUTS_VIEW_TYPE = "window-spaces-layouts";
/**
 * Persistent version of the Window Layouts picker.
 *
 * The content is rendered by WindowLayoutsModal so both entry points keep the
 * same restore semantics. Unlike a modal, this view deliberately remains
 * mounted after a layout is restored.
 */
class WindowLayoutsView extends obsidian.ItemView {
    constructor(leaf, plugin) {
        super(leaf);
        this.navigation = false;
        this.plugin = plugin;
    }
    getViewType() {
        return WINDOW_LAYOUTS_VIEW_TYPE;
    }
    getDisplayText() {
        return t("common.windowLayouts");
    }
    getIcon() {
        return "layout";
    }
    onOpen() {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            (_a = this.containerEl.closest(".workspace-leaf")) === null || _a === void 0 ? void 0 : _a.classList.add("mod-window-spaces-leaf");
            this.contentController = new WindowLayoutsModal(this.app, this.plugin);
            // The panel is considered active when Obsidian marks its leaf as the
            // active leaf. Clicking the panel (or its tab) and opening it via a
            // command all activate the leaf natively, so arrow-key ownership follows
            // the same rule as every other Obsidian panel.
            this.contentController.mountInContainer(this.contentEl, undefined, () => {
                var _a;
                const ws = this.app.workspace;
                return ((_a = ws.getMostRecentLeaf) === null || _a === void 0 ? void 0 : _a.call(ws)) === this.leaf || ws.activeLeaf === this.leaf;
            });
        });
    }
    onClose() {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            (_a = this.contentController) === null || _a === void 0 ? void 0 : _a.unmountFromContainer();
            this.contentController = undefined;
        });
    }
}

const INITIAL_SPLIT_RATIO = 0.34;
/** 判斷 DOM Window 是否為 Popout。 */
function isPopoutWindow(win) {
    var _a;
    if (!win || (typeof window !== "undefined" && win === window))
        return false;
    const body = (_a = win.document) === null || _a === void 0 ? void 0 : _a.body;
    return !!body && (body.classList.contains("is-popout-window") || body.classList.contains("mod-popout"));
}
/** 取得 leaf 所屬的 DOM Window。 */
function getWindowOfLeaf(leaf) {
    var _a, _b, _c;
    if (!leaf)
        return null;
    const extLeaf = leaf;
    const container = extLeaf.containerEl || ((_a = leaf.view) === null || _a === void 0 ? void 0 : _a.containerEl);
    return (_c = (_b = container === null || container === void 0 ? void 0 : container.ownerDocument) === null || _b === void 0 ? void 0 : _b.defaultView) !== null && _c !== void 0 ? _c : null;
}
/** 測量 WorkspaceTabs 容器本身的 DOMRect（背景 tab 寬高為 0，需測 tabs 容器）。 */
function getPaneRect(tabs) {
    var _a, _b;
    const container = tabs === null || tabs === void 0 ? void 0 : tabs.containerEl;
    if (container instanceof HTMLElement) {
        const rect = container.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0)
            return rect;
    }
    const children = ((_a = tabs === null || tabs === void 0 ? void 0 : tabs.children) !== null && _a !== void 0 ? _a : []);
    for (const leaf of children) {
        const extLeaf = leaf;
        const leafContainer = extLeaf.containerEl || ((_b = leaf.view) === null || _b === void 0 ? void 0 : _b.containerEl);
        if (leafContainer instanceof HTMLElement) {
            const rect = leafContainer.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0)
                return rect;
        }
    }
    return null;
}
/** 向上追溯至 Popout 視窗層級的最頂層 Split 節點。 */
function getTopLevelNodeInWindow(leaf) {
    let curr = leaf;
    while (curr && curr.parent) {
        const parent = curr.parent;
        if (!parent || !parent.parent || parent.type === "root" || parent.isRoot || parent.kind === "root") {
            return curr;
        }
        curr = parent;
    }
    return curr;
}
/** 尋找 leaf 的 containerEl 距離最近（含自身）的祖先中的 `.mod-root` split 元素。 */
function findRootSplitElement(element) {
    let node = element;
    while (node) {
        if (node.classList.contains("workspace-split") && node.classList.contains("mod-root")) {
            return node;
        }
        node = node.parentElement;
    }
    return null;
}
/** 從 element 向上找到 root 的 direct child（即頂層欄位元素）。 */
function getDirectChildOf(root, element) {
    let current = element;
    while (current && current.parentElement !== root) {
        current = current.parentElement;
    }
    return current && current.parentElement === root ? current : null;
}
/** 找到 leaf 在其 parent split 下的 direct child 元素（`.workspace-tabs` 或巢狀 split）。 */
function getPaneContainerElement(leaf) {
    var _a;
    const extLeaf = leaf;
    const container = extLeaf.containerEl || ((_a = leaf.view) === null || _a === void 0 ? void 0 : _a.containerEl);
    if (!(container instanceof HTMLElement))
        return null;
    let current = container;
    while (current && current.parentElement) {
        if (current.parentElement.classList.contains("workspace-split")) {
            return current;
        }
        current = current.parentElement;
    }
    return null;
}
/** 是否為隱藏狀態（inline display:none 或明確的 collapse class）。 */
function isElementHidden(el) {
    return !!el && (el.style.display === "none" ||
        el.classList.contains("window-spaces-column-hidden"));
}
/** 透過 Obsidian 樣式 Helper 設定 display（禁止直接指派 el.style.display）。 */
function setElementDisplay(el, display) {
    const customEl = el;
    if (typeof customEl.setCssProps === "function") {
        customEl.setCssProps({ display });
    }
    else {
        el.style.display = display;
    }
}
function setElementCssStyles(el, styles) {
    const customEl = el;
    if (typeof customEl.setCssStyles === "function") {
        customEl.setCssStyles(styles);
    }
    else if (typeof customEl.setCssProps === "function") {
        customEl.setCssProps(styles);
    }
    else {
        for (const [key, value] of Object.entries(styles)) {
            el.style.setProperty(key, value);
        }
    }
}
function getViewContainer(leaf) {
    var _a;
    const extLeaf = leaf;
    const container = extLeaf.containerEl || ((_a = leaf.view) === null || _a === void 0 ? void 0 : _a.containerEl);
    return container instanceof HTMLElement ? container : null;
}
function getDirectSplitChild(split, element) {
    let current = element;
    while (current && current.parentElement !== split) {
        current = current.parentElement;
    }
    return current;
}
function scheduleInitialSplitSizing(panelLeaf, editorLeaf, win) {
    var _a;
    const raf = ((_a = win.requestAnimationFrame) === null || _a === void 0 ? void 0 : _a.bind(win)) || window.requestAnimationFrame.bind(window);
    raf(() => {
        raf(() => {
            applyInitialSplitSizing(panelLeaf, editorLeaf);
        });
    });
}
function applyInitialSplitSizing(panelLeaf, editorLeaf) {
    const panelContainer = getViewContainer(panelLeaf);
    const editorContainer = getViewContainer(editorLeaf);
    if (!panelContainer || !editorContainer)
        return;
    const split = panelContainer.closest(".workspace-split.mod-vertical");
    if (!split || !split.contains(editorContainer))
        return;
    const panelPane = getDirectSplitChild(split, panelContainer);
    const editorPane = getDirectSplitChild(split, editorContainer);
    if (!panelPane || !editorPane || panelPane === editorPane)
        return;
    setElementCssStyles(panelPane, { flex: `0 0 ${INITIAL_SPLIT_RATIO * 100}%` });
    setElementCssStyles(editorPane, { flex: "1 1 0%" });
}
function findLeafInTabs(tabs, viewType) {
    var _a, _b;
    const children = ((_a = tabs === null || tabs === void 0 ? void 0 : tabs.children) !== null && _a !== void 0 ? _a : []);
    for (const leaf of children) {
        if (((_b = leaf.getViewState()) === null || _b === void 0 ? void 0 : _b.type) === viewType) {
            return leaf;
        }
    }
    return null;
}
/**
 * 判斷頂層欄位是否被 UI 標記為 sidebar（`window-spaces-sidebar-column` class）。
 *
 * 此 class 由 Window Spaces 的 activityBar（syncSidebarColumnClasses）依
 * 「該側 activity bar 可見 + 位於最左/最右 + 頂層欄位數 ≥ 2」套用，並同時
 * 驅動側欄底色與 tab header 樣式。被動判定（isLeafInSideColumn /
 * getCenterPanes）以它為唯一依據，確保「開檔排除」與「視覺樣式」永遠一致。
 */
function isSidebarColumnElement(columnEl) {
    return !!columnEl && columnEl.classList.contains("window-spaces-sidebar-column");
}
class PopoutLayoutEngine {
    constructor(app) {
        this.sidebarSidesByWindow = new WeakMap();
        this.app = app;
    }
    get workspace() {
        return this.app.workspace;
    }
    /** 取得指定視窗中最新的 active leaf（限定該 window）。 */
    getActiveLeafInWindow(win) {
        const activeLeaf = typeof this.workspace.getMostRecentLeaf === "function"
            ? this.workspace.getMostRecentLeaf()
            : this.workspace.activeLeaf;
        return activeLeaf && getWindowOfLeaf(activeLeaf) === win ? activeLeaf : null;
    }
    /** 取得指定視窗中最後一個 leaf（限定該 window）。 */
    getLastLeafInWindow(win) {
        let lastLeaf = null;
        this.workspace.iterateAllLeaves((leaf) => {
            if (getWindowOfLeaf(leaf) === win) {
                lastLeaf = leaf;
            }
        });
        return lastLeaf;
    }
    /** 取得指定視窗中所有 leaf。 */
    getLeavesForWindow(win) {
        const leaves = [];
        this.workspace.iterateAllLeaves((leaf) => {
            if (getWindowOfLeaf(leaf) === win) {
                leaves.push(leaf);
            }
        });
        return leaves;
    }
    /** Record which endpoint columns are real sidebars for a newly-created Popout. */
    setSidebarSides(win, sides) {
        this.sidebarSidesByWindow.set(win, Object.assign({}, sides));
    }
    getSidebarSides(win) {
        const sides = this.sidebarSidesByWindow.get(win);
        return sides ? Object.assign({}, sides) : undefined;
    }
    /** 取得所有目前存活的 Popout DOM Window（去重）。 */
    getLivePopoutWindows() {
        const wins = [];
        this.workspace.iterateAllLeaves((leaf) => {
            const win = getWindowOfLeaf(leaf);
            if (win && isPopoutWindow(win) && !wins.includes(win)) {
                wins.push(win);
            }
        });
        return wins;
    }
    /** 收集 Popout 視窗中的所有 Pane（測量 tabs 容器）。 */
    collectPopoutPanes(win) {
        const tabsSet = new Set();
        this.workspace.iterateAllLeaves((leaf) => {
            if (getWindowOfLeaf(leaf) !== win)
                return;
            const parent = leaf.parent;
            if (parent) {
                tabsSet.add(parent);
            }
        });
        const panes = [];
        for (const tabs of tabsSet) {
            const rect = getPaneRect(tabs);
            const left = rect ? rect.left : 0;
            const width = rect ? rect.width : 400;
            panes.push({ tabs, left, width, center: left + width / 2 });
        }
        panes.sort((a, b) => a.left - b.left);
        return panes;
    }
    /** 在指定頂層欄位內尋找特定 view type 的 leaf（限定該欄位，不跨 tab group / 不跨側欄）。 */
    findLeafOfTypeInColumn(win, columnEl, viewType) {
        let found = null;
        this.workspace.iterateAllLeaves((leaf) => {
            var _a, _b;
            if (found)
                return;
            if (getWindowOfLeaf(leaf) !== win || ((_a = leaf.getViewState()) === null || _a === void 0 ? void 0 : _a.type) !== viewType)
                return;
            const extLeaf = leaf;
            const container = extLeaf.containerEl || ((_b = leaf.view) === null || _b === void 0 ? void 0 : _b.containerEl);
            if (container instanceof HTMLElement && columnEl.contains(container)) {
                found = leaf;
            }
        });
        return found;
    }
    findLeafByIdInWindow(win, leafId) {
        let found = null;
        this.workspace.iterateAllLeaves((leaf) => {
            if (!found && getWindowOfLeaf(leaf) === win && leaf.id === leafId) {
                found = leaf;
            }
        });
        return found;
    }
    pickCenterPopoutPane(panes, win) {
        const firstPane = panes[0];
        if (!firstPane)
            return null;
        if (panes.length === 1)
            return firstPane;
        const winCenter = win.innerWidth / 2;
        let bestPane = firstPane;
        let bestDistance = Infinity;
        for (const pane of panes) {
            const distance = Math.abs(pane.center - winCenter);
            if (distance < bestDistance) {
                bestDistance = distance;
                bestPane = pane;
            }
        }
        return bestPane;
    }
    /**
     * 確保指定 Popout 的某側存在「側欄欄位」（結構化：第一/最後頂層欄位即側欄），
     * 並開啟/聚焦指定 view type。
     * - viewType 有值：建立/聚焦該 view 的 leaf。
     * - viewType 無值：僅確保欄位存在並回傳一個空 leaf（供攔截器由第三方設定 view）。
     *
     * 主動定位語意：open-in-left/right-sidebar 應把 view 開到「最左/最右邊的 split」。
     * 因此當該側沒有被標記為 sidebar 的欄位時（例如 activity bar 未開啟），仍回退到
     * 最左/最右現有的頂層欄位；完全沒有欄位時才建立新的垂直 Split 欄位。
     */
    ensureSideColumn(win, side, viewType) {
        var _a, _b, _c;
        return __awaiter(this, void 0, void 0, function* () {
            const workspace = this.workspace;
            const columnEl = (_a = this.getColumnElement(win, side)) !== null && _a !== void 0 ? _a : this.getEdgeColumnElement(win, side);
            if (columnEl) {
                const tabs = this.getSidebarTabsInColumn(win, columnEl);
                if (tabs) {
                    if (viewType) {
                        const existingInSidebar = findLeafInTabs(tabs, viewType);
                        if (existingInSidebar) {
                            yield workspace.revealLeaf(existingInSidebar);
                            workspace.setActiveLeaf(existingInSidebar, { focus: true });
                            return existingInSidebar;
                        }
                    }
                    const newLeaf = viewType
                        ? yield this.openPanelInTabs(tabs, viewType)
                        : this.createLeafInTabs(tabs);
                    yield workspace.revealLeaf(newLeaf);
                    workspace.setActiveLeaf(newLeaf, { focus: true });
                    return newLeaf;
                }
            }
            // 尚無側欄欄位：建立貫穿全高的垂直 Split 欄位
            // Prefer an existing center pane when adding a second sidebar. The active
            // leaf is often still in the first sidebar after the user clicks an
            // Activity Bar button; splitting that leaf would turn a sidebar into the
            // content area and leave the layout with no real center column.
            const centerPane = this.getCenterPanes(win)[0];
            let editorLeaf = ((_b = centerPane === null || centerPane === void 0 ? void 0 : centerPane.tabs.children) === null || _b === void 0 ? void 0 : _b[0])
                || this.getActiveLeafInWindow(win)
                || this.getLastLeafInWindow(win);
            if (editorLeaf && viewType && ((_c = editorLeaf.getViewState()) === null || _c === void 0 ? void 0 : _c.type) === viewType) {
                let otherLeaf = null;
                workspace.iterateAllLeaves((l) => {
                    var _a;
                    if (!otherLeaf && getWindowOfLeaf(l) === win && ((_a = l.getViewState()) === null || _a === void 0 ? void 0 : _a.type) !== viewType) {
                        otherLeaf = l;
                    }
                });
                if (otherLeaf)
                    editorLeaf = otherLeaf;
            }
            if (!editorLeaf) {
                return this.openPanelInEditor(win, viewType);
            }
            const targetNode = getTopLevelNodeInWindow(editorLeaf) || editorLeaf;
            const isParentNode = targetNode !== editorLeaf && Boolean(targetNode.children);
            const before = side === "left" ? !isParentNode : isParentNode;
            const panelLeaf = workspace.createLeafBySplit(targetNode, "vertical", before);
            if (viewType) {
                yield panelLeaf.setViewState({
                    type: viewType,
                    active: false,
                    state: {},
                });
            }
            scheduleInitialSplitSizing(panelLeaf, editorLeaf, win);
            yield workspace.revealLeaf(panelLeaf);
            workspace.setActiveLeaf(panelLeaf, { focus: true });
            return panelLeaf;
        });
    }
    /**
     * 在指定側欄欄位（頂層 column 元素）內解析目標 tabs 群組：
     * 優先取該欄位中 active leaf 所在的 pane，否則第一個 pane 的 tabs。
     */
    getSidebarTabsInColumn(win, columnEl) {
        const activeLeaf = this.getActiveLeafInWindow(win);
        if (activeLeaf) {
            const tabs = this.getTabsForLeafInColumn(win, columnEl, activeLeaf);
            if (tabs)
                return tabs;
        }
        let firstTabs = null;
        this.workspace.iterateAllLeaves((leaf) => {
            if (firstTabs)
                return;
            const tabs = this.getTabsForLeafInColumn(win, columnEl, leaf);
            if (tabs)
                firstTabs = tabs;
        });
        return firstTabs;
    }
    /** 若 leaf 位於指定 column 元素內，回傳其所屬 tabs 群組；否則 null。 */
    getTabsForLeafInColumn(win, columnEl, leaf) {
        var _a, _b;
        if (getWindowOfLeaf(leaf) !== win)
            return null;
        const extLeaf = leaf;
        const container = extLeaf.containerEl || ((_a = leaf.view) === null || _a === void 0 ? void 0 : _a.containerEl);
        if (container instanceof HTMLElement && columnEl.contains(container)) {
            return (_b = extLeaf.parent) !== null && _b !== void 0 ? _b : null;
        }
        return null;
    }
    /** 攔截器專用：在指定側欄回傳一個 leaf（欄位不存在則建立），供第三方設定 view state。 */
    openSideLeaf(win, side) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.ensureSideColumn(win, side);
        });
    }
    /**
     * 攔截器專用（同步版本）：`app.workspace.getLeftLeaf` 為同步 API，無法 await。
     * 同步建立/回傳側欄 leaf，不進行 reveal / setViewState（由第三方呼叫端後續設定）。
     */
    openSideLeafSync(win, side) {
        var _a;
        const workspace = this.workspace;
        // 與 ensureSideColumn 相同的主動定位語意：無標記側欄時回退到最左/最右欄位。
        const columnEl = (_a = this.getColumnElement(win, side)) !== null && _a !== void 0 ? _a : this.getEdgeColumnElement(win, side);
        if (columnEl) {
            const tabs = this.getSidebarTabsInColumn(win, columnEl);
            if (tabs) {
                return this.createLeafInTabs(tabs);
            }
        }
        let editorLeaf = this.getActiveLeafInWindow(win) || this.getLastLeafInWindow(win);
        if (!editorLeaf)
            return null;
        const targetNode = getTopLevelNodeInWindow(editorLeaf) || editorLeaf;
        const isParentNode = targetNode !== editorLeaf && Boolean(targetNode.children);
        const before = side === "left" ? !isParentNode : isParentNode;
        const panelLeaf = workspace.createLeafBySplit(targetNode, "vertical", before);
        scheduleInitialSplitSizing(panelLeaf, editorLeaf, win);
        return panelLeaf;
    }
    createLeafInTabs(tabs) {
        var _a;
        const workspace = this.workspace;
        const children = ((_a = tabs === null || tabs === void 0 ? void 0 : tabs.children) !== null && _a !== void 0 ? _a : []);
        const leaf = workspace.createLeafInParent(tabs, children.length);
        return leaf;
    }
    openPanelInTabs(tabs, viewType) {
        return __awaiter(this, void 0, void 0, function* () {
            const leaf = this.createLeafInTabs(tabs);
            yield leaf.setViewState({
                type: viewType,
                active: true,
                state: {},
            });
            return leaf;
        });
    }
    /**
     * 統一入口：在指定 Popout 開啟/聚焦指定 view type。
     * - location "left"/"right"：側欄欄位。
     * - location "tab"：中央編輯區域。
     */
    openPanel(win, location, viewType) {
        return __awaiter(this, void 0, void 0, function* () {
            if (location === "left" || location === "right") {
                return this.ensureSideColumn(win, location, viewType);
            }
            return this.ensureCenterPanel(win, viewType);
        });
    }
    /** 在指定 Popout 的中央編輯區域開啟/聚焦指定 view type。 */
    ensureCenterPanel(win, viewType) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const workspace = this.workspace;
            const panes = this.collectPopoutPanes(win);
            const targetPane = this.pickCenterPopoutPane(panes, win);
            if (targetPane) {
                const existingInTabs = findLeafInTabs(targetPane.tabs, viewType);
                if (existingInTabs) {
                    yield workspace.revealLeaf(existingInTabs);
                    workspace.setActiveLeaf(existingInTabs, { focus: true });
                    return existingInTabs;
                }
                return this.openPanelInTabs(targetPane.tabs, viewType);
            }
            const baseLeaf = (_a = this.getActiveLeafInWindow(win)) !== null && _a !== void 0 ? _a : this.getLastLeafInWindow(win);
            if (!baseLeaf) {
                const leaf = workspace.getLeaf("tab");
                yield leaf.setViewState({
                    type: viewType,
                    active: true,
                    state: {},
                });
                yield workspace.revealLeaf(leaf);
                workspace.setActiveLeaf(leaf, { focus: true });
                return leaf;
            }
            const tabs = baseLeaf.parent;
            if (tabs) {
                const existingInTabs = findLeafInTabs(tabs, viewType);
                if (existingInTabs) {
                    yield workspace.revealLeaf(existingInTabs);
                    workspace.setActiveLeaf(existingInTabs, { focus: true });
                    return existingInTabs;
                }
            }
            const leaf = yield this.openPanelInTabs(tabs, viewType);
            yield workspace.revealLeaf(leaf);
            workspace.setActiveLeaf(leaf, { focus: true });
            return leaf;
        });
    }
    openPanelInEditor(win, viewType) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const workspace = this.workspace;
            const panes = this.collectPopoutPanes(win);
            const targetPane = this.pickCenterPopoutPane(panes, win);
            if (targetPane) {
                if (viewType) {
                    const existingInTabs = findLeafInTabs(targetPane.tabs, viewType);
                    if (existingInTabs)
                        return existingInTabs;
                }
                return viewType
                    ? this.openPanelInTabs(targetPane.tabs, viewType)
                    : this.createLeafInTabs(targetPane.tabs);
            }
            const baseLeaf = (_a = this.getActiveLeafInWindow(win)) !== null && _a !== void 0 ? _a : this.getLastLeafInWindow(win);
            if (!baseLeaf) {
                const leaf = workspace.getLeaf("tab");
                if (viewType) {
                    yield leaf.setViewState({ type: viewType, active: true, state: {} });
                }
                return leaf;
            }
            const tabs = baseLeaf.parent;
            if (tabs && viewType) {
                const existingInTabs = findLeafInTabs(tabs, viewType);
                if (existingInTabs)
                    return existingInTabs;
            }
            return viewType ? this.openPanelInTabs(tabs, viewType) : this.createLeafInTabs(tabs);
        });
    }
    /** 判斷 leaf 是否位於 Popout 視窗的「偽側欄」（被 UI 標記為 sidebar 的頂層欄位）中。 */
    isLeafInSideColumn(win, leaf) {
        var _a;
        if (!leaf || getWindowOfLeaf(leaf) !== win)
            return false;
        const extLeaf = leaf;
        const container = extLeaf.containerEl || ((_a = leaf.view) === null || _a === void 0 ? void 0 : _a.containerEl);
        if (!(container instanceof HTMLElement))
            return false;
        return isSidebarColumnElement(this.getTopLevelColumnForContainer(container));
    }
    /** 回傳 container 所在的頂層欄位元素（root split 的 direct child）。 */
    getTopLevelColumnForContainer(container) {
        const rootEl = findRootSplitElement(container);
        if (!rootEl)
            return null;
        return getDirectChildOf(rootEl, container);
    }
    /**
     * 取得 Popout 視窗非側欄的「中央編輯區」Tabs 群組。
     * 排除被 UI 標記為 sidebar（window-spaces-sidebar-column）的頂層欄位內 Tabs。
     */
    getCenterPanes(win) {
        const panes = this.collectPopoutPanes(win);
        if (panes.length === 0)
            return [];
        const centerPanes = panes.filter((pane) => {
            var _a, _b;
            const tabs = pane.tabs;
            const container = tabs.containerEl;
            if (container instanceof HTMLElement) {
                if (isSidebarColumnElement(this.getTopLevelColumnForContainer(container)))
                    return false;
            }
            const children = ((_a = tabs.children) !== null && _a !== void 0 ? _a : []);
            for (const leaf of children) {
                const extLeaf = leaf;
                const leafContainer = extLeaf.containerEl || ((_b = leaf.view) === null || _b === void 0 ? void 0 : _b.containerEl);
                if (leafContainer instanceof HTMLElement) {
                    if (isSidebarColumnElement(this.getTopLevelColumnForContainer(leafContainer)))
                        return false;
                }
            }
            return true;
        });
        return centerPanes;
    }
    /**
     * 同步取得/建立位於 Popout 視窗「中央編輯區」的 WorkspaceLeaf。
     * 用於避免側欄觸發開啟檔案時覆蓋側欄 View。
     */
    getCenterLeafSync(win, newLeaf) {
        var _a, _b;
        const workspace = this.workspace;
        const centerPanes = this.getCenterPanes(win);
        const targetPane = this.pickCenterPopoutPane(centerPanes, win);
        if (targetPane) {
            const isNewTabRequested = newLeaf === true || newLeaf === "tab" || newLeaf === "split";
            if (!isNewTabRequested) {
                const children = ((_a = targetPane.tabs.children) !== null && _a !== void 0 ? _a : []);
                for (const leaf of children) {
                    const extLeaf = leaf;
                    const isPinned = Boolean(extLeaf.pinned || ((_b = leaf.getViewState()) === null || _b === void 0 ? void 0 : _b.pinned));
                    if (!isPinned) {
                        return leaf;
                    }
                }
            }
            return this.createLeafInTabs(targetPane.tabs);
        }
        // 尚無中央編輯區 (例如 Popout 視窗目前只有側欄欄位)：建立垂直 Split 放置中央區
        const baseLeaf = this.getActiveLeafInWindow(win) || this.getLastLeafInWindow(win);
        if (!baseLeaf) {
            return workspace.getLeaf("tab");
        }
        const targetNode = getTopLevelNodeInWindow(baseLeaf) || baseLeaf;
        const centerLeaf = workspace.createLeafBySplit(targetNode, "vertical", false);
        return centerLeaf;
    }
    // ===== 隱藏/還原 =====
    /**
     * 取得 Popout 視窗 Root split 的頂層欄位元素（依 DOM 結構，不依賴幾何測量，
     * 因此即使欄位被 display:none 隱藏仍能正確定址）。
     */
    getTopLevelColumnElements(win) {
        var _a;
        const leaves = this.getLeavesForWindow(win);
        if (leaves.length === 0)
            return [];
        const leaf = leaves[0];
        if (!leaf)
            return [];
        const container = leaf.containerEl ||
            ((_a = leaf.view) === null || _a === void 0 ? void 0 : _a.containerEl);
        if (!(container instanceof HTMLElement))
            return [];
        const rootEl = findRootSplitElement(container);
        if (!rootEl)
            return [];
        return Array.from(rootEl.children).filter((el) => {
            if (!(el instanceof HTMLElement))
                return false;
            return (el.classList.contains("workspace-tabs") ||
                el.classList.contains("workspace-split"));
        });
    }
    /** 取得指定側「最外側」的頂層欄位（不問是否為 sidebar），供主動 open-in-sidebar 定位。 */
    getEdgeColumnElement(win, side) {
        var _a, _b;
        const topEls = this.getTopLevelColumnElements(win);
        if (topEls.length === 0)
            return null;
        return side === "left" ? (_a = topEls[0]) !== null && _a !== void 0 ? _a : null : (_b = topEls[topEls.length - 1]) !== null && _b !== void 0 ? _b : null;
    }
    /**
     * 取得指定側的「物理側欄」頂層欄位元素（DOM 結構優先，display-independent）。
     *
     * 語意：主動/實體定位（open-in-sidebar、hide/show column、隱藏狀態 capture/apply）。
     * - 有 hints（activityBar 寫入的物理側欄映射）：該側有側欄 → 最左/最右欄位；
     *   該側無側欄 → null。
     * - 無 hints（非 Window Spaces 管理或尚未同步）：以 UI 標記
     *   （window-spaces-sidebar-column class）保守推斷；無標記 → null。
     *
     * 注意：被動判定（isLeafInSideColumn / getCenterPanes）不使用本方法，
     * 一律以 UI 標記 class 為準，確保開檔排除與視覺樣式永遠一致。
     */
    getColumnElement(win, side) {
        const edge = this.getEdgeColumnElement(win, side);
        if (!edge)
            return null;
        const configuredSides = this.sidebarSidesByWindow.get(win);
        if (configuredSides) {
            if (!configuredSides[side])
                return null;
            const requiredColumns = Number(configuredSides.left) + Number(configuredSides.right) + 1;
            if (this.getTopLevelColumnElements(win).length < requiredColumns)
                return null;
            return edge;
        }
        return isSidebarColumnElement(edge) ? edge : null;
    }
    /** 目前仍可見的頂層欄位數量（display:none 的欄位不計）。 */
    getVisibleColumnCount(win) {
        return this.getTopLevelColumnElements(win).filter((el) => !isElementHidden(el)).length;
    }
    isColumnHidden(win, side) {
        const column = this.getColumnElement(win, side);
        return isElementHidden(column) || !!(column === null || column === void 0 ? void 0 : column.classList.contains("window-spaces-column-hidden"));
    }
    hideColumn(win, side) {
        const column = this.getColumnElement(win, side);
        if (!column)
            return;
        // Keep an explicit state class alongside inline display. Obsidian can
        // reapply flex sizing to a popout split after a layout update; the class
        // lets our stylesheet collapse that split's flex basis as well.
        column.classList.add("window-spaces-column-hidden");
        setElementDisplay(column, "none");
    }
    showColumn(win, side) {
        const column = this.getColumnElement(win, side);
        if (!column)
            return;
        column.classList.remove("window-spaces-column-hidden");
        setElementDisplay(column, "");
    }
    hidePaneGroup(leaf) {
        const container = getPaneContainerElement(leaf);
        if (container)
            setElementDisplay(container, "none");
    }
    // ===== 持久化 =====
    /** 讀取指定視窗目前隱藏的欄位與 pane group。 */
    captureHiddenState(win) {
        const state = {};
        const leftEl = this.getColumnElement(win, "left");
        if (leftEl)
            state.leftSidebar = isElementHidden(leftEl);
        const rightEl = this.getColumnElement(win, "right");
        if (rightEl)
            state.rightSidebar = isElementHidden(rightEl);
        const hiddenIds = [];
        this.getLeavesForWindow(win).forEach((leaf) => {
            const container = getPaneContainerElement(leaf);
            if (container && isElementHidden(container)) {
                const id = leaf.id;
                if (id)
                    hiddenIds.push(id);
            }
        });
        if (hiddenIds.length > 0) {
            state.hiddenLeafIds = hiddenIds;
        }
        return state;
    }
    /** 於 restore 完成後重新套用隱藏狀態。 */
    applyHiddenState(win, state) {
        if (!state || !win || win.closed)
            return;
        if (state.leftSidebar)
            this.hideColumn(win, "left");
        if (state.rightSidebar)
            this.hideColumn(win, "right");
        if (Array.isArray(state.hiddenLeafIds)) {
            state.hiddenLeafIds.forEach((leafId) => {
                const leaf = this.findLeafByIdInWindow(win, leafId);
                if (leaf)
                    this.hidePaneGroup(leaf);
            });
        }
    }
}

/** Fixed cross-bundle key. Both plugins must use this exact namespace. */
const POPOUT_LAYOUT_REGISTRY_KEY = "__obsidian_popout_layout_registry_v1__";
function compareRevisions(left, right) {
    return left === right ? 0 : left > right ? 1 : -1;
}
function compareCandidatePriority(left, right) {
    // Prefer the newest API, then the implementation that supports the broadest
    // compatible range, and finally the newest implementation revision.
    if (left.apiVersion !== right.apiVersion) {
        return right.apiVersion - left.apiVersion;
    }
    if (left.compatibleFrom !== right.compatibleFrom) {
        return left.compatibleFrom - right.compatibleFrom;
    }
    const revisionOrder = compareRevisions(left.implementationRevision, right.implementationRevision);
    return revisionOrder === 0 ? 0 : -revisionOrder;
}
function compareCandidates(left, right) {
    const priorityOrder = compareCandidatePriority(left, right);
    if (priorityOrder !== 0)
        return priorityOrder;
    return left.id < right.id ? -1 : left.id > right.id ? 1 : 0;
}
function supportsApiVersion(candidate, apiVersion) {
    return candidate.compatibleFrom <= apiVersion && apiVersion <= candidate.apiVersion;
}
/**
 * A candidate may become active only when it can serve every older API version
 * currently registered. Registered candidates represent active consumers: this
 * prevents a v2 implementation with compatibleFrom=2 from replacing the v1
 * implementation that an already-loaded plugin still requires.
 */
function isBackwardCompatibleWithRegisteredConsumers(candidate, candidates) {
    return candidates
        .filter((consumer) => consumer.apiVersion < candidate.apiVersion)
        .every((consumer) => supportsApiVersion(candidate, consumer.apiVersion));
}
function selectActiveCandidate(state) {
    var _a, _b, _c, _d;
    // acquirePopoutLayoutEngine validates each candidate's own range. Selection
    // must now evaluate it against the other registered API consumers.
    const candidates = Array.from(state.candidates.values());
    const compatibleCandidates = candidates
        .filter((candidate) => isBackwardCompatibleWithRegisteredConsumers(candidate, candidates))
        .sort(compareCandidates);
    const currentActive = state.activeId ? (_a = state.candidates.get(state.activeId)) !== null && _a !== void 0 ? _a : null : null;
    const currentRemainsBest = currentActive !== null &&
        compatibleCandidates.some((candidate) => candidate.id === currentActive.id) &&
        compatibleCandidates.every((candidate) => compareCandidatePriority(currentActive, candidate) <= 0);
    const active = currentRemainsBest ? currentActive : (_b = compatibleCandidates[0]) !== null && _b !== void 0 ? _b : null;
    state.activeId = (_c = active === null || active === void 0 ? void 0 : active.id) !== null && _c !== void 0 ? _c : null;
    state.activeEngine = (_d = active === null || active === void 0 ? void 0 : active.engine) !== null && _d !== void 0 ? _d : null;
}
function createStableProxy(state) {
    const target = Object.create(null);
    return new Proxy(target, {
        get(proxyTarget, property, receiver) {
            // Let test instrumentation or an explicitly attached property behave
            // normally without changing the delegate held by the registry.
            if (property in proxyTarget) {
                return Reflect.get(proxyTarget, property, receiver);
            }
            const delegate = state.activeEngine;
            if (!delegate)
                return undefined;
            const value = Reflect.get(delegate, property, delegate);
            if (typeof value !== "function")
                return value;
            let wrapper = state.methodWrappers.get(property);
            if (!wrapper) {
                wrapper = (...args) => {
                    const current = state.activeEngine;
                    if (!current)
                        throw new Error("No active Popout layout engine candidate");
                    const currentMethod = Reflect.get(current, property, current);
                    if (typeof currentMethod !== "function") {
                        throw new Error(`Active Popout layout engine has no method '${String(property)}'`);
                    }
                    return currentMethod.apply(current, args);
                };
                state.methodWrappers.set(property, wrapper);
            }
            return wrapper;
        },
        has(proxyTarget, property) {
            return property in proxyTarget || Boolean(state.activeEngine && property in state.activeEngine);
        },
        getOwnPropertyDescriptor(proxyTarget, property) {
            const own = Reflect.getOwnPropertyDescriptor(proxyTarget, property);
            if (own)
                return own;
            const delegate = state.activeEngine;
            if (delegate && property in delegate) {
                return {
                    configurable: true,
                    enumerable: false,
                    writable: true,
                    value: Reflect.get(delegate, property, delegate),
                };
            }
            return undefined;
        },
        set(proxyTarget, property, value, receiver) {
            return Reflect.set(proxyTarget, property, value, receiver);
        },
    });
}
function getRegistryState() {
    const namespace = globalThis;
    const existing = namespace[POPOUT_LAYOUT_REGISTRY_KEY];
    if (existing)
        return existing;
    const state = {
        candidates: new Map(),
        activeId: null,
        activeEngine: null,
        methodWrappers: new Map(),
        proxy: undefined,
    };
    state.proxy = createStableProxy(state);
    namespace[POPOUT_LAYOUT_REGISTRY_KEY] = state;
    return state;
}
/**
 * Register an implementation candidate and return the cross-bundle stable
 * singleton proxy. A later compatible candidate only changes the proxy's
 * delegate; existing references therefore remain valid after an upgrade.
 */
function acquirePopoutLayoutEngine(candidate) {
    if (!candidate.id)
        throw new Error("Popout layout candidate id is required");
    if (!Number.isInteger(candidate.apiVersion) || candidate.apiVersion < 1) {
        throw new Error("Popout layout candidate apiVersion must be a positive integer");
    }
    if (!Number.isInteger(candidate.compatibleFrom) || candidate.compatibleFrom < 1) {
        throw new Error("Popout layout candidate compatibleFrom must be a positive integer");
    }
    if (candidate.compatibleFrom > candidate.apiVersion) {
        throw new Error("Popout layout candidate compatibleFrom cannot exceed apiVersion");
    }
    if (typeof candidate.create !== "function") {
        throw new Error("Popout layout candidate create must be a function");
    }
    const state = getRegistryState();
    const engine = candidate.create();
    if (!engine)
        throw new Error(`Popout layout candidate '${candidate.id}' returned no engine`);
    state.candidates.set(candidate.id, {
        id: candidate.id,
        apiVersion: candidate.apiVersion,
        compatibleFrom: candidate.compatibleFrom,
        implementationRevision: candidate.implementationRevision,
        engine,
    });
    selectActiveCandidate(state);
    return state.proxy;
}
/** Remove a candidate and fall back to the best remaining implementation. */
function releasePopoutLayoutEngine(id) {
    const state = getRegistryState();
    state.candidates.delete(id);
    selectActiveCandidate(state);
}

/** Shared Popout layout library API version. */
const SHARED_API_VERSION = 5;
/** Oldest shared API version implemented by this copy. */
const SHARED_COMPATIBLE_FROM_VERSION = 1;
/** Monotonic implementation identifier used when API versions are equal. */
const SHARED_IMPLEMENTATION_REVISION = "2026-08-12T16:10:00Z";

/**
 * Popout Activity Bar 控制器。
 *
 * 在每個 Popout 左右邊緣注入垂直工具列：
 * - 頂端：toggle 本側欄位按鈕。
 * - 分隔線下方：設定指定的 view 切換按鈕。
 * 欄位隱藏由 `PopoutLayoutEngine` 的 CSS display 機制處理。
 * 另外在左上角注入可拖曳移動視窗的 drag handle。
 */
class PopoutActivityBarManager {
    constructor(plugin, engine) {
        this.barsByWindow = new WeakMap();
        this.injectedWindows = new Set();
        this.sidebarHintsByWindow = new WeakMap();
        this.columnEnsurePromises = new WeakMap();
        this.app = plugin.app;
        this.plugin = plugin;
        this.engine = engine;
    }
    get settings() {
        return this.plugin.settings;
    }
    isEnabled() {
        // Visibility is controlled independently by the left/right defaults and
        // per-Space settings. Keep injecting the lightweight controller so a
        // later setting change can update the existing Popout without reopening it.
        return true;
    }
    getItemsForSide(side) {
        var _a, _b;
        return (_b = (_a = this.settings.activityBars) === null || _a === void 0 ? void 0 : _a[side]) !== null && _b !== void 0 ? _b : [];
    }
    /** Snapshot the global Activity Bar defaults for a newly-created Space. */
    getDefaultSettingsForNewSpace() {
        const copy = (side) => {
            var _a;
            return ({
                show: ((_a = this.settings.activityBarDefaults) === null || _a === void 0 ? void 0 : _a[side]) !== false,
                items: this.getItemsForSide(side).map((item) => (Object.assign({}, item))),
            });
        };
        return { left: copy("left"), right: copy("right") };
    }
    /**
     * Build the initial columns for a brand-new empty Popout. The first
     * configured button on each enabled side becomes that sidebar's first view.
     * When no view is available, ensureSideColumn intentionally leaves a New Tab
     * panel in that sidebar instead.
     */
    initializeNewWindow(win) {
        var _a, _b, _c, _d, _e;
        return __awaiter(this, void 0, void 0, function* () {
            if (!win || win.closed)
                return;
            this.injectForWindow(win);
            const leftVisible = ((_a = this.settings.activityBarDefaults) === null || _a === void 0 ? void 0 : _a.left) !== false;
            const rightVisible = ((_b = this.settings.activityBarDefaults) === null || _b === void 0 ? void 0 : _b.right) !== false;
            const engineWithSidebarHints = this.engine;
            (_c = engineWithSidebarHints.setSidebarSides) === null || _c === void 0 ? void 0 : _c.call(engineWithSidebarHints, win, { left: leftVisible, right: rightVisible });
            if (leftVisible) {
                yield this.engine.ensureSideColumn(win, "left", (_d = this.getItemsForSide("left")[0]) === null || _d === void 0 ? void 0 : _d.viewType);
            }
            // ensureSideColumn focuses the newly-created sidebar leaf. Before creating
            // the opposite sidebar, explicitly reactivate the center pane so the right
            // split is made around content rather than around the left sidebar.
            if (leftVisible && rightVisible) {
                const centerLeaf = this.engine.getCenterLeafSync(win);
                this.app.workspace.setActiveLeaf(centerLeaf, { focus: false });
            }
            if (rightVisible) {
                yield this.engine.ensureSideColumn(win, "right", (_e = this.getItemsForSide("right")[0]) === null || _e === void 0 ? void 0 : _e.viewType);
            }
            yield this.waitForLayoutFrame(win);
            this.applyDefaultColumnSizing(win, leftVisible, rightVisible);
            this.renderWindow(win);
        });
    }
    /**
     * Keep a real content column while Activity Bar visibility changes on an
     * existing Space. A newly enabled side is added next to the current center;
     * enabling the second side then produces [left sidebar, content, right
     * sidebar].
     */
    ensureLayoutColumns(win) {
        const existing = this.columnEnsurePromises.get(win);
        if (existing)
            return existing;
        const promise = (() => __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            const layout = this.getLayoutForWindow(win);
            if (!layout)
                return;
            const leftVisible = this.isSideVisibleForWindow(win, "left");
            const rightVisible = this.isSideVisibleForWindow(win, "right");
            const initialColumns = this.engine.getTopLevelColumnElements(win).length;
            let hints = this.sidebarHintsByWindow.get(win) || this.getEngineSidebarHints(win);
            if (!hints) {
                // Infer the physical endpoints once for legacy Spaces. Three columns
                // already imply both sidebars; two columns use the requested side (or
                // native Obsidian split classes when available). Keep this physical
                // mapping even if an Activity Bar is later hidden, so re-enabling the
                // other side does not create duplicate columns.
                const columns = this.engine.getTopLevelColumnElements(win);
                const hasLeftClass = ((_a = columns[0]) === null || _a === void 0 ? void 0 : _a.classList.contains("mod-left-split")) === true;
                const hasRightClass = ((_b = columns[columns.length - 1]) === null || _b === void 0 ? void 0 : _b.classList.contains("mod-right-split")) === true;
                hints = initialColumns >= 3
                    ? { left: true, right: true }
                    : initialColumns <= 1
                        ? { left: false, right: false }
                        : hasLeftClass || hasRightClass
                            ? { left: hasLeftClass, right: hasRightClass }
                            : { left: leftVisible && !rightVisible, right: rightVisible && !leftVisible };
            }
            this.setEngineSidebarHints(win, hints);
            const ensureSide = (side) => __awaiter(this, void 0, void 0, function* () {
                var _d;
                if (!((side === "left" ? leftVisible : rightVisible) && !(hints === null || hints === void 0 ? void 0 : hints[side])))
                    return;
                yield this.engine.ensureSideColumn(win, side, (_d = this.getItemsForWindowSide(win, side)[0]) === null || _d === void 0 ? void 0 : _d.viewType);
                hints = Object.assign(Object.assign({}, (hints || { left: false, right: false })), { [side]: true });
                this.setEngineSidebarHints(win, hints);
            });
            yield ensureSide("left");
            yield ensureSide("right");
            // `hints` describes physical sidebar columns, not current Activity Bar
            // visibility. Preserve it while a bar is hidden so a later toggle can
            // reuse the existing column instead of splitting it again.
            const finalHints = hints || { left: false, right: false };
            this.sidebarHintsByWindow.set(win, finalHints);
            this.setEngineSidebarHints(win, finalHints);
            const finalColumns = this.engine.getTopLevelColumnElements(win).length;
            if (finalColumns !== initialColumns) {
                yield this.waitForLayoutFrame(win);
                if (!this.hasSavedLayoutDimensions((_c = layout.workspace) === null || _c === void 0 ? void 0 : _c.layout)) {
                    this.applyDefaultColumnSizing(win, leftVisible, rightVisible);
                }
            }
        }))().finally(() => {
            this.columnEnsurePromises.delete(win);
        });
        this.columnEnsurePromises.set(win, promise);
        return promise;
    }
    getEngineSidebarHints(win) {
        var _a;
        const engineWithSidebarHints = this.engine;
        return (_a = engineWithSidebarHints.getSidebarSides) === null || _a === void 0 ? void 0 : _a.call(engineWithSidebarHints, win);
    }
    setEngineSidebarHints(win, hints) {
        var _a;
        this.sidebarHintsByWindow.set(win, Object.assign({}, hints));
        const engineWithSidebarHints = this.engine;
        (_a = engineWithSidebarHints.setSidebarSides) === null || _a === void 0 ? void 0 : _a.call(engineWithSidebarHints, win, hints);
    }
    waitForLayoutFrame(win) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const raf = (_a = win.requestAnimationFrame) === null || _a === void 0 ? void 0 : _a.bind(win);
            if (raf) {
                yield new Promise((resolve) => raf(() => resolve()));
                yield new Promise((resolve) => raf(() => resolve()));
                return;
            }
            yield new Promise((resolve) => win.setTimeout(resolve, 0));
        });
    }
    applyDefaultColumnSizing(win, leftVisible, rightVisible) {
        const columns = this.engine.getTopLevelColumnElements(win);
        // flex-grow 權重語意（與 Obsidian 原生 setDimension 一致）：容器縮放或
        // 側欄收合（display:none）時剩餘欄位自動重新分配，不需 rebalance。
        const weights = leftVisible && rightVisible
            ? [20, 60, 20]
            : leftVisible
                ? [24, 76]
                : rightVisible
                    ? [76, 24]
                    : [100];
        columns.forEach((column, index) => {
            const weight = weights[index];
            if (weight === undefined)
                return;
            const customEl = column;
            const flexGrow = String(weight);
            if (typeof customEl.setCssProps === "function") {
                // setCssProps 以 setProperty(key, value) 套用，key 需為 kebab-case
                customEl.setCssProps({ "flex-grow": flexGrow });
            }
            else {
                column.style.setProperty("flex-grow", flexGrow);
            }
        });
    }
    hasSavedLayoutDimensions(node) {
        if (!node || !Array.isArray(node.children))
            return false;
        return node.children.some((child) => (typeof (child === null || child === void 0 ? void 0 : child.dimension) === "number" && Number.isFinite(child.dimension)) ||
            this.hasSavedLayoutDimensions(child));
    }
    /**
     * Reapply Obsidian's serialized split dimensions after a leaf-level restore.
     * The leaf APIs recreate the tree but initially distribute every split
     * equally; saved `dimension` values are the source of truth for final sizes.
     *
     * 以 flex-grow 權重語意（0~100，與 Obsidian 原生 setDimension 一致）遞迴
     * 套用：容器縮放或側欄收合時剩餘欄位自動重新分配，不會像 flex-basis 百分比
     * 那樣需要手動 rebalance。
     */
    applySavedLayoutDimensions(win) {
        var _a, _b;
        const layout = this.getLayoutForWindow(win);
        let rootNode = (_a = layout === null || layout === void 0 ? void 0 : layout.workspace) === null || _a === void 0 ? void 0 : _a.layout;
        if (!rootNode)
            return;
        // Some workspace snapshots wrap the actual window tree in a `floating`
        // node. The popout root element corresponds to that node's window child.
        if (rootNode.type === "floating" && ((_b = rootNode.children) === null || _b === void 0 ? void 0 : _b.length) === 1) {
            rootNode = rootNode.children[0];
        }
        const rootEl = win.document.querySelector(".workspace-split.mod-root");
        if (!rootEl)
            return;
        const getSplitChildren = (splitEl) => Array.from(splitEl.children).filter((child) => child instanceof HTMLElement &&
            (child.classList.contains("workspace-tabs") || child.classList.contains("workspace-split")));
        const setFlex = (el, dimension) => {
            const customEl = el;
            // flex-grow 權重（與 Obsidian setDimension 一致），而非 flex-basis 百分比
            const flexGrow = String(dimension);
            if (typeof customEl.setCssProps === "function") {
                // setCssProps 以 setProperty(key, value) 套用，key 需為 kebab-case
                customEl.setCssProps({ "flex-grow": flexGrow });
            }
            else {
                el.style.setProperty("flex-grow", flexGrow);
            }
        };
        const applyNode = (node, splitEl) => {
            if (!node || !Array.isArray(node.children))
                return;
            const domChildren = getSplitChildren(splitEl);
            node.children.forEach((child, index) => {
                const domChild = domChildren[index];
                if (!domChild)
                    return;
                const dimension = Number(child === null || child === void 0 ? void 0 : child.dimension);
                if (Number.isFinite(dimension) && dimension > 0) {
                    setFlex(domChild, dimension);
                }
                if ((child === null || child === void 0 ? void 0 : child.type) === "split") {
                    applyNode(child, domChild);
                }
            });
        };
        applyNode(rootNode, rootEl);
    }
    getItemsForWindowSide(win, side) {
        var _a;
        const layout = this.getLayoutForWindow(win);
        const savedSettings = (_a = layout === null || layout === void 0 ? void 0 : layout.activityBars) === null || _a === void 0 ? void 0 : _a[side];
        if (savedSettings === null || savedSettings === void 0 ? void 0 : savedSettings.items)
            return savedSettings.items;
        const items = this.getItemsForSide(side);
        const selectedViewTypes = savedSettings === null || savedSettings === void 0 ? void 0 : savedSettings.viewTypes;
        if (!selectedViewTypes)
            return items;
        const selected = new Set(selectedViewTypes);
        return items.filter((item) => selected.has(item.viewType));
    }
    isSideVisibleForWindow(win, side) {
        var _a, _b, _c;
        const layout = this.getLayoutForWindow(win);
        if ((_a = layout === null || layout === void 0 ? void 0 : layout.activityBars) === null || _a === void 0 ? void 0 : _a[side]) {
            return ((_b = layout.activityBars[side]) === null || _b === void 0 ? void 0 : _b.show) === true;
        }
        // A legacy saved Space without per-side settings is intentionally hidden.
        if (layout)
            return false;
        return ((_c = this.settings.activityBarDefaults) === null || _c === void 0 ? void 0 : _c[side]) !== false;
    }
    /**
     * 套用 sidebar toggle icon（對齊 Obsidian 主視窗原生按鈕 SVG 結構與 CSS）：
     * 包含外框 <rect> 與內部側欄指示條 <rect class="sidebar-toggle-icon-inner">，
     * 透過 mod-left / mod-right 與 is-open / is-collapsed 類別控制側欄開合狀態與方向。
     */
    applySidebarToggleIcon(btn, side, hidden) {
        btn.classList.add("window-spaces-sidebar-toggle-btn");
        btn.classList.toggle("mod-left", side === "left");
        btn.classList.toggle("mod-right", side === "right");
        btn.classList.toggle("is-collapsed", hidden);
        btn.classList.toggle("is-open", !hidden);
        let svg = btn.querySelector("svg.sidebar-toggle-button-icon");
        if (!svg) {
            btn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon sidebar-toggle-button-icon">
          <rect x="1" y="2" width="22" height="20" rx="4"></rect>
          <rect x="4" y="5" width="2" height="14" rx="2" fill="currentColor" class="sidebar-toggle-icon-inner"></rect>
        </svg>
      `.trim();
            svg = btn.querySelector("svg.sidebar-toggle-button-icon");
        }
        const innerRect = svg === null || svg === void 0 ? void 0 : svg.querySelector(".sidebar-toggle-icon-inner");
        if (innerRect) {
            if (hidden) {
                innerRect.setAttribute("width", "2");
                innerRect.style.setProperty("width", "var(--sidebar-left-toggle-inner-width, 8.33%)");
            }
            else {
                innerRect.setAttribute("width", "5.76");
                innerRect.style.setProperty("width", "var(--sidebar-left-toggle-inner-width-open, 24%)");
            }
        }
    }
    /** 針對單一 Popout 注入（若已注入且仍連接著 DOM 則重新渲染按鈕）。 */
    injectForWindow(win) {
        var _a;
        if (!win || win.closed || !isPopoutWindow(win))
            return;
        if (!this.isEnabled()) {
            this.cleanupWindow(win);
            return;
        }
        // 跳過 Obsidian 自己的 UI 視窗（如設定 popout：含 modal container），
        // 避免注入 Activity Bar / 攔截器影響其運作。
        const body = (_a = win.document) === null || _a === void 0 ? void 0 : _a.body;
        if (!body) {
            this.cleanupWindow(win);
            return;
        }
        if (body.querySelector(".modal-container")) {
            this.cleanupWindow(win);
            return;
        }
        const existing = this.barsByWindow.get(win);
        if (existing && existing.left.isConnected) {
            this.renderWindow(win);
            return;
        }
        const spaceIdentity = body.createDiv({ cls: "window-spaces-space-identity" });
        const left = body.createDiv({ cls: "window-spaces-activity-bar window-spaces-activity-left" });
        // 只有左側 bar 有拖曳 handle（右上方是原生視窗控制鈕，不能遮蓋）
        left.createDiv({ cls: "window-spaces-activity-drag" });
        const right = body.createDiv({ cls: "window-spaces-activity-bar window-spaces-activity-right" });
        this.barsByWindow.set(win, {
            left,
            right,
            spaceIdentity,
            viewButtons: new Map(),
            columnButtons: {
                left: left.createEl("button", { cls: "window-spaces-activity-btn clickable-icon", attr: { type: "button", "aria-label": t("activityBar.toggleColumn") } }),
                right: right.createEl("button", { cls: "window-spaces-activity-btn clickable-icon", attr: { type: "button", "aria-label": t("activityBar.toggleColumn") } }),
            },
        });
        body.classList.add("window-spaces-has-left-activity");
        body.classList.add("window-spaces-has-right-activity");
        this.injectedWindows.add(win);
        this.renderWindow(win);
    }
    /** 移除單一 Popout 的 activity bar 與 body class。 */
    cleanupWindow(win) {
        var _a;
        const bars = this.barsByWindow.get(win);
        if (bars) {
            bars.left.remove();
            bars.right.remove();
            bars.spaceIdentity.remove();
        }
        this.barsByWindow.delete(win);
        this.injectedWindows.delete(win);
        const body = (_a = win.document) === null || _a === void 0 ? void 0 : _a.body;
        body === null || body === void 0 ? void 0 : body.classList.remove("window-spaces-has-left-activity");
        body === null || body === void 0 ? void 0 : body.classList.remove("window-spaces-has-right-activity");
        body === null || body === void 0 ? void 0 : body.classList.remove("window-spaces-has-left-activity-hidden");
        body === null || body === void 0 ? void 0 : body.classList.remove("window-spaces-has-right-activity-hidden");
        body === null || body === void 0 ? void 0 : body.classList.remove("window-spaces-left-activity-hidden");
        body === null || body === void 0 ? void 0 : body.classList.remove("window-spaces-right-activity-hidden");
        this.clearTabHeaderAvoidance(win);
        body === null || body === void 0 ? void 0 : body.style.removeProperty("--window-space-color");
        body === null || body === void 0 ? void 0 : body.style.removeProperty("--window-space-border-inset");
        body === null || body === void 0 ? void 0 : body.classList.remove("has-window-space-color");
        body === null || body === void 0 ? void 0 : body.classList.remove("has-window-space-border");
        body === null || body === void 0 ? void 0 : body.classList.remove("has-window-space-folded-corner");
    }
    /** 清理所有已注入的 Popout。 */
    cleanupAll() {
        Array.from(this.injectedWindows).forEach((win) => this.cleanupWindow(win));
    }
    /** 重新注入並渲染所有存活 Popout，並清理已關閉視窗的殘留（layout-change 時呼叫）。 */
    refreshAll() {
        const live = this.engine.getLivePopoutWindows();
        live.forEach((win) => this.injectForWindow(win));
        Array.from(this.injectedWindows).forEach((win) => {
            if (!live.includes(win))
                this.cleanupWindow(win);
        });
    }
    getLayoutForWindow(win) {
        var _a, _b, _c;
        if (!win || win.closed)
            return null;
        // 1. 優先依 explicit _windowSpacesLayoutId 尋找
        const explicitId = win._windowSpacesLayoutId;
        if (explicitId) {
            const found = this.settings.spaces.find((s) => s.id === explicitId);
            if (found)
                return found;
        }
        // 2. 依 manager 的 layoutNames (視窗名) 尋找對應 space
        const manager = this.plugin.manager;
        const name = (_a = manager === null || manager === void 0 ? void 0 : manager.getLayoutNameForWindow) === null || _a === void 0 ? void 0 : _a.call(manager, win);
        if (name) {
            const found = this.settings.spaces.find((s) => s.name === name);
            if (found)
                return found;
        }
        // 3. 依 manager 的 layoutWindows 記憶體 map 反向比對
        for (const space of (_b = this.settings.spaces) !== null && _b !== void 0 ? _b : []) {
            if (((_c = manager === null || manager === void 0 ? void 0 : manager.layoutWindows) === null || _c === void 0 ? void 0 : _c.get(space)) === win) {
                return space;
            }
        }
        return null;
    }
    updateDragHandleIcon(bars, win) {
        var _a, _b, _c;
        const drag = bars.left.querySelector(".window-spaces-activity-drag");
        if (!drag)
            return;
        drag.empty();
        bars.spaceIdentity.empty();
        const layout = this.getLayoutForWindow(win);
        const icon = resolveSpaceIcon(layout === null || layout === void 0 ? void 0 : layout.icon, this.settings.defaultIcon);
        const color = (_a = layout === null || layout === void 0 ? void 0 : layout.color) === null || _a === void 0 ? void 0 : _a.trim();
        const hasCustomColor = Boolean(color);
        const hasCustomBorderInset = typeof (layout === null || layout === void 0 ? void 0 : layout.borderInset) === "number" && Number.isFinite(layout.borderInset);
        const borderInset = hasCustomBorderInset
            ? Math.max(0, Math.min(5, layout === null || layout === void 0 ? void 0 : layout.borderInset))
            : 0;
        const showFoldedCorner = hasCustomColor && ((_b = layout === null || layout === void 0 ? void 0 : layout.showFoldedCorner) !== null && _b !== void 0 ? _b : this.settings.defaultShowFoldedCorner !== false);
        const body = (_c = win.document) === null || _c === void 0 ? void 0 : _c.body;
        if (body) {
            if (hasCustomColor) {
                body.style.setProperty("--window-space-color", color);
                body.classList.add("has-window-space-color");
            }
            else {
                body.style.removeProperty("--window-space-color");
                body.classList.remove("has-window-space-color");
            }
            if (hasCustomColor && hasCustomBorderInset) {
                body.style.setProperty("--window-space-border-inset", `${borderInset}px`);
            }
            else {
                body.style.removeProperty("--window-space-border-inset");
            }
            body.classList.toggle("has-window-space-border", hasCustomColor && hasCustomBorderInset && borderInset > 0);
            body.classList.toggle("has-window-space-folded-corner", showFoldedCorner);
        }
        const isEmoji = isSpaceEmoji(icon);
        if (isEmoji) {
            bars.spaceIdentity.createSpan({ cls: "window-spaces-space-icon window-spaces-drag-emoji", text: icon });
        }
        else {
            const iconEl = bars.spaceIdentity.createDiv({ cls: "window-spaces-space-icon window-spaces-drag-icon" });
            if (!setIconWithCheck(iconEl, icon)) {
                obsidian.setIcon(iconEl, "square");
            }
        }
        bars.spaceIdentity.setAttribute("aria-label", (layout === null || layout === void 0 ? void 0 : layout.name) || "Window Space");
    }
    /** 重建指定視窗的按鈕內容。 */
    renderWindow(win) {
        void this.ensureLayoutColumns(win).then(() => this.renderWindowNow(win));
        this.renderWindowNow(win);
    }
    renderWindowNow(win) {
        var _a;
        const bars = this.barsByWindow.get(win);
        if (!bars)
            return;
        this.updateDragHandleIcon(bars, win);
        const body = (_a = win.document) === null || _a === void 0 ? void 0 : _a.body;
        if (body) {
            const leftVisible = this.isSideVisibleForWindow(win, "left");
            const rightVisible = this.isSideVisibleForWindow(win, "right");
            bars.spaceIdentity.classList.toggle("window-spaces-space-identity-drag-region", !leftVisible);
            body.classList.toggle("window-spaces-has-left-activity", leftVisible);
            body.classList.toggle("window-spaces-has-right-activity", rightVisible);
            body.classList.toggle("window-spaces-left-activity-hidden", !leftVisible);
            body.classList.toggle("window-spaces-right-activity-hidden", !rightVisible);
            this.updateTabHeaderAvoidance(win, leftVisible);
        }
        this.renderBar(bars, win, "left");
        this.renderBar(bars, win, "right");
        this.applySavedLayoutDimensions(win);
        this.updateActiveStates(win);
    }
    /**
     * When the left Activity Bar is hidden, reserve its exact width only in
     * the first tab header of the first visible root column. A root column may
     * contain multiple stacked split headers, so the class belongs on the
     * header itself rather than on the whole column.
     */
    updateTabHeaderAvoidance(win, leftActivityVisible) {
        this.clearTabHeaderAvoidance(win);
        if (leftActivityVisible)
            return;
        const firstVisibleColumn = this.engine
            .getTopLevelColumnElements(win)
            .find((column) => !isElementHidden(column));
        const firstTabHeader = firstVisibleColumn === null || firstVisibleColumn === void 0 ? void 0 : firstVisibleColumn.querySelector(".workspace-tab-header-container");
        firstTabHeader === null || firstTabHeader === void 0 ? void 0 : firstTabHeader.classList.add("window-spaces-space-identity-tab-header");
    }
    clearTabHeaderAvoidance(win) {
        win.document
            .querySelectorAll(".window-spaces-space-identity-tab-header")
            .forEach((header) => header.classList.remove("window-spaces-space-identity-tab-header"));
    }
    renderBar(bars, win, side) {
        const bar = side === "left" ? bars.left : bars.right;
        const isVisible = this.isSideVisibleForWindow(win, side);
        bar.classList.toggle("window-spaces-activity-hidden", !isVisible);
        // 移除舊的 view 按鈕與分隔線（保留 bar 容器與固定按鈕）。
        // viewButtons 同時保存左右兩側的按鈕，因此只清理目前這一側。
        bar.querySelectorAll(".window-spaces-activity-view, .window-spaces-activity-divider").forEach((el) => {
            bars.viewButtons.forEach((button, key) => {
                if (button === el)
                    bars.viewButtons.delete(key);
            });
            el.remove();
        });
        // 固定控制按鈕：插入於 drag handle 之後、視圖按鈕之前
        const colBtn = side === "left" ? bars.columnButtons.left : bars.columnButtons.right;
        const isHidden = this.engine.isColumnHidden(win, side);
        this.applySidebarToggleIcon(colBtn, side, isHidden);
        colBtn.onclick = (evt) => {
            evt.preventDefault();
            evt.stopPropagation();
            void this.toggleColumn(win, side);
        };
        const drag = bar.querySelector(".window-spaces-activity-drag");
        if (drag) {
            drag.after(colBtn);
        }
        else {
            bar.prepend(colBtn);
        }
        // 固定控制與 view 按鈕之間的分隔線
        bar.createDiv({ cls: "window-spaces-activity-divider" });
        const items = this.getItemsForWindowSide(win, side);
        const configuredTypes = new Set();
        for (const item of items) {
            const label = item.label || resolveViewLabel(this.app, item.viewType);
            const btn = bar.createEl("button", {
                cls: "window-spaces-activity-btn window-spaces-activity-view clickable-icon",
                attr: { type: "button", "aria-label": label },
            });
            // 自訂 icon 優先，否則走 A+B 機制
            applyItemIcon(btn, this.app, item);
            btn.onclick = (evt) => {
                evt.preventDefault();
                evt.stopPropagation();
                void this.toggleView(win, item);
            };
            bars.viewButtons.set(`${side}:${item.viewType}`, btn);
            configuredTypes.add(item.viewType);
        }
    }
    /** 更新所有按鈕的 active 狀態。 */
    updateActiveStates(win) {
        const bars = this.barsByWindow.get(win);
        if (!bars)
            return;
        this.syncSidebarColumnClasses(win);
        // 拖曳 tab 後 Obsidian 會非同步重建頂層欄位結構（例如把 workspace-tabs 拆成
        // 巢狀 workspace-split），且可能在 layout-change 事件之後才完成。因此延遲到
        // 下一幀再重新同步一次，確保新產生的容器 / tab group 也套用到 sidebar class。
        this.scheduleDeferredSync(win);
        bars.viewButtons.forEach((btn, key) => {
            // 以按鈕所屬的 bar 判定側（同側的 view 按鈕只反映自己側欄的狀態）
            const side = bars.left.contains(btn) ? "left" : "right";
            const viewType = key.slice(key.indexOf(":") + 1);
            const columnEl = this.engine.getColumnElement(win, side);
            let active = false;
            if (columnEl) {
                const leaf = this.engine.findLeafOfTypeInColumn(win, columnEl, viewType);
                if (leaf) {
                    active = this.isLeafVisibleInSideColumn(win, side, leaf);
                }
            }
            btn.classList.toggle("is-active", active);
        });
        this.setColumnActive(bars, win, "left");
        this.setColumnActive(bars, win, "right");
    }
    /** 判斷 Leaf 在所屬 Popout 側欄中是否處於 active (可見/選中) 狀態。 */
    isLeafVisibleInSideColumn(win, side, leaf) {
        var _a;
        if (this.engine.isColumnHidden(win, side))
            return false;
        const extLeaf = leaf;
        const container = extLeaf.containerEl;
        if (!container)
            return false;
        if ((_a = extLeaf.tabEl) === null || _a === void 0 ? void 0 : _a.classList.contains("is-active"))
            return true;
        const parent = container.parentElement;
        if (!parent)
            return false;
        const isHidden = container.classList.contains("mod-hidden") ||
            container.style.display === "none" ||
            parent.style.display === "none" ||
            parent.classList.contains("mod-hidden");
        return !isHidden;
    }
    /**
     * 將視窗最左/最右的頂層欄位標記為 sidebar column，並套用 Obsidian 的
     * sidebar 相關 class（mod-sidedock / mod-left-split / mod-right-split），
     * 使其 tab 使用與主視窗 sidebar 一致的樣式，且讓側欄的 resize handle 可拖曳。
     *
     * 注意：`.workspace-split` 容器也會套用這些 class——Obsidian 的
     * `.workspace-split.mod-left-split, .workspace-split.mod-right-split { flex: 0 0 auto }`
     * 確實會把巢狀 split 容器壓扁成 width 0，因此 styles.css 以相同 specificity、
     * 較晚載入的非 important `flex: 1 1 0` 覆蓋它，同時保留 Obsidian 的 inline
     * `flex-grow`（popout 的 resize 機制），sidebar 才不會消失、也才能拖寬。
     */
    syncSidebarColumnClasses(win) {
        var _a;
        const columns = this.engine.getTopLevelColumnElements(win);
        const last = columns.length - 1;
        const engineWithSidebarHints = this.engine;
        const configuredSides = (_a = engineWithSidebarHints.getSidebarSides) === null || _a === void 0 ? void 0 : _a.call(engineWithSidebarHints, win);
        const leftActivityVisible = this.isSideVisibleForWindow(win, "left");
        const rightActivityVisible = this.isSideVisibleForWindow(win, "right");
        columns.forEach((el, index) => {
            // Only a column adjacent to a visible Activity Bar is a visual sidebar.
            // If the bar is hidden, its neighboring column is content and must keep
            // the normal editor background/tab presentation.
            const isLeftSidebar = columns.length >= 2
                && leftActivityVisible
                && (configuredSides ? configuredSides.left : true)
                && index === 0;
            const isRightSidebar = columns.length >= 2
                && rightActivityVisible
                && (configuredSides ? configuredSides.right : true)
                && index === last;
            const isSidebar = isLeftSidebar || isRightSidebar;
            el.classList.toggle("window-spaces-sidebar-column", isSidebar);
            el.classList.toggle("mod-sidedock", isSidebar);
            el.classList.toggle("mod-left-split", isLeftSidebar);
            el.classList.toggle("mod-right-split", isRightSidebar);
            const tabGroups = this.getSidebarTabGroups(el);
            tabGroups.forEach((tabsEl) => {
                tabsEl.classList.toggle("mod-sidedock", isSidebar);
                tabsEl.classList.toggle("mod-left-split", isLeftSidebar);
                tabsEl.classList.toggle("mod-right-split", isRightSidebar);
            });
            if (isSidebar) {
                this.ensureSidebarFileTabIcons(win, el);
            }
        });
    }
    /** 取得欄位內需要套用 sidebar 樣式的 tab group 元素（不含 split 容器本身）。 */
    getSidebarTabGroups(columnEl) {
        if (columnEl.classList.contains("workspace-tabs")) {
            return [columnEl];
        }
        return Array.from(columnEl.querySelectorAll(".workspace-tabs"));
    }
    /**
     * 於下一幀重新同步 sidebar class。Obsidian 拖曳 tab 時會非同步重建頂層欄位
     * 結構（例如把單一 workspace-tabs 拆成巢狀 workspace-split），重建可能在
     * layout-change 事件之後才完成；此延遲確保新節點也能套用到 sidebar 樣式，
     * 避免 sidebar 視覺樣式在拖曳後失效。
     */
    scheduleDeferredSync(win) {
        const raf = (win && typeof win.requestAnimationFrame === "function" ? win.requestAnimationFrame : window.requestAnimationFrame).bind(win && typeof win.requestAnimationFrame === "function" ? win : window);
        raf(() => {
            if (win.closed)
                return;
            raf(() => {
                if (win.closed)
                    return;
                if (this.barsByWindow.has(win)) {
                    this.syncSidebarColumnClasses(win);
                }
            });
        });
    }
    /** DOM fallback：側欄中頁籤若無 icon（部分情境 Obsidian 不渲染），補上 icon。 */
    ensureSidebarFileTabIcons(win, columnEl) {
        columnEl.querySelectorAll(".workspace-tab-header").forEach((tabEl) => {
            var _a, _b;
            let iconEl = tabEl.querySelector(".workspace-tab-header-inner-icon");
            if (!iconEl) {
                iconEl = tabEl.createDiv({ cls: "workspace-tab-header-inner-icon" });
                tabEl.prepend(iconEl);
            }
            if (iconEl.querySelector("svg"))
                return;
            const viewType = tabEl.getAttribute("data-type") || "markdown";
            // 該 tab 對應的 leaf 一定開在目前欄位內：直接取 view 實體的 icon，避免全域掃描
            const leaf = this.engine.findLeafOfTypeInColumn(win, columnEl, viewType);
            const leafIcon = leaf ? (_b = (_a = leaf.view).getIcon) === null || _b === void 0 ? void 0 : _b.call(_a) : "";
            if (leafIcon && setIconWithCheck(iconEl, leafIcon))
                return;
            applyViewIcon(iconEl, this.app, viewType);
        });
    }
    setColumnActive(bars, win, side) {
        const columnEl = this.engine.getColumnElement(win, side);
        const hidden = !!columnEl && this.engine.isColumnHidden(win, side);
        const active = !!columnEl && !hidden;
        bars.columnButtons[side].classList.toggle("is-active", active);
        // 依開合狀態切換 toggle 圖示（模仿主視窗）
        this.applySidebarToggleIcon(bars.columnButtons[side], side, hidden);
    }
    /** 該視窗是否已注入 Activity Bar（供攔截器判斷是否為本外掛管理的視窗）。 */
    isInjected(win) {
        return this.barsByWindow.has(win);
    }
    /** 更新所有已注入視窗的 active 狀態（layout-change 時呼叫）。 */
    updateActiveStatesAll() {
        Array.from(this.injectedWindows).forEach((win) => this.updateActiveStates(win));
    }
    // ===== 互動邏輯 =====
    toggleView(win, item) {
        return __awaiter(this, void 0, void 0, function* () {
            const side = item.side;
            // 只在自己的側欄欄位內找該 view（不跨中央編輯區 / 不跨對側 sidebar）
            const columnEl = this.engine.getColumnElement(win, side);
            const leaf = columnEl ? this.engine.findLeafOfTypeInColumn(win, columnEl, item.viewType) : null;
            if (leaf) {
                if (this.engine.isColumnHidden(win, side)) {
                    // 側欄隱藏中 → 顯示並切到該 view
                    this.engine.showColumn(win, side);
                    yield this.revealAndActivate(leaf);
                }
                else {
                    // 側欄顯示中：僅當該 view 目前就是側欄中「可見/顯示中」的 view 時才關閉（toggle off）。
                    // 判斷以容器可見性為準（背景 tab 內容為 display:none），而非 tab 的 is-active
                    // （is-active 對應視窗 active leaf，點擊側欄外的 view 時會被移除）。
                    if (this.isLeafVisibleInSideColumn(win, side, leaf)) {
                        this.engine.hideColumn(win, side);
                    }
                    else {
                        yield this.revealAndActivate(leaf);
                    }
                }
            }
            else {
                // 自己側欄內沒有該 view（即使它存在於中央編輯區或對側 sidebar）→ 開在自己側欄
                yield this.engine.ensureSideColumn(win, side, item.viewType);
            }
            this.updateActiveStates(win);
        });
    }
    revealAndActivate(leaf) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.app.workspace.revealLeaf(leaf);
                this.app.workspace.setActiveLeaf(leaf, { focus: true });
            }
            catch (_a) {
                // Ignore focus error
            }
        });
    }
    toggleColumn(win, side) {
        return __awaiter(this, void 0, void 0, function* () {
            const columnEl = this.engine.getColumnElement(win, side);
            if (!columnEl)
                return;
            if (this.engine.isColumnHidden(win, side)) {
                this.engine.showColumn(win, side);
                yield this.ensureColumnViewsRendered(win, columnEl);
            }
            else {
                // 防呆：若隱藏後沒有任何可見欄位，則拒絕
                if (this.engine.getVisibleColumnCount(win) < 2) {
                    new obsidian.Notice(t("activityBar.cannotHideLastPane"));
                    return;
                }
                this.engine.hideColumn(win, side);
            }
            // 側欄收合：flex-grow 權重語意下，display:none 的欄位不參與 flex 佈局，
            // 剩餘欄位依權重自動重新分配填滿，不需手動 rebalance。
            // The column toggle changes pane visibility, not Activity Bar settings.
            // Recompute only the tab-header marker here so lightweight test/mocked
            // windows do not need the full Activity Bar DOM renderer.
            this.updateTabHeaderAvoidance(win, this.isSideVisibleForWindow(win, "left"));
            // Refresh the toggle button's open/collapsed SVG state and each view
            // button's active state after the column visibility changed.
            this.updateActiveStates(win);
        });
    }
    /**
     * Views restored into a hidden sidebar can remain DeferredViews with an
     * empty container. Once the sidebar becomes visible, load and render every
     * leaf in that column so split panels such as Tags and Search are populated.
     */
    ensureColumnViewsRendered(win, columnEl) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            const leaves = this.engine.getLeavesForWindow(win).filter((leaf) => {
                var _a;
                const extLeaf = leaf;
                const container = extLeaf.containerEl || ((_a = leaf.view) === null || _a === void 0 ? void 0 : _a.containerEl);
                return container instanceof HTMLElement && columnEl.contains(container);
            });
            const manager = this.plugin.manager;
            for (const leaf of leaves) {
                const extLeaf = leaf;
                if (extLeaf.isDeferred && typeof extLeaf.loadIfDeferred === "function") {
                    try {
                        yield extLeaf.loadIfDeferred();
                    }
                    catch (_c) {
                        // A later render attempt may still recover the view.
                    }
                }
                (_a = manager === null || manager === void 0 ? void 0 : manager.ensureViewRendered) === null || _a === void 0 ? void 0 : _a.call(manager, leaf);
                (_b = manager === null || manager === void 0 ? void 0 : manager.scheduleViewRenderAfterActivation) === null || _b === void 0 ? void 0 : _b.call(manager, leaf, win);
            }
        });
    }
}

function getState(app) {
    const namespace = globalThis;
    const existing = namespace.__obsidian_workspace_interceptor_state_v1__;
    if (existing) {
        if (existing.participants.size === 0 && !existing.installed) {
            existing.workspace = app.workspace;
        }
        return existing;
    }
    const state = {
        workspace: app.workspace,
        participants: new Map(),
        installed: false,
        originalMethods: undefined,
    };
    namespace.__obsidian_workspace_interceptor_state_v1__ = state;
    return state;
}
function hasWindowFocus(win) {
    const document = win === null || win === void 0 ? void 0 : win.document;
    if (!document)
        return false;
    if (typeof document.hasFocus !== "function")
        return true;
    return document.hasFocus();
}
function getActivePopoutWindow(state) {
    var _a;
    const mainWindow = typeof window !== "undefined" ? window : null;
    if (hasWindowFocus(mainWindow))
        return null;
    const focusedWindow = typeof activeWindow !== "undefined" ? activeWindow : null;
    if (focusedWindow === mainWindow)
        return null;
    if (focusedWindow &&
        focusedWindow !== mainWindow &&
        isPopoutWindow(focusedWindow) &&
        hasWindowFocus(focusedWindow)) {
        return focusedWindow;
    }
    let focusedPopout = null;
    const workspace = state.workspace;
    // 解構後必須以 call(workspace) 綁定 this，否則原生 iterateAllLeaves 內部
    // 的 this.iterateLeaves 會因 this 為 undefined 而拋錯，中斷 restore 流程。
    (_a = workspace.iterateAllLeaves) === null || _a === void 0 ? void 0 : _a.call(workspace, (leaf) => {
        const win = getWindowOfLeaf(leaf);
        if (!focusedPopout && win && isPopoutWindow(win) && hasWindowFocus(win)) {
            focusedPopout = win;
        }
    });
    return focusedPopout;
}
function isParticipantEnabled(participant) {
    try {
        return participant.isEnabled ? participant.isEnabled() : true;
    }
    catch (_a) {
        return false;
    }
}
function getParticipantForWindow(state, win) {
    for (const participant of state.participants.values()) {
        if (!isParticipantEnabled(participant))
            continue;
        try {
            if (!participant.isManagedWindow || participant.isManagedWindow(win))
                return participant;
        }
        catch (_a) {
            // A failing plugin policy must not affect other participants.
        }
    }
    return null;
}
function routeSideLeaf(state, side) {
    var _a;
    const activeWindow = getActivePopoutWindow(state);
    const participant = activeWindow ? getParticipantForWindow(state, activeWindow) : null;
    const engine = (_a = participant === null || participant === void 0 ? void 0 : participant.engine) !== null && _a !== void 0 ? _a : null;
    if (!activeWindow || !engine)
        return null;
    try {
        return engine.openSideLeafSync(activeWindow, side);
    }
    catch (_b) {
        return null;
    }
}
function routeGetLeaf(state, newLeaf) {
    var _a;
    const activeWindow = getActivePopoutWindow(state);
    const participant = activeWindow ? getParticipantForWindow(state, activeWindow) : null;
    const engine = (_a = participant === null || participant === void 0 ? void 0 : participant.engine) !== null && _a !== void 0 ? _a : null;
    if (!activeWindow || !engine)
        return null;
    if (newLeaf === "left" || newLeaf === "right") {
        return engine.openSideLeafSync(activeWindow, newLeaf);
    }
    if (newLeaf === "window") {
        return null;
    }
    const activeLeaf = engine.getActiveLeafInWindow(activeWindow);
    if (activeLeaf && engine.isLeafInSideColumn(activeWindow, activeLeaf)) {
        return engine.getCenterLeafSync(activeWindow, newLeaf);
    }
    if (!activeLeaf || getWindowOfLeaf(activeLeaf) !== activeWindow) {
        return engine.getCenterLeafSync(activeWindow, newLeaf);
    }
    return null;
}
function routeEnsureSideLeaf(state, viewType, side, options) {
    var _a, _b, _c, _d, _e, _f, _g;
    return __awaiter(this, void 0, void 0, function* () {
        const activeWindow = getActivePopoutWindow(state);
        const participant = activeWindow ? getParticipantForWindow(state, activeWindow) : null;
        const engine = (_a = participant === null || participant === void 0 ? void 0 : participant.engine) !== null && _a !== void 0 ? _a : null;
        if (!activeWindow || !engine)
            return null;
        // Popout windows have no native sidebar split tree. The shared engine's
        // side-column semantics are therefore used for both split=true and false;
        // active/reveal/state are still applied exactly from the caller options.
        const column = engine.getColumnElement(activeWindow, side);
        const existing = column
            ? engine.findLeafOfTypeInColumn(activeWindow, column, viewType)
            : null;
        const leaf = existing !== null && existing !== void 0 ? existing : engine.openSideLeafSync(activeWindow, side);
        if (!leaf)
            return null;
        if (!existing) {
            yield leaf.setViewState({
                type: viewType,
                active: options.active,
                state: options.state,
            });
        }
        else if (options.state) {
            yield leaf.setViewState({ type: viewType, state: options.state });
        }
        yield leaf.loadIfDeferred();
        if (options.reveal !== false) {
            yield ((_c = (_b = state.workspace).revealLeaf) === null || _c === void 0 ? void 0 : _c.call(_b, leaf));
        }
        if (options.active) {
            (_e = (_d = state.workspace).setActiveLeaf) === null || _e === void 0 ? void 0 : _e.call(_d, leaf, { focus: true });
        }
        if (!existing) {
            yield ((_g = (_f = state.workspace).requestSaveLayout) === null || _g === void 0 ? void 0 : _g.call(_f));
        }
        return leaf;
    });
}
function hasOwnMethod(workspace, key) {
    return Object.prototype.hasOwnProperty.call(workspace, key);
}
function restoreMethod(workspace, key, original) {
    if (original.hadOwn) {
        workspace[key] = original.value;
    }
    else {
        delete workspace[key];
    }
}
function install(state) {
    if (state.installed)
        return;
    const workspace = state.workspace;
    state.originalMethods = {
        getLeftLeaf: { hadOwn: hasOwnMethod(workspace, "getLeftLeaf"), value: workspace.getLeftLeaf },
        getRightLeaf: { hadOwn: hasOwnMethod(workspace, "getRightLeaf"), value: workspace.getRightLeaf },
        getLeaf: { hadOwn: hasOwnMethod(workspace, "getLeaf"), value: workspace.getLeaf },
        getLeavesOfType: { hadOwn: hasOwnMethod(workspace, "getLeavesOfType"), value: workspace.getLeavesOfType },
        ensureSideLeaf: { hadOwn: hasOwnMethod(workspace, "ensureSideLeaf"), value: workspace.ensureSideLeaf },
    };
    workspace.__workspaceInterceptorOriginalGetLeftLeaf = workspace.getLeftLeaf;
    workspace.__workspaceInterceptorOriginalGetRightLeaf = workspace.getRightLeaf;
    workspace.__workspaceInterceptorOriginalGetLeaf = workspace.getLeaf;
    workspace.__workspaceInterceptorOriginalGetLeavesOfType = workspace.getLeavesOfType;
    workspace.__workspaceInterceptorOriginalEnsureSideLeaf = workspace.ensureSideLeaf;
    workspace.getLeftLeaf = function (split) {
        var _a, _b, _c;
        const original = (_a = state.originalMethods) === null || _a === void 0 ? void 0 : _a.getLeftLeaf.value;
        return (_c = (_b = routeSideLeaf(state, "left")) !== null && _b !== void 0 ? _b : original === null || original === void 0 ? void 0 : original.call(workspace, split)) !== null && _c !== void 0 ? _c : null;
    };
    workspace.getRightLeaf = function (split) {
        var _a, _b, _c;
        const original = (_a = state.originalMethods) === null || _a === void 0 ? void 0 : _a.getRightLeaf.value;
        return (_c = (_b = routeSideLeaf(state, "right")) !== null && _b !== void 0 ? _b : original === null || original === void 0 ? void 0 : original.call(workspace, split)) !== null && _c !== void 0 ? _c : null;
    };
    workspace.getLeaf = function (newLeaf) {
        var _a, _b, _c;
        const original = (_a = state.originalMethods) === null || _a === void 0 ? void 0 : _a.getLeaf.value;
        return (_c = (_b = routeGetLeaf(state, newLeaf)) !== null && _b !== void 0 ? _b : original === null || original === void 0 ? void 0 : original.call(workspace, newLeaf)) !== null && _c !== void 0 ? _c : null;
    };
    workspace.getLeavesOfType = function (type) {
        var _a, _b;
        const original = (_a = state.originalMethods) === null || _a === void 0 ? void 0 : _a.getLeavesOfType.value;
        const leaves = (_b = original === null || original === void 0 ? void 0 : original.call(workspace, type)) !== null && _b !== void 0 ? _b : [];
        const activeWindow = getActivePopoutWindow(state);
        const participant = activeWindow ? getParticipantForWindow(state, activeWindow) : null;
        return participant ? leaves.filter((leaf) => getWindowOfLeaf(leaf) === activeWindow) : leaves;
    };
    workspace.ensureSideLeaf = function (viewType, side, options = {}) {
        var _a;
        const original = (_a = state.originalMethods) === null || _a === void 0 ? void 0 : _a.ensureSideLeaf.value;
        return routeEnsureSideLeaf(state, viewType, side, options).then((leaf) => {
            if (leaf)
                return leaf;
            if (original)
                return original.call(workspace, viewType, side, options);
            return Promise.reject(new Error("Workspace.ensureSideLeaf is unavailable"));
        });
    };
    workspace.__workspaceInterceptorInstalled = true;
    state.installed = true;
}
function uninstall(state) {
    if (!state.installed)
        return;
    const workspace = state.workspace;
    const original = state.originalMethods;
    if (original) {
        restoreMethod(workspace, "getLeftLeaf", original.getLeftLeaf);
        restoreMethod(workspace, "getRightLeaf", original.getRightLeaf);
        restoreMethod(workspace, "getLeaf", original.getLeaf);
        restoreMethod(workspace, "getLeavesOfType", original.getLeavesOfType);
        restoreMethod(workspace, "ensureSideLeaf", original.ensureSideLeaf);
    }
    delete workspace.__workspaceInterceptorOriginalGetLeftLeaf;
    delete workspace.__workspaceInterceptorOriginalGetRightLeaf;
    delete workspace.__workspaceInterceptorOriginalGetLeaf;
    delete workspace.__workspaceInterceptorOriginalGetLeavesOfType;
    delete workspace.__workspaceInterceptorOriginalEnsureSideLeaf;
    delete workspace.__workspaceInterceptorInstalled;
    state.originalMethods = undefined;
    state.installed = false;
}
/** Register one plugin policy with the process-wide coordinator. */
function acquireWorkspaceInterceptor(app, participant) {
    if (!participant.id)
        throw new Error("Workspace interceptor participant id is required");
    const state = getState(app);
    state.participants.set(participant.id, participant);
    install(state);
}
/** Release one plugin policy; restore the original APIs after the last release. */
function releaseWorkspaceInterceptor(id) {
    const namespace = globalThis;
    const state = namespace.__obsidian_workspace_interceptor_state_v1__;
    if (!state)
        return;
    state.participants.delete(id);
    if (state.participants.size === 0)
        uninstall(state);
}

/**
 * Window Spaces compatibility wrapper for the shared Workspace coordinator.
 * The actual monkey patch is installed once per workspace by the shared
 * coordinator, so Folder Spaces and Window Spaces cannot overwrite each other.
 */
class WorkspaceInterceptor {
    constructor(app, engine) {
        this.installed = false;
        this.enabled = true;
        this.isManagedWindow = null;
        this.app = app;
        this.engine =
            engine !== null && engine !== void 0 ? engine : acquirePopoutLayoutEngine({
                id: "window-spaces",
                apiVersion: SHARED_API_VERSION,
                compatibleFrom: SHARED_COMPATIBLE_FROM_VERSION,
                implementationRevision: SHARED_IMPLEMENTATION_REVISION,
                create: () => new PopoutLayoutEngine(app),
            });
    }
    install() {
        if (this.installed)
            return;
        acquireWorkspaceInterceptor(this.app, {
            id: "window-spaces",
            engine: this.engine,
            isEnabled: () => this.enabled,
            isManagedWindow: (win) => { var _a, _b; return (_b = (_a = this.isManagedWindow) === null || _a === void 0 ? void 0 : _a.call(this, win)) !== null && _b !== void 0 ? _b : true; },
        });
        this.installed = true;
    }
    uninstall() {
        if (!this.installed)
            return;
        releaseWorkspaceInterceptor("window-spaces");
        this.installed = false;
    }
}

const DEFAULT_SETTINGS = {
    spaces: [],
    autoSave: false,
    showNotifications: true,
    version: "1.0.0",
    showLayoutStatusBar: true,
    layoutStatusBarDefaultApplied: false,
    showWindowLayoutsRibbonIcon: true,
    sortBy: "updated-desc",
    sectionsOrder: [],
    groupBySection: true,
    showArchived: false,
    defaultIcon: DEFAULT_SPACE_ICON,
    colorPresets: DEFAULT_COLOR_PRESETS,
    defaultBorderInset: 1,
    visualDefaultsVersion: 1,
    defaultShowFoldedCorner: true,
    activityBars: {
        left: BUILTIN_SIDEBAR_VIEWS.filter((item) => item.side === "left"),
        right: BUILTIN_SIDEBAR_VIEWS.filter((item) => item.side === "right"),
    },
    activityBarDefaults: {
        left: true,
        right: true,
    },
    workspaceInterceptorEnabled: true,
};
class WindowSpacesPlugin extends obsidian.Plugin {
    constructor() {
        super(...arguments);
        this.windowLayoutsRibbonEl = null;
        this.autoSaveCleanup = null;
    }
    onload() {
        return __awaiter(this, void 0, void 0, function* () {
            // 初始化國際化
            initI18n(this.app);
            // 加載設定
            yield this.loadSettings();
            // 初始化管理器
            this.manager = new WindowLayoutManager(this);
            this.manager.registerExistingPopoutWindows();
            // 初始化 Popout 工作空間增強（Activity Bar + API 攔截器）
            this.popoutLayout = acquirePopoutLayoutEngine({
                id: "window-spaces",
                apiVersion: SHARED_API_VERSION,
                compatibleFrom: SHARED_COMPATIBLE_FROM_VERSION,
                implementationRevision: SHARED_IMPLEMENTATION_REVISION,
                create: () => new PopoutLayoutEngine(this.app),
            });
            this.activityBars = new PopoutActivityBarManager(this, this.popoutLayout);
            this.workspaceInterceptor = new WorkspaceInterceptor(this.app, this.popoutLayout);
            this.workspaceInterceptor.enabled = this.settings.workspaceInterceptorEnabled !== false;
            // 僅對已注入 Activity Bar 且非 Obsidian UI 視窗（如設定 popout）攔截
            this.workspaceInterceptor.isManagedWindow = (win) => {
                var _a, _b;
                if (!this.activityBars.isInjected(win))
                    return false;
                if ((_b = (_a = win.document) === null || _a === void 0 ? void 0 : _a.body) === null || _b === void 0 ? void 0 : _b.querySelector(".modal-container"))
                    return false;
                return true;
            };
            this.workspaceInterceptor.install();
            // 註冊可固定在側欄或主工作區分頁的 Window Layouts view
            this.registerView(WINDOW_LAYOUTS_VIEW_TYPE, (leaf) => new WindowLayoutsView(leaf, this));
            // 註冊命令
            this.registerCommands();
            // 刷新與添加 Ribbon 按鈕
            this.refreshRibbonIcons();
            // 添加設定頁面
            this.addSettingTab(new WindowSpacesSettingTab(this.app, this));
            // 設置事件監聽
            this.setupEventListeners();
            // 為既有 Popout 注入 Activity Bar
            this.activityBars.refreshAll();
            // 添加狀態欄指示器（可選）
            if (this.settings.showStatusBarIndicator === true) {
                this.addStatusBarIndicator();
            }
        });
    }
    onunload() {
        var _a, _b, _c, _d;
        (_a = this.windowLayoutsRibbonEl) === null || _a === void 0 ? void 0 : _a.remove();
        this.windowLayoutsRibbonEl = null;
        (_b = this.manager) === null || _b === void 0 ? void 0 : _b.clearLayoutLabels();
        // 清理 Activity Bar 與 API 攔截器
        (_c = this.workspaceInterceptor) === null || _c === void 0 ? void 0 : _c.uninstall();
        (_d = this.activityBars) === null || _d === void 0 ? void 0 : _d.cleanupAll();
        // 清理自動保存
        if (this.autoSaveCleanup) {
            this.autoSaveCleanup();
        }
        releasePopoutLayoutEngine("window-spaces");
    }
    refreshRibbonIcons() {
        if (this.settings.showWindowLayoutsRibbonIcon) {
            if (!this.windowLayoutsRibbonEl) {
                this.windowLayoutsRibbonEl = this.addRibbonIcon("layout", t("commands.openLayoutsRibbon"), () => this.openWindowLayoutsModal());
            }
        }
        else if (this.windowLayoutsRibbonEl) {
            this.windowLayoutsRibbonEl.remove();
            this.windowLayoutsRibbonEl = null;
        }
    }
    loadSettings() {
        return __awaiter(this, void 0, void 0, function* () {
            const savedSettings = (yield this.loadData());
            if (savedSettings && savedSettings.layouts && !savedSettings.spaces) {
                savedSettings.spaces = savedSettings.layouts;
                delete savedSettings.layouts;
            }
            this.settings = Object.assign({}, DEFAULT_SETTINGS, savedSettings);
            // Version 1 used 3px as the default frame inset. Migrate that legacy
            // default to Obsidian's native 1px accent-border thickness once, while
            // preserving other values that may have been explicitly chosen.
            if ((savedSettings === null || savedSettings === void 0 ? void 0 : savedSettings.visualDefaultsVersion) !== 1) {
                if ((savedSettings === null || savedSettings === void 0 ? void 0 : savedSettings.defaultBorderInset) === 3) {
                    this.settings.defaultBorderInset = 1;
                }
                this.settings.visualDefaultsVersion = 1;
                yield this.saveSettings();
            }
            // "layout" was the old built-in fallback. Migrate that legacy default so
            // icon-less Spaces now use the neutral square icon.
            if ((savedSettings === null || savedSettings === void 0 ? void 0 : savedSettings.defaultIcon) === "layout") {
                this.settings.defaultIcon = DEFAULT_SPACE_ICON;
                yield this.saveSettings();
            }
            // 將舊版「預設關閉」的狀態列設定遷移為新版預設開啟；之後尊重使用者的手動選擇。
            if (this.settings.layoutStatusBarDefaultApplied !== true) {
                this.settings.showLayoutStatusBar = true;
                this.settings.layoutStatusBarDefaultApplied = true;
                yield this.saveSettings();
            }
            // 處理舊版本數據遷移
            if (!this.settings.version) {
                this.settings.version = DEFAULT_SETTINGS.version;
                yield this.saveSettings();
            }
        });
    }
    saveSettings() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.saveData(this.settings);
        });
    }
    registerCommands() {
        // 保存當前視窗佈局
        this.addCommand({
            id: "save-current-window-layout",
            name: t("commands.saveLayout"),
            icon: "save",
            callback: () => __awaiter(this, void 0, void 0, function* () {
                try {
                    yield this.openSaveCurrentLayoutModal();
                }
                catch (error) {
                    const message = error instanceof Error ? error.message : String(error);
                    new obsidian.Notice(`${t("errors.failedToSave")}: ${message}`);
                }
            }),
        });
        // 開啟 Window Spaces 彈出視窗 (與 ribbon icon 相同的入口)
        this.addCommand({
            id: "open-window-layouts",
            name: t("commands.openLayouts"),
            icon: "layout",
            callback: () => this.openWindowLayoutsModal(),
        });
        this.addCommand({
            id: "open-window-layouts-panel",
            name: t("commands.openLayoutsPanel"),
            icon: "layout",
            callback: () => void this.openWindowLayoutsPanel("tab"),
        });
        this.addCommand({
            id: "open-window-layouts-panel-left",
            name: t("commands.openLayoutsPanelLeft"),
            icon: "panel-left",
            callback: () => void this.openWindowLayoutsPanel("left"),
        });
        this.addCommand({
            id: "open-window-layouts-panel-right",
            name: t("commands.openLayoutsPanelRight"),
            icon: "panel-right",
            callback: () => void this.openWindowLayoutsPanel("right"),
        });
        // Popout 工作空間增強命令
        this.addCommand({
            id: "toggle-left-activity-bar",
            name: t("commands.toggleLeftActivityBar"),
            icon: "panel-left",
            callback: () => this.toggleActivityBarVisibility("left"),
        });
        this.addCommand({
            id: "toggle-right-activity-bar",
            name: t("commands.toggleRightActivityBar"),
            icon: "panel-right",
            callback: () => this.toggleActivityBarVisibility("right"),
        });
    }
    toggleActivityBarVisibility(side) {
        const win = (this.manager ? this.manager.getActiveWindow() : undefined) ||
            (typeof activeWindow !== "undefined" ? activeWindow : window);
        if (!win || win === window) {
            new obsidian.Notice(t("activityBar.onlyInPopout"));
            return;
        }
        const columnEl = this.popoutLayout.getColumnElement(win, side);
        if (!columnEl) {
            new obsidian.Notice(t("activityBar.cannotHideLastPane"));
            return;
        }
        if (this.popoutLayout.isColumnHidden(win, side)) {
            this.popoutLayout.showColumn(win, side);
        }
        else {
            if (this.popoutLayout.getVisibleColumnCount(win) < 2) {
                new obsidian.Notice(t("activityBar.cannotHideLastPane"));
                return;
            }
            this.popoutLayout.hideColumn(win, side);
        }
        this.activityBars.updateActiveStates(win);
    }
    openSaveLayoutModal(layout, targetWindow) {
        const modal = new SaveLayoutModal(this.app, this, layout, (savedLayout) => {
            void (() => __awaiter(this, void 0, void 0, function* () {
                try {
                    yield this.manager.saveLayout(savedLayout);
                }
                catch (error) {
                    const message = error instanceof Error ? error.message : String(error);
                    new obsidian.Notice(`${t("errors.failedToSave")}: ${message}`);
                }
            }))();
        });
        // Popout 視窗開啟儲存對話框時，Obsidian 的 Modal.open() 預設掛載到 main window 的
        // document.body（plugin 的 JS realm 在主視窗，讀取的 activeWindow 也是主視窗），
        // 導致對話框被 popout 蓋住、看不到。此處明確將 modal 容器掛載到目標視窗的 body，
        // 讓對話框在使用者所在（點擊 Save 的）popout 最上層顯示。
        if (targetWindow && targetWindow !== window) {
            modal.open(targetWindow.document.body);
            return;
        }
        modal.open();
    }
    openSaveCurrentLayoutModal(targetWindow) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const layout = yield this.manager.captureCurrentLayout({}, targetWindow);
                this.openSaveLayoutModal(layout, targetWindow);
            }
            catch (error) {
                const message = error instanceof Error ? error.message : String(error);
                new obsidian.Notice(`${t("errors.failedToSave")}: ${message}`);
            }
        });
    }
    openWindowLayoutsModal(targetWindow) {
        try {
            const win = targetWindow || (this.manager ? this.manager.getActiveWindow() : undefined);
            // Use a plain native Modal as the host. The shared Window Spaces
            // controller mounts here reliably, while popup-only CSS keeps its
            // toolbar visually separate from the native close X.
            const hostModal = new obsidian.Modal(this.app);
            const controller = new WindowLayoutsModal(this.app, this, win);
            hostModal.setTitle(t("common.windowLayouts"));
            hostModal.onOpen = () => {
                try {
                    hostModal.modalEl.addClass("window-layouts-modal");
                    hostModal.modalEl.addClass("window-layouts-popout-modal");
                    controller.mountInModalContainer(hostModal.contentEl, () => hostModal.close());
                    const titleHeader = hostModal.containerEl.querySelector(".modal-title");
                    if (titleHeader) {
                        controller.mountHeaderActions(titleHeader);
                    }
                }
                catch (error) {
                    console.error("[WindowSpaces] Error mounting Window Spaces picker:", error);
                    const message = error instanceof Error ? error.message : String(error);
                    hostModal.contentEl.empty();
                    hostModal.contentEl.createEl("p", {
                        text: `Error loading Window Spaces: ${message}`,
                    });
                }
            };
            hostModal.onClose = () => {
                controller.unmountFromContainer();
            };
            hostModal.open();
        }
        catch (error) {
            console.error("[WindowSpaces] Error opening WindowLayoutsModal:", error);
            const message = error instanceof Error ? error.message : String(error);
            new obsidian.Notice(`Window Spaces Error: ${message}`);
        }
    }
    openWindowLayoutsPanel(location = "tab", targetWindow) {
        var _a, _b, _c, _d;
        return __awaiter(this, void 0, void 0, function* () {
            // 步驟 1：最先偵測開在哪個視窗 (Main Window 或特定 Popout Window)
            const win = targetWindow ||
                (this.manager ? this.manager.getActiveWindow() : undefined) ||
                (typeof activeWindow !== "undefined" ? activeWindow : window);
            const isPopout = win !== window &&
                Boolean(((_b = (_a = win.document) === null || _a === void 0 ? void 0 : _a.body) === null || _b === void 0 ? void 0 : _b.classList.contains("is-popout-window")) ||
                    ((_d = (_c = win.document) === null || _c === void 0 ? void 0 : _c.body) === null || _d === void 0 ? void 0 : _d.classList.contains("mod-popout")));
            const workspace = this.app.workspace;
            // 處理在 Popout 視窗開啟
            if (isPopout) {
                return this.popoutLayout.openPanel(win, location, WINDOW_LAYOUTS_VIEW_TYPE);
            }
            // 處理在 Main Window 開啟
            let root;
            if (location === "left") {
                root = workspace.leftSplit;
            }
            else if (location === "right") {
                root = workspace.rightSplit;
            }
            else {
                root = workspace.rootSplit;
            }
            // 步驟 2 & 3：看該 split (root) 中是否已有 Window Spaces panel 開啟，如果有就 reveal 並 active
            const existingLeaf = findLeafInRoot(workspace, root, WINDOW_LAYOUTS_VIEW_TYPE);
            if (existingLeaf) {
                yield workspace.revealLeaf(existingLeaf);
                workspace.setActiveLeaf(existingLeaf, { focus: true });
                return existingLeaf;
            }
            // 沒有就在該 split 開啟 Window Space tab
            let leaf;
            if (location === "left") {
                leaf = workspace.getLeftLeaf(false);
            }
            else if (location === "right") {
                leaf = workspace.getRightLeaf(false);
            }
            else {
                let mainLeaf = null;
                workspace.iterateAllLeaves((candidate) => {
                    var _a, _b, _c, _d;
                    const extCandidate = candidate;
                    const body = (_b = (_a = extCandidate.containerEl) === null || _a === void 0 ? void 0 : _a.ownerDocument) === null || _b === void 0 ? void 0 : _b.body;
                    const isCandidatePopout = ((_c = body === null || body === void 0 ? void 0 : body.classList) === null || _c === void 0 ? void 0 : _c.contains("is-popout-window")) ||
                        ((_d = body === null || body === void 0 ? void 0 : body.classList) === null || _d === void 0 ? void 0 : _d.contains("mod-popout"));
                    if (!mainLeaf && !isCandidatePopout)
                        mainLeaf = candidate;
                });
                if (mainLeaf)
                    workspace.setActiveLeaf(mainLeaf, { focus: false });
                leaf = workspace.getLeaf("tab");
            }
            if (!leaf) {
                throw new Error("Unable to create a Window Layouts panel");
            }
            yield leaf.setViewState({ type: WINDOW_LAYOUTS_VIEW_TYPE, state: {} });
            yield workspace.revealLeaf(leaf);
            workspace.setActiveLeaf(leaf, { focus: true });
            return leaf;
        });
    }
    setupEventListeners() {
        // 監聽視窗開關
        this.registerEvent(this.app.workspace.on("window-open", (_workspaceWindow, popoutWindow) => {
            this.manager.registerPopoutWindow(popoutWindow);
            this.activityBars.injectForWindow(popoutWindow);
            WindowLayoutsModal.renderAllInstances();
        }));
        this.registerEvent(this.app.workspace.on("window-close", (_workspaceWindow, popoutWindow) => {
            this.manager.unregisterPopoutWindow(popoutWindow);
            this.activityBars.cleanupWindow(popoutWindow);
            WindowLayoutsModal.renderAllInstances();
        }));
        // 監聽 Workspace 分頁與佈局變化（用於特定 Layout 的 5 秒 Debounced 自動儲存）
        this.registerEvent(this.app.workspace.on("layout-change", () => {
            var _a;
            if ((_a = this.manager) === null || _a === void 0 ? void 0 : _a.isRestoringLayout)
                return;
            this.manager.matchUnlabeledPopoutWindows();
            this.manager.checkAndDebouncedAutoSaveAll();
            this.activityBars.refreshAll();
        }));
        this.registerEvent(this.app.workspace.on("active-leaf-change", (leaf) => {
            var _a;
            if ((_a = this.manager) === null || _a === void 0 ? void 0 : _a.isRestoringLayout)
                return;
            this.manager.checkAndDebouncedAutoSaveAll();
            this.activityBars.updateActiveStatesAll();
            // 等待 mousedown/mouseup/click 完成後，才檢查剛切換到的 Popout tab
            // 是否仍是空 DOM；主視窗不走此路徑，避免 File Explorer 單擊失效。
            const leafWindow = leaf ? getWindowOfLeaf(leaf) : null;
            if (leaf && leafWindow && isPopoutWindow(leafWindow)) {
                this.manager.scheduleViewRenderAfterActivation(leaf, leafWindow);
            }
        }));
    }
    addStatusBarIndicator() {
        const statusBarItem = this.addStatusBarItem();
        statusBarItem.setText("Window Spaces");
        statusBarItem.onClickEvent((evt) => {
            if (evt.shiftKey) {
                // Shift+點擊：快速保存
                void this.manager.captureCurrentLayout().then((layout) => {
                    this.openSaveLayoutModal(layout);
                }).catch((error) => {
                    const message = error instanceof Error ? error.message : String(error);
                    new obsidian.Notice(`${t("errors.failedToSave")}: ${message}`);
                });
            }
            else {
                // 普通點擊：顯示佈局列表
                this.openWindowLayoutsModal();
            }
        });
        // 添加工具提示
        statusBarItem.setAttribute("aria-label", "Window Spaces - Click to restore space, Shift+Click to save space");
    }
}
function findLeafInRoot(workspace, root, viewType) {
    if (!root)
        return null;
    let found = null;
    workspace.iterateAllLeaves((leaf) => {
        var _a, _b;
        if (found)
            return;
        const extLeaf = leaf;
        if (((_a = extLeaf.getRoot) === null || _a === void 0 ? void 0 : _a.call(extLeaf)) === root && ((_b = leaf.getViewState()) === null || _b === void 0 ? void 0 : _b.type) === viewType) {
            found = leaf;
        }
    });
    return found;
}

module.exports = WindowSpacesPlugin;
//# sourceMappingURL=main.js.map
