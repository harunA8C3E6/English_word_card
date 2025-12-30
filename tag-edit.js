const tagListEl = document.getElementById("tag-edit-list");
const backBtn = document.getElementById("back-btn");

backBtn.onclick = () => {
    location.href = "tags.html";
};

const tags = JSON.parse(localStorage.getItem("tags")) ?? {};

Object.entries(tags).forEach(([tagId, tag]) => {
    const li = document.createElement("li");
    li.className = "tag-item";

    li.innerHTML = `
        <span class="tag-name">#${tagId}</span>
        <input type="text" class="tag-rename-textbox" value="${tag.name}" data-tag="${tagId}">
    `;

    const input = li.querySelector("input");

    input.onchange = () => {
        tags[tagId].name = input.value.trim() || tagId;
        localStorage.setItem("tags", JSON.stringify(tags));
    };

    tagListEl.appendChild(li);
});

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