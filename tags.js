document.getElementById("back-btn").onclick = () => {
    location.href = "index.html";
};


// 初期化用コード
function loadJSON(key, defaultValue) {
    try {
        return JSON.parse(localStorage.getItem(key)) ?? defaultValue;
    } catch {
        return defaultValue;
    }
}

const tags = loadJSON("tags", {
    タグ1: { name: "タグ1" },
    タグ2: { name: "タグ2" },
    タグ3: { name: "タグ3" }
});

localStorage.setItem("tags", JSON.stringify(tags));
// 初期化用コード終了

// localStorage から取得
// const tags = JSON.parse(localStorage.getItem("tags")) ?? {};
const wordTags = JSON.parse(localStorage.getItem("wordTags")) ?? {};

const tagListEl = document.getElementById("tag-list");

console.log("tags:", tags);
console.log("wordTags:", wordTags);
console.log("tagListEl:", tagListEl);

// タグごとの単語数を数える
function countWordsByTag(tagId) {
    let count = 0;
    
    Object.values(wordTags).forEach(tagArray => {
        if (tagArray.includes(tagId)) {
            count++;
        }
    });
    
    return count;
}

// 描画
Object.entries(tags).forEach(([tagId, tag]) => {
    const li = document.createElement("li");
    li.className = "tag-item";
    
    const count = countWordsByTag(tagId);
    
    li.innerHTML = `
    <a href="study.html?tag=${tagId}" class="tag-link">
    <span class="tag-name">#${tag.name}</span>
    <span class="tag-count">${count}語</span>
    </a>
    `;
    
    tagListEl.appendChild(li);
});
