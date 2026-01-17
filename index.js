// ==============================
// 英語
// ==============================
const listEl = document.getElementById("wordbook-list");
wordBooks.forEach(book => {
    const card = document.createElement("div");
    card.className = "wordbook-card";

    const wordCount = (wordData[book.id] ?? []).length;

    card.innerHTML = `
        <div class="wordbook-title">${book.title}</div>
        <div class="wordbook-desc">${book.description}</div>
        <div class="wordbook-desc">単語数：${wordCount}</div>
    `;

    card.addEventListener("click", () => {
        location.href = `English/study.html?book=${book.id}`;
    });

    listEl.appendChild(card);
});

// ==============================
// 現代文
// ==============================
const modernListEl = document.getElementById("modernJapanese-wordbook-list");
modernWordBooks.forEach(book => {
    const card = document.createElement("div");
    card.className = "wordbook-card";

    const wordCount = (modernWordData[book.id] ?? []).length;

    card.innerHTML = `
        <div class="wordbook-title">${book.title}</div>
        <div class="wordbook-desc">${book.description}</div>
        <div class="wordbook-desc">用語数：${wordCount}</div>
    `;

    // card.addEventListener("click", () => {
    //     location.href = `study-modernJapanese.html?book=${book.id}`;
    // });

    modernListEl.appendChild(card);
});

// ==============================
// 古典
// ==============================
const classicalListEl = document.getElementById("classicalJapanese-wordbook-list");
classicalWordBooks.forEach(book => {
    const card = document.createElement("div");
    card.className = "wordbook-card";

    const wordCount = (classicalWordData[book.id] ?? []).length;

    card.innerHTML = `
        <div class="wordbook-title">${book.title}</div>
        <div class="wordbook-desc">${book.description}</div>
        <div class="wordbook-desc">用語数：${wordCount}</div>
    `;

    card.addEventListener("click", () => {
        location.href = `classicalJapanese/study-classicalJapanese.html?book=${book.id}`;
    });

    classicalListEl.appendChild(card);
});