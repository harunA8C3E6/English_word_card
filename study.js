const STORAGE_KEY = "word_list_visibility"; 
// 値: "show" | "hide"

let targetSerialNumber = null;

document.getElementById("back-btn").addEventListener("click", () => {
    location.href = "index.html";
});

const params = new URLSearchParams(location.search);
const bookId = params.get("book");
const book = wordBookMap[bookId];

document.getElementById("book-title").textContent =
    book ? book.title : "単語帳";

// ===== ここから単語表示 =====

const words = wordData[bookId] ?? [];
const WORDS_PER_PAGE = 10;
let currentPage = 1;

const listEl = document.getElementById("word-list");

function renderWords() {
    listEl.innerHTML = "";

    const start = (currentPage - 1) * WORDS_PER_PAGE;
    const end = start + WORDS_PER_PAGE;
    const pageWords = words.slice(start, end);

    let highlightElement = null;

    const globalMode = localStorage.getItem(STORAGE_KEY); 
    // "show" | "hide" | null

    pageWords.forEach((word, index) => {
        const li = document.createElement("li");
        li.className = "word-item";

        const serialNumber =
        (currentPage - 1) * WORDS_PER_PAGE + index + 1;

        li.innerHTML = `
            <div class="word-index">${serialNumber}.</div>
            <div class="word-en">${word.en}</div>
            <div>|　</div>
            <div class="word-ja-area">
                <span class="ja-text">${word.ja}</span>
                <div class="sticky-note">タップして表示</div>
            </div>
        `;

        // このif文はハイライト
        if (serialNumber === targetSerialNumber) {
            li.classList.add("highlight");
            highlightElement = li;
        }

        const sticky = li.querySelector(".sticky-note");

        // ★ 全体状態をここで統一
        if (globalMode === "show") {
            sticky.classList.add("hidden");
            } else {
            sticky.classList.remove("hidden");
        }

        // 個別タップはその場だけ上書き
        sticky.addEventListener("click", () => {
            sticky.classList.toggle("hidden");
        });

    listEl.appendChild(li);
    });

    const totalPages = Math.ceil(words.length / WORDS_PER_PAGE);
    updatePageInfo(currentPage, totalPages);

    // ★ 描画後にスクロール
    if (highlightElement) {
        highlightElement.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });

        // 次回描画では解除
        targetSerialNumber = null;
    }
}


// ボタン操作
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

// 初期表示
renderWords();

document.getElementById("show-all-btn").onclick = () => {
    localStorage.setItem(STORAGE_KEY, "show");
    renderWords();
};

document.getElementById("hide-all-btn").onclick = () => {
    localStorage.setItem(STORAGE_KEY, "hide");
    renderWords();
};

// 番号検索の導入
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

// 単語検索の導入
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

