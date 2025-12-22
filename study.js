const STORAGE_KEY = "word_list_visibility"; 
// 値: "show" | "hide"

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

    const globalMode = localStorage.getItem(STORAGE_KEY); 
    // "show" | "hide" | null

    pageWords.forEach(word => {
        const li = document.createElement("li");
        li.className = "word-item";

        li.innerHTML = `
            <div class="word-en">${word.en}</div>
            <div>　|　</div>
            <div class="word-ja-area">
                <span class="ja-text">${word.ja}</span>
                <div class="sticky-note">タップして表示</div>
            </div>
        `;

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
    pageInfoEls.textContent = `${currentPage} / ${totalPages}`;
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

// document.getElementById("show-all-btn").onclick = () => {
//     localStorage.setItem(STORAGE_KEY, "show");
//     document.querySelectorAll(".sticky-note").forEach(el => {
//         el.classList.add("hidden");
//     });
// };

// document.getElementById("hide-all-btn").onclick = () => {
//     localStorage.setItem(STORAGE_KEY, "hide");
//     document.querySelectorAll(".sticky-note").forEach(el => {
//         el.classList.remove("hidden");
//     });
// };

document.getElementById("show-all-btn").onclick = () => {
    localStorage.setItem(STORAGE_KEY, "show");
    renderWords();
};

document.getElementById("hide-all-btn").onclick = () => {
    localStorage.setItem(STORAGE_KEY, "hide");
    renderWords();
};