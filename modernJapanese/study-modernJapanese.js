// ==============================
// 変数の定義
// ==============================

// ===== URLパラメータ =====
    const params = new URLSearchParams(location.search);
    const bookId = params.get("book");
    const book = wordBookMap[bookId];
    const tagId = params.get("tag");
// ===== データ =====
    const WORDS_PER_PAGE = 10; //1ページに何単語載せるのか
    let currentPage = 1;
    const STORAGE_KEY = "word_list_visibility";
    // 品詞チェックボックス
    const POS_FILTER_KEY = "posFilter-modern";
    const ALL_POS = ["テ1", "テ2", "テ3", "テ4", "テ5"];
    let activePosSet = new Set(ALL_POS);
    // なぞ変数↓３つ
    let targetSerialNumber = null;
    let currentExampleText = "";
    let currentUtterance = null;
    // なぞ変数
    let jaVisible = false;
    // タグ用
    let wordTags = loadJSON("wordTags-modern", {});
    let tags = loadJSON("tags-modern", {});
    // メモ用
    const MEMO_KEY = "wordMemos";
    let wordMemos = loadJSON(MEMO_KEY, {});
    let currentMemoWordId = null;
    // 単語リスト
    let words = [];
    // なぞ変数
    let currentWordId = null;
// ===== DOM取得 =====
    // 単語リスト
    const listEl = document.getElementById("word-list");
    // 例文モーダル関連
    const modal = document.getElementById("example-modal");
    const exampleEn = modal.querySelector(".example-en");
    const closeModalBtn = document.getElementById("close-modal");
    // タグ設定モーダル
    const tagModal = document.getElementById("tag-modal");
    const tagModalTitle = document.getElementById("tag-modal-title");
    const tagCheckboxArea = document.getElementById("tag-checkbox-area");
    const tagSaveBtn = document.getElementById("tag-save-btn");
    const tagCloseBtn = document.getElementById("tag-close-btn");
    // テーマフィルターモーダル
    const posModal = document.getElementById("pos-modal");
    const posFilterBtn = document.getElementById("pos-filter-btn");
    const posApplyBtn = document.getElementById("pos-apply-btn");
    const posCloseBtn = document.getElementById("pos-close-btn");
    // カード設定モーダル
    const openBtn = document.getElementById("open-card-setting");
    const closeBtn = document.getElementById("close-card-btn");
    const cardModal = document.getElementById("card-setting-modal");
    // メモモーダル
    const memoModal = document.getElementById("memo-modal");
    const memoTitle = document.getElementById("memo-modal-title");
    const memoTextarea = document.getElementById("memo-textarea");
    const memoSaveBtn = document.getElementById("memo-save-btn");
    const memoCloseBtn = document.getElementById("memo-close-btn");
    const memoEditBtn = document.getElementById("memo-edit-btn");
    const memoCancelBtn = document.getElementById("memo-cancel-btn");
    const memoView = document.getElementById("memo-view");
    // 次へボタン
    const prevButtons = document.querySelectorAll(".prev-btn");
    const nextButtons = document.querySelectorAll(".next-btn");
    const pageInfoEls = document.querySelectorAll(".page-info");
    // 単語検索
    const wordSearchInput = document.getElementById("word-search-input");
    const wordSearchBtn = document.getElementById("word-search-btn");
    // 番号検索
    const jumpInput = document.getElementById("jump-input");
    const jumpBtn = document.getElementById("jump-btn");
    // 前に戻るボタン
    const prevBtn = document.getElementById("prev-page-btn");
    const backBtn = document.getElementById("back-btn");
    const buttonParams = new URLSearchParams(location.search);

// ==============================
// loadJSONの定義
// ==============================
function loadJSON(key, defaultValue) {
    try {
        return JSON.parse(localStorage.getItem(key)) ?? defaultValue;
    } catch {
        return defaultValue;
    }
}

// ==============================
// 単語に関する部分
// ==============================

// ===== 対象となる品詞情報の取得＆繁栄 =====
loadPosFilter();
function loadPosFilter() {
    try {
        const saved = JSON.parse(localStorage.getItem(POS_FILTER_KEY));
        if (Array.isArray(saved) && saved.length > 0) {
            activePosSet = new Set(saved);
        }
    } catch {
        activePosSet = new Set(ALL_POS);
    }
}
// ===== テーマフィルターのcbを現在の情報にそろえる =====
document.querySelectorAll("#pos-filter input").forEach(cb => {
    cb.checked = activePosSet.has(cb.value);
});
// ===== テーマフィルターの実行 =====
document.querySelectorAll("#pos-filter input").forEach(cb => {
    cb.addEventListener("change", () => {
        activePosSet.clear();

        document.querySelectorAll("#pos-filter input:checked")
            .forEach(el => activePosSet.add(el.value));

        // 全解除防止
        // if (activePosSet.size === 0) {
        //     cb.checked = true;
        //     activePosSet.add(cb.value);
        // }

        // 保存
        localStorage.setItem(
            POS_FILTER_KEY,
            JSON.stringify([...activePosSet])
        );

        // 動かなくなったらこれ消す→study.jsの544行
        document.querySelectorAll("#pos-filter input:checked")
        .forEach(checked => {
            activePosSet.add(checked.value);
        });

        currentPage = 1;
        renderWords();
    });
});
// ===== 表示対象 words を決定 =====
if (tagId) {
    // タグページの場合
    Object.values(modernWordData).forEach(bookWords => {
        bookWords.forEach(word => {
            const tagsOfWord = wordTags[word.id] ?? [];
            if (tagsOfWord.includes(tagId)) {
                words.push(word);
            }
        });
    });
    
    const tagName = tags[tagId]?.name ?? tagId;
    document.getElementById("book-title").textContent = `#${tagName}`;
    
} else if (bookId) {
    // 単語帳ページの場合
    words = modernWordData[bookId] ?? [];
    
    const book = wordBookMap[bookId];
    document.getElementById("book-title").textContent =
    book ? book.title : "単語帳";
}

// ===== 単語描画 =====
renderWords();
function renderWords() {
    listEl.innerHTML = "";
    
    const start = (currentPage - 1) * WORDS_PER_PAGE;
    const filteredWords = words.filter(matchPosFilter);
    const pageWords = filteredWords.slice(start, start + WORDS_PER_PAGE);
    
    let highlightElement = null;
    const globalMode = localStorage.getItem(STORAGE_KEY);
    
    pageWords.forEach((word, index) => {
        const li = document.createElement("li");
        li.className = "word-item";
        
        const serialNumber = start + index + 1;
        
        // ===== 日本語訳の作成 =====
        function renderJapanese(word) {
            
            // 新データ（配列）
            if (Array.isArray(word.meanset)) {
                return word.meanset.map(item => `
                    <div class="ja-line">
                    <span class="pos-tag" data-pos="${item.pos}">${item.pos}</span>
                    <span class="meaning">${item.mean}</span>
                    </div>
                    `).join("");
            }
            // 旧データ（文字列）にも対応
            if (typeof word.ja === "string") {
                return `<div class="ja-line">${word.mean}</div>`;
            }
            
            return "";
        }
        
        // ===== 単語HTMLの生成 =====
        li.innerHTML = `
        <div class="word-en-area">
        <span class="word-index">${serialNumber}.</span>
        <span class="word-en">${word.ja}</span>
        <button class="example-btn button-text">例文</button>
        <button class="tag-edit-btn button-text">タグ設定</button>
        <button class="memo-btn button-text">メモ</button>
        </div>
        <div class="word-ja-area">
        <div class="ja-text">${renderJapanese(word)}</div>
        <div class="sticky-note">タップして表示</div>
        </div>
        `;
        
        // 番号検索におけるハイライト
        if (serialNumber === targetSerialNumber) {
            li.classList.add("highlight");
            highlightElement = li;
        }
        
        const sticky = li.querySelector(".sticky-note");
        const jaText = li.querySelector(".ja-text");
        const jaArea = li.querySelector(".word-ja-area");
        // 日本語の高さを取得
        const textHeight = jaText.offsetHeight;
        // 高さの動機
        // sticky.style.height = textHeight + "px";
        jaArea.style.height = textHeight + "px";
        
        if (globalMode === "show") {
            sticky.classList.add("hidden");
        } else {
            sticky.classList.remove("hidden");
        }
        
        sticky.onclick = () => {
            sticky.classList.toggle("hidden");
        };
        
        // 例文ボタン
        li.querySelector(".example-btn").onclick = () => {
            if (!word.example) {
                exampleEn.textContent = "例文はありません";
                exampleJa.textContent = "";
                toggleJaBtn.classList.add("modal-hidden");
                currentExampleText = "";
            } else {
                exampleEn.textContent = word.example.en;
                jaVisible = false;
                currentExampleText = word.example.en;
            }
            modal.classList.remove("modal-hidden");
        };
        
        listEl.appendChild(li);
        
        li.querySelector(".tag-edit-btn").onclick = () => {
            openTagModal(word);
        };
        
        // メモ用
        li.querySelector(".memo-btn").onclick = () => {
            openMemoModal(word);
        };
        
        const memoBtn = li.querySelector(".memo-btn");
        
        const memo = wordMemos[word.id];
        if (memo && memo.trim() !== "") {
            memoBtn.classList.add("has-memo");
        }
        
    });
    
    const totalPages = Math.ceil(filteredWords.length / WORDS_PER_PAGE);
    updatePageInfo(currentPage, totalPages);
    
    if (highlightElement) {
        highlightElement.scrollIntoView({ behavior: "smooth", block: "center" });
        targetSerialNumber = null;
    }
    
    // タグ設定ボタン
    function openTagModal(word) {
        currentWordId = word.id;
        
        tagModalTitle.textContent = `${word.ja} のタグ設定`;
        tagCheckboxArea.innerHTML = "";
        
        const currentTags = wordTags[word.id] ?? [];
        
        Object.entries(tags).forEach(([tagId, tag]) => {
            const checked = currentTags.includes(tagId) ? "checked" : "";
            
            tagCheckboxArea.innerHTML += `
            <label>
            <input type="checkbox" value="${tagId}" ${checked}>
            ${tag.name}
            </label>
            `;
        });
        
        tagModal.classList.remove("modal-hidden");
    }
    
    // テーマチェックボックス関連
    function matchPosFilter(word) {
        // meanset がない単語は表示
        if (!Array.isArray(word.meanset)) return true;
        // meanset 内の pos をチェック
        return word.meanset.some(item =>
            activePosSet.has(item.pos)
        );
    }
    
    if (activePosSet.size === 0) {
        cb.checked = true;
        activePosSet.add(cb.value);
        return;
    }
}

// ==============================
// モーダルに関する部分
// ==============================

// ===== 閉じる関数 =====
function closeModal() {
    modal.classList.add("modal-hidden");
}

// ===== 例文モーダル =====
// 閉じるボタン
closeModalBtn.onclick = closeModal;
modal.addEventListener("click", closeModal);
modal.querySelector(".modal-content").addEventListener("click", e => {
    e.stopPropagation();
});
// ===== テーマフィルター =====
function closePosModal() {
    posModal.classList.add("modal-hidden");
};
posCloseBtn.addEventListener("click", closePosModal);
posModal.onclick = closePosModal;
posModal.querySelector(".modal-tag-content").onclick = e => {
    e.stopPropagation();
};
posFilterBtn.onclick = () => {
    document
        .querySelectorAll("#pos-checkbox-area input")
        .forEach(cb => {
            cb.checked = activePosSet.has(cb.value);
        });

    posModal.classList.remove("modal-hidden");
};
// posCloseBtn.onclick = () => {
//     posModal.classList.add("modal-hidden");
// };
posApplyBtn.addEventListener("click", () => {
    activePosSet.clear();
    
    const selected = [];
    
    document
    .querySelectorAll("#pos-checkbox-area input:checked")
    .forEach(cb => {
        activePosSet.add(cb.value);
        selected.push(cb.value);
    });
    
    localStorage.setItem(
        "posFilter-modern",
        JSON.stringify(selected)
    );
    
    // posModal.classList.add("modal-hidden");
    closePosModal();
    renderWords(); // ← 再描画
});
function loadPosFilterFromLocalStorage() {
    const saved = JSON.parse(
        localStorage.getItem("posFilter-modern")
    );
    
    const checkboxes = document.querySelectorAll(
        "#pos-checkbox-area input[type='checkbox']"
    );
    
    // 保存データがない場合は全チェック
    if (!Array.isArray(saved)) {
        checkboxes.forEach(cb => cb.checked = true);
        return;
    }
    checkboxes.forEach(cb => {
        cb.checked = saved.includes(cb.value);
    });
}
document.addEventListener("DOMContentLoaded", () => {
    loadPosFilter();
    renderWords();
});
function renderJaByPos(jaArray) {
    if (!Array.isArray(jaArray)) return "";
    
    const grouped = {};
    
    jaArray.forEach(({ pos, meaning }) => {
        if (!activePosSet.has(pos)) return;
        
        if (!grouped[pos]) grouped[pos] = [];
        grouped[pos].push(meaning);
    });
    
    let html = "";
    
    for (const pos in grouped) {
        html += `
        <div class="pos-block">
        <div class="pos-label">${pos}</div>
        <ul class="meaning-list">
                    ${grouped[pos].map(m => `<li>${m}</li>`).join("")}
                </ul>
            </div>
            `;
    }
    
    return html || `<div class="ja-line">（該当する品詞なし）</div>`;
};
// ===== カード設定モーダル =====
openBtn.addEventListener("click", () => {
    cardModal.classList.remove("modal-hidden");
    const maxWordCount = words.length;
    const to = document.getElementById("range-to");
    
    // from.value = 1;
    to.value = maxWordCount;
    
    // from.max = maxWordCount;
    to.max = maxWordCount;
    
    // cardModal.classList.remove("modal-hidden");
});
closeBtn.addEventListener("click", () => {
    cardModal.classList.add("modal-hidden");
});
document.getElementById("start-study-btn").addEventListener("click", () => {
    // const params = new URLSearchParams(location.search);
    const book = params.get("book");
    
    const from = document.getElementById("range-from").value;
    const to = document.getElementById("range-to").value;
    const limit = document.getElementById("limit-count").value;
    const order = document.getElementById("order-type").value;
    
    const pos = [...document.querySelectorAll(
        'fieldset input[type="checkbox"]:checked'
    )].map(cb => cb.value).join(",");
    
    location.href =
    `card-modernJapanese.html?book=${book}` +
    `&from=${from}` +
    `&to=${to}` +
    `&limit=${limit}` +
    `&pos=${pos}` +
    `&order=${order}`;
});
// メモモーダル
memoSaveBtn.addEventListener("click", () => {
    const value = memoTextarea.value;
    wordMemos[currentMemoWordId] = value;
    localStorage.setItem(MEMO_KEY, JSON.stringify(wordMemos));
    // 表示更新
    memoView.textContent = value || "（メモはまだありません）";
    memoView.classList.toggle("empty", !value);
    
    // ← ここ重要：一覧を再描画
    renderWords();
    
    memoView.classList.remove("modal-hidden");
    memoTextarea.classList.add("modal-hidden");
    
    memoEditBtn.classList.remove("modal-hidden");
    memoSaveBtn.classList.add("modal-hidden");
    memoCancelBtn.classList.add("modal-hidden");
});
function closeMemoModal() {
    memoModal.classList.add("modal-hidden");
    currentMemoWordId = null;
}
memoCloseBtn.addEventListener("click", closeMemoModal);
memoModal.onclick = closeMemoModal;
memoModal.querySelector(".modal-tag-content").onclick = e => {
    e.stopPropagation();
};
memoEditBtn.addEventListener("click", () => {
    memoView.classList.add("modal-hidden");
    memoTextarea.classList.remove("modal-hidden");
    memoTextarea.focus();
    memoEditBtn.classList.add("modal-hidden");
    memoSaveBtn.classList.remove("modal-hidden");
    memoCancelBtn.classList.remove("modal-hidden");
});
memoCancelBtn.addEventListener("click", () => {
    memoView.classList.remove("modal-hidden");
    memoTextarea.classList.add("modal-hidden");
    
    memoEditBtn.classList.remove("modal-hidden");
    memoSaveBtn.classList.add("modal-hidden");
    memoCancelBtn.classList.add("modal-hidden");
});
function openMemoModal(word) {
    currentMemoWordId = word.id;
    
    const memo = wordMemos[word.id] ?? "";
    
    memoTitle.textContent = `${word.ja} のメモ`;
    
    memoView.textContent = memo || "（メモはまだありません）";
    memoView.classList.toggle("empty", !memo);
    
    memoTextarea.value = memo;
    
    // 閲覧モード
    memoView.classList.remove("modal-hidden");
    memoTextarea.classList.add("modal-hidden");
    
    memoEditBtn.classList.remove("modal-hidden");
    memoSaveBtn.classList.add("modal-hidden");
    memoCancelBtn.classList.add("modal-hidden");
    
    memoModal.classList.remove("modal-hidden");
    memoEditBtn.textContent = memo ? "編集" : "新規作成";
}

// ==============================
// タグ関連
// ==============================
function saveWordTags() {
    localStorage.setItem("wordTags-modern", JSON.stringify(wordTags));
}
tagSaveBtn.addEventListener("click", () => {
    const selected = [];
    
    tagCheckboxArea
    .querySelectorAll("input[type='checkbox']:checked")
    .forEach(cb => {
        selected.push(cb.value);
    });
    
    wordTags[currentWordId] = selected;
    localStorage.setItem("wordTags-modern", JSON.stringify(wordTags));
    
    closeTagModal();
});
tagCloseBtn.addEventListener("click", closeTagModal);
function closeTagModal() {
    tagModal.classList.add("modal-hidden");
    currentWordId = null;
};
tagModal.onclick = closeTagModal;
tagModal.querySelector(".modal-tag-content").onclick = e => {
    e.stopPropagation();
};

// ==============================
// ページ数表示・「前へ・次へ」ボタン
// ==============================
function updatePageInfo(current, total) {
    pageInfoEls.forEach(el => {
        el.textContent = `${current} / ${total}`;
    });
}
prevButtons.forEach(btn => {
    btn.onclick = () => {
        if (currentPage > 1) {
            currentPage--;
            renderWords();
        }
    };
});
nextButtons.forEach(btn => {
    btn.onclick = () => {
        const totalPages = Math.ceil(words.length / WORDS_PER_PAGE);
        if (currentPage < totalPages) {
            currentPage++;
            renderWords();
        }
    };
});

// ==============================
// 「すべて表示/非表示」ボタン
// ==============================
document.getElementById("show-all-btn").onclick = () => {
    localStorage.setItem(STORAGE_KEY, "show");
    renderWords();
};
document.getElementById("hide-all-btn").onclick = () => {
    localStorage.setItem(STORAGE_KEY, "hide");
    renderWords();
};

// ==============================
// 単語検索
// ==============================
wordSearchBtn.onclick = () => {
    const keyword = wordSearchInput.value.trim().toLowerCase();
    if (!keyword) return;
    
    // 単語を検索（英語 or 日本語）
    const index = words.findIndex(word =>
        word.ja.toLowerCase().includes(keyword)
    );
    
    if (index === -1) {
        alert("該当する単語が見つかりませんでした");
        return;
    }
    
    // 通し番号（1始まり）
    const serialNumber = index + 1;
    
    // ページ計算
    const targetPage = Math.ceil(serialNumber / WORDS_PER_PAGE);
    
    currentPage = targetPage;
    
    // ハイライトする単語番号の保存
    targetSerialNumber = serialNumber;
    
    renderWords();
    
    wordSearchInput.value = "";
};
// 検索をエンターキーでも検索できるようにする
wordSearchInput.addEventListener("keydown", e => {
    if (e.key === "Enter") {
        wordSearchBtn.click();
    }
});

// ==============================
// 番号検索
// ==============================
jumpBtn.onclick = () => {
    const number = Number(jumpInput.value);
    
    // 入力チェック
    if (!number || number < 1 || number > words.length) {
        alert("有効な番号を入力してください");
        return;
    }
    
    // ハイライトする単語番号の保存
    targetSerialNumber = number;
    
    currentPage = Math.ceil(number / WORDS_PER_PAGE);
    renderWords();
    
    // 任意：入力欄を空にする
    jumpInput.value = "";
};
// 検索をエンターキーでも検索できるようにする
jumpInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        jumpBtn.click();
    }
});

// ==============================
// 「ホーム/タグ一覧」に戻るボタン
// ==============================
document.getElementById("back-btn").onclick = () => {
    if (params.has("tag")) {
        // タグ学習ページから来た場合
        location.href = "./tags-modern.html";
    } else {
        // 通常の単語帳から来た場合
        location.href = "../index.html";
    }
};
// 表示を変える工夫
backBtn.textContent = buttonParams.has("tag")
    ? "← タグ一覧に戻る"
    : "← ホームに戻る";
prevBtn.onclick = () => {
    if (params.has("tag")) {
        // タグ学習ページから来た場合
        location.href = "./tags-modern.html";
    } else {
        // 通常の単語帳から来た場合
        location.href = "../index.html";
    }
};