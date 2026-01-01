const STORAGE_KEY = "word_list_visibility";

let targetSerialNumber = null;
let currentExampleText = "";
let currentUtterance = null;

// 品詞チェックボックス関連
const POS_FILTER_KEY = "posFilter";
const ALL_POS = ["動", "名", "形", "副", "その他"];

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

// ===== 品詞フィルター用モーダル =====
const posModal = document.getElementById("pos-modal");
const posFilterBtn = document.getElementById("pos-filter-btn");
const posApplyBtn = document.getElementById("pos-apply-btn");
const posCloseBtn = document.getElementById("pos-close-btn");

posFilterBtn.onclick = () => {
    posModal.classList.remove("modal-hidden");
};

posCloseBtn.onclick = () => {
    posModal.classList.add("modal-hidden");
};

posApplyBtn.onclick = () => {
    activePosSet.clear();

    const selected = [];

    document
        .querySelectorAll("#pos-checkbox-area input:checked")
        .forEach(cb => {
            activePosSet.add(cb.value);
            selected.push(cb.value);
        });

        localStorage.setItem(
            "posFilter",
            JSON.stringify(selected)
        );

    posModal.classList.add("modal-hidden");
    renderWords(); // ← 再描画
};

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
    loadPosFilterFromLocalStorage();

    activePosSet.clear();
    document
        .querySelectorAll("#pos-checkbox-area input:checked")
        .forEach(cb => {
            activePosSet.add(cb.value);
        });

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
}

// ===== テスト題名用ユーティリティ =====
function makeRangeLabel(range) {
    if (!range || !range.start || !range.end) return "";
    return `（範囲：${range.start}～${range.end}）`;
}

function makeTestTitle(baseTitle, options) {
    const rangeText = makeRangeLabel(options.range);
    return `${baseTitle} ${rangeText}`;
}

// ===== テスト関連 =====
// function setupJapaneseFont(doc) {
//     doc.addFileToVFS(
//         "NotoSansJP-Regular.ttf",
//         NotoSansJP
//     );
//     doc.addFont(
//         "NotoSansJP-Regular.ttf",
//         "NotoSansJP",
//         "normal"
//     );
//     doc.setFont("NotoSansJP");
// }

function filterWordsByPos(words, posSet) {
    return words.filter(word =>
        word.ja.some(j => posSet.has(j.pos))
    );
}

function sortWords(words, order) {
    if (order === "random") {
        return [...words].sort(() => Math.random() - 0.5);
    }
    return words; // 連番
}

// function pickTestWords(allWords, options) {
//     let words = filterWordsByRange(allWoeds, options.range);
//     words = filterWordsByPos(allWords, options.posSet);
//     words = sortWords(words, options.order);

//     return words.slice(0, 50);
// }

function createQuestionLines(words) {
    return words.map((w, i) => `${i + 1}. ${w.en}`);
}

// document.getElementById("create-test-btn").onclick = () => {
//     const options = getTestOptions();
//     const testWords = pickTestWords(wordData.system, options);

//     if (testWords.length < 50) {
//         alert("単語数が不足しています");
//         return;
//     }

//     generateMultipleTestsPDF(systemWords, options);
// };

const testModal = document.getElementById("test-modal");
const openTestModalBtn = document.getElementById("open-test-modal-btn");
const cardModal = document.getElementById("card-settings-modal");
const cardModalBtn = document.getElementById("open-card-settings");
const closecardModalBtn = document.getElementById("card-study-close");

openTestModalBtn.onclick = () => {
    testModal.classList.remove("modal-hidden");
};

cardModalBtn.onclick = () => {
    cardModal.classList.remove("modal-hidden");
}

closecardModalBtn.onclick = () => {
    cardModal.classList.add("modal-hidden");
}


document.getElementById("test-maker-close").onclick = () => {
    testModal.classList.add("modal-hidden");
}

function getRangeOptions() {
    const start = parseInt(document.getElementById("range-start").value, 10);
    const end = parseInt(document.getElementById("range-end").value, 10);

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
}

function pickRandomTestWords(allWords, options) {
    // ① 単語番号で範囲指定
    let words = filterWordsByRange(allWords, options.range);

    // ② 品詞フィルタ
    words = filterWordsByPos(words, options.posSet);

    words = shuffleArray(words);

    // ④ 50問
    return words.slice(0, 50);
}
function pickSequentialWords(allWords, options) {
    let words = filterWordsByRange(allWords, options.range);
    words = filterWordsByPos(words, options.posSet);

    return words; // ← 重要：sliceしない
}

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

// テスト作成ボタン
// document.getElementById("create-test-btn").onclick = () => {
//     const options = getTestOptions();
//     let words = [];
//     // const filteredWords = getWordsByRangeAndPos(options);

//     if (options.order === "sequential") {
//         // 連番：範囲内全て
//         words = pickSequentialWords(wordData.system, options);
//     } else {
//         // ランダム：50語抽出
//         words = pickRandomTestWords(wordData.system, options);
//     }

//     if (words.length === 0) {
//         alert("条件に合う単語がありません");
//         return;
//     }

//     generateCombinedTestPdf(words);
// };
document.getElementById("create-test-btn").onclick = () => {
    const options = getTestOptions();

    // 範囲＋品詞で絞り込んだ「母集団」
    const baseWords = getWordsByRangeAndPos(options);

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

        if (testWords.length < 50) {
            alert("単語数が不足しています");
            return;
        }

        allTests.push(testWords);
    }

    generateRandomTestsPdf(allTests, options);
};
// テスト作成ボタン終了

document.getElementById("range-end").value = wordData.system.length;

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
}


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
    doc.text(word.en, x + colWidths.no + 2, y + 5);

    // 空欄
    doc.rect(
        x + colWidths.no + colWidths.word,
        y,
        colWidths.blank,
        height
    );

    // 解答（解答PDFのみ）
    if (showAnswer) {
        doc.setFontSize(9);
        doc.setTextColor(120);

        doc.text(
            getAnswerText(word),
            x + colWidths.no + colWidths.word + 2,
            y + 5,
            { maxWidth: colWidths.blank - 4 }
        );

        doc.setFontSize(11);
        doc.setTextColor(0);
    }
}

// 解答の作成
function getAnswerText(word) {
    if (!Array.isArray(word.ja)) return "";

    return word.ja
        .map(j => j.meaning)
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
        doc.text("英単語テスト（50問）", 45, 23, { align: "center" });

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
    const start = Number(range.start);
    const end = Number(range.end);

    const allWords = words;

    return allWords.filter((word, index) => {
        const wordNumber = index + 1;

        // 範囲チェック
        if (wordNumber < range.start || wordNumber > range.end) return false;

        // 品詞チェック
        if (!posSet || posSet.size === 0) return true;

        return Array.isArray(word.ja) &&
            word.ja.some(j => posSet.has(j.pos));
    });
}

const options = getTestOptions(); // order, range, etc.
// let wordsLotOfTest = getWordsByRangeAndPos(options);

// function generateTestPdf(wordsLotOfTest, testIndex) {
//     const { jsPDF } = window.jspdf;
//     const doc = new jsPDF({
//         orientation: "landscape",
//         unit: "mm",
//         format: "a4"
//     });


//     doc.setFontSize(20);
//     doc.text("英単語テスト（50問）", 45, 17, { align: "center" });

//     doc.setFontSize(15);
//     doc.text("学年：＿＿", 85, 17);
//     doc.text("番号：＿＿", 115, 17);
//     doc.text("名前：＿＿＿＿＿＿＿＿", 145, 17);

//     // 得点欄
//     doc.text("得点：＿＿＿ / 50", 220, 17);
//     drawTable(doc, wordsLotOfTest, false);

//     doc.addPage();
//     doc.setFontSize(20);
//     doc.text("英単語テスト（解答）", 45, 17, { align: "center" });
//     drawTable(doc, wordsLotOfTest, true);

//     doc.save(`英単語テスト_${testIndex}.pdf`);
// }

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

function generateCombinedTestPdf(words) {
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

    doc.save(`${getCurrentTestLabel()}テスト連番_(${getTodayString()}).pdf`);
}

function generateRandomTestsPdf(tests) {
    const { jsPDF } = window.jspdf;

    const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4"
    });

    doc.setFont("NotoSansJP-Regular", "normal");

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

    doc.save(`${getCurrentTestLabel()}テストランダム_(${getTodayString()}).pdf`);
}



function makeSequentialRangeLabel(baseRange, chunkIndex, chunkSize, chunkLength) {
    const start = baseRange.start + chunkIndex * chunkSize;
    const end = start + chunkLength - 1;
    return `（範囲：${start}～${end}）`;
}

function makeSequentialTestTitle(baseTitle, options, chunkIndex, chunkLength) {
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

        Object.values(wordData).forEach(bookWords => {
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
    return wordData[bookId] ?? [];
}


function getWordsByRangeAndPos(options) {
    const { range, posSet } = options;
    const baseWords = getBaseWords();

    return baseWords.filter((word, index) => {
        const wordNumber = index + 1;

        if (wordNumber < range.start || wordNumber > range.end) return false;
        if (!posSet || posSet.size === 0) return true;

        return word.ja?.some(j => posSet.has(j.pos));
    });
}


// k－アド画面への推移
const startBtn = document.getElementById("card-study-btn");

startBtn.onclick = () => {
    const from = Number(document.getElementById("range-from").value);
    const to = Number(document.getElementById("range-to").value);
    
    // 選択されている品詞
    const posChecked = Array.from(document.querySelectorAll("#pos-filter input[type='checkbox']:checked"))
                            .map(cb => cb.value);

    const random = document.getElementById("random-mode").checked;
    const randomCount = Number(document.getElementById("random-count").value);

    // URL パラメータを作成
    const params = new URLSearchParams();
    params.set("from", from);
    params.set("to", to);
    params.set("pos", posChecked.join(",")); // 例: "動,名"
    params.set("random", random ? "1" : "0");
    if (random) params.set("count", randomCount);

    // 単語カードページに遷移
    location.href = `card.html?${params.toString()}`;
};
