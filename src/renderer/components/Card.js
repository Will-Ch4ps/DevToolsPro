export function createCard(title, content) {
    const div = document.createElement('div');
    div.className = 'card';
    div.innerHTML = `<h3>${title}</h3><div>${content}</div>`;
    return div;
}