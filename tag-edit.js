// ==============================
// DOM取得
// ==============================
const tagListEl = document.getElementById("tag-edit-list");
const tags = JSON.parse(localStorage.getItem("tags")) ?? {};

// ==============================
// タグごとにテキストボックスの生成
// ==============================
Object.entries(tags).forEach(([tagId, tag]) => {
    const li = document.createElement("li");
    li.className = "tag-item";
    
    li.innerHTML = `
    <span class="tag-name">#${tagId}</span>
    <input type="text" class="tag-rename-textbox" value="${tag.name}" data-tag="${tagId}">
    `;
    
    const input = li.querySelector("input");
    
    // 名前が変更された際にローカルストレージも変更
    input.onchange = () => {
        tags[tagId].name = input.value.trim() || tagId;
        localStorage.setItem("tags", JSON.stringify(tags));
    };
    
    tagListEl.appendChild(li);
});

// ==============================
// 「←」「← ホームに戻る」ボタン
// ==============================
document.getElementById("back-btn").onclick = () => {
    location.href = "tags.html";
};
document.getElementById("prev-page-btn").onclick = () => {
    location.href = "index.html";
};