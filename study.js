const STORAGE_KEY = "word_list_visibility";

let targetSerialNumber = null;
let currentExampleText = "";
let currentUtterance = null;

// 品詞チェックボックス関連
const POS_FILTER_KEY = "posFilter";
const ALL_POS = ["動", "名", "形", "副"];

let activePosSet = new Set(ALL_POS);

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
loadPosFilter();

document.querySelectorAll("#pos-filter input").forEach(cb => {
    cb.checked = activePosSet.has(cb.value);
});

document.querySelectorAll("#pos-filter input").forEach(cb => {
    cb.addEventListener("change", () => {
        activePosSet.clear();

        document.querySelectorAll("#pos-filter input:checked")
            .forEach(el => activePosSet.add(el.value));

        // 全解除防止
        if (activePosSet.size === 0) {
            cb.checked = true;
            activePosSet.add(cb.value);
        }

        // 保存
        localStorage.setItem(
            POS_FILTER_KEY,
            JSON.stringify([...activePosSet])
        );

        currentPage = 1;
        renderWords();
    });
});


// ===== 「ホーム/タグ一覧」に戻るボタン =====
document.getElementById("back-btn").onclick = () => {
    const params = new URLSearchParams(location.search);
    if (params.has("tag")) {
        // タグ学習ページから来た場合
        location.href = "tags.html";
    } else {
        // 通常の単語帳から来た場合
        location.href = "index.html";
    }
};
const backBtn = document.getElementById("back-btn");
const buttonParams = new URLSearchParams(location.search);
backBtn.textContent = buttonParams.has("tag")
    ? "← タグ一覧に戻る"
    : "← ホームに戻る";
// ===== 終了 =====

function loadJSON(key, defaultValue) {
    try {
        return JSON.parse(localStorage.getItem(key)) ?? defaultValue;
    } catch {
        return defaultValue;
    }
}

let wordTags = loadJSON("wordTags", {});
let tags = loadJSON("tags", {});



// ===== タグ設定モーダル =====
const tagModal = document.getElementById("tag-modal");
const tagModalTitle = document.getElementById("tag-modal-title");
const tagCheckboxArea = document.getElementById("tag-checkbox-area");
const tagSaveBtn = document.getElementById("tag-save-btn");
const tagCloseBtn = document.getElementById("tag-close-btn");

let currentWordId = null;

// ===== URLパラメータ =====
const params = new URLSearchParams(location.search);
const bookId = params.get("book");
const book = wordBookMap[bookId];
const tagId = params.get("tag"); //タグのために追加

document.getElementById("book-title").textContent =
book ? book.title : "単語帳";

// ===== 表示対象 words を決定 =====
// お試し↓
let words = [];

if (tagId) {
    // タグページの場合
    Object.values(wordData).forEach(bookWords => {
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
    words = wordData[bookId] ?? [];

    const book = wordBookMap[bookId];
    document.getElementById("book-title").textContent =
        book ? book.title : "単語帳";
}
// お試し↑
// let words = [];

// if (tagId) {
//     Object.values(wordData).forEach(bookWords => {
//         bookWords.forEach(word => {
//             const tags = wordTags[word.id] ?? [];
//             if (tags.includes(tagId)) {
//                 words.push(word);
//             }
//         });
//     });

//     const tagName = tags[tagId]?.name ?? "タグ";
//     document.getElementById("book-title").textContent = `#${tagName}`;
// } else {
//     words = wordData[bookId] ?? [];
//     const book = wordBookMap[bookId];
//     document.getElementById("book-title").textContent =
//         book ? book.title : "単語帳";
// }


// ===== データ =====
// const words = wordData[bookId] ?? [];
const WORDS_PER_PAGE = 10;
let currentPage = 1;

const listEl = document.getElementById("word-list");

// ===== モーダル（1回だけ取得） =====
const modal = document.getElementById("example-modal");
const exampleEn = modal.querySelector(".example-en");
const exampleJa = modal.querySelector(".example-ja");
const toggleJaBtn = document.getElementById("toggle-ja");
const closeModalBtn = document.getElementById("close-modal");
const playAudioBtn = document.getElementById("play-audio");

let jaVisible = false;

// ===== 音声再生 =====
function speak(text) {
    if (!text) return;
    speechSynthesis.cancel();

    const uttr = new SpeechSynthesisUtterance(text);
    uttr.lang = "en-US";
    uttr.rate = 1.0;
    uttr.pitch = 1.0;

    currentUtterance = uttr;
    speechSynthesis.speak(uttr);
}

// ===== モーダル制御 =====
function closeModal() {
    modal.classList.add("modal-hidden");
    speechSynthesis.cancel();
}

toggleJaBtn.onclick = () => {
    jaVisible = !jaVisible;
    exampleJa.classList.toggle("modal-hidden");
    toggleJaBtn.textContent = jaVisible
        ? "日本語を隠す"
        : "日本語を表示";
};

closeModalBtn.onclick = closeModal;

modal.addEventListener("click", closeModal);
modal.querySelector(".modal-content").addEventListener("click", e => {
    e.stopPropagation();
});

playAudioBtn.onclick = () => {
    speak(currentExampleText);
};

localStorage.setItem("posFilter", JSON.stringify([...activePosSet]));
// ===== 単語描画 =====
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
            // 旧データ（文字列）にも対応
            if (typeof word.ja === "string") {
                return `<div class="ja-line">${word.ja}</div>`;
            }

            // 新データ（配列）
            if (Array.isArray(word.ja)) {
                return word.ja.map(item => `
                    <div class="ja-line">
                        <span class="pos-tag" data-pos="${item.pos}">${item.pos}</span>
                        <span class="meaning">${item.meaning}</span>
                    </div>
                `).join("");
            }

            return "";
        }

        // ===== 単語HTMLの生成 =====
        li.innerHTML = `
            <div class="word-en-area">
                <span class="word-index">${serialNumber}.</span>
                <span class="word-en">${word.en}</span>
                <button class="speak-btn button-text" data-word="${word.en}">🔊 再生</button>
                <button class="example-btn button-text">例文</button>
                
                <button class="tag-edit-btn button-text">
                タグ設定
                </button>
            </div>
            <div class="word-ja-area">
                <div class="ja-text">${renderJapanese(word)}</div>
                <div class="sticky-note">タップして表示</div>
            </div>
        `;

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

        // 単語音声
        li.querySelector(".speak-btn").onclick = (e) => {
            e.stopPropagation();
            speak(word.en);
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
                toggleJaBtn.textContent = "日本語を表示";
                jaVisible = false;

                currentExampleText = word.example.en;
            }
            
            modal.classList.remove("modal-hidden");
        };
        
        listEl.appendChild(li);

        li.querySelector(".tag-edit-btn").onclick = () => {
            openTagModal(word);
        };
    });

    const totalPages = Math.ceil(filteredWords.length / WORDS_PER_PAGE);
    updatePageInfo(currentPage, totalPages);

    if (highlightElement) {
        highlightElement.scrollIntoView({ behavior: "smooth", block: "center" });
        targetSerialNumber = null;
    }

    // タグ関連
    // const select = li.querySelector(".tag-select");

    // select.onchange = () => {
    //     const tag = select.value;
    //     if (!tag) return;

    //     if (!wordTags[word.id]) wordTags[word.id] = [];
    //     if (!wordTags[word.id].includes(tag)) {
    //         wordTags[word.id].push(tag);
    //         saveWordTags();
    //     }
    // };

    // タグ関連終了

    // タグ設定ボタン

    function openTagModal(word) {
        currentWordId = word.id;

    tagModalTitle.textContent = `${word.en} のタグ設定`;
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
        // 品詞データがない単語は常に表示
        if (!Array.isArray(word.ja)) return true;

        // 単語が持つ品詞一覧
        const wordPosList = word.ja.map(item => item.pos);

        // 選択中の品詞と1つでも一致すればOK
        return wordPosList.some(pos => activePosSet.has(pos));
    }
    
    if (activePosSet.size === 0) {
        cb.checked = true;
        activePosSet.add(cb.value);
        return;
    }
}

// タグ関連
function saveWordTags() {
    localStorage.setItem("wordTags", JSON.stringify(wordTags));
}
// タグ関連終了

// ===== ページ制御 =====
const prevButtons = document.querySelectorAll(".prev-btn");
const nextButtons = document.querySelectorAll(".next-btn");
const pageInfoEls = document.querySelectorAll(".page-info");

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

// ===== 付箋「すべて表示/非表示」切替 =====
document.getElementById("show-all-btn").onclick = () => {
    localStorage.setItem(STORAGE_KEY, "show");
    renderWords();
};

document.getElementById("hide-all-btn").onclick = () => {
    localStorage.setItem(STORAGE_KEY, "hide");
    renderWords();
};

// ===== 単語検索の導入 =====
const wordSearchInput = document.getElementById("word-search-input");
const wordSearchBtn = document.getElementById("word-search-btn");

wordSearchBtn.onclick = () => {
    const keyword = wordSearchInput.value.trim().toLowerCase();
    if (!keyword) return;
    
    // 単語を検索（英語 or 日本語）
    const index = words.findIndex(word =>
        word.en.toLowerCase().includes(keyword) ||
        word.ja.includes(keyword)
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

// ===== 番号検索の導入 =====
const jumpInput = document.getElementById("jump-input");
const jumpBtn = document.getElementById("jump-btn");

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

// ===== 初期表示 =====
renderWords();

// ===== タグの保存 =====
tagSaveBtn.onclick = () => {
    const selected = [];

    tagCheckboxArea
        .querySelectorAll("input[type='checkbox']:checked")
        .forEach(cb => {
            selected.push(cb.value);
        });

    wordTags[currentWordId] = selected;
    localStorage.setItem("wordTags", JSON.stringify(wordTags));

    closeTagModal();
};

function closeTagModal() {
    tagModal.classList.add("modal-hidden");
    currentWordId = null;
}

tagCloseBtn.onclick = closeTagModal;

tagModal.onclick = closeTagModal;
tagModal.querySelector(".modal-tag-content").onclick = e => {
    e.stopPropagation();
};

// タグの初期化ボタン
// document.getElementById(tagRestart).onclick = loadJSON;

// ===== 1つ前のページに戻るボタン =====
const prevBtn = document.getElementById("prev-page-btn");
if (prevBtn) {
    prevBtn.onclick = () => {
        if (history.length > 1) {
            history.back();
        } else {
            location.href = "index.html";
        }
    };
}

// ===== 品詞チェックボックスの設定 =====
document.querySelectorAll("#pos-filter input").forEach(cb => {
    cb.addEventListener("change", () => {
        activePosSet.clear();

        document.querySelectorAll("#pos-filter input:checked")
            .forEach(checked => {
                activePosSet.add(checked.value);
            });

        renderWords();
    });
});
