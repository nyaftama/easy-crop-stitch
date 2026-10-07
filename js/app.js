/**
 * easy-crop-stitch - app.js
 * 複数画像の一括定点切り抜き＆グリッド結合ツール
 */

(function () {
    "use strict";

    // アプリケーション全体の状態管理
    const state = {
        images: [], // { id, name, img, width, height }
        baseImageIndex: 0,
        isDeleteMode: false,
        draggedIndex: null,
        crop: {
            x: 0,
            y: 0,
            w: 100,
            h: 100
        },
        layout: {
            cols: 3,
            gap: 8,
            padding: 8,
            backgroundColor: "transparent",
            format: "image/png",
            arrangement: "z" // "z" | "n" | "s"
        },
        zoomMode: "fit", // "fit" | "100"
        interaction: {
            isDragging: false,
            isResizing: false,
            activeHandle: null,
            startX: 0,
            startY: 0,
            initialCrop: null
        },
        activeDesktopTab: "crop", // "crop" | "preview"
        activeMobileTab: "crop"   // "crop" | "layout" | "tray" | "preview"
    };

    // DOM要素キャッシュ
    const dom = {
        // 画面コンテナ
        startScreen: document.getElementById("startScreen"),
        workspaceScreen: document.getElementById("workspaceScreen"),

        // スタート画面
        imageDropzone: document.getElementById("imageDropzone"),
        imageFileInput: document.getElementById("imageFileInput"),
        btnSelectImages: document.getElementById("btnSelectImages"),
        btnLoadSample: document.getElementById("btnLoadSample"),

        // ヘッダー
        btnBackToStart: document.getElementById("btnBackToStart"),
        imageCountBadge: document.getElementById("imageCountBadge"),
        imageSizeMeta: document.getElementById("imageSizeMeta"),
        btnAddMoreImages: document.getElementById("btnAddMoreImages"),
        addMoreFileInput: document.getElementById("addMoreFileInput"),
        btnHeaderExportZip: document.getElementById("btnHeaderExportZip"),
        btnHeaderExportStitched: document.getElementById("btnHeaderExportStitched"),

        // タブナビゲーション
        mobileTabs: document.getElementById("mobileTabs"),
        mobileTabBtns: document.querySelectorAll("#mobileTabs .tab-btn"),
        desktopLeftTabs: document.getElementById("desktopLeftTabs"),
        desktopTabBtns: document.querySelectorAll("#desktopLeftTabs .tab-btn"),
        btnSortAsc: document.getElementById("btnSortAsc"),
        btnSortDesc: document.getElementById("btnSortDesc"),
        sectionCrop: document.getElementById("sectionCrop"),
        sectionPreview: document.getElementById("sectionPreview"),
        sectionLayout: document.getElementById("sectionLayout"),
        sectionTray: document.getElementById("sectionTray"),

        // エクスポート設定モーダル
        exportModal: document.getElementById("exportModal"),
        btnCloseExportModal: document.getElementById("btnCloseExportModal"),
        btnCancelExportModal: document.getElementById("btnCancelExportModal"),
        btnExecuteExportZip: document.getElementById("btnExecuteExportZip"),
        btnExecuteDownload: document.getElementById("btnExecuteDownload"),
        exportInfoDimension: document.getElementById("exportInfoDimension"),
        exportInfoCount: document.getElementById("exportInfoCount"),

        // クロップペイン
        cropViewerWrapper: document.getElementById("cropViewerWrapper"),
        cropStage: document.getElementById("cropStage"),
        baseImagePreview: document.getElementById("baseImagePreview"),
        cropBox: document.getElementById("cropBox"),
        cropDimensionBadge: document.getElementById("cropDimensionBadge"),
        inputCropX: document.getElementById("inputCropX"),
        inputCropY: document.getElementById("inputCropY"),
        inputCropW: document.getElementById("inputCropW"),
        inputCropH: document.getElementById("inputCropH"),
        btnCropSelectAll: document.getElementById("btnCropSelectAll"),
        btnCropCenter: document.getElementById("btnCropCenter"),
        btnCropSquare: document.getElementById("btnCropSquare"),

        // 設定 (スライダー & btn-adjust-step)
        inputCols: document.getElementById("inputCols"),
        valDisplayCols: document.getElementById("valDisplayCols"),
        btnColsMinus: document.getElementById("btnColsMinus"),
        btnColsPlus: document.getElementById("btnColsPlus"),
        btnPresetRow: document.getElementById("btnPresetRow"),
        btnPresetCol: document.getElementById("btnPresetCol"),
        btnPresetAuto: document.getElementById("btnPresetAuto"),

        inputGap: document.getElementById("inputGap"),
        valDisplayGap: document.getElementById("valDisplayGap"),
        btnGapMinus: document.getElementById("btnGapMinus"),
        btnGapPlus: document.getElementById("btnGapPlus"),

        inputPadding: document.getElementById("inputPadding"),
        valDisplayPadding: document.getElementById("valDisplayPadding"),
        btnPaddingMinus: document.getElementById("btnPaddingMinus"),
        btnPaddingPlus: document.getElementById("btnPaddingPlus"),

        colorPresetBtns: document.querySelectorAll(".btn-color-preset"),
        inputCustomColor: document.getElementById("inputCustomColor"),

        // すき間・余白プリセット
        gapPresetBtns: document.querySelectorAll(".gap-presets .btn-val-preset"),
        paddingPresetBtns: document.querySelectorAll(".padding-presets .btn-val-preset"),

        // ドロップダウン (custom-dropdown)
        formatDropdown: document.getElementById("formatDropdown"),
        formatDropdownTrigger: document.getElementById("formatDropdownTrigger"),
        formatDropdownMenu: document.getElementById("formatDropdownMenu"),
        formatSelectedText: document.getElementById("formatSelectedText"),

        // 配置順ドロップダウン (custom-dropdown)
        arrangementDropdown: document.getElementById("arrangementDropdown"),
        arrangementDropdownTrigger: document.getElementById("arrangementDropdownTrigger"),
        arrangementDropdownMenu: document.getElementById("arrangementDropdownMenu"),
        arrangementSelectedText: document.getElementById("arrangementSelectedText"),
        arrangementSelectedIcon: document.getElementById("arrangementSelectedIcon"),

        // サムネイルトレイ
        trayCountText: document.getElementById("trayCountText"),
        imageThumbList: document.getElementById("imageThumbList"),
        btnToggleDeleteMode: document.getElementById("btnToggleDeleteMode"),
        btnDeleteModeText: document.getElementById("btnDeleteModeText"),
        deleteModeHint: document.getElementById("deleteModeHint"),

        // プレビュー
        stitchCanvasViewport: document.getElementById("stitchCanvasViewport"),
        stitchCanvas: document.getElementById("stitchCanvas"),
        canvasDimensionBadge: document.getElementById("canvasDimensionBadge"),
        btnZoomFit: document.getElementById("btnZoomFit"),
        btnZoom100: document.getElementById("btnZoom100"),
        btnBottomExportZip: document.getElementById("btnBottomExportZip"),
        btnBottomExportStitched: document.getElementById("btnBottomExportStitched"),

        // モーダルダイアログ
        dialogModal: document.getElementById("dialogModal"),
        dialogTitleText: document.getElementById("dialogTitleText"),
        dialogIconInfo: document.getElementById("dialogIconInfo"),
        dialogIconWarning: document.getElementById("dialogIconWarning"),
        dialogMessage: document.getElementById("dialogMessage"),
        btnDialogClose: document.getElementById("btnDialogClose"),
        btnDialogCancel: document.getElementById("btnDialogCancel"),
        btnDialogOk: document.getElementById("btnDialogOk")
    };

    /**
     * ズーム表示モードの適用
     */
    function applyZoomMode(mode) {
        state.zoomMode = mode;
        if (mode === "100") {
            if (dom.stitchCanvasViewport) dom.stitchCanvasViewport.classList.add("zoom-100");
            if (dom.stitchCanvas) dom.stitchCanvas.classList.add("zoom-100");
            if (dom.btnZoom100) {
                dom.btnZoom100.classList.add("btn-primary");
                dom.btnZoom100.classList.remove("btn-secondary");
            }
            if (dom.btnZoomFit) {
                dom.btnZoomFit.classList.remove("btn-primary");
                dom.btnZoomFit.classList.add("btn-secondary");
            }
        } else {
            if (dom.stitchCanvasViewport) dom.stitchCanvasViewport.classList.remove("zoom-100");
            if (dom.stitchCanvas) dom.stitchCanvas.classList.remove("zoom-100");
            if (dom.btnZoomFit) {
                dom.btnZoomFit.classList.add("btn-primary");
                dom.btnZoomFit.classList.remove("btn-secondary");
            }
            if (dom.btnZoom100) {
                dom.btnZoom100.classList.remove("btn-primary");
                dom.btnZoom100.classList.add("btn-secondary");
            }
        }
    }

    /**
     * ファイル名順によるソート (自然順ソート)
     */
    function sortImagesByName(ascending = true) {
        if (state.images.length === 0) return;
        state.images.sort((a, b) => {
            return ascending
                ? a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
                : b.name.localeCompare(a.name, undefined, { numeric: true, sensitivity: 'base' });
        });
        state.baseImageIndex = 0;
        updateThumbList();
        updateBaseImageView();
        renderStitchedCanvas();
    }

    function setDesktopTab(tab) {
        state.activeDesktopTab = tab;
        document.body.setAttribute("data-desktop-tab", tab);
        if (dom.desktopTabBtns) {
            dom.desktopTabBtns.forEach(btn => {
                btn.classList.toggle("active", btn.dataset.dtTab === tab);
            });
        }
        if (tab === "preview") {
            renderStitchedCanvas();
        } else if (tab === "crop") {
            updateCropBoxDisplay();
        }
    }

    /**
     * モバイル用4タブの切り替え (切り抜き / レイアウト / 並び順 / プレビュー)
     */
    function setMobileTab(tab) {
        state.activeMobileTab = tab;
        document.body.setAttribute("data-mobile-tab", tab);
        if (dom.mobileTabBtns) {
            dom.mobileTabBtns.forEach(btn => {
                btn.classList.toggle("active", btn.dataset.tab === tab);
            });
        }
        const mainContent = document.querySelector(".workspace-main-content");
        if (mainContent) {
            mainContent.scrollTop = 0;
        }
        if (tab === "preview") {
            renderStitchedCanvas();
        } else if (tab === "crop") {
            updateCropBoxDisplay();
        }
    }

    /**
     * エクスポート設定モーダルを開く
     */
    function openExportModal() {
        if (state.images.length === 0) return;
        if (dom.exportInfoDimension) {
            dom.exportInfoDimension.textContent = dom.canvasDimensionBadge ? dom.canvasDimensionBadge.textContent : "0 × 0 px";
        }
        if (dom.exportInfoCount) {
            dom.exportInfoCount.textContent = state.images.length + "枚";
        }
        if (dom.exportModal) {
            dom.exportModal.classList.add("open");
        }
    }

    /**
     * エクスポート設定モーダルを閉じる
     */
    function closeExportModal() {
        if (dom.exportModal) {
            dom.exportModal.classList.remove("open");
        }
        if (dom.formatDropdown) {
            dom.formatDropdown.classList.remove("open");
        }
    }

    function init() {
        bindEvents();
        setDesktopTab("crop");
        setMobileTab("crop");

        // クロップビューアのリサイズ追従
        if (window.ResizeObserver && dom.cropViewerWrapper) {
            const ro = new ResizeObserver(() => {
                if (state.images.length > 0) {
                    updateCropBoxDisplay();
                }
            });
            ro.observe(dom.cropViewerWrapper);
        }
    }

    /**
     * モーダルダイアログ表示
     */
    let dialogResolve = null;

    function showDialog({ title = "お知らせ", message = "", type = "info", isConfirm = false }) {
        return new Promise((resolve) => {
            dialogResolve = resolve;

            dom.dialogTitleText.textContent = title;
            dom.dialogMessage.textContent = message;

            if (type === "warning") {
                dom.dialogIconInfo.style.display = "none";
                dom.dialogIconWarning.style.display = "inline-block";
            } else {
                dom.dialogIconInfo.style.display = "inline-block";
                dom.dialogIconWarning.style.display = "none";
            }

            if (isConfirm) {
                dom.btnDialogCancel.style.display = "inline-flex";
            } else {
                dom.btnDialogCancel.style.display = "none";
            }

            dom.dialogModal.classList.add("open");
        });
    }

    function closeDialog(result) {
        dom.dialogModal.classList.remove("open");
        if (dialogResolve) {
            dialogResolve(result);
            dialogResolve = null;
        }
    }

    function dialogAlert(message, title = "お知らせ") {
        return showDialog({ title, message, type: "info", isConfirm: false });
    }

    function dialogConfirm(message, title = "確認") {
        return showDialog({ title, message, type: "warning", isConfirm: true });
    }

    /**
     * イベントバインド
     */
    function bindEvents() {
        // ダイアログ操作
        dom.btnDialogOk.addEventListener("click", () => closeDialog(true));
        dom.btnDialogCancel.addEventListener("click", () => closeDialog(false));
        dom.btnDialogClose.addEventListener("click", () => closeDialog(false));
        dom.dialogModal.addEventListener("click", (e) => {
            if (e.target === dom.dialogModal) closeDialog(false);
        });

        // ファイル選択ダイアログ
        dom.btnSelectImages.addEventListener("click", () => dom.imageFileInput.click());
        dom.imageFileInput.addEventListener("change", (e) => handleFileSelect(e.target.files));

        // ドロップゾーン ドラッグ＆ドロップ
        dom.imageDropzone.addEventListener("dragover", (e) => {
            e.preventDefault();
            dom.imageDropzone.classList.add("dragover");
        });
        dom.imageDropzone.addEventListener("dragleave", () => {
            dom.imageDropzone.classList.remove("dragover");
        });
        dom.imageDropzone.addEventListener("drop", (e) => {
            e.preventDefault();
            dom.imageDropzone.classList.remove("dragover");
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                handleFileSelect(e.dataTransfer.files);
            }
        });

        // サンプル画像ボタン
        dom.btnLoadSample.addEventListener("click", loadSampleImages);

        // ワークスペース追加読み込み
        dom.btnAddMoreImages.addEventListener("click", () => dom.addMoreFileInput.click());
        dom.addMoreFileInput.addEventListener("change", (e) => handleFileSelect(e.target.files, true));

        // スタート画面へ戻る (モーダル確認)
        dom.btnBackToStart.addEventListener("click", async () => {
            const confirmed = await dialogConfirm("スタート画面に戻りますか？読み込んだ画像一覧はリセットされます。");
            if (confirmed) {
                resetToStart();
            }
        });

        // クロップ枠のインタラクティブ操作
        setupCropBoxInteraction();

        // クロップ数値入力フィールドの変更
        [dom.inputCropX, dom.inputCropY, dom.inputCropW, dom.inputCropH].forEach(input => {
            input.addEventListener("input", handleCoordInputChange);
        });

        // クロップクイックアクション
        dom.btnCropSelectAll.addEventListener("click", handleCropSelectAll);
        dom.btnCropCenter.addEventListener("click", handleCropCenter);
        dom.btnCropSquare.addEventListener("click", handleCropSquare);

        // 列数スライダー & btn-adjust-step
        dom.inputCols.addEventListener("input", (e) => {
            setCols(parseInt(e.target.value, 10));
        });
        dom.btnColsMinus.addEventListener("click", () => {
            setCols(state.layout.cols - 1);
        });
        dom.btnColsPlus.addEventListener("click", () => {
            setCols(state.layout.cols + 1);
        });

        // 列数プリセット
        dom.btnPresetRow.addEventListener("click", () => setCols(state.images.length || 1));
        dom.btnPresetCol.addEventListener("click", () => setCols(1));
        dom.btnPresetAuto.addEventListener("click", () => {
            const count = state.images.length;
            if (count > 0) {
                setCols(Math.ceil(Math.sqrt(count)));
            }
        });

        // 間隔 (Gap) & btn-adjust-step
        dom.inputGap.addEventListener("input", (e) => {
            setGap(parseInt(e.target.value, 10));
        });
        dom.btnGapMinus.addEventListener("click", () => {
            setGap(state.layout.gap - 1);
        });
        dom.btnGapPlus.addEventListener("click", () => {
            setGap(state.layout.gap + 1);
        });

        // 外枠余白 (Padding) & btn-adjust-step
        dom.inputPadding.addEventListener("input", (e) => {
            setPadding(parseInt(e.target.value, 10));
        });
        dom.btnPaddingMinus.addEventListener("click", () => {
            setPadding(state.layout.padding - 1);
        });
        dom.btnPaddingPlus.addEventListener("click", () => {
            setPadding(state.layout.padding + 1);
        });

        // 間隔・余白プリセットボタン
        if (dom.gapPresetBtns) {
            dom.gapPresetBtns.forEach(btn => {
                btn.addEventListener("click", () => {
                    const val = parseInt(btn.dataset.val, 10);
                    if (!isNaN(val)) setGap(val);
                });
            });
        }
        if (dom.paddingPresetBtns) {
            dom.paddingPresetBtns.forEach(btn => {
                btn.addEventListener("click", () => {
                    const val = parseInt(btn.dataset.val, 10);
                    if (!isNaN(val)) setPadding(val);
                });
            });
        }

        // 配置順ドロップダウン (Z配置 / N配置 / S配置)
        if (dom.arrangementDropdownTrigger && dom.arrangementDropdown) {
            dom.arrangementDropdownTrigger.addEventListener("click", (e) => {
                e.stopPropagation();
                dom.arrangementDropdown.classList.toggle("open");
            });

            document.addEventListener("click", (e) => {
                if (!dom.arrangementDropdown.contains(e.target)) {
                    dom.arrangementDropdown.classList.remove("open");
                }
            });

            const arrangementItems = dom.arrangementDropdownMenu.querySelectorAll(".dropdown-item");
            arrangementItems.forEach(item => {
                item.addEventListener("click", () => {
                    arrangementItems.forEach(i => i.classList.remove("active"));
                    item.classList.add("active");
                    state.layout.arrangement = item.dataset.value || "z";
                    const spanText = item.querySelector("span");
                    if (spanText && dom.arrangementSelectedText) {
                        dom.arrangementSelectedText.textContent = spanText.textContent;
                    }
                    const svg = item.querySelector("svg");
                    if (svg && dom.arrangementSelectedIcon) {
                        dom.arrangementSelectedIcon.innerHTML = svg.outerHTML;
                    }
                    dom.arrangementDropdown.classList.remove("open");
                    renderStitchedCanvas();
                });
            });
        }

        // 背景色プリセット
        dom.colorPresetBtns.forEach(btn => {
            btn.addEventListener("click", () => {
                dom.colorPresetBtns.forEach(b => b.classList.remove("active"));
                btn.classList.add("active");
                state.layout.backgroundColor = btn.dataset.color;
                renderStitchedCanvas();
            });
        });

        // カスタム背景色ピッカー
        dom.inputCustomColor.addEventListener("input", (e) => {
            dom.colorPresetBtns.forEach(b => b.classList.remove("active"));
            state.layout.backgroundColor = e.target.value;
            renderStitchedCanvas();
        });

        // ドロップダウン
        dom.formatDropdownTrigger.addEventListener("click", (e) => {
            e.stopPropagation();
            dom.formatDropdown.classList.toggle("open");
        });
        document.addEventListener("click", (e) => {
            if (!dom.formatDropdown.contains(e.target)) {
                dom.formatDropdown.classList.remove("open");
            }
        });
        const dropdownItems = dom.formatDropdownMenu.querySelectorAll(".dropdown-item");
        dropdownItems.forEach(item => {
            item.addEventListener("click", () => {
                dropdownItems.forEach(i => i.classList.remove("active"));
                item.classList.add("active");
                state.layout.format = item.dataset.value;
                dom.formatSelectedText.textContent = item.querySelector("span").textContent;
                dom.formatDropdown.classList.remove("open");
            });
        });

        // 削除モード切り替え
        dom.btnToggleDeleteMode.addEventListener("click", toggleDeleteMode);

        // プレビューズーム切替
        if (dom.btnZoomFit) {
            dom.btnZoomFit.addEventListener("click", () => applyZoomMode("fit"));
        }
        if (dom.btnZoom100) {
            dom.btnZoom100.addEventListener("click", () => applyZoomMode("100"));
        }

        // ファイル名並び替え
        if (dom.btnSortAsc) {
            dom.btnSortAsc.addEventListener("click", () => sortImagesByName(true));
        }
        if (dom.btnSortDesc) {
            dom.btnSortDesc.addEventListener("click", () => sortImagesByName(false));
        }

        // エクスポートボタン（ヘッダー ＆ 下部バー）: exportModal を表示
        if (dom.btnHeaderExportStitched) {
            dom.btnHeaderExportStitched.addEventListener("click", openExportModal);
        }
        if (dom.btnBottomExportStitched) {
            dom.btnBottomExportStitched.addEventListener("click", openExportModal);
        }
        if (dom.btnHeaderExportZip) {
            dom.btnHeaderExportZip.addEventListener("click", exportZipArchive);
        }
        if (dom.btnBottomExportZip) {
            dom.btnBottomExportZip.addEventListener("click", exportZipArchive);
        }

        // エクスポート設定モーダルの操作
        if (dom.btnCloseExportModal) {
            dom.btnCloseExportModal.addEventListener("click", closeExportModal);
        }
        if (dom.btnCancelExportModal) {
            dom.btnCancelExportModal.addEventListener("click", closeExportModal);
        }
        if (dom.btnExecuteExportZip) {
            dom.btnExecuteExportZip.addEventListener("click", () => {
                exportZipArchive();
                closeExportModal();
            });
        }
        if (dom.btnExecuteDownload) {
            dom.btnExecuteDownload.addEventListener("click", () => {
                exportStitchedImage();
                closeExportModal();
            });
        }
        if (dom.exportModal) {
            dom.exportModal.addEventListener("click", (e) => {
                if (e.target === dom.exportModal) closeExportModal();
            });
        }

        // デスクトップ用 左タブ切り替え
        if (dom.desktopTabBtns) {
            dom.desktopTabBtns.forEach(btn => {
                btn.addEventListener("click", () => {
                    setDesktopTab(btn.dataset.dtTab);
                });
            });
        }

        // モバイル用 4タブ切り替え
        if (dom.mobileTabBtns) {
            dom.mobileTabBtns.forEach(btn => {
                btn.addEventListener("click", () => {
                    setMobileTab(btn.dataset.tab);
                });
            });
        }

        // Escキーでモーダルを閉じる
        window.addEventListener("keydown", (e) => {
            if (e.key === "Escape") {
                if (dom.exportModal && dom.exportModal.classList.contains("open")) {
                    closeExportModal();
                } else if (dom.dialogModal && dom.dialogModal.classList.contains("open")) {
                    closeDialog(false);
                }
            }
        });

        // ウィンドウリサイズ時のクロップ枠再計算
        window.addEventListener("resize", () => {
            if (state.images.length > 0) {
                updateCropBoxDisplay();
            }
        });
    }

    /**
     * HEIC/HEIF形式のファイル判定
     */
    function isHeicFile(file) {
        if (!file) return false;
        const name = (file.name || "").toLowerCase();
        return name.endsWith(".heic") || name.endsWith(".heif") || file.type === "image/heic" || file.type === "image/heif";
    }

    /**
     * 1つの画像ファイルを読み込み (HEIC自動変換対応)
     */
    async function loadSingleImageFile(file) {
        let processBlob = file;

        if (isHeicFile(file)) {
            const converter = (typeof HeicTo !== "undefined") ? HeicTo :
                              (typeof heicTo !== "undefined") ? heicTo :
                              (window.HeicTo || window.heicTo || null);
            if (converter) {
                try {
                    const converted = await converter({
                        blob: file,
                        type: "image/jpeg",
                        quality: 0.95
                    });
                    processBlob = Array.isArray(converted) ? converted[0] : converted;
                } catch (err) {
                    console.warn("HEIC converter failed, falling back to original blob:", err);
                }
            }
        }

        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    resolve({
                        id: "img_" + Math.random().toString(36).substr(2, 9),
                        name: file.name,
                        img: img,
                        width: img.naturalWidth,
                        height: img.naturalHeight
                    });
                };
                img.onerror = () => {
                    if (isHeicFile(file) && processBlob === file) {
                        const converter = (typeof HeicTo !== "undefined") ? HeicTo :
                                          (typeof heicTo !== "undefined") ? heicTo :
                                          (window.HeicTo || window.heicTo || null);
                        if (converter) {
                            converter({ blob: file, type: "image/jpeg", quality: 0.95 })
                                .then(conv => {
                                    const blob = Array.isArray(conv) ? conv[0] : conv;
                                    const r2 = new FileReader();
                                    r2.onload = (e2) => {
                                        const img2 = new Image();
                                        img2.onload = () => {
                                            resolve({
                                                id: "img_" + Math.random().toString(36).substr(2, 9),
                                                name: file.name,
                                                img: img2,
                                                width: img2.naturalWidth,
                                                height: img2.naturalHeight
                                            });
                                        };
                                        img2.onerror = reject;
                                        img2.src = e2.target.result;
                                    };
                                    r2.onerror = reject;
                                    r2.readAsDataURL(blob);
                                })
                                .catch(reject);
                            return;
                        }
                    }
                    reject(new Error(`画像デコード失敗: ${file.name}`));
                };
                img.src = e.target.result;
            };
            reader.onerror = () => reject(new Error(`ファイル読み込み失敗: ${file.name}`));
            reader.readAsDataURL(processBlob);
        });
    }

    /**
     * ファイル選択時の処理 (複数画像対応 & HEIC対応)
     */
    async function handleFileSelect(files, isAppend = false) {
        if (!files || files.length === 0) return;

        const fileArray = Array.from(files).filter(f => {
            return (f.type && f.type.startsWith("image/")) || isHeicFile(f);
        });

        if (fileArray.length === 0) {
            dialogAlert("画像ファイルを選択してください。(JPEG, PNG, WebP, GIF, HEIC対応)");
            return;
        }

        try {
            const newImages = [];
            for (const file of fileArray) {
                try {
                    const loaded = await loadSingleImageFile(file);
                    newImages.push(loaded);
                } catch (err) {
                    console.error("個別画像の読み込みエラー:", file.name, err);
                }
            }

            if (newImages.length === 0) {
                dialogAlert("画像の読み込みに失敗しました。ファイル形式をご確認ください。");
                return;
            }

            if (isAppend) {
                state.images = state.images.concat(newImages);
            } else {
                state.images = newImages;
                state.baseImageIndex = 0;
                // 初期のクロップ範囲を設定（画像中央部を自動設定）
                const baseImg = newImages[0];
                const defaultW = Math.round(baseImg.width * 0.5);
                const defaultH = Math.round(baseImg.height * 0.5);
                state.crop = {
                    x: Math.round((baseImg.width - defaultW) / 2),
                    y: Math.round((baseImg.height - defaultH) / 2),
                    w: defaultW,
                    h: defaultH
                };
                // デフォルト列数を自動調整
                const autoCols = Math.min(6, Math.max(2, Math.ceil(Math.sqrt(state.images.length))));
                setCols(autoCols);
            }

            switchToWorkspace();
        } catch (err) {
            console.error("画像一括読み込みエラー:", err);
            dialogAlert("画像の読み込み中にエラーが発生しました。");
        }
    }

    /**
     * サンプル画像を生成して読み込む（手ぶらでお試し）
     */
    function loadSampleImages() {
        const sampleColors = [
            { bg: "#3b82f6", label: "サンプル 1", icon: "ALPHA" },
            { bg: "#10b981", label: "サンプル 2", icon: "BRAVO" },
            { bg: "#f59e0b", label: "サンプル 3", icon: "CHARLIE" },
            { bg: "#ec4899", label: "サンプル 4", icon: "DELTA" }
        ];

        const sampleImages = sampleColors.map((item, idx) => {
            const canvas = document.createElement("canvas");
            canvas.width = 480;
            canvas.height = 480;
            const ctx = canvas.getContext("2d");

            // 背景グラデーション
            const grad = ctx.createLinearGradient(0, 0, 480, 480);
            grad.addColorStop(0, item.bg);
            grad.addColorStop(1, "#1e293b");
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, 480, 480);

            // 装飾パターン
            ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
            ctx.lineWidth = 4;
            ctx.strokeRect(20, 20, 440, 440);

            // クロップ対象となる中央フォーカスカード
            ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
            ctx.beginPath();
            ctx.roundRect(100, 100, 280, 280, 24);
            ctx.fill();

            // 中央カード内のシンボルと文字
            ctx.fillStyle = item.bg;
            ctx.beginPath();
            ctx.arc(240, 200, 50, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = "#ffffff";
            ctx.font = "bold 28px sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(String(idx + 1), 240, 200);

            ctx.fillStyle = "#1e293b";
            ctx.font = "bold 22px sans-serif";
            ctx.fillText(item.label, 240, 290);

            ctx.fillStyle = "#64748b";
            ctx.font = "14px monospace";
            ctx.fillText(`CODE: ${item.icon}`, 240, 325);

            // 外側のラベル
            ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
            ctx.font = "12px sans-serif";
            ctx.fillText("SAMPLE ORIGINAL IMAGE", 240, 60);

            const img = new Image();
            img.src = canvas.toDataURL("image/png");

            return {
                id: "sample_" + idx,
                name: `sample_${idx + 1}.png`,
                img: img,
                width: 480,
                height: 480
            };
        });

        // ロード完了待ち
        let loadedCount = 0;
        sampleImages.forEach(item => {
            item.img.onload = () => {
                loadedCount++;
                if (loadedCount === sampleImages.length) {
                    state.images = sampleImages;
                    state.baseImageIndex = 0;
                    state.crop = { x: 100, y: 100, w: 280, h: 280 };
                    setCols(2);
                    switchToWorkspace();
                }
            };
        });
    }

    /**
     * ワークスペース画面へ切り替え
     */
    function switchToWorkspace() {
        dom.startScreen.style.display = "none";
        dom.workspaceScreen.style.display = "flex";

        setDesktopTab("crop");
        setMobileTab("crop");

        updateWorkspaceMeta();
        updateBaseImageView();
        updateThumbList();
        renderStitchedCanvas();
    }

    /**
     * スタート画面へリセット
     */
    function resetToStart() {
        state.images = [];
        state.isDeleteMode = false;
        dom.imageFileInput.value = "";
        dom.addMoreFileInput.value = "";
        dom.workspaceScreen.style.display = "none";
        dom.startScreen.style.display = "flex";
    }

    /**
     * ヘッダーのメタ情報表示更新
     */
    function updateWorkspaceMeta() {
        const count = state.images.length;
        if (dom.imageCountBadge) {
            dom.imageCountBadge.textContent = "画像: " + count + "枚";
        }
        if (dom.trayCountText) {
            dom.trayCountText.textContent = String(count);
        }

        if (count > 0) {
            const base = state.images[state.baseImageIndex];
            if (dom.imageSizeMeta) {
                dom.imageSizeMeta.textContent = "元サイズ: " + base.width + " × " + base.height + " px";
            }
            if (dom.inputCropX) dom.inputCropX.max = base.width - 1;
            if (dom.inputCropY) dom.inputCropY.max = base.height - 1;
            if (dom.inputCropW) dom.inputCropW.max = base.width;
            if (dom.inputCropH) dom.inputCropH.max = base.height;
        }
    }

    /**
     * 基準画像プレビューとクロップ枠の初期表示
     */
    function updateBaseImageView() {
        if (state.images.length === 0) return;
        const base = state.images[state.baseImageIndex];
        dom.baseImagePreview.src = base.img.src;

        dom.baseImagePreview.onload = () => {
            updateCropInputs();
            updateCropBoxDisplay();
        };

        if (dom.baseImagePreview.complete) {
            updateCropInputs();
            updateCropBoxDisplay();
        }
    }

    /**
     * クロップ枠の表示位置・サイズをCSSピクセルに変換してDOMに反映
     */
    function updateCropBoxDisplay() {
        const base = state.images[state.baseImageIndex];
        if (!base) return;

        const renderedW = dom.baseImagePreview.clientWidth;
        const renderedH = dom.baseImagePreview.clientHeight;
        if (!renderedW || !renderedH) return;

        const scaleX = renderedW / base.width;
        const scaleY = renderedH / base.height;

        const boxLeft = state.crop.x * scaleX;
        const boxTop = state.crop.y * scaleY;
        const boxWidth = state.crop.w * scaleX;
        const boxHeight = state.crop.h * scaleY;

        dom.cropBox.style.left = `${boxLeft}px`;
        dom.cropBox.style.top = `${boxTop}px`;
        dom.cropBox.style.width = `${boxWidth}px`;
        dom.cropBox.style.height = `${boxHeight}px`;

        dom.cropDimensionBadge.textContent = `${state.crop.w} × ${state.crop.h} px`;
    }

    /**
     * 座標入力フィールドへ数値を反映
     */
    function updateCropInputs() {
        dom.inputCropX.value = state.crop.x;
        dom.inputCropY.value = state.crop.y;
        dom.inputCropW.value = state.crop.w;
        dom.inputCropH.value = state.crop.h;
    }

    /**
     * 座標入力フィールドが手動変更された時
     */
    function handleCoordInputChange() {
        const base = state.images[state.baseImageIndex];
        if (!base) return;

        let x = parseInt(dom.inputCropX.value, 10) || 0;
        let y = parseInt(dom.inputCropY.value, 10) || 0;
        let w = parseInt(dom.inputCropW.value, 10) || 10;
        let h = parseInt(dom.inputCropH.value, 10) || 10;

        // 境界制限
        w = Math.max(1, Math.min(w, base.width));
        h = Math.max(1, Math.min(h, base.height));
        x = Math.max(0, Math.min(x, base.width - w));
        y = Math.max(0, Math.min(y, base.height - h));

        state.crop = { x, y, w, h };
        updateCropBoxDisplay();
        renderStitchedCanvas();
    }

    /**
     * クロップクイックアクション: 全体選択
     */
    function handleCropSelectAll() {
        const base = state.images[state.baseImageIndex];
        if (!base) return;
        state.crop = { x: 0, y: 0, w: base.width, h: base.height };
        updateCropInputs();
        updateCropBoxDisplay();
        renderStitchedCanvas();
    }

    /**
     * クロップクイックアクション: 中央配置
     */
    function handleCropCenter() {
        const base = state.images[state.baseImageIndex];
        if (!base) return;
        state.crop.x = Math.round((base.width - state.crop.w) / 2);
        state.crop.y = Math.round((base.height - state.crop.h) / 2);
        updateCropInputs();
        updateCropBoxDisplay();
        renderStitchedCanvas();
    }

    /**
     * クロップクイックアクション: 正方形(1:1)化
     */
    function handleCropSquare() {
        const base = state.images[state.baseImageIndex];
        if (!base) return;
        const side = Math.min(state.crop.w, state.crop.h, base.width, base.height);
        let x = state.crop.x;
        let y = state.crop.y;
        if (x + side > base.width) x = base.width - side;
        if (y + side > base.height) y = base.height - side;
        state.crop = { x, y, w: side, h: side };
        updateCropInputs();
        updateCropBoxDisplay();
        renderStitchedCanvas();
    }

    /**
     * 列数の変更とUI反映
     */
    function setCols(val) {
        state.layout.cols = Math.max(1, Math.min(12, val));
        dom.inputCols.value = state.layout.cols;
        dom.valDisplayCols.textContent = `${state.layout.cols}列`;
        renderStitchedCanvas();
    }

    /**
     * 間隔 (Gap) の変更とUI反映
     */
    function setGap(val) {
        state.layout.gap = Math.max(0, Math.min(64, val));
        dom.inputGap.value = state.layout.gap;
        dom.valDisplayGap.textContent = `${state.layout.gap} px`;
        if (dom.gapPresetBtns) {
            dom.gapPresetBtns.forEach(btn => {
                btn.classList.toggle("active", parseInt(btn.dataset.val, 10) === state.layout.gap);
            });
        }
        renderStitchedCanvas();
    }

    /**
     * 外枠余白 (Padding) の変更とUI反映
     */
    function setPadding(val) {
        state.layout.padding = Math.max(0, Math.min(64, val));
        dom.inputPadding.value = state.layout.padding;
        dom.valDisplayPadding.textContent = `${state.layout.padding} px`;
        if (dom.paddingPresetBtns) {
            dom.paddingPresetBtns.forEach(btn => {
                btn.classList.toggle("active", parseInt(btn.dataset.val, 10) === state.layout.padding);
            });
        }
        renderStitchedCanvas();
    }

    /**
     * 削除モード切り替え
     */
    function toggleDeleteMode() {
        state.isDeleteMode = !state.isDeleteMode;

        if (state.isDeleteMode) {
            dom.btnToggleDeleteMode.className = "btn btn-secondary btn-sm";
            dom.btnDeleteModeText.textContent = "完了";
            dom.deleteModeHint.style.display = "inline";
        } else {
            dom.btnToggleDeleteMode.className = "btn btn-danger btn-sm";
            dom.btnDeleteModeText.textContent = "削除...";
            dom.deleteModeHint.style.display = "none";
        }

        updateThumbList();
    }

    /**
     * クロップ枠のマウス・タッチインタラクション設定
     */
    function setupCropBoxInteraction() {
        const stage = dom.cropStage;

        stage.addEventListener("pointerdown", (e) => {
            const handleEl = e.target.closest(".crop-handle");
            const isBox = e.target === dom.cropBox || dom.cropBox.contains(e.target);

            if (!handleEl && !isBox) return;

            e.preventDefault();
            stage.setPointerCapture(e.pointerId);

            state.interaction.startX = e.clientX;
            state.interaction.startY = e.clientY;
            state.interaction.initialCrop = { ...state.crop };

            if (handleEl) {
                state.interaction.isResizing = true;
                state.interaction.activeHandle = handleEl.dataset.handle;
            } else {
                state.interaction.isDragging = true;
            }
        });

        stage.addEventListener("pointermove", (e) => {
            if (!state.interaction.isDragging && !state.interaction.isResizing) return;

            const base = state.images[state.baseImageIndex];
            if (!base) return;

            const renderedW = dom.baseImagePreview.clientWidth;
            const renderedH = dom.baseImagePreview.clientHeight;
            const scaleX = base.width / renderedW;
            const scaleY = base.height / renderedH;

            const deltaX = (e.clientX - state.interaction.startX) * scaleX;
            const deltaY = (e.clientY - state.interaction.startY) * scaleY;
            const init = state.interaction.initialCrop;

            if (state.interaction.isDragging) {
                let newX = Math.round(init.x + deltaX);
                let newY = Math.round(init.y + deltaY);

                newX = Math.max(0, Math.min(newX, base.width - init.w));
                newY = Math.max(0, Math.min(newY, base.height - init.h));

                state.crop.x = newX;
                state.crop.y = newY;
            } else if (state.interaction.isResizing) {
                const handle = state.interaction.activeHandle;
                let { x, y, w, h } = init;

                if (handle.includes("r")) {
                    w = Math.max(10, Math.min(init.w + deltaX, base.width - x));
                }
                if (handle.includes("b")) {
                    h = Math.max(10, Math.min(init.h + deltaY, base.height - y));
                }
                if (handle.includes("l")) {
                    const maxDelta = init.w - 10;
                    const clampedDelta = Math.min(maxDelta, Math.max(-init.x, deltaX));
                    x = Math.round(init.x + clampedDelta);
                    w = Math.round(init.w - clampedDelta);
                }
                if (handle.includes("t")) {
                    const maxDelta = init.h - 10;
                    const clampedDelta = Math.min(maxDelta, Math.max(-init.y, deltaY));
                    y = Math.round(init.y + clampedDelta);
                    h = Math.round(init.h - clampedDelta);
                }

                state.crop = {
                    x: Math.round(x),
                    y: Math.round(y),
                    w: Math.round(w),
                    h: Math.round(h)
                };
            }

            updateCropInputs();
            updateCropBoxDisplay();
            renderStitchedCanvas();
        });

        const handlePointerEnd = (e) => {
            if (state.interaction.isDragging || state.interaction.isResizing) {
                state.interaction.isDragging = false;
                state.interaction.isResizing = false;
                state.interaction.activeHandle = null;
                try {
                    stage.releasePointerCapture(e.pointerId);
                } catch (err) {
                    // ignore
                }
            }
        };

        stage.addEventListener("pointerup", handlePointerEnd);
        stage.addEventListener("pointercancel", handlePointerEnd);
    }

    /**
     * サムネイルトレイの描画 (ドラッグ並び替え ＆ 削除モード対応)
     */
    function updateThumbList() {
        const list = dom.imageThumbList;
        list.innerHTML = "";

        state.images.forEach((item, index) => {
            const card = document.createElement("div");
            card.className = "thumb-card";
            card.draggable = !state.isDeleteMode; // 削除モード中はドラッグ無効化
            card.dataset.index = String(index);

            // インデックスバッジ
            const indexBadge = `<span class="thumb-index-badge">${index + 1}</span>`;

            // 画像本体
            const imgEl = `<img src="${item.img.src}" alt="${item.name}">`;

            // 削除モード時の削除バッジ
            let deleteBadge = "";
            if (state.isDeleteMode) {
                deleteBadge = `
                    <button type="button" class="thumb-delete-badge" title="除外" data-index="${index}">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                `;
            }

            card.innerHTML = `${indexBadge}${imgEl}${deleteBadge}`;

            // 削除バッジクリックイベント
            if (state.isDeleteMode) {
                const delBtn = card.querySelector(".thumb-delete-badge");
                if (delBtn) {
                    delBtn.addEventListener("click", (e) => {
                        e.stopPropagation();
                        deleteImageAtIndex(index);
                    });
                }
                // カード全体タップでも削除
                card.addEventListener("click", () => {
                    deleteImageAtIndex(index);
                });
            } else {
                // HTML5 ドラッグ＆ドロップによる並び替え
                card.addEventListener("dragstart", (e) => {
                    state.draggedIndex = index;
                    card.classList.add("dragging");
                    e.dataTransfer.effectAllowed = "move";
                    e.dataTransfer.setData("text/plain", String(index));
                });

                card.addEventListener("dragenter", (e) => {
                    e.preventDefault();
                    if (state.draggedIndex !== null && state.draggedIndex !== index) {
                        card.classList.add("drag-over");
                    }
                });

                card.addEventListener("dragover", (e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = "move";
                });

                card.addEventListener("dragleave", () => {
                    card.classList.remove("drag-over");
                });

                card.addEventListener("drop", (e) => {
                    e.preventDefault();
                    card.classList.remove("drag-over");
                    if (state.draggedIndex !== null && state.draggedIndex !== index) {
                        const fromIdx = state.draggedIndex;
                        const toIdx = index;
                        const [movedItem] = state.images.splice(fromIdx, 1);
                        state.images.splice(toIdx, 0, movedItem);
                        updateThumbList();
                        renderStitchedCanvas();
                    }
                });

                card.addEventListener("dragend", () => {
                    state.draggedIndex = null;
                    document.querySelectorAll(".thumb-card").forEach(c => {
                        c.classList.remove("dragging");
                        c.classList.remove("drag-over");
                    });
                });

                // スマートフォン・タブレット用 タッチ操作による並び替え
                let touchDragActive = false;
                let touchFromIndex = null;
                let currentTargetCard = null;

                card.addEventListener("touchstart", (e) => {
                    if (state.isDeleteMode) return;
                    touchDragActive = true;
                    touchFromIndex = index;
                    card.classList.add("dragging");
                }, { passive: true });

                card.addEventListener("touchmove", (e) => {
                    if (!touchDragActive || touchFromIndex === null) return;
                    const touch = e.touches[0];
                    if (!touch) return;

                    if (e.cancelable) e.preventDefault();

                    const element = document.elementFromPoint(touch.clientX, touch.clientY);
                    const overCard = element ? element.closest(".thumb-card") : null;

                    if (overCard !== currentTargetCard) {
                        if (currentTargetCard) {
                            currentTargetCard.classList.remove("drag-over");
                        }
                        if (overCard && overCard !== card) {
                            overCard.classList.add("drag-over");
                            currentTargetCard = overCard;
                        } else {
                            currentTargetCard = null;
                        }
                    }
                }, { passive: false });

                card.addEventListener("touchend", () => {
                    if (!touchDragActive) return;
                    touchDragActive = false;
                    card.classList.remove("dragging");

                    if (currentTargetCard) {
                        currentTargetCard.classList.remove("drag-over");
                        const toIndex = parseInt(currentTargetCard.dataset.index, 10);
                        if (!isNaN(toIndex) && touchFromIndex !== null && toIndex !== touchFromIndex) {
                            const [movedItem] = state.images.splice(touchFromIndex, 1);
                            state.images.splice(toIndex, 0, movedItem);
                            updateThumbList();
                            renderStitchedCanvas();
                        }
                    }

                    touchFromIndex = null;
                    currentTargetCard = null;
                    document.querySelectorAll(".thumb-card").forEach(c => {
                        c.classList.remove("dragging");
                        c.classList.remove("drag-over");
                    });
                });

                card.addEventListener("touchcancel", () => {
                    touchDragActive = false;
                    touchFromIndex = null;
                    if (currentTargetCard) {
                        currentTargetCard.classList.remove("drag-over");
                        currentTargetCard = null;
                    }
                    card.classList.remove("dragging");
                    document.querySelectorAll(".thumb-card").forEach(c => {
                        c.classList.remove("dragging");
                        c.classList.remove("drag-over");
                    });
                });
            }

            list.appendChild(card);
        });
    }

    /**
     * 指定インデックスの画像を削除
     */
    function deleteImageAtIndex(index) {
        state.images.splice(index, 1);
        if (state.images.length === 0) {
            resetToStart();
        } else {
            if (state.baseImageIndex >= state.images.length) {
                state.baseImageIndex = 0;
            }
            updateWorkspaceMeta();
            updateBaseImageView();
            updateThumbList();
            renderStitchedCanvas();
        }
    }

    /**
     * 配置順に応じたグリッドセル座標 (col, row) を計算
     * @param {number} index - 画像のインデックス (0 <= index < count)
     * @param {number} cols - 列数 (cols >= 1)
     * @param {number} rows - 行数 (rows >= 1)
     * @param {string} arrangement - "z" | "n" | "s"
     * @returns {{col: number, row: number}}
     */
    function getGridPosition(index, cols, rows, arrangement) {
        if (arrangement === "n") {
            // N配置（縦書き・右上から下、次の列は左隣へ）
            const r = index % rows;
            const c = Math.max(0, (cols - 1) - Math.floor(index / rows));
            return { col: c, row: r };
        } else if (arrangement === "s") {
            // S配置（蛇行・ブストロフェドン: 偶数行はLTR、奇数行はRTL）
            const r = Math.floor(index / cols);
            const posInRow = index % cols;
            const c = (r % 2 === 0) ? posInRow : ((cols - 1) - posInRow);
            return { col: Math.max(0, Math.min(cols - 1, c)), row: r };
        } else {
            // デフォルト: Z配置（横書き: LTR）
            const r = Math.floor(index / cols);
            const c = index % cols;
            return { col: c, row: r };
        }
    }

    /**
     * 結合キャンバスの描画（コア処理）
     */
    function renderStitchedCanvas() {
        const count = state.images.length;
        if (count === 0) return;

        const cropW = state.crop.w;
        const cropH = state.crop.h;
        if (cropW <= 0 || cropH <= 0) return;

        const cols = Math.min(state.layout.cols, count);
        const rows = Math.ceil(count / cols);
        const gap = state.layout.gap;
        const padding = state.layout.padding;

        const totalWidth = padding * 2 + cols * cropW + (cols - 1) * gap;
        const totalHeight = padding * 2 + rows * cropH + (rows - 1) * gap;

        const canvas = dom.stitchCanvas;
        canvas.width = totalWidth;
        canvas.height = totalHeight;
        const ctx = canvas.getContext("2d");

        // 背景塗りつぶし
        if (state.layout.backgroundColor !== "transparent") {
            ctx.fillStyle = state.layout.backgroundColor;
            ctx.fillRect(0, 0, totalWidth, totalHeight);
        } else {
            ctx.clearRect(0, 0, totalWidth, totalHeight);
        }

        // 各画像の切り抜きとグリッド配置描画
        state.images.forEach((item, index) => {
            const { col, row } = getGridPosition(index, cols, rows, state.layout.arrangement || "z");

            const dx = padding + col * (cropW + gap);
            const dy = padding + row * (cropH + gap);

            ctx.drawImage(
                item.img,
                state.crop.x,
                state.crop.y,
                cropW,
                cropH,
                dx,
                dy,
                cropW,
                cropH
            );
        });

        // 寸法バッジ更新
        dom.canvasDimensionBadge.textContent = `${totalWidth} × ${totalHeight} px`;
    }

    /**
     * 結合画像のダウンロード保存
     */
    function exportStitchedImage() {
        if (state.images.length === 0) return;

        const canvas = dom.stitchCanvas;
        const format = state.layout.format;
        const ext = format === "image/jpeg" ? "jpg" : format === "image/webp" ? "webp" : "png";
        const dateStr = getTimestampString();
        const filename = `easy-crop-stitch_${dateStr}.${ext}`;

        let exportCanvas = canvas;
        if (format === "image/jpeg" && state.layout.backgroundColor === "transparent") {
            exportCanvas = document.createElement("canvas");
            exportCanvas.width = canvas.width;
            exportCanvas.height = canvas.height;
            const expCtx = exportCanvas.getContext("2d");
            expCtx.fillStyle = "#ffffff";
            expCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
            expCtx.drawImage(canvas, 0, 0);
        }

        exportCanvas.toBlob((blob) => {
            if (!blob) return;
            downloadBlob(blob, filename);
        }, format, 0.95);
    }

    /**
     * 個別切り抜き画像のZIP一括ダウンロード保存
     */
    function exportZipArchive() {
        if (state.images.length === 0) return;
        if (typeof JSZip === "undefined") {
            dialogAlert("ZIPライブラリの読み込みに失敗しました。");
            return;
        }

        const zip = new JSZip();
        const cropW = state.crop.w;
        const cropH = state.crop.h;
        const format = state.layout.format;
        const ext = format === "image/jpeg" ? "jpg" : format === "image/webp" ? "webp" : "png";

        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = cropW;
        tempCanvas.height = cropH;
        const tempCtx = tempCanvas.getContext("2d");

        const promises = state.images.map((item, index) => {
            return new Promise((resolve) => {
                tempCtx.clearRect(0, 0, cropW, cropH);
                if (format === "image/jpeg" && state.layout.backgroundColor === "transparent") {
                    tempCtx.fillStyle = "#ffffff";
                    tempCtx.fillRect(0, 0, cropW, cropH);
                } else if (state.layout.backgroundColor !== "transparent") {
                    tempCtx.fillStyle = state.layout.backgroundColor;
                    tempCtx.fillRect(0, 0, cropW, cropH);
                }

                tempCtx.drawImage(
                    item.img,
                    state.crop.x,
                    state.crop.y,
                    cropW,
                    cropH,
                    0,
                    0,
                    cropW,
                    cropH
                );

                tempCanvas.toBlob((blob) => {
                    const padIndex = String(index + 1).padStart(2, "0");
                    const origBaseName = item.name.replace(/\.[^/.]+$/, "");
                    const filename = `crop_${padIndex}_${origBaseName}.${ext}`;
                    zip.file(filename, blob);
                    resolve();
                }, format, 0.95);
            });
        });

        Promise.all(promises).then(() => {
            zip.generateAsync({ type: "blob" }).then((zipBlob) => {
                const dateStr = getTimestampString();
                const zipFilename = `easy-crops_${dateStr}.zip`;
                downloadBlob(zipBlob, zipFilename);
            });
        });
    }

    /**
     * Blobダウンロード共通関数
     */
    function downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }

    /**
     * 日時文字列生成 (YYYYMMDD_HHmmss)
     */
    function getTimestampString() {
        const now = new Date();
        const Y = now.getFullYear();
        const M = String(now.getMonth() + 1).padStart(2, "0");
        const D = String(now.getDate()).padStart(2, "0");
        const h = String(now.getHours()).padStart(2, "0");
        const m = String(now.getMinutes()).padStart(2, "0");
        const s = String(now.getSeconds()).padStart(2, "0");
        return `${Y}${M}${D}_${h}${m}${s}`;
    }

    // 起動
    init();
})();
