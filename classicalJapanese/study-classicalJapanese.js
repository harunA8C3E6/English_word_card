// ==============================
// 変数の定義
// ==============================
console.log(window);

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
    const POS_FILTER_KEY = "posFilter-classical";
    const ALL_POS = ["動", "形", "形動", "名", "副"];
    let activePosSet = new Set(ALL_POS);
    // なぞ変数↓３つ
    let targetSerialNumber = null;
    let currentExampleText = "";
    let currentUtterance = null;
    // なぞ変数
    let jaVisible = false;
    // タグ用
    let wordTags = loadJSON("wordTags-classical", {});
    let tags = loadJSON("tags-classical", {});
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
    const exampleJa = modal.querySelector(".example-ja");
    const toggleJaBtn = document.getElementById("toggle-ja");
    const closeModalBtn = document.getElementById("close-modal");
    const playAudioBtn = document.getElementById("play-audio");
    // タグ設定モーダル
    const tagModal = document.getElementById("tag-modal");
    const tagModalTitle = document.getElementById("tag-modal-title");
    const tagCheckboxArea = document.getElementById("tag-checkbox-area");
    const tagSaveBtn = document.getElementById("tag-save-btn");
    const tagCloseBtn = document.getElementById("tag-close-btn");
    // 品詞フィルターモーダル
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
    // テストモーダル
    const testModal = document.getElementById("test-modal");
    const openTestModalBtn = document.getElementById("open-test-modal-btn");
    const testModalCloseBtn = document.getElementById("test-maker-close");
    const cardModalBtn = document.getElementById("open-card-settings");
    const closecardModalBtn = document.getElementById("card-study-close");
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
// ===== 品詞フィルターのcbを現在の情報にそろえる =====
document.querySelectorAll("#pos-filter input").forEach(cb => {
    cb.checked = activePosSet.has(cb.value);
});
// ===== 品詞フィルターの実行 =====
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
    Object.values(classicalWordData).forEach(bookWords => {
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
    words = classicalWordData[bookId] ?? [];
    
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
                exampleJa.textContent = word.example.ja;
                exampleJa.classList.add("modal-hidden");
                toggleJaBtn.classList.remove("modal-hidden");
                toggleJaBtn.textContent = "現代語訳語を表示";
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
    
    // 品詞チェックボックス関連
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
// 現代語訳のトグル
toggleJaBtn.onclick = () => {
    jaVisible = !jaVisible;
    exampleJa.classList.toggle("modal-hidden");
    toggleJaBtn.textContent = jaVisible
    ? "現代語訳を隠す"
    : "現代語訳を表示";
};
// ===== 品詞フィルター =====
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
        "posFilter-classical",
        JSON.stringify(selected)
    );
    
    // posModal.classList.add("modal-hidden");
    closePosModal();
    renderWords(); // ← 再描画
});
function loadPosFilterFromLocalStorage() {
    const saved = JSON.parse(
        localStorage.getItem("posFilter")
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
    `card-classicalJapanese.html?book=${book}` +
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
    localStorage.setItem("wordTags-classical", JSON.stringify(wordTags));
}
tagSaveBtn.addEventListener("click", () => {
    const selected = [];
    
    tagCheckboxArea
    .querySelectorAll("input[type='checkbox']:checked")
    .forEach(cb => {
        selected.push(cb.value);
    });
    
    wordTags[currentWordId] = selected;
    localStorage.setItem("wordTags-classical", JSON.stringify(wordTags));
    
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
        location.href = "./tags-classical.html";
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
        location.href = "./tags-classical.html";
    } else {
        // 通常の単語帳から来た場合
        location.href = "../index.html";
    }
};

// ==============================
// テスト関連
// ==============================
// モーダルを開く
openTestModalBtn.addEventListener("click", () => {
    testModal.classList.remove("modal-hidden");
    const maxWordCount = words.length;
    const to = document.getElementById("range-end");
    // from.value = 1;
    to.value = maxWordCount;
    // from.max = maxWordCount;
    to.max = maxWordCount;
});
function closeTestModal() {
    testModal.classList.add("modal-hidden");
}
testModalCloseBtn.addEventListener("click", closeTestModal);
// 背景クリックで閉じる
testModal.addEventListener("click", closeTestModal);
// 中身クリックは無効化
testModal.querySelector(".modal-tag-content").addEventListener("click", e => {
    e.stopPropagation();
});

function makeRangeLabel(range) {
    if (!range || !range.start || !range.end) return "";
    return `（範囲：${range.start}～${range.end}）`;
};
function makeTestTitle(baseTitle, options) {
    const rangeText = makeRangeLabel(options.range);
    return `${baseTitle} ${rangeText}`;
};
function filterWordsByPos(words, posSet) {
    return words.filter(word => {
        if (!Array.isArray(word.ja)) return true;
        
        return word.meanset?.some(item => {
            if (posSet.has(item.pos)) return true;
            return false;
        });
    });
};
function sortWords(words, order) {
    if (order === "random") {
        return [...words].sort(() => Math.random() - 0.5);
    }
    return words; // 連番
};
function createQuestionLines(words) {
    return words.map((w, i) => `${i + 1}. ${w.en}`);
};
document.getElementById("test-maker-close").onclick = () => {
    testModal.classList.add("modal-hidden");
};
function getRangeOptions() {
    const startEl = document.getElementById("range-start");
    const endEl = document.getElementById("range-end");
    let start = parseInt(startEl?.value, 10);
    let end = parseInt(endEl?.value, 10);
    if (isNaN(start)) start = 1;
    if (isNaN(end)) end = words.length;
    if (start > end) [start, end] = [end, start];
    return { start, end };
}

function filterWordsByRange(words, range) {
    let startIdx = range.start - 1;
    let endIdx = range.end - 1;
    
    if (isNaN(startIdx) || startIdx < 0) startIdx = 0;
    if (isNaN(endIdx) || endIdx >= words.length) endIdx = words.length - 1;
    
    if (startIdx > endIdx) {
        [startIdx, endIdx] = [endIdx, startIdx];
    }
    
    return words.slice(startIdx, endIdx + 1);
};
function pickRandomTestWords(allWords, options) {
    // ① 単語番号で範囲指定
    let words = filterWordsByRange(allWords, options.range);
    
    // ② 品詞フィルタ
    words = filterWordsByPos(words, options.posSet);
    
    words = shuffleArray(words);
    
    // ④ 50問
    return words.slice(0, 50);
};
function pickSequentialWords(allWords, options) {
    let words = filterWordsByRange(allWords, options.range);
    words = filterWordsByPos(words, options.posSet);
    
    return words; // ← 重要：sliceしない
};
function getTestOptions() {
    const order = document.getElementById("order-select").value;
    
    const posSet = new Set(
        [...document.querySelectorAll("#test-modal input[type='checkbox']:checked")]
        .map(cb => cb.value)
    );
    
    const range = getRangeOptions();
    const testCount = getTestCount();
    
    return { order, posSet, range, testCount };
}
document.getElementById("create-test-btn").addEventListener("click", () => {
    const options = getTestOptions();
    
    console.log("テストオプション:", options);
    console.log("品詞セット:", [...options.posSet]);
    
    // 範囲＋品詞で絞り込んだ「母集団」
    const baseWords = getWordsByRangeAndPos(options);
    
    console.log("絞り込み後の単語数:", baseWords.length);
    
    if (baseWords.length === 0) {
        alert("条件に合う単語がありません");
        return;
    }
    
    // ===== 連番 =====
    if (options.order === "sequential") {
        // 50語ずつ分割してそのままPDFへ
        generateCombinedTestPdf(baseWords, options);
        return;
    }
    
    // ===== ランダム（種類数対応） =====
    const allTests = [];
    
    for (let i = 0; i < options.testCount; i++) {
        const testWords = shuffleArray(baseWords).slice(0, 50);
        
        // if (testWords.length < 50) {
            //     alert("単語数が不足しています");
            //     return;
            // }
            
            allTests.push(testWords);
    }
    generateRandomTestsPdf(allTests, options);
});
function drawTable(doc, words, showAnswer = false) {
    const startY = 30;
    const rowHeight = 7;
    
    const leftX = 10;
    const rightX = 150;
    
    const colWidths = {
        no: 8,
        word: 38,
        blank: 94
    };
    doc.setFontSize(10);
    
    for (let i = 0; i < 25; i++) {
        const y = startY + i * rowHeight;
        
        if (words[i]) {
            drawRow(
                doc,
                leftX,
                y,
                i + 1,
                words[i],
                colWidths,
                rowHeight,
                showAnswer
            );
        }
        
        if (words[i + 25]) {
            drawRow(
                doc,
                rightX,
                y,
                i + 26,
                words[i + 25],
                colWidths,
                rowHeight,
                showAnswer
            );
        }
    }
};
function drawRow(doc, x, y, number, word, colWidths, height, showAnswer = false) {
    // 番号
    doc.rect(x, y, colWidths.no, height);
    doc.text(
        String(number),
        x + colWidths.no / 2,
        y + height / 2 + 2,
        { align: "center" }
    );

    // 英単語
    doc.rect(x + colWidths.no, y, colWidths.word, height);
    doc.text(word.ja, x + colWidths.no + 2, y + 5);

    // 解答枠
    const answerX = x + colWidths.no + colWidths.word;
    doc.rect(answerX, y, colWidths.blank, height);

    if (showAnswer) {
        const text = getAnswerText(word);
        const maxWidth = colWidths.blank - 4;

        // 行分割
        const lines = doc.splitTextToSize(text, maxWidth);

        // 行数に応じて調整
        if (lines.length >= 2) {
            doc.setFontSize(8);          // 小さく
            doc.setTextColor(120);

            doc.text(
                lines,
                answerX + 2,
                y + 3,                   // 少し上に
                {
                    maxWidth,
                    lineHeightFactor: 1.1 // 行間を詰める
                }
            );
        } else {
            doc.setFontSize(9);
            doc.setTextColor(120);

            doc.text(
                lines,
                answerX + 2,
                y + 5
            );
        }

        // フォント戻す
        doc.setFontSize(11);
        doc.setTextColor(0);
    }
}
// 解答の作成
function getAnswerText(word) {
    if (!Array.isArray(word.meanset)) return "";
    
    return word.meanset
    .map(m => m.mean)
    .join(" / ");
}
// 種類数の取得
function getTestCount() {
    const count = parseInt(
        document.getElementById("test-count").value,
        10
    );

    return isNaN(count) || count < 1 ? 1 : count;
}
// 複数種類作成できるようにするコード
function createOneTest(words, options) {
    let list = filterWordsByRange(words, options.range);
    list = filterWordsByPos(list, options.posSet);
    list = sortWords(list, options.order);
    
    return list.slice(0, 50);
}
function generateMultipleTestsPDF(allWords, options) {
    const { jsPDF } = window.jspdf;
    
    const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4"
    });
    
    const labels = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    doc.setFont("NotoSansJP-Regular", "normal");
    
    if (options.order === "sequential") {
        // const chunks = splitIntoChunks(wordsLotOfTest, 50);
        
        chunks.forEach((chunk, index) => {
            generateTestPdf(chunk, index + 1);
        });
    } else {
        // ランダムは今まで通り
        generateCombinedTestPdf(words.slice(0, 50));
    }
    
    for (let i = 0; i < options.testCount; i++) {
        const testWords = createOneTest(allWords, options);

        if (testWords.length < 50) {
            alert("単語数が不足しています");
            return;
        }

        const label = labels[i];
        
        /* ===== 問題ページ ===== */
        if (i > 0) doc.addPage();
        doc.setFontSize(20);
        // doc.text("英単語テスト（50問）", 45, 23, { align: "center" });
        const title = makeSequentialTestTitle(
            `${getCurrentTestLabel()}-連番`,
            options,
            index,
            chunk.length
        );
        doc.text(
            String(title), // ← 強制的に string 化
            148,
            15,
            { align: "center" }
        );
        doc.setFontSize(15);
        doc.text("学年：＿＿", 85, 23);
        doc.text("番号：＿＿", 115, 23);
        doc.text("名前：＿＿＿＿＿＿＿＿", 145, 23);
        
        // 得点欄
        doc.text("得点：＿＿＿ / 50", 220, 23)
        // doc.text("＿＿＿ / 50", 250, 17);
        
        // 下線
        // doc.line(10, 28, 287, 28);
        
        drawTable(doc, testWords, false);
        
        /* ===== 解答ページ ===== */
        doc.addPage();
        doc.setFontSize(20);
        doc.text("英単語テスト（解答）", 45, 17, { align: "center" });
        drawTable(doc, testWords, true);
    }

    doc.save(`english_test_${options.testCount}_types.pdf`);
}
// 連番で、50を超える範囲を選択した場合の設定
function splitIntoChunks(array, chunkSize = 50) {
    const chunks = [];
    
    for (let i = 0; i < array.length; i += chunkSize) {
        chunks.push(array.slice(i, i + chunkSize));
    }
    
    return chunks;
}
function getWordsByRangeAndPos(options) {
    const { range, posSet } = options;
    const baseWords = getBaseWords();
    
    return baseWords.filter((word, index) => {
        const wordNumber = index + 1;
        
        if (wordNumber < range.start || wordNumber > range.end) return false;
        if (!posSet || posSet.size === 0) return true;
        
        return word.meanset?.some(item => {
            if (posSet.has(item.pos)) return true;
            return false;
        });
    });
}
function shuffleArray(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}
function getTodayString() {
    const d = new Date();

    const y = String(d.getFullYear()).slice(-2);
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");

    return `${y}-${m}-${day}`;
}
function generateCombinedTestPdf(words, options) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4"
    });
    
    const chunkSize = 50;
    const chunks = splitIntoChunks(words, chunkSize);
    doc.setFont("NotoSansJP-Regular", "normal");
    
    chunks.forEach((chunk, index) => {
        if (index > 0) doc.addPage();
        
        // ===== 問題ページ =====
        doc.setFontSize(20);
        doc.text(makeSequentialTestTitle(`${getCurrentTestLabel()}-連番`, options, index, chunk.length),148, 15, { align: "center" });
        doc.setFontSize(15);
        doc.text("学年：＿＿", 85, 25);
        doc.text("番号：＿＿", 115, 25);
        doc.text("名前：＿＿＿＿＿＿＿＿", 145, 25);
        
        // 得点欄
        doc.text("得点：＿＿＿ / 50", 220, 25);
        // drawTable(doc, wordsLotOfTest, false);
        drawTable(doc, chunk, false);
        
        // 解答ページ
        doc.addPage();
        doc.setFontSize(20);
        doc.text(makeSequentialTestTitle(`${getCurrentTestLabel()}-連番（解答）`, options, index, chunk.length), 148, 17, { align: "center" });
        drawTable(doc, chunk, true);
    });

    const namestart = parseInt(document.getElementById("range-start").value, 10);
    const nameend = parseInt(document.getElementById("range-end").value, 10);
    doc.save(`${getCurrentTestLabel()}テスト連番(${namestart}～${nameend})_(${getTodayString()}).pdf`);
}
function generateRandomTestsPdf(tests, options) {
    const { jsPDF } = window.jspdf;
    
    const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4"
    });
    
    doc.setFont("NotoSansJP-Regular", "normal");
    
    const start = parseInt(document.getElementById("range-start").value, 10);
    const end = parseInt(document.getElementById("range-end").value, 10);
    
    
    tests.forEach((words, index) => {
        if (index > 0) doc.addPage();

        // ===== 問題 =====
        doc.setFontSize(20);
        doc.text(makeTestTitle(`${getCurrentTestLabel()}-ランダム`, options), 148, 15, { align: "center" });
        
        doc.setFontSize(15);
        doc.text("学年：＿＿", 85, 25);
        doc.text("番号：＿＿", 115, 25);
        doc.text("名前：＿＿＿＿＿＿＿＿", 145, 25);
        doc.text("得点：＿＿＿ / 50", 220, 25);

        drawTable(doc, words, false);
        
        // ===== 解答 =====
        doc.addPage();
        doc.setFontSize(20);
        doc.text(makeTestTitle(`${getCurrentTestLabel()}-ランダム（解答）`, options), 148, 17, { align: "center" });
        drawTable(doc, words, true);
    });

    doc.save(`${getCurrentTestLabel()}テストランダム(${start}～${end})_(${getTodayString()}).pdf`);
}
function makeSequentialRangeLabel(baseRange, chunkIndex, chunkSize, chunkLength) {
    const start = baseRange.start + chunkIndex * chunkSize;
    const end = start + chunkLength - 1;
    return `（範囲：${start}～${end}）`;
}
function makeSequentialTestTitle(baseTitle, options, chunkIndex, chunkLength) {
    if (!options?.range) return baseTitle;
    const rangeText = makeSequentialRangeLabel(
        options.range,
        chunkIndex,
        50,
        chunkLength
    );
    return `${baseTitle} ${rangeText}`;
}

function getCurrentTestLabel() {
    // タグページ優先
    if (tagId) {
        const name = tags[tagId]?.name ?? "タグ";
        return `#${name}`;
    }
    
    // 単語帳ページ
    if (book) {
        return book.abbr ?? book.title;
    }
    
    return "単語帳";
}
function getBaseWords() {
    // タグページ
    if (tagId) {
        const result = [];
        
        Object.values(classicalWordData).forEach(bookWords => {
            bookWords.forEach(word => {
                const tagsOfWord = wordTags[word.id] ?? [];
                
                if (tagsOfWord.includes(tagId)) {
                    result.push(word);
                }
            });
        });
        
        return result;
    }

    // 単語帳ページ
    return classicalWordData[bookId] ?? [];
}