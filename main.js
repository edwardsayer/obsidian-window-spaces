'use strict';

var obsidian = require('obsidian');

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
        layoutLabel: "Window Spaces layout",
        noLayout: "No layout applied",
        newWindow: "New Window",
        edit: "Edit",
        windowLayouts: "Window Layouts",
    },
    commands: {
        saveLayout: "Save current window layout",
        openLayouts: "Open window layouts",
    },
    saveModal: {
        title: "Save Window Layout",
        nameLabel: "Layout Name",
        namePlaceholder: "Enter layout name...",
        descriptionLabel: "Description (optional)",
        descriptionPlaceholder: "Enter layout description...",
        infoSection: "Layout Details",
        windowSize: "Window Size",
        includePosition: "Include Window Position",
        includePositionDesc: "Save the window position coordinates on screen",
        includeWindowSize: "Include window size",
        includeWindowSizeDesc: "Save the window width and height",
        includeGeometry: "Include window position & size",
        includeGeometryDesc: "Save the window coordinates and dimensions on screen",
        andOthers: "and others",
        overwriteNotice: "Will overwrite existing layout",
        saveButton: "Save Layout",
        cancelButton: "Cancel",
        emptyNameError: "Layout name cannot be empty",
        duplicateNameError: "A layout with this name already exists",
        saveSuccess: "Layout saved successfully",
        autoSaveToggle: "Enable auto-save for this layout",
    },
    restoreModal: {
        title: "Restore Window Layout",
        selectLayout: "Select a layout to restore:",
        noLayoutsMessage: "No saved window layouts found.",
        restoreButton: "Restore",
        restoreHint: "Restore layout (click or Enter for a new window; long-press the item or Restore button, Shift+click, or Shift+Enter for the current window)",
        cancelButton: "Cancel",
        restoreSuccess: "Layout restored successfully",
        restoreError: "Failed to restore layout",
        includedFiles: "Included files",
        restoringLayout: "Restoring layout",
    },
    manageModal: {
        title: "Manage Window Layouts",
        noLayoutsMessage: "No saved layouts found.",
        searchPlaceholder: "Search layouts...",
        saveCurrentButton: "Save",
        layoutName: "Layout Name",
        createdDate: "Created",
        updatedDate: "Updated",
        fileCount: "Files",
        actions: "Actions",
        renameButton: "Rename",
        deleteButton: "Delete",
        confirmDeleteTitle: "Delete Layout",
        confirmDeleteMessage: "Are you sure you want to delete this layout? This action cannot be undone.",
        deleteSuccess: "Layout deleted successfully",
        renameSuccess: "Layout renamed successfully",
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
    },
    settings: {
        title: "Window Spaces Settings",
        description: "Manage your window layouts and configure auto-save options.",
        autoSaveSection: "General & Auto-Save Settings",
        autoSaveDescription: "Automatically save window layouts at regular intervals.",
        autoSaveEnabled: "Enable auto-save",
        showNotifications: "Show notifications",
        showNotificationsDesc: "Display notice toasts on saving or restoring layouts",
        layoutDisplaySection: "Popout layout display",
        showLayoutStatusBar: "Show layout status bar",
        showLayoutStatusBarDesc: "Display the current layout name and a Save button in a status-style bar at the bottom-left of every Popout window",
        showWindowLayoutsRibbonIcon: "Show 'Window Layouts' ribbon icon",
        showWindowLayoutsRibbonIconDesc: "Display one quick-access icon for restoring and managing window layouts",
        maxLayouts: "Max layouts",
        maxLayoutsDesc: "Limit the number of saved layouts (0 = unlimited)",
        layoutStats: "Total saved layouts: {{count}}",
        autoSaveInterval: "Auto-save interval",
        minutes: "minutes",
        layoutsSection: "Saved Layouts",
        layoutsDescription: "Manage your saved window layouts.",
        noLayouts: "No saved layouts found.",
        layoutInfo: "Layout: {{name}}",
        createdOn: "Created: {{date}}",
        includesFiles: "Includes {{count}} files",
        deleteLayout: "Delete Layout",
        confirmDelete: "Are you sure you want to delete this layout?",
        resetSettings: "Reset Settings",
        resetSettingsDescription: "Reset all settings to default values.",
        resetButton: "Reset Settings",
        resetConfirmTitle: "Confirm Reset",
        resetConfirmMessage: "Are you sure you want to reset all settings? This will not delete your saved layouts.",
        resetSuccess: "Settings reset successfully",
    },
    notifications: {
        layoutSaved: "Layout saved successfully",
        layoutOverwritten: "Layout overwritten successfully",
        layoutRestored: "Layout restored successfully",
        layoutDeleted: "Layout deleted successfully",
        layoutRenamed: "Layout renamed successfully",
        settingsReset: "Settings reset successfully",
        errorOccurred: "An error occurred",
        invalidLayout: "Invalid layout data",
        cannotRestore: "Cannot restore layout",
        missingFilesNotice: "missing files",
    },
    errors: {
        failedToSave: "Failed to save layout",
        failedToRestore: "Failed to restore layout",
        failedToDelete: "Failed to delete layout",
        failedToRename: "Failed to rename layout",
        layoutNotFound: "Layout not found",
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
        layoutLabel: "Window Spaces 佈局",
        noLayout: "尚未套用佈局",
        newWindow: "新視窗",
        edit: "編輯",
        windowLayouts: "視窗佈局",
    },
    commands: {
        saveLayout: "儲存目前視窗佈局",
        openLayouts: "開啟視窗佈局",
    },
    saveModal: {
        title: "儲存視窗佈局",
        nameLabel: "佈局名稱",
        namePlaceholder: "輸入佈局名稱...",
        descriptionLabel: "描述（選填）",
        descriptionPlaceholder: "輸入佈局描述...",
        infoSection: "佈局資訊",
        windowSize: "視窗大小",
        includePosition: "包含視窗位置",
        includePositionDesc: "儲存視窗在螢幕上的位置",
        includeWindowSize: "包含視窗大小",
        includeWindowSizeDesc: "儲存視窗的寬度和高度",
        includeGeometry: "包含視窗位置與大小",
        includeGeometryDesc: "保存並還原視窗在螢幕上的座標位置與寬高尺寸",
        andOthers: "及其他",
        overwriteNotice: "將覆蓋更新既有佈局",
        saveButton: "儲存佈局",
        cancelButton: "取消",
        emptyNameError: "佈局名稱不能為空",
        duplicateNameError: "此名稱的佈局已經存在",
        saveSuccess: "佈局儲存成功",
        autoSaveToggle: "啟用此佈局的自動保存",
    },
    restoreModal: {
        title: "復原視窗佈局",
        selectLayout: "選擇要復原的佈局：",
        noLayoutsMessage: "沒有找到已儲存的佈局。",
        restoreButton: "復原",
        restoreHint: "復原佈局（點擊或按 Enter 在新視窗開啟；長按佈局項目或 Restore 按鈕、按住 Shift 點擊或按 Shift+Enter 套用至目前視窗）",
        cancelButton: "取消",
        restoreSuccess: "佈局復原成功",
        restoreError: "復原佈局失敗",
        includedFiles: "收錄檔案",
        restoringLayout: "正在復原佈局",
    },
    manageModal: {
        title: "管理視窗佈局",
        noLayoutsMessage: "沒有找到已儲存的佈局。",
        searchPlaceholder: "搜尋佈局...",
        saveCurrentButton: "Save",
        layoutName: "佈局名稱",
        createdDate: "建立時間",
        updatedDate: "更新時間",
        fileCount: "檔案數",
        actions: "操作",
        renameButton: "重命名",
        deleteButton: "刪除",
        confirmDeleteTitle: "確認刪除",
        confirmDeleteMessage: "您確定要刪除這個佈局嗎？此操作無法復原。",
        deleteSuccess: "佈局刪除成功",
        renameSuccess: "佈局重新命名成功",
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
    },
    settings: {
        title: "Window Spaces 設定",
        description: "管理您的視窗佈局並設定自動儲存選項。",
        autoSaveSection: "一般與自動儲存設定",
        autoSaveDescription: "定期自動儲存視窗佈局。",
        autoSaveEnabled: "啟用自動儲存",
        showNotifications: "顯示通知",
        showNotificationsDesc: "在儲存或恢復佈局時顯示通知快訊",
        layoutDisplaySection: "Popout 佈局顯示",
        showLayoutStatusBar: "顯示佈局狀態列",
        showLayoutStatusBarDesc: "在每個 Popout 視窗左下方以狀態列樣式顯示目前佈局名稱與儲存按鈕",
        showWindowLayoutsRibbonIcon: "顯示「視窗佈局」側邊欄圖示",
        showWindowLayoutsRibbonIconDesc: "在主視窗左側邊欄顯示恢復與管理視窗佈局的單一入口",
        maxLayouts: "最大佈局數量",
        maxLayoutsDesc: "限制儲存的佈局數量（0 代表無限制）",
        layoutStats: "已儲存佈局總數：{{count}} 個",
        autoSaveInterval: "自動儲存間隔",
        minutes: "分鐘",
        layoutsSection: "已儲存的佈局",
        layoutsDescription: "管理您已儲存的視窗佈局。",
        noLayouts: "沒有找到已儲存的佈局。",
        layoutInfo: "佈局：{{name}}",
        createdOn: "建立時間：{{date}}",
        includesFiles: "包含 {{count}} 個檔案",
        deleteLayout: "刪除佈局",
        confirmDelete: "您確定要刪除這個佈局嗎？",
        resetSettings: "重設設定",
        resetSettingsDescription: "將所有設定重設為預設值。",
        resetButton: "重設設定",
        resetConfirmTitle: "確認重設",
        resetConfirmMessage: "您確定要重設所有設定嗎？這不會刪除您已儲存的佈局。",
        resetSuccess: "設定重設成功",
    },
    notifications: {
        layoutSaved: "佈局儲存成功",
        layoutOverwritten: "已覆蓋更新佈局",
        layoutRestored: "佈局復原成功",
        layoutDeleted: "佈局刪除成功",
        layoutRenamed: "佈局重新命名成功",
        settingsReset: "設定重設成功",
        errorOccurred: "發生錯誤",
        invalidLayout: "無效的佈局資料",
        cannotRestore: "無法復原佈局",
        missingFilesNotice: "包含不存在的檔案",
    },
    errors: {
        failedToSave: "儲存佈局失敗",
        failedToRestore: "恢復佈局失敗",
        failedToDelete: "刪除佈局失敗",
        failedToRename: "重新命名佈局失敗",
        layoutNotFound: "找不到佈局",
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
        layoutLabel: "Window Spaces 布局",
        noLayout: "尚未应用布局",
        newWindow: "新窗口",
        edit: "编辑",
        windowLayouts: "窗口布局",
    },
    commands: {
        saveLayout: "保存当前窗口布局",
        openLayouts: "打开窗口布局",
    },
    saveModal: {
        title: "保存窗口布局",
        nameLabel: "布局名称",
        namePlaceholder: "输入布局名称...",
        descriptionLabel: "描述（可选）",
        descriptionPlaceholder: "输入布局描述...",
        infoSection: "布局信息",
        windowSize: "窗口大小",
        includePosition: "包含窗口位置",
        includePositionDesc: "保存窗口在屏幕上的位置坐标",
        includeWindowSize: "包含窗口大小",
        includeWindowSizeDesc: "保存窗口的宽度与高度",
        includeGeometry: "包含窗口位置与大小",
        includeGeometryDesc: "保存并恢复窗口在屏幕上的坐标位置与宽高尺寸",
        andOthers: "及其他",
        overwriteNotice: "将覆盖更新现有布局",
        saveButton: "保存布局",
        cancelButton: "取消",
        emptyNameError: "布局名称不能为空",
        duplicateNameError: "此名称的布局已存在",
        saveSuccess: "布局保存成功",
        autoSaveToggle: "启用此布局的自动保存",
    },
    restoreModal: {
        title: "恢复窗口布局",
        selectLayout: "选择要恢复的布局：",
        noLayoutsMessage: "没有找到已保存的布局。",
        restoreButton: "恢复",
        restoreHint: "恢复布局（点击或按 Enter 在新窗口打开；长按布局项或恢复按钮、按住 Shift 点击或按 Shift+Enter 应用至当前窗口）",
        cancelButton: "取消",
        restoreSuccess: "布局恢复成功",
        restoreError: "恢复布局失败",
        includedFiles: "包含文件",
        restoringLayout: "正在恢复布局",
    },
    manageModal: {
        title: "管理窗口布局",
        noLayoutsMessage: "没有找到已保存的布局。",
        searchPlaceholder: "搜索布局...",
        saveCurrentButton: "Save",
        layoutName: "布局名称",
        createdDate: "创建时间",
        updatedDate: "更新时间",
        fileCount: "文件数",
        actions: "操作",
        renameButton: "重命名",
        deleteButton: "删除",
        confirmDeleteTitle: "确认删除",
        confirmDeleteMessage: "您确定要删除这个布局吗？此操作无法撤销。",
        deleteSuccess: "布局删除成功",
        renameSuccess: "布局重命名成功",
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
    },
    settings: {
        title: "Window Spaces 设置",
        description: "管理您的窗口布局并配置自动保存选项。",
        autoSaveSection: "常规与自动保存设置",
        autoSaveDescription: "定期自动保存窗口布局。",
        autoSaveEnabled: "启用自动保存",
        showNotifications: "显示通知",
        showNotificationsDesc: "在保存或恢复布局时显示通知消息",
        layoutDisplaySection: "Popout 布局显示",
        showLayoutStatusBar: "显示布局状态栏",
        showLayoutStatusBarDesc: "在每个 Popout 窗口左下方以状态栏样式显示当前布局名称与保存按钮",
        showWindowLayoutsRibbonIcon: "显示“窗口布局”侧边栏图标",
        showWindowLayoutsRibbonIconDesc: "在主窗口左侧边栏显示恢复与管理窗口布局的单一入口",
        maxLayouts: "最大布局数量",
        maxLayoutsDesc: "限制保存的布局数量（0 代表无限制）",
        layoutStats: "已保存布局总数：{{count}} 个",
        autoSaveInterval: "自动保存间隔",
        minutes: "分钟",
        layoutsSection: "已保存的布局",
        layoutsDescription: "管理您已保存的窗口布局。",
        noLayouts: "没有找到已保存的布局。",
        layoutInfo: "布局：{{name}}",
        createdOn: "创建时间：{{date}}",
        includesFiles: "包含 {{count}} 个文件",
        deleteLayout: "删除布局",
        confirmDelete: "您确定要删除这个布局吗？",
        resetSettings: "重置设置",
        resetSettingsDescription: "将所有设置重置为默认值。",
        resetButton: "重置设置",
        resetConfirmTitle: "确认重置",
        resetConfirmMessage: "您确定要重置所有设置吗？这不会删除您已保存的布局。",
        resetSuccess: "设置重置成功",
    },
    notifications: {
        layoutSaved: "布局保存成功",
        layoutOverwritten: "已覆盖更新布局",
        layoutRestored: "布局恢复成功",
        layoutDeleted: "布局删除成功",
        layoutRenamed: "布局重命名成功",
        settingsReset: "设置重置成功",
        errorOccurred: "发生错误",
        invalidLayout: "无效的布局数据",
        cannotRestore: "无法恢复布局",
        missingFilesNotice: "包含不存在的文件",
    },
    errors: {
        failedToSave: "保存布局失败",
        failedToRestore: "恢复布局失败",
        failedToDelete: "删除布局失败",
        failedToRename: "重命名布局失败",
        layoutNotFound: "找不到布局",
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

class WindowLayoutManager {
    constructor(plugin) {
        this.layoutWindows = new WeakMap();
        this.popoutWindows = new Set();
        this.layoutNames = new Map();
        this.layoutLabels = new Map();
        this.autoSaveTimers = new Map();
        this.lastValidSnapshots = new Map();
        this.plugin = plugin;
        this.app = plugin.app;
    }
    /** 記錄 Obsidian 建立的 Popout，供 label 生命週期管理使用。 */
    registerPopoutWindow(targetWin) {
        if (!targetWin)
            return;
        this.popoutWindows.add(targetWin);
        this.refreshLayoutStatusBar(targetWin);
        // window-open 觸發時 Popout DOM 可能仍在建立中，再補一次確保狀態列出現。
        targetWin.setTimeout(() => this.refreshLayoutStatusBar(targetWin), 0);
    }
    /** 插件重新載入時，補註冊已經存在的 Popout。 */
    registerExistingPopoutWindows() {
        this.app.workspace.iterateAllLeaves((leaf) => {
            var _a, _b;
            const targetWin = (_b = (_a = leaf.containerEl) === null || _a === void 0 ? void 0 : _a.ownerDocument) === null || _b === void 0 ? void 0 : _b.defaultView;
            if (targetWin && this.isPopoutDocument(targetWin.document)) {
                this.registerPopoutWindow(targetWin);
            }
        });
    }
    /** Popout 關閉時移除對應的 layout label 與追蹤狀態。 */
    unregisterPopoutWindow(targetWin) {
        if (!targetWin)
            return;
        this.removeLayoutLabel(targetWin);
        this.popoutWindows.delete(targetWin);
    }
    /** Plugin 卸載時清除所有由本 plugin 建立的 Popout label。 */
    clearLayoutLabels() {
        var _a;
        for (const [targetWin, labels] of this.layoutLabels) {
            (_a = labels.statusBar) === null || _a === void 0 ? void 0 : _a.remove();
            this.popoutWindows.delete(targetWin);
        }
        this.layoutNames.clear();
        this.layoutLabels.clear();
        this.popoutWindows.clear();
    }
    /**
     * 在指定 Popout 的內容區顯示目前套用的 layout 名稱。
     * 不修改 document.title，也不寫入 Obsidian layout tree。
     */
    setLayoutLabelForWindow(targetWin, layoutName) {
        if (!targetWin || !(layoutName === null || layoutName === void 0 ? void 0 : layoutName.trim()))
            return;
        const targetDocument = targetWin.document;
        const body = targetDocument === null || targetDocument === void 0 ? void 0 : targetDocument.body;
        if (!body || !this.isPopoutDocument(targetDocument))
            return;
        this.registerPopoutWindow(targetWin);
        this.layoutNames.set(targetWin, layoutName);
        body.setAttribute("data-layout-name", layoutName);
        // 清理舊版浮動 label，避免更新插件後殘留在 Popout 右上角。
        body.querySelectorAll(".window-spaces-layout-label").forEach((element) => element.remove());
        this.refreshLayoutStatusBar(targetWin);
    }
    getLayoutNameForWindow(targetWin) {
        var _a, _b;
        if (!targetWin)
            return null;
        const nameFromMap = this.layoutNames.get(targetWin);
        if (nameFromMap)
            return nameFromMap;
        const nameFromDOM = (_b = (_a = targetWin.document) === null || _a === void 0 ? void 0 : _a.body) === null || _b === void 0 ? void 0 : _b.getAttribute("data-layout-name");
        if (nameFromDOM) {
            this.layoutNames.set(targetWin, nameFromDOM);
            return nameFromDOM;
        }
        return null;
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
        const element = targetDocument.createElement("div");
        element.className = className;
        body.appendChild(element);
        return element;
    }
    updateLayoutLabelElement(element, layoutName, targetWin) {
        const targetDocument = targetWin.document;
        let iconElement = element.querySelector(".window-spaces-layout-icon");
        if (!iconElement) {
            iconElement = targetDocument.createElement("span");
            iconElement.className = "window-spaces-layout-icon";
            obsidian.setIcon(iconElement, "history");
            element.appendChild(iconElement);
        }
        let nameElement = element.querySelector(".window-spaces-layout-name");
        if (!nameElement) {
            nameElement = targetDocument.createElement("span");
            nameElement.className = "window-spaces-layout-name";
            element.appendChild(nameElement);
        }
        let actionsElement = element.querySelector(".window-spaces-layout-actions");
        if (!actionsElement) {
            actionsElement = targetDocument.createElement("div");
            actionsElement.className = "window-spaces-layout-actions";
            element.appendChild(actionsElement);
        }
        const ensureActionButton = (className, icon, label, onClick) => {
            let button = actionsElement.querySelector(`.${className}`);
            if (!button) {
                button = targetDocument.createElement("button");
                button.className = `window-spaces-layout-action ${className} clickable-icon`;
                button.type = "button";
                obsidian.setIcon(button, icon);
                actionsElement.appendChild(button);
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
        const currentLayout = this.plugin.settings.layouts.find((l) => l.name === layoutName);
        const isAutoSave = !!(currentLayout === null || currentLayout === void 0 ? void 0 : currentLayout.autoSave);
        ensureActionButton("window-spaces-layout-save", "save", t("commands.saveLayout"), () => void this.saveLayoutFromWindow(targetWin));
        const autoSaveBtn = ensureActionButton("window-spaces-layout-auto-save", "refresh-cw", isAutoSave ? t("manageModal.autoSaveEnabled") : t("manageModal.autoSaveDisabled"), () => __awaiter(this, void 0, void 0, function* () {
            const targetLayout = this.plugin.settings.layouts.find((l) => l.name === layoutName);
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
        }));
        if (isAutoSave) {
            autoSaveBtn.classList.add("is-active");
        }
        else {
            autoSaveBtn.classList.remove("is-active");
        }
        ensureActionButton("window-spaces-layout-open", "layout", t("commands.openLayouts"), () => this.plugin.openWindowLayoutsModal(targetWin));
        element.setAttribute("aria-label", `${t("common.layoutLabel")}: ${layoutName}`);
        element.setAttribute("title", layoutName);
        element.dataset.layoutName = layoutName;
    }
    /** 開啟全新的 Popout 視窗 */
    openNewPopoutWindow() {
        var _a, _b;
        try {
            const leaf = this.app.workspace.openPopoutLeaf();
            if (leaf) {
                leaf.setViewState({ type: "empty" });
                const targetWin = ((_b = (_a = leaf.containerEl) === null || _a === void 0 ? void 0 : _a.ownerDocument) === null || _b === void 0 ? void 0 : _b.defaultView) || null;
                if (targetWin && typeof targetWin.focus === "function") {
                    try {
                        targetWin.focus();
                    }
                    catch (e) {
                        console.warn("Failed to focus new popout window:", e);
                    }
                }
                return targetWin;
            }
        }
        catch (e) {
            console.warn("Failed to open new popout window:", e);
        }
        return null;
    }
    saveLayoutFromWindow(targetWin) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const layoutName = this.layoutNames.get(targetWin) || "";
                const existing = this.plugin.settings.layouts.find((l) => l.name === layoutName);
                const layout = yield this.captureCurrentLayout({ name: layoutName }, targetWin);
                if (existing) {
                    layout.autoSave = existing.autoSave;
                }
                this.plugin.openSaveLayoutModal(layout);
            }
            catch (error) {
                console.error("Failed to capture layout from Popout:", error);
                new obsidian.Notice(`${t("errors.failedToSave")}: ${(error === null || error === void 0 ? void 0 : error.message) || error}`);
            }
        });
    }
    /**
     * 檢查並發動所有已開啟自動保存的 Popout 視窗的 5 秒 Debounced 自動儲存
     */
    checkAndDebouncedAutoSaveAll() {
        this.layoutNames.forEach((layoutName, targetWin) => {
            const existing = this.plugin.settings.layouts.find((l) => l.name === layoutName);
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
                if (this.autoSaveTimers.has(targetWin)) {
                    clearTimeout(this.autoSaveTimers.get(targetWin));
                }
                const timer = setTimeout(() => {
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
            const existing = this.plugin.settings.layouts.find((l) => l.name === layoutName);
            if (!existing || existing.autoSave !== true)
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
                        this.lastValidSnapshots.set(targetWin, captured);
                    }
                }
                catch (e) {
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
                const index = this.plugin.settings.layouts.findIndex((l) => l.id === existing.id);
                if (index !== -1) {
                    this.plugin.settings.layouts[index] = captured;
                }
                else {
                    this.plugin.settings.layouts.push(captured);
                }
                yield this.plugin.saveSettings();
            }
            catch (e) {
                console.warn(`[Window Spaces] Auto-save on close/change failed for "${layoutName}":`, e);
            }
        });
    }
    removeLayoutLabel(targetWin) {
        var _a;
        // 1. 若有待發動的 5 秒 Debounce 定時器，將其清除
        if (this.autoSaveTimers.has(targetWin)) {
            clearTimeout(this.autoSaveTimers.get(targetWin));
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
    getWindowForLayout(layout) {
        return this.layoutWindows.get(layout) ||
            this.findWindowForSavedLeaves(this.getSavedViewStates(layout));
    }
    /**
     * 獲取目前活動視窗 (activeWindow) 中真正的 activeLeaf
     */
    getActiveLeafForCurrentWindow(targetWindow) {
        var _a, _b;
        const currentWin = targetWindow || (typeof activeWindow !== "undefined" ? activeWindow : window);
        const globalActiveLeaf = this.app.workspace.activeLeaf;
        // 1. 若全域 activeLeaf 的 ownerWindow 就是 currentWin，直接返回
        if (globalActiveLeaf && ((_b = (_a = globalActiveLeaf.containerEl) === null || _a === void 0 ? void 0 : _a.ownerDocument) === null || _b === void 0 ? void 0 : _b.defaultView) === currentWin) {
            return globalActiveLeaf;
        }
        // 2. 若全域 activeLeaf 不在 currentWin（例如 Command Palette modal 搶焦），遍歷尋找屬於 currentWin 的 leaf
        let windowLeaf = null;
        this.app.workspace.iterateAllLeaves((leaf) => {
            var _a, _b;
            if (!windowLeaf && ((_b = (_a = leaf.containerEl) === null || _a === void 0 ? void 0 : _a.ownerDocument) === null || _b === void 0 ? void 0 : _b.defaultView) === currentWin) {
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
            if (((_b = (_a = leaf.containerEl) === null || _a === void 0 ? void 0 : _a.ownerDocument) === null || _b === void 0 ? void 0 : _b.defaultView) === targetWin) {
                leaves.push(leaf);
            }
        });
        return leaves;
    }
    /** 保存指定 Window 的 live leaf 狀態，供 changeLayout 後重新辨識視窗。 */
    getViewStatesForWindow(targetWin) {
        return this.getLeavesForWindow(targetWin).map((leaf) => {
            var _a;
            const viewState = typeof leaf.getViewState === "function"
                ? leaf.getViewState()
                : {};
            return {
                id: leaf.id || this.generateId(),
                type: viewState.type || ((_a = leaf.view) === null || _a === void 0 ? void 0 : _a.getViewType()) || "unknown",
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
        var _a, _b, _c, _d, _e, _f, _g, _h;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const fullLayout = this.app.workspace.getLayout();
                const activeLeaf = this.getActiveLeafForCurrentWindow(targetWindow);
                const currentWin = targetWindow || (typeof activeWindow !== "undefined" ? activeWindow : window);
                // 取得當前活動 DOM 視窗中所有真實開著的 Leaves
                const windowLeaves = this.getLeavesForWindow(currentWin);
                // 只提取當前浮動視窗的佈局資訊
                let floatingLayout = this.extractCurrentFloatingLayout(fullLayout, activeLeaf);
                if (!floatingLayout) {
                    const rootInfo = activeLeaf && typeof activeLeaf.getRoot === "function" ? (_b = (_a = activeLeaf.getRoot()) === null || _a === void 0 ? void 0 : _a.constructor) === null || _b === void 0 ? void 0 : _b.name : "no-leaf";
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
                            return ({
                                id: this.generateId(),
                                type: "tabs",
                                children: [{
                                        id: leaf.id || this.generateId(),
                                        type: "leaf",
                                        state: typeof leaf.getViewState === "function" ? leaf.getViewState() : { type: ((_a = leaf.view) === null || _a === void 0 ? void 0 : _a.getViewType()) || "markdown", state: {} }
                                    }]
                            });
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
                    var _a;
                    const liveLeaf = liveLeavesById.get(layoutLeaf.id);
                    if (!liveLeaf)
                        return layoutLeaf;
                    const viewState = typeof liveLeaf.getViewState === "function"
                        ? liveLeaf.getViewState()
                        : {};
                    return {
                        id: layoutLeaf.id,
                        type: viewState.type || ((_a = liveLeaf.view) === null || _a === void 0 ? void 0 : _a.getViewType()) || layoutLeaf.type,
                        state: viewState.state || layoutLeaf.state || {},
                    };
                });
                // 若 layout tree 缺少 leaf（例如 Obsidian 正在完成 Popout layout），
                // 仍保留即時找到的 leaf，避免保存時遺失其他檔案。
                const capturedIds = new Set(leaves.map((leaf) => leaf.id));
                windowLeaves.forEach((leaf) => {
                    var _a;
                    const id = leaf.id || this.generateId();
                    if (capturedIds.has(id))
                        return;
                    const viewState = typeof leaf.getViewState === "function"
                        ? leaf.getViewState()
                        : {};
                    leaves.push({
                        id,
                        type: viewState.type || ((_a = leaf.view) === null || _a === void 0 ? void 0 : _a.getViewType()) || "unknown",
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
        var _a, _b, _c, _d, _e;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // 驗證佈局數據
                if (!this.validateLayout(layout)) {
                    throw new Error(t("errors.invalidData"));
                }
                // changeLayout 可能重建任一既有 WorkspaceWindow。所有 restore 都先
                // 保存 live popout；普通 Enter restore 不保留將被取代的目標名稱。
                const preservedWindowLayouts = this.capturePreservedWindowLayouts()
                    .filter((snapshot) => options.forceNewWindow || snapshot.window !== options.targetWindow);
                const savedLeaves = this.getSavedViewStates(layout);
                const savedLeafId = ((_a = layout.windowInfo) === null || _a === void 0 ? void 0 : _a.firstLeafId) || ((_b = savedLeaves[0]) === null || _b === void 0 ? void 0 : _b.id);
                let currentLayout = this.app.workspace.getLayout();
                let floatingWindows = this.getFloatingWindows(currentLayout);
                // 1. 嘗試尋找目標現有視窗
                let targetIndex = -1;
                let targetWin = null;
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
                        const popoutLeaf = this.app.workspace.openPopoutLeaf();
                        targetWin = this.getWindowForLeaf(popoutLeaf);
                        // 等待 Popout 視窗誕生
                        yield new Promise((resolve) => setTimeout(resolve, 150));
                        // 重新讀取最新的 Layout
                        currentLayout = this.app.workspace.getLayout();
                        floatingWindows = this.getFloatingWindows(currentLayout);
                        // 新開的視窗位於 floating 陣列末尾
                        targetIndex = floatingWindows.length - 1;
                    }
                }
                // 3. 只替換目標 window 的 children，保留 floating container 與
                // window id。Obsidian 1.12 的 floating schema 是：
                // floating object -> window children -> split/tabs/leaf；不能把
                // floating 當成陣列，也不能直接用 leaf/split 覆蓋 window。
                if (targetIndex >= 0 && ((_c = layout.workspace) === null || _c === void 0 ? void 0 : _c.layout)) {
                    const currentFloatingWindow = floatingWindows[targetIndex];
                    const restoredWindow = this.prepareFloatingWindowForRestore(layout.workspace.layout, currentFloatingWindow);
                    if (((_d = currentLayout.floating) === null || _d === void 0 ? void 0 : _d.type) === "floating" && Array.isArray(currentLayout.floating.children)) {
                        currentLayout.floating.children = currentLayout.floating.children.map((child, idx) => (idx === targetIndex ? restoredWindow : child));
                    }
                    else if (Array.isArray(currentLayout.floating)) {
                        currentLayout.floating[targetIndex] = restoredWindow;
                    }
                    yield this.app.workspace.changeLayout(currentLayout);
                }
                yield new Promise((resolve) => setTimeout(resolve, 150));
                // 4. 取得目標 Popout 視窗的 DOM Window 並安全開啟所有檔案。
                // changeLayout 可能會重建 leaf，因此若原 ID 不再存在，改用還原後
                // 同一視窗中匹配最多保存 leaf 的方式辨識目標視窗。
                // changeLayout 會清除並重新建立 WorkspaceWindow，舊的 targetWin
                // 可能已經被關閉；但 forceNewWindow 時來源視窗可能仍包含相同的
                // leaf ID，不能只依 saved leaf ID 找視窗，否則會把檔案開回來源視窗。
                const preferredTargetWin = targetWin;
                targetWin = this.findWindowForSavedLeaves(savedLeaves, options.forceNewWindow ? options.targetWindow : undefined, preferredTargetWin) || targetWin;
                let missingFiles = [];
                if (options.validateFiles !== false && savedLeaves.length > 0) {
                    missingFiles = yield this.restoreFileStatesForWindow(targetWin, savedLeaves, (_e = layout.workspace) === null || _e === void 0 ? void 0 : _e.activeFile);
                }
                // 5. 調整視窗尺寸與座標，並聚焦視窗
                if (targetWin) {
                    this.restoreWindowGeometry(targetWin, layout.windowState);
                    if (typeof targetWin.focus === "function") {
                        try {
                            targetWin.focus();
                        }
                        catch (e) {
                            console.warn("Failed to focus target window:", e);
                        }
                    }
                }
                this.setLayoutLabelForWindow(targetWin, layout.name);
                this.restorePreservedWindowLabels(preservedWindowLayouts, targetWin);
                this.refreshLayoutLabels();
                if (options.showNotifications !== false) {
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
                throw new Error(`${t("errors.failedToRestore")}: ${(error === null || error === void 0 ? void 0 : error.message) || error}`);
            }
        });
    }
    /**
     * 獲取所有保存的佈局 (按建立時間降序排列，最新儲存的在最上面)
     */
    getSavedLayouts() {
        const settings = this.plugin.settings;
        const layouts = settings.layouts || [];
        const sortBy = settings.sortBy || "updated-desc";
        return [...layouts].sort((a, b) => {
            const aCreated = a.createdAt || a.timestamp || 0;
            const bCreated = b.createdAt || b.timestamp || 0;
            const aUpdated = a.updatedAt || a.timestamp || aCreated;
            const bUpdated = b.updatedAt || b.timestamp || bCreated;
            switch (sortBy) {
                case "updated-desc":
                    return bUpdated - aUpdated;
                case "updated-asc":
                    return aUpdated - bUpdated;
                case "created-desc":
                    return bCreated - aCreated;
                case "created-asc":
                    return aCreated - bCreated;
                case "name-asc":
                    return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" });
                case "name-desc":
                    return b.name.localeCompare(a.name, undefined, { numeric: true, sensitivity: "base" });
                default:
                    return bUpdated - aUpdated;
            }
        });
    }
    /**
     * 保存佈局到存儲
     */
    saveLayout(layout) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const settings = this.plugin.settings;
                if (!settings.layouts) {
                    settings.layouts = [];
                }
                const now = Date.now();
                const existingIndex = settings.layouts.findIndex((l) => l.name === layout.name);
                const isOverwrite = existingIndex >= 0;
                if (isOverwrite) {
                    const existing = settings.layouts[existingIndex];
                    layout.id = existing.id;
                    layout.createdAt = existing.createdAt || existing.timestamp || now;
                    layout.updatedAt = now;
                    layout.timestamp = now;
                    settings.layouts[existingIndex] = layout;
                }
                else {
                    // 全新建立 (由 A 複製/改名另存為 B 時，重設 B 的 createdAt 為當時時間)
                    layout.createdAt = now;
                    layout.updatedAt = now;
                    layout.timestamp = now;
                    settings.layouts.push(layout);
                }
                // 限制佈局數量
                if (settings.maxLayouts &&
                    settings.layouts.length > settings.maxLayouts) {
                    settings.layouts = settings.layouts.slice(-settings.maxLayouts);
                }
                yield this.plugin.saveSettings();
                const sourceWindow = this.getWindowForLayout(layout);
                this.setLayoutLabelForWindow(sourceWindow, layout.name);
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
                const index = settings.layouts.findIndex((l) => l.id === layoutId);
                if (index >= 0) {
                    const deletedLayout = settings.layouts[index];
                    settings.layouts.splice(index, 1);
                    yield this.plugin.saveSettings();
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
     * 獲取當前活發對應的 DOM Window (包含當前命令發起所在 Popout 視窗)
     */
    getActiveWindow() {
        const activeLeaf = this.getActiveLeafForCurrentWindow();
        if (activeLeaf && activeLeaf.containerEl) {
            const ownerDocument = activeLeaf.containerEl.ownerDocument;
            if (ownerDocument && ownerDocument.defaultView) {
                return ownerDocument.defaultView;
            }
        }
        return typeof activeWindow !== "undefined" ? activeWindow : window;
    }
    /**
     * 獲取當前視窗狀態
     */
    getCurrentWindowState() {
        const activeLeaf = this.getActiveLeafForCurrentWindow();
        let currentWindow = typeof activeWindow !== "undefined" ? activeWindow : window;
        if (activeLeaf && activeLeaf.containerEl) {
            const ownerDocument = activeLeaf.containerEl.ownerDocument;
            if (ownerDocument && ownerDocument.defaultView) {
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
            const root = typeof leaf.getRoot === "function"
                ? leaf.getRoot()
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
    prepareFloatingWindowForRestore(savedLayout, currentWindow) {
        const saved = JSON.parse(JSON.stringify(savedLayout));
        if ((currentWindow === null || currentWindow === void 0 ? void 0 : currentWindow.type) === "window") {
            if (saved.type === "window") {
                return Object.assign(Object.assign(Object.assign({}, currentWindow), saved), { id: currentWindow.id, children: Array.isArray(saved.children)
                        ? saved.children.map((child) => this.normalizeFloatingLayout(child))
                        : [] });
            }
            return Object.assign(Object.assign({}, currentWindow), { children: [this.normalizeFloatingLayout(saved)] });
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
     * 根據 Pinned 檔案、Active 檔案與檔案數量自動產生智慧佈局名稱 (UX-006)
     */
    generateSmartLayoutName(layout) {
        var _a;
        const leaves = this.getSavedViewStates(layout);
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
        if (typeof ((_a = leafState.state) === null || _a === void 0 ? void 0 : _a.file) === "string")
            return leafState.state.file;
        if (typeof ((_c = (_b = leafState.state) === null || _b === void 0 ? void 0 : _b.state) === null || _c === void 0 ? void 0 : _c.file) === "string")
            return leafState.state.state.file;
        if (typeof leafState.file === "string")
            return leafState.file;
        return null;
    }
    /**
     * 恢復檔案狀態 (在對應現有分頁中安全開立檔案，尊重原生 Layout)
     */
    restoreFileStatesForWindow(targetWin, leaves, activeFilePath) {
        var _a, _b, _c;
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
            if (totalFiles > 1) {
                progressNotice = new obsidian.Notice(`🔄 ${t("restoreModal.restoringLayout")}... (0/${totalFiles})`, 0);
            }
            let processedCount = 0;
            for (let i = 0; i < leaves.length; i++) {
                const leafState = leaves[i];
                const filePath = this.getFilePathFromLeafState(leafState);
                if (!filePath)
                    continue;
                processedCount++;
                if (progressNotice) {
                    progressNotice.setMessage(`🔄 ${t("restoreModal.restoringLayout")}... (${processedCount}/${totalFiles})`);
                }
                let targetLeaf = leavesById.get(leafState.id) || null;
                if (i < windowLeaves.length && !targetLeaf)
                    targetLeaf = windowLeaves[i];
                const file = this.app.vault.getAbstractFileByPath(filePath);
                if (file instanceof obsidian.TFile) {
                    if (targetLeaf) {
                        const viewMode = ((_a = leafState.state) === null || _a === void 0 ? void 0 : _a.mode) || ((_c = (_b = leafState.state) === null || _b === void 0 ? void 0 : _b.state) === null || _c === void 0 ? void 0 : _c.mode);
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
            if (targetActiveLeaf) {
                try {
                    this.app.workspace.setActiveLeaf(targetActiveLeaf, { focus: true });
                }
                catch (e) {
                    console.warn("Failed to set active leaf:", e);
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
                yield new Promise((resolve) => setTimeout(resolve, 50));
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
    findWindowForSavedLeaves(leaves, excludedWindow, preferredWindow, claimedWindows = new Set()) {
        if (leaves.length === 0)
            return null;
        const savedIds = new Set(leaves.map((leaf) => leaf.id));
        const savedFiles = new Set(leaves
            .map((leaf) => this.getFilePathFromLeafState(leaf))
            .filter((filePath) => !!filePath));
        const windows = new Map();
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
            const score = (windows.get(targetWindow) || 0) +
                (savedIds.has(leaf.id) ? 100 : 0) +
                (filePath && savedFiles.has(filePath) ? 10 : 0);
            windows.set(targetWindow, score);
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
        if (bestWindow)
            return bestWindow;
        // 首次 restore 時若 Obsidian 已重建 leaf ID，但目前只有一個 popout，
        // 該視窗就是唯一合法目標。
        return windows.size === 1 ? Array.from(windows.keys())[0] : null;
    }
    /**
     * 將 restore 前保存的所有 layout 名稱，一對一重新綁定到 restore 後的
     * live popout。目標新視窗與已配對視窗不會被重複使用。
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
            this.restoreWindowGeometry(currentWindow, snapshot.windowState);
            claimedWindows.add(currentWindow);
        });
    }
    /** 在 changeLayout 重建 popout 後恢復實際視窗尺寸與座標。 */
    restoreWindowGeometry(targetWin, windowState) {
        if (!windowState)
            return;
        const size = windowState.size;
        if (size &&
            size.width > 0 &&
            size.height > 0 &&
            typeof targetWin.resizeTo === "function") {
            targetWin.resizeTo(size.width, size.height);
        }
        if (windowState.position && typeof targetWin.moveTo === "function") {
            targetWin.moveTo(windowState.position.x, windowState.position.y);
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
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
}

class SaveLayoutModal extends obsidian.Modal {
    constructor(app, plugin, layout, onSubmit) {
        super(app);
        this.plugin = plugin;
        this.layout = layout;
        this.onSubmit = onSubmit;
    }
    onOpen() {
        var _a;
        this.modalEl.addClass("window-layouts-modal");
        this.setTitle(t("saveModal.title"));
        const { contentEl } = this;
        contentEl.empty();
        contentEl.addClass("window-spaces-modal");
        // 名稱輸入與動態同名提示
        let nameInput;
        const nameSetting = new obsidian.Setting(contentEl)
            .setName(t("saveModal.nameLabel"))
            .addText((text) => {
            nameInput = text.inputEl;
            text.inputEl.value = this.layout.name || this.generateDefaultName();
            text.inputEl.focus();
            text.inputEl.select();
            text.inputEl.addEventListener("keydown", (e) => {
                if (e.key === "Enter") {
                    e.preventDefault();
                    void this.submitForm(nameInput, includeGeometry, autoSave);
                }
            });
        });
        nameSetting.settingEl.addClass("window-spaces-setting-full-width");
        const noticeContainer = contentEl.createDiv("save-overwrite-notice");
        noticeContainer.style.fontSize = "var(--font-ui-smaller, 12px)";
        noticeContainer.style.color = "var(--text-accent, #70a7ff)";
        noticeContainer.style.marginTop = "-8px";
        noticeContainer.style.marginBottom = "12px";
        noticeContainer.style.paddingLeft = "2px";
        let autoSave = (_a = this.layout.autoSave) !== null && _a !== void 0 ? _a : false;
        let autoSaveToggleComponent = null;
        // 佈局資訊顯示
        const i18n = getI18n();
        const infoEl = contentEl.createDiv();
        infoEl.createEl("h3", { text: t("saveModal.infoSection") });
        const infoList = infoEl.createEl("ul");
        infoList.createEl("li", {
            text: `${t("manageModal.fileCount")}: ${this.layout.metadata.fileCount}`,
        });
        infoList.createEl("li", {
            text: `${t("manageModal.createdDate")}: ${i18n.formatDate(new Date(this.layout.timestamp))}`,
        });
        infoList.createEl("li", {
            text: `${t("saveModal.windowSize")}: ${this.layout.windowState.size.width} x ${this.layout.windowState.size.height}`,
        });
        // 選項
        let includeGeometry = this.layout.windowState.position !== undefined ||
            (this.layout.windowState.size && this.layout.windowState.size.width > 0);
        new obsidian.Setting(contentEl)
            .setName(t("saveModal.includeGeometry"))
            .setDesc(t("saveModal.includeGeometryDesc"))
            .addToggle((toggle) => {
            toggle.setValue(includeGeometry);
            toggle.onChange((value) => {
                includeGeometry = value;
            });
        });
        new obsidian.Setting(contentEl)
            .setName(t("saveModal.autoSaveToggle"))
            .addToggle((toggle) => {
            autoSaveToggleComponent = toggle;
            toggle.setValue(autoSave);
            toggle.onChange((value) => {
                autoSave = value;
            });
        });
        const checkDuplicateName = () => {
            var _a, _b;
            const currentName = (nameInput === null || nameInput === void 0 ? void 0 : nameInput.value.trim()) || "";
            if (!currentName) {
                noticeContainer.setText("");
                return;
            }
            const existingLayouts = ((_b = (_a = this.plugin) === null || _a === void 0 ? void 0 : _a.manager) === null || _b === void 0 ? void 0 : _b.getSavedLayouts()) || [];
            const match = existingLayouts.find((l) => l.name === currentName);
            if (match) {
                noticeContainer.setText(`ℹ️ ${t("saveModal.overwriteNotice")}「${currentName}」`);
                if (autoSaveToggleComponent && match.autoSave !== undefined) {
                    autoSave = !!match.autoSave;
                    autoSaveToggleComponent.setValue(autoSave);
                }
            }
            else {
                noticeContainer.setText("");
            }
        };
        nameInput.addEventListener("input", checkDuplicateName);
        checkDuplicateName();
        // 按鈕
        const buttonContainer = contentEl.createDiv();
        buttonContainer.style.textAlign = "right";
        buttonContainer.style.marginTop = "20px";
        const cancelButton = buttonContainer.createEl("button", {
            text: t("common.cancel"),
        });
        cancelButton.onclick = () => this.close();
        const saveButton = buttonContainer.createEl("button", {
            text: t("common.save"),
            cls: "mod-cta",
        });
        saveButton.style.marginLeft = "10px";
        saveButton.onclick = () => {
            void this.submitForm(nameInput, includeGeometry, autoSave);
        };
        setTimeout(() => nameInput === null || nameInput === void 0 ? void 0 : nameInput.focus(), 50);
    }
    submitForm(nameInput, includeGeometry, autoSave) {
        return __awaiter(this, void 0, void 0, function* () {
            const name = nameInput.value.trim();
            if (!name) {
                new obsidian.Notice(t("saveModal.emptyNameError"));
                nameInput.focus();
                return;
            }
            // 更新佈局數據
            this.layout.name = name;
            this.layout.autoSave = autoSave;
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
        var _a, _b;
        if ((_b = (_a = this.plugin) === null || _a === void 0 ? void 0 : _a.manager) === null || _b === void 0 ? void 0 : _b.generateSmartLayoutName) {
            return this.plugin.manager.generateSmartLayoutName(this.layout);
        }
        const now = new Date();
        const i18n = getI18n();
        const dateStr = i18n.formatDate(now);
        return `${t("saveModal.title")} ${dateStr}`;
    }
}

/**
 * 統一的 Window Layouts 視窗：搜尋、恢復與管理都在同一個入口完成。
 */
class WindowLayoutsModal extends obsidian.Modal {
    constructor(app, plugin, targetWindow) {
        super(app);
        this.filteredLayouts = [];
        this.selectedIndex = 0;
        this.plugin = plugin;
        this.targetWindow = targetWindow;
    }
    onOpen() {
        var _a, _b;
        this.modalEl.addClass("window-layouts-modal");
        // Modal 實際所在的 document 是鍵盤 Enter 操作最可靠的來源視窗。
        // Command Palette / activeLeaf 可能仍指向另一個 popout。
        const modalWindow = (_a = this.modalEl.ownerDocument) === null || _a === void 0 ? void 0 : _a.defaultView;
        const modalBody = (_b = modalWindow === null || modalWindow === void 0 ? void 0 : modalWindow.document) === null || _b === void 0 ? void 0 : _b.body;
        if (modalWindow &&
            modalBody &&
            (modalBody.classList.contains("is-popout-window") ||
                modalBody.classList.contains("mod-popout"))) {
            this.targetWindow = modalWindow;
        }
        this.setTitle(t("common.windowLayouts"));
        // 隱藏原生的 modal-close-button，避免觸發 Obsidian 原生 close()
        const nativeCloseBtn = this.containerEl.querySelector(".modal-close-button");
        if (nativeCloseBtn) {
            nativeCloseBtn.style.display = "none";
        }
        // 在 modal-title 內建立專屬的齒輪 (⚙️) 排序與選項按鈕
        const titleHeader = this.containerEl.querySelector(".modal-title");
        if (titleHeader) {
            titleHeader.style.display = "flex";
            titleHeader.style.alignItems = "center";
            titleHeader.style.justifyContent = "space-between";
            titleHeader.style.width = "100%";
            let gearBtn = titleHeader.querySelector(".window-layouts-gear-btn");
            if (!gearBtn) {
                gearBtn = titleHeader.createEl("div", {
                    cls: "clickable-icon window-layouts-gear-btn",
                });
                obsidian.setIcon(gearBtn, "gear");
                obsidian.setTooltip(gearBtn, t("manageModal.sortDateDesc"));
                gearBtn.style.cursor = "pointer";
                gearBtn.style.marginLeft = "auto";
                gearBtn.onclick = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.showSortMenu(e);
                };
            }
        }
        // 註冊 Obsidian Scope 鍵盤導覽
        this.scope.register([], "ArrowDown", (evt) => {
            this.handleArrowKey(1);
            evt.preventDefault();
            return false;
        });
        this.scope.register([], "ArrowUp", (evt) => {
            this.handleArrowKey(-1);
            evt.preventDefault();
            return false;
        });
        // 捕獲階段全域 Keydown 監聽（無論焦點在標題、空白處還是任何元素上均 100% 生效）
        const targetDoc = this.modalEl.ownerDocument || document;
        this.keydownListener = (event) => {
            if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                event.preventDefault();
                event.stopPropagation();
                this.handleArrowKey(event.key === "ArrowDown" ? 1 : -1);
            }
            else if (event.key === "Enter") {
                const activeEl = targetDoc.activeElement;
                if (activeEl && activeEl.tagName === "BUTTON") {
                    return;
                }
                event.preventDefault();
                event.stopPropagation();
                const targetIndex = this.selectedIndex >= 0 ? this.selectedIndex : 0;
                const selectedLayout = this.filteredLayouts[targetIndex];
                if (selectedLayout)
                    void this.restoreLayout(selectedLayout, !event.shiftKey);
            }
        };
        targetDoc.addEventListener("keydown", this.keydownListener, true);
        const { contentEl } = this;
        contentEl.empty();
        contentEl.addClass("window-spaces-modal");
        const toolbar = contentEl.createDiv("window-layouts-toolbar");
        this.searchInput = toolbar.createEl("input");
        this.searchInput.type = "search";
        this.searchInput.placeholder = t("manageModal.searchPlaceholder");
        this.searchInput.setAttribute("aria-label", t("manageModal.searchPlaceholder"));
        this.searchInput.addEventListener("input", () => {
            this.selectedIndex = 0;
            this.renderLayouts();
        });
        const newWinButton = toolbar.createEl("button", {
            text: `+ ${t("common.newWindow")}`,
            cls: "mod-cta qsp-action-btn",
        });
        obsidian.setTooltip(newWinButton, t("common.newWindow"));
        newWinButton.onclick = () => {
            this.close();
            this.plugin.manager.openNewPopoutWindow();
        };
        this.listEl = contentEl.createDiv("window-layouts-list");
        this.listEl.setAttribute("role", "listbox");
        this.renderLayouts();
        const instructionsEl = contentEl.createDiv("prompt-instructions window-layouts-instructions");
        const navInst = instructionsEl.createDiv("prompt-instruction");
        navInst.createEl("span", { text: "↑ ↓", cls: "prompt-instruction-command" });
        navInst.createEl("span", { text: t("instructions.navigate") });
        const useInst = instructionsEl.createDiv("prompt-instruction");
        useInst.createEl("span", { text: "Shift ↵", cls: "prompt-instruction-command" });
        useInst.createEl("span", { text: t("instructions.use") });
        const newWinInst = instructionsEl.createDiv("prompt-instruction");
        newWinInst.createEl("span", { text: "↵", cls: "prompt-instruction-command" });
        newWinInst.createEl("span", { text: t("instructions.useNewWindow") });
        const dismissInst = instructionsEl.createDiv("prompt-instruction");
        dismissInst.createEl("span", { text: "esc", cls: "prompt-instruction-command" });
        dismissInst.createEl("span", { text: t("instructions.dismiss") });
        window.setTimeout(() => { var _a; return (_a = this.searchInput) === null || _a === void 0 ? void 0 : _a.focus(); }, 50);
    }
    handleArrowKey(direction) {
        if (this.filteredLayouts.length === 0)
            return;
        if (this.selectedIndex < 0) {
            this.selectedIndex = direction > 0 ? 0 : this.filteredLayouts.length - 1;
        }
        else {
            this.selectedIndex =
                (this.selectedIndex + direction + this.filteredLayouts.length) % this.filteredLayouts.length;
        }
        this.renderLayouts();
        this.scrollSelectedIntoView();
    }
    renderLayouts() {
        var _a;
        if (!this.listEl)
            return;
        this.listEl.empty();
        const query = ((_a = this.searchInput) === null || _a === void 0 ? void 0 : _a.value.trim().toLowerCase()) || "";
        this.filteredLayouts = this.plugin.manager
            .getSavedLayouts()
            .filter((layout) => !query || layout.name.toLowerCase().includes(query));
        if (this.filteredLayouts.length > 0) {
            if (this.selectedIndex < 0 || this.selectedIndex >= this.filteredLayouts.length) {
                this.selectedIndex = 0;
            }
        }
        else {
            this.selectedIndex = -1;
        }
        if (this.filteredLayouts.length === 0) {
            this.listEl.createEl("p", {
                text: t("manageModal.noLayoutsMessage"),
                cls: "setting-item-description",
            });
            return;
        }
        this.filteredLayouts.forEach((layout, index) => {
            this.renderLayoutItem(layout, index);
        });
    }
    renderLayoutItem(layout, index) {
        var _a;
        const layoutEl = this.listEl.createDiv("suggestion-item window-layout-item");
        layoutEl.setAttribute("role", "option");
        layoutEl.setAttribute("aria-selected", String(index === this.selectedIndex));
        if (index === this.selectedIndex)
            layoutEl.addClass("is-selected");
        this.setFilesTooltipForLayout(layoutEl, layout);
        let holdTimer = null;
        let isLongPress = false;
        const isActionButtonTarget = (target) => { var _a; return Boolean((_a = target === null || target === void 0 ? void 0 : target.closest) === null || _a === void 0 ? void 0 : _a.call(target, "button")); };
        const cancelHold = () => {
            if (holdTimer) {
                clearTimeout(holdTimer);
                holdTimer = null;
            }
        };
        // Long press works across the whole layout item. Action buttons keep their
        // own behavior and are intentionally excluded from the parent timer.
        layoutEl.addEventListener("mousedown", (e) => {
            if (e.button !== 0 || isActionButtonTarget(e.target))
                return;
            isLongPress = false;
            holdTimer = setTimeout(() => {
                isLongPress = true;
                void this.restoreLayout(layout, false);
            }, 450);
        });
        layoutEl.addEventListener("mouseup", cancelHold);
        layoutEl.addEventListener("mouseleave", cancelHold);
        layoutEl.addEventListener("click", (e) => {
            if (isActionButtonTarget(e.target))
                return;
            if (isLongPress) {
                isLongPress = false;
                return;
            }
            const forceNewWindow = !e.shiftKey;
            void this.restoreLayout(layout, forceNewWindow);
        });
        const itemContentEl = layoutEl.createDiv("suggestion-content qsp-content");
        const titleEl = itemContentEl.createDiv({
            cls: "suggestion-title qsp-title",
        });
        titleEl.createSpan({ text: layout.name });
        if (layout.autoSave) {
            const autoSaveBadge = titleEl.createSpan({
                cls: "layout-auto-save-badge",
            });
            obsidian.setIcon(autoSaveBadge, "refresh-cw");
            obsidian.setTooltip(autoSaveBadge, t("manageModal.autoSaveEnabled"));
        }
        const noteEl = itemContentEl.createDiv("suggestion-note qsp-note");
        const i18n = getI18n();
        const pathEl = noteEl.createDiv("qsp-path");
        pathEl.createEl("span", {
            text: `${t("manageModal.updatedDate")}: ${i18n.formatDate(new Date(layout.updatedAt || layout.timestamp || layout.createdAt || Date.now()))}`,
            cls: "layout-date",
        });
        pathEl.createEl("span", {
            text: `${t("manageModal.fileCount")}: ${((_a = layout.metadata) === null || _a === void 0 ? void 0 : _a.fileCount) || 0}`,
            cls: "layout-files",
        });
        const actionsEl = layoutEl.createDiv("suggestion-aux qsp-aux layout-actions");
        const restoreButton = actionsEl.createEl("button", {
            text: t("common.restore"),
        });
        obsidian.setTooltip(restoreButton, t("restoreModal.restoreHint"));
        restoreButton.addEventListener("mousedown", (e) => {
            if (e.button !== 0)
                return;
            isLongPress = false;
            holdTimer = setTimeout(() => {
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
            cls: "clickable-icon layout-more-btn",
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
                this.close();
                yield this.plugin.manager.restoreLayout(layout, {
                    // forceNewWindow 只控制 restore 的目標是否新建；仍需傳入來源視窗，
                    // 讓 manager 能保留該 popout 原本的 layout 名稱與狀態列。
                    targetWindow: this.targetWindow,
                    forceNewWindow,
                });
            }
            catch (error) {
                new obsidian.Notice(`${t("errors.failedToRestore")}: ${(error === null || error === void 0 ? void 0 : error.message) || error}`);
            }
        });
    }
    scrollSelectedIntoView() {
        const selected = this.listEl.querySelector(".window-layout-item.is-selected");
        selected === null || selected === void 0 ? void 0 : selected.scrollIntoView({ block: "nearest" });
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
            const buttonContainer = modal.contentEl.createDiv();
            buttonContainer.style.textAlign = "right";
            buttonContainer.style.marginTop = "20px";
            const cancelButton = buttonContainer.createEl("button", {
                text: t("common.cancel"),
            });
            cancelButton.onclick = () => modal.close();
            const saveButton = buttonContainer.createEl("button", {
                text: t("common.save"),
                cls: "mod-cta",
            });
            saveButton.style.marginLeft = "10px";
            const submit = () => __awaiter(this, void 0, void 0, function* () {
                const newName = input.value.trim();
                if (!newName) {
                    new obsidian.Notice(t("saveModal.emptyNameError"));
                    input.focus();
                    return;
                }
                const duplicate = this.plugin.settings.layouts.some((item) => item.id !== layout.id && item.name === newName);
                if (duplicate) {
                    new obsidian.Notice(t("saveModal.duplicateNameError"));
                    input.focus();
                    return;
                }
                layout.name = newName;
                yield this.plugin.saveSettings();
                modal.close();
                this.renderLayouts();
                new obsidian.Notice(t("notifications.layoutRenamed"));
            });
            saveButton.onclick = submit;
        };
        modal.onClose = () => modal.contentEl.empty();
        modal.open();
    }
    showDeleteDialog(layout) {
        this.showConfirmDialog(`${t("manageModal.confirmDeleteMessage")}\n\n${layout.name}`, t("manageModal.confirmDeleteTitle")).then((confirmed) => __awaiter(this, void 0, void 0, function* () {
            if (!confirmed)
                return;
            try {
                yield this.plugin.manager.deleteLayout(layout.id);
                this.renderLayouts();
            }
            catch (error) {
                new obsidian.Notice(`${t("errors.failedToDelete")}: ${(error === null || error === void 0 ? void 0 : error.message) || error}`);
            }
        }));
    }
    showConfirmDialog(message, title = t("common.confirm")) {
        return new Promise((resolve) => {
            const modal = new obsidian.Modal(this.app);
            modal.setTitle(title);
            modal.onOpen = () => {
                modal.contentEl.createEl("p", { text: message });
                const buttonContainer = modal.contentEl.createDiv();
                buttonContainer.style.textAlign = "right";
                buttonContainer.style.marginTop = "20px";
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
                confirmButton.style.marginLeft = "10px";
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
        const leaves = this.plugin.manager.getSavedViewStates(layout);
        const files = [];
        leaves.forEach((leaf) => {
            const filePath = this.plugin.manager.getFilePathFromLeafState(leaf);
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
        const menu = new obsidian.Menu();
        const currentSort = this.plugin.settings.sortBy || "updated-desc";
        const addSortItem = (id, label, icon) => {
            menu.addItem((item) => {
                item
                    .setTitle(label)
                    .setIcon(icon)
                    .setChecked(currentSort === id)
                    .onClick(() => __awaiter(this, void 0, void 0, function* () {
                    this.plugin.settings.sortBy = id;
                    yield this.plugin.saveSettings();
                    this.selectedIndex = 0;
                    this.renderLayouts();
                }));
            });
        };
        addSortItem("updated-desc", t("manageModal.sortUpdatedDesc"), "history");
        addSortItem("updated-asc", t("manageModal.sortUpdatedAsc"), "history");
        addSortItem("created-desc", t("manageModal.sortCreatedDesc"), "calendar-days");
        addSortItem("created-asc", t("manageModal.sortCreatedAsc"), "calendar");
        addSortItem("name-asc", t("manageModal.sortNameAsc"), "sort-asc");
        addSortItem("name-desc", t("manageModal.sortNameDesc"), "sort-desc");
        const targetEl = event.currentTarget || this.modalEl;
        const rect = targetEl.getBoundingClientRect();
        menu.showAtPosition({
            x: Math.max(10, rect.right - 145),
            y: rect.bottom + 6,
        });
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
                new obsidian.Notice(layout.autoSave
                    ? `${layout.name}: ${t("manageModal.autoSaveEnabled")}`
                    : `${layout.name}: ${t("manageModal.autoSaveDisabled")}`);
                this.renderLayouts();
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
                this.close();
                this.plugin.openSaveLayoutModal(layout);
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
        const targetEl = event.currentTarget || this.modalEl;
        const rect = targetEl.getBoundingClientRect();
        menu.showAtPosition({
            x: Math.max(10, rect.right - 120),
            y: rect.bottom + 4,
        });
    }
    onClose() {
        if (this.keydownListener) {
            const targetDoc = this.modalEl.ownerDocument || document;
            targetDoc.removeEventListener("keydown", this.keydownListener, true);
        }
        this.contentEl.empty();
    }
}

class WindowSpacesSettingTab extends obsidian.PluginSettingTab {
    constructor(app, plugin) {
        super(app, plugin);
        this.autoSaveTimeout = null;
        this.plugin = plugin;
    }
    display() {
        const { containerEl } = this;
        containerEl.empty();
        containerEl.createEl("h2", { text: t("settings.title") });
        // 一般設定
        containerEl.createEl("h3", { text: t("settings.autoSaveSection") });
        new obsidian.Setting(containerEl)
            .setName(t("settings.showNotifications"))
            .setDesc(t("settings.showNotificationsDesc"))
            .addToggle((toggle) => {
            toggle.setValue(this.plugin.settings.showNotifications !== false);
            toggle.onChange((value) => __awaiter(this, void 0, void 0, function* () {
                this.plugin.settings.showNotifications = value;
                yield this.plugin.saveSettings();
            }));
        });
        new obsidian.Setting(containerEl)
            .setName(t("settings.autoSaveEnabled"))
            .setDesc(t("settings.autoSaveDescription"))
            .addToggle((toggle) => {
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
        containerEl.createEl("h3", { text: t("settings.layoutDisplaySection") });
        new obsidian.Setting(containerEl)
            .setName(t("settings.showLayoutStatusBar"))
            .setDesc(t("settings.showLayoutStatusBarDesc"))
            .addToggle((toggle) => {
            toggle.setValue(this.plugin.settings.showLayoutStatusBar === true);
            toggle.onChange((value) => __awaiter(this, void 0, void 0, function* () {
                this.plugin.settings.showLayoutStatusBar = value;
                yield this.plugin.saveSettings();
                this.plugin.manager.refreshLayoutLabels();
            }));
        });
        new obsidian.Setting(containerEl)
            .setName(t("settings.showWindowLayoutsRibbonIcon"))
            .setDesc(t("settings.showWindowLayoutsRibbonIconDesc"))
            .addToggle((toggle) => {
            toggle.setValue(this.plugin.settings.showWindowLayoutsRibbonIcon !== false);
            toggle.onChange((value) => __awaiter(this, void 0, void 0, function* () {
                this.plugin.settings.showWindowLayoutsRibbonIcon = value;
                yield this.plugin.saveSettings();
                this.plugin.refreshRibbonIcons();
            }));
        });
        new obsidian.Setting(containerEl)
            .setName(t("settings.maxLayouts"))
            .setDesc(t("settings.maxLayoutsDesc"))
            .addSlider((slider) => {
            slider
                .setLimits(0, 50, 1)
                .setValue(this.plugin.settings.maxLayouts || 20)
                .setDynamicTooltip()
                .onChange((value) => __awaiter(this, void 0, void 0, function* () {
                this.plugin.settings.maxLayouts = value;
                yield this.plugin.saveSettings();
            }));
        });
        // 佈局管理
        containerEl.createEl("h3", { text: t("settings.layoutsSection") });
        const layouts = this.plugin.manager.getSavedLayouts();
        if (layouts.length === 0) {
            containerEl.createEl("p", {
                text: t("settings.noLayouts"),
                cls: "setting-item-description",
            });
        }
        else {
            // 顯示佈局統計
            const statsEl = containerEl.createDiv();
            statsEl.addClass("layout-stats");
            statsEl.createEl("p", {
                text: tWithParams("settings.layoutStats", { count: layouts.length }),
                cls: "setting-item-description",
            });
            // 顯示每個佈局
            layouts.forEach((layout) => {
                var _a;
                const layoutContainer = containerEl.createDiv();
                layoutContainer.addClass("layout-setting-item");
                // 佈局名稱和基本信息
                const headerEl = layoutContainer.createDiv();
                headerEl.addClass("layout-header");
                headerEl.createEl("div", {
                    text: layout.name,
                    cls: "layout-name",
                });
                const infoEl = headerEl.createEl("div", {
                    cls: "layout-info",
                });
                const fileCountText = tWithParams("settings.includesFiles", { count: ((_a = layout.metadata) === null || _a === void 0 ? void 0 : _a.fileCount) || 0 });
                infoEl.createEl("span", {
                    text: fileCountText,
                    cls: "layout-file-count",
                });
                infoEl.createEl("span", {
                    text: new Date(layout.timestamp).toLocaleDateString(),
                    cls: "layout-date",
                });
                // 操作按鈕
                const actionsEl = layoutContainer.createDiv();
                actionsEl.addClass("layout-actions");
                const restoreBtn = actionsEl.createEl("button", {
                    text: t("common.restore"),
                    cls: "mod-cta",
                });
                restoreBtn.onclick = () => __awaiter(this, void 0, void 0, function* () {
                    try {
                        yield this.plugin.manager.restoreLayout(layout);
                    }
                    catch (error) {
                        new obsidian.Notice(`${t("errors.failedToRestore")}: ${error.message}`);
                    }
                });
                const renameBtn = actionsEl.createEl("button", {
                    text: t("common.rename"),
                });
                renameBtn.onclick = () => {
                    this.showRenameDialog(layout);
                };
                const deleteBtn = actionsEl.createEl("button", {
                    text: t("common.delete"),
                    cls: "mod-warning",
                });
                deleteBtn.onclick = () => {
                    this.showDeleteDialog(layout);
                };
            });
        }
        // 危險操作
        containerEl.createEl("h3", { text: t("settings.resetSettings") });
        new obsidian.Setting(containerEl)
            .setName(t("settings.resetSettings"))
            .setDesc(t("settings.resetSettingsDescription"))
            .addButton((button) => {
            button
                .setButtonText(t("settings.resetButton"))
                .setWarning()
                .onClick(() => __awaiter(this, void 0, void 0, function* () {
                const confirmed = yield this.showConfirmDialog(t("settings.resetConfirmMessage"), t("settings.resetConfirmTitle"));
                if (confirmed) {
                    this.plugin.settings.layouts = [];
                    yield this.plugin.saveSettings();
                    this.display(); // 重新顯示設定頁面
                    new obsidian.Notice(t("settings.resetSuccess"));
                }
            }));
        });
    }
    setupAutoSave() {
        this.plugin.registerEvent(this.app.workspace.on("layout-change", () => {
            if (this.plugin.settings.autoSave) {
                if (this.autoSaveTimeout) {
                    clearTimeout(this.autoSaveTimeout);
                }
                this.autoSaveTimeout = setTimeout(() => __awaiter(this, void 0, void 0, function* () {
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
        if (this.autoSaveTimeout) {
            clearTimeout(this.autoSaveTimeout);
            this.autoSaveTimeout = null;
        }
    }
    showRenameDialog(layout) {
        const modal = new obsidian.Modal(this.app);
        modal.setTitle(t("manageModal.renameButton"));
        modal.onOpen = () => {
            let input;
            const setting = new obsidian.Setting(modal.contentEl).setName(t("saveModal.nameLabel")).addText((text) => {
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
            const buttonContainer = modal.contentEl.createDiv();
            buttonContainer.style.textAlign = "right";
            buttonContainer.style.marginTop = "20px";
            const cancelBtn = buttonContainer.createEl("button", {
                text: t("common.cancel"),
            });
            cancelBtn.onclick = () => modal.close();
            const saveBtn = buttonContainer.createEl("button", {
                text: t("common.save"),
                cls: "mod-cta",
            });
            saveBtn.style.marginLeft = "10px";
            const submit = () => __awaiter(this, void 0, void 0, function* () {
                const newName = input.value.trim();
                if (newName && newName !== layout.name) {
                    layout.name = newName;
                    yield this.plugin.saveSettings();
                    this.display();
                    new obsidian.Notice(t("notifications.layoutRenamed"));
                }
                modal.close();
            });
            saveBtn.onclick = submit;
        };
        modal.open();
    }
    showDeleteDialog(layout) {
        this.showConfirmDialog(tWithParams("settings.confirmDelete", { name: layout.name }), t("manageModal.confirmDeleteTitle")).then((confirmed) => __awaiter(this, void 0, void 0, function* () {
            if (confirmed) {
                try {
                    yield this.plugin.manager.deleteLayout(layout.id);
                    this.display();
                    new obsidian.Notice(t("notifications.layoutDeleted"));
                }
                catch (error) {
                    new obsidian.Notice(`${t("errors.failedToDelete")}: ${error.message}`);
                }
            }
        }));
    }
    showConfirmDialog(message, title = t("common.confirm")) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve) => {
                const modal = new obsidian.Modal(this.app);
                modal.setTitle(title);
                modal.onOpen = () => {
                    modal.contentEl.createEl("p", { text: message });
                    const buttonContainer = modal.contentEl.createDiv();
                    buttonContainer.style.textAlign = "right";
                    buttonContainer.style.marginTop = "20px";
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
                    confirmBtn.style.marginLeft = "10px";
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

const DEFAULT_SETTINGS = {
    layouts: [],
    autoSave: false,
    showNotifications: true,
    maxLayouts: 20,
    version: "1.0.0",
    showLayoutStatusBar: true,
    layoutStatusBarDefaultApplied: false,
    showWindowLayoutsRibbonIcon: true,
    sortBy: "updated-desc",
};
class WindowSpacesPlugin extends obsidian.Plugin {
    constructor() {
        super(...arguments);
        this.windowLayoutsRibbonEl = null;
        this.autoSaveCleanup = null;
    }
    onload() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log("Loading Window Spaces plugin");
            // 初始化國際化
            initI18n(this.app);
            // 加載設定
            yield this.loadSettings();
            // 初始化管理器
            this.manager = new WindowLayoutManager(this);
            this.manager.registerExistingPopoutWindows();
            // 註冊命令
            this.registerCommands();
            // 刷新與添加 Ribbon 按鈕
            this.refreshRibbonIcons();
            // 添加設定頁面
            this.addSettingTab(new WindowSpacesSettingTab(this.app, this));
            // 設置事件監聽
            this.setupEventListeners();
            // 添加狀態欄指示器（可選）
            if (this.settings.showStatusBarIndicator === true) {
                this.addStatusBarIndicator();
            }
            console.log("Window Spaces plugin loaded successfully");
        });
    }
    onunload() {
        var _a, _b;
        console.log("Unloading Window Spaces plugin");
        (_a = this.windowLayoutsRibbonEl) === null || _a === void 0 ? void 0 : _a.remove();
        this.windowLayoutsRibbonEl = null;
        (_b = this.manager) === null || _b === void 0 ? void 0 : _b.clearLayoutLabels();
        // 清理自動保存
        if (this.autoSaveCleanup) {
            this.autoSaveCleanup();
        }
    }
    refreshRibbonIcons() {
        if (this.settings.showWindowLayoutsRibbonIcon) {
            if (!this.windowLayoutsRibbonEl) {
                this.windowLayoutsRibbonEl = this.addRibbonIcon("layout", t("commands.openLayouts"), () => this.openWindowLayoutsModal());
            }
        }
        else if (this.windowLayoutsRibbonEl) {
            this.windowLayoutsRibbonEl.remove();
            this.windowLayoutsRibbonEl = null;
        }
    }
    loadSettings() {
        return __awaiter(this, void 0, void 0, function* () {
            const savedSettings = yield this.loadData();
            this.settings = Object.assign({}, DEFAULT_SETTINGS, savedSettings);
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
                    new obsidian.Notice(`${t("errors.failedToSave")}: ${error.message}`);
                }
            }),
        });
        // 開啟統一的視窗佈局對話框
        this.addCommand({
            id: "open-window-layouts",
            name: t("commands.openLayouts"),
            icon: "layout",
            callback: () => this.openWindowLayoutsModal(),
        });
    }
    openSaveLayoutModal(layout) {
        const modal = new SaveLayoutModal(this.app, this, layout, (savedLayout) => __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.manager.saveLayout(savedLayout);
            }
            catch (error) {
                new obsidian.Notice(`${t("errors.failedToSave")}: ${error.message}`);
            }
        }));
        modal.open();
    }
    openSaveCurrentLayoutModal(targetWindow) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const layout = yield this.manager.captureCurrentLayout({}, targetWindow);
                this.openSaveLayoutModal(layout);
            }
            catch (error) {
                new obsidian.Notice(`${t("errors.failedToSave")}: ${(error === null || error === void 0 ? void 0 : error.message) || error}`);
            }
        });
    }
    openWindowLayoutsModal(targetWindow) {
        const win = targetWindow || (this.manager ? this.manager.getActiveWindow() : undefined);
        new WindowLayoutsModal(this.app, this, win).open();
    }
    setupEventListeners() {
        // 監聽視窗開關
        this.registerEvent(this.app.workspace.on("window-open", (_workspaceWindow, popoutWindow) => {
            this.manager.registerPopoutWindow(popoutWindow);
            console.log("New window opened");
        }));
        this.registerEvent(this.app.workspace.on("window-close", (_workspaceWindow, popoutWindow) => {
            this.manager.unregisterPopoutWindow(popoutWindow);
            console.log("Popout window closed");
        }));
        // 監聽 Workspace 分頁與佈局變化（用於特定 Layout 的 5 秒 Debounced 自動儲存）
        this.registerEvent(this.app.workspace.on("layout-change", () => {
            this.manager.checkAndDebouncedAutoSaveAll();
        }));
        this.registerEvent(this.app.workspace.on("active-leaf-change", () => {
            this.manager.checkAndDebouncedAutoSaveAll();
        }));
    }
    addStatusBarIndicator() {
        const statusBarItem = this.addStatusBarItem();
        statusBarItem.setText("Window Spaces");
        statusBarItem.onClickEvent((evt) => {
            if (evt.shiftKey) {
                // Shift+點擊：快速保存
                this.manager.captureCurrentLayout().then((layout) => {
                    this.openSaveLayoutModal(layout);
                });
            }
            else {
                // 普通點擊：顯示佈局列表
                this.openWindowLayoutsModal();
            }
        });
        // 添加工具提示
        statusBarItem.setAttribute("aria-label", "Window Spaces - Click to restore layout, Shift+Click to save layout");
    }
}

module.exports = WindowSpacesPlugin;
//# sourceMappingURL=main.js.map
