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
    windowLayouts: string;
    openAsPanel: string;
  };

  // 命令
  commands: {
    saveLayout: string;
    openLayouts: string;
    openLayoutsRibbon: string;
    openLayoutsPanel: string;
    openLayoutsPanelLeft: string;
    openLayoutsPanelRight: string;
    toggleLeftActivityBar: string;
    toggleRightActivityBar: string;
    toggleCurrentPaneGroup: string;
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
    iconLabel: string;
    iconPlaceholder: string;
    colorLabel: string;
    colorPresetLabel: string;
    clearColor: string;
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
    enterToCreate?: string;
    clearSearch?: string;
    saveCurrentButton: string;
    layoutName: string;
    createdDate: string;
    updatedDate: string;
    fileCount: string;
    tabCount: string;
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
    windowOpenBadge?: string;
    viewOptions?: string;
    groupBySection?: string;
    flatView?: string;
    showArchived?: string;
    hideArchived?: string;
    uncategorized?: string;
    archivedGroup?: string;
    archiveSpace?: string;
    unarchiveSpace?: string;
    archiveSuccess?: string;
    unarchiveSuccess?: string;
    renameSection?: string;
    sectionsLabel?: string;
    sectionsPlaceholder?: string;
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
    showWindowLayoutsRibbonIcon: string;
    showWindowLayoutsRibbonIconDesc: string;
    maxLayouts: string;
    maxLayoutsDesc: string;
    autoSaveInterval: string;
    minutes: string;
    resetSettings: string;
    resetSettingsDescription: string;
    resetButton: string;
    resetConfirmTitle: string;
    resetConfirmMessage: string;
    resetSuccess: string;
    popoutSidebarSection: string;
    activityBarSection: string;
    enableActivityBars: string;
    enableActivityBarsDesc: string;
    leftBar: string;
    rightBar: string;
    addView: string;
    removeView: string;
    viewTypePlaceholder: string;
    pickIcon: string;
    restoreDefaultButtons: string;
    restoreDefaultIcon: string;
    enableInterceptor: string;
    enableInterceptorDesc: string;
    accentSection: string;
    defaultIcon: string;
    defaultIconDesc: string;
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
    switchedToOpenWindow: string;
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

  // Activity Bar
  activityBar: {
    toggleColumn: string;
    toggleGroup: string;
    cannotHideLastPane: string;
    onlyInPopout: string;
    openSettings: string;
  };
}
