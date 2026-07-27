/**
 * 國際化翻譯接口
 */
export interface TranslationStrings {
  // 通用
  common: {
    save: string;
    restore: string;
    cancel: string;
    delete: string;
    rename: string;
    confirm: string;
    success: string;
    error: string;
    warning: string;
    loading: string;
    close: string;
    ok: string;
    layoutLabel: string;
    noLayout: string;
    newWindow: string;
    edit: string;
  };

  // 命令
  commands: {
    saveLayout: string;
    restoreLayout: string;
    manageLayouts: string;
  };

  // 保存對話框
  saveModal: {
    title: string;
    nameLabel: string;
    namePlaceholder: string;
    descriptionLabel: string;
    descriptionPlaceholder: string;
    infoSection: string;
    windowSize: string;
    includePosition: string;
    includePositionDesc: string;
    includeWindowSize: string;
    includeWindowSizeDesc: string;
    includeGeometry: string;
    includeGeometryDesc: string;
    andOthers: string;
    overwriteNotice: string;
    saveButton: string;
    cancelButton: string;
    emptyNameError: string;
    duplicateNameError: string;
    saveSuccess: string;
    autoSaveToggle: string;
  };

  // 恢復對話框
  restoreModal: {
    title: string;
    selectLayout: string;
    noLayoutsMessage: string;
    restoreButton: string;
    restoreHint: string;
    cancelButton: string;
    restoreSuccess: string;
    restoreError: string;
    includedFiles: string;
    restoringLayout: string;
  };

  // 管理對話框
  manageModal: {
    title: string;
    noLayoutsMessage: string;
    searchPlaceholder: string;
    saveCurrentButton: string;
    layoutName: string;
    createdDate: string;
    updatedDate: string;
    fileCount: string;
    actions: string;
    renameButton: string;
    deleteButton: string;
    confirmDeleteTitle: string;
    confirmDeleteMessage: string;
    deleteSuccess: string;
    renameSuccess: string;
    sortDateDesc: string;
    sortDateAsc: string;
    sortUpdatedDesc: string;
    sortUpdatedAsc: string;
    sortCreatedDesc: string;
    sortCreatedAsc: string;
    sortNameAsc: string;
    sortNameDesc: string;
    autoSaveEnabled: string;
    autoSaveDisabled: string;
  };

  // 設定頁面
  settings: {
    title: string;
    description: string;
    autoSaveSection: string;
    autoSaveDescription: string;
    autoSaveEnabled: string;
    showNotifications: string;
    showNotificationsDesc: string;
    layoutDisplaySection: string;
    showLayoutStatusBar: string;
    showLayoutStatusBarDesc: string;
    showRestoreRibbonIcon: string;
    showRestoreRibbonIconDesc: string;
    showManageRibbonIcon: string;
    showManageRibbonIconDesc: string;
    maxLayouts: string;
    maxLayoutsDesc: string;
    layoutStats: string;
    autoSaveInterval: string;
    minutes: string;
    layoutsSection: string;
    layoutsDescription: string;
    noLayouts: string;
    layoutInfo: string;
    createdOn: string;
    includesFiles: string;
    deleteLayout: string;
    confirmDelete: string;
    resetSettings: string;
    resetSettingsDescription: string;
    resetButton: string;
    resetConfirmTitle: string;
    resetConfirmMessage: string;
    resetSuccess: string;
  };

  // 通知
  notifications: {
    layoutSaved: string;
    layoutOverwritten: string;
    layoutRestored: string;
    layoutDeleted: string;
    layoutRenamed: string;
    settingsReset: string;
    errorOccurred: string;
    invalidLayout: string;
    cannotRestore: string;
    missingFilesNotice: string;
  };

  // 錯誤訊息
  errors: {
    failedToSave: string;
    failedToRestore: string;
    failedToDelete: string;
    failedToRename: string;
    layoutNotFound: string;
    invalidData: string;
    permissionDenied: string;
    notInPopoutWindow: string;
    unknownError: string;
  };

  // 底部提示訊息
  instructions: {
    navigate: string;
    use: string;
    useNewWindow: string;
    dismiss: string;
  };
}
