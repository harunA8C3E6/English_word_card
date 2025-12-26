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
        <span>#${tagId}</span>
        <input type="text" value="${tag.name}" data-tag="${tagId}">
    `;

    const input = li.querySelector("input");

    input.onchange = () => {
        tags[tagId].name = input.value.trim() || tagId;
        localStorage.setItem("tags", JSON.stringify(tags));
    };

    tagListEl.appendChild(li);
});
