const listEl = document.getElementById("wordbook-list");

wordBooks.forEach(book => {
    const card = document.createElement("div");
    card.className = "wordbook-card";

    card.innerHTML = `
        <div class="wordbook-title">${book.title}</div>
        <div class="wordbook-desc">${book.description}</div>
        <div class="wordbook-desc">単語数：${book.count}</div>
    `;

    card.addEventListener("click", () => {
        location.href = `study.html?book=${book.id}`;
    });

    listEl.appendChild(card);
});