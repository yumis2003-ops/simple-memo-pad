// Data structure: Array of memo objects { id, title, content, updatedAt }
const STORAGE_KEY = 'notion_memos';
let memos = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
let currentMemoId = null;

// DOM Elements
const titleInput = document.getElementById('memoTitle');
const contentInput = document.getElementById('memoContent');
const memoList = document.getElementById('memoList');
const newMemoBtn = document.getElementById('newMemoBtn');
const deleteBtn = document.getElementById('deleteBtn');
const statusText = document.getElementById('saveStatus');
const breadcrumb = document.getElementById('currentMemoBreadcrumb');
const imageInput = document.getElementById('imageInput');
const addImageBtn = document.getElementById('addImageBtn');
const toolbarBtns = document.querySelectorAll('.toolbar-btn[data-command]');

let saveTimeout = null;

// File icon SVG
const documentIcon = `<svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M3.5 1.75H8.16667L11.6667 5.25V11.6667C11.6667 11.9761 11.5437 12.2728 11.325 12.4916C11.1062 12.7104 10.8094 12.8333 10.5 12.8333H3.5C3.19058 12.8333 2.89384 12.7104 2.67504 12.4916C2.45625 12.2728 2.33333 11.9761 2.33333 11.6667V2.91667C2.33333 2.60725 2.45625 2.3105 2.67504 2.09171C2.89384 1.87292 3.19058 1.75 3.5 1.75Z" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M8.16699 1.75V5.25H11.667" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

// Helper: Save to localStorage
function saveMemos() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(memos));
  showSaveStatus();
}

// Helper: Show "Saved to LocalStorage" briefly
function showSaveStatus() {
  statusText.classList.add('visible');
  setTimeout(() => {
    statusText.classList.remove('visible');
  }, 2000);
}

// Helper: Generate unique ID
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Create new memo
function createNewMemo() {
  const newMemo = {
    id: generateId(),
    title: '',
    content: '',
    updatedAt: Date.now()
  };
  memos.unshift(newMemo);
  saveMemos();
  selectMemo(newMemo.id);
  titleInput.focus();
}

// Select memo and update UI
function selectMemo(id) {
  currentMemoId = id;
  const memo = memos.find(m => m.id === id);
  if (memo) {
    titleInput.value = memo.title;
    contentInput.innerHTML = memo.content;
    breadcrumb.textContent = memo.title || 'Untitled';
  } else {
    titleInput.value = '';
    contentInput.innerHTML = '';
    breadcrumb.textContent = 'Untitled';
  }
  renderMemoList();
}

// Render the sidebar list
function renderMemoList() {
  memoList.innerHTML = '';

  // Sort by updatedAt descending
  const sortedMemos = [...memos].sort((a, b) => b.updatedAt - a.updatedAt);

  sortedMemos.forEach(memo => {
    const li = document.createElement('li');
    li.className = `memo-item ${memo.id === currentMemoId ? 'active' : ''}`;

    // Icon container
    const iconContainer = document.createElement('span');
    iconContainer.innerHTML = documentIcon;
    iconContainer.style.marginRight = '8px';
    iconContainer.style.display = 'flex';
    iconContainer.style.color = 'var(--steel)';

    // Title container
    const text = document.createElement('span');
    text.textContent = memo.title || 'Untitled';
    text.style.overflow = 'hidden';
    text.style.textOverflow = 'ellipsis';

    li.appendChild(iconContainer);
    li.appendChild(text);
    li.onclick = () => selectMemo(memo.id);
    memoList.appendChild(li);
  });
}

// Handle input changes with debounce for saving
function handleInput() {
  if (!currentMemoId) return;
  const memo = memos.find(m => m.id === currentMemoId);
  if (memo) {
    memo.title = titleInput.value;
    memo.content = contentInput.innerHTML;
    memo.updatedAt = Date.now();
    breadcrumb.textContent = memo.title || 'Untitled';

    // Update list immediately for title change, but don't re-sort immediately
    const activeItem = Array.from(memoList.children).find(li => li.classList.contains('active'));
    if (activeItem) {
      activeItem.lastElementChild.textContent = memo.title || 'Untitled';
    }

    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
      saveMemos();
      renderMemoList(); // Re-sort and render list after debounce
    }, 500);
  }
}

// Delete current memo
function deleteCurrentMemo() {
  if (!currentMemoId) return;

  const confirmDelete = confirm('このメモを削除しますか？');
  if (!confirmDelete) return;

  memos = memos.filter(m => m.id !== currentMemoId);
  saveMemos();

  if (memos.length > 0) {
    selectMemo(memos[0].id);
  } else {
    createNewMemo();
  }
}

// Event Listeners
titleInput.addEventListener('input', handleInput);
contentInput.addEventListener('input', handleInput);
newMemoBtn.addEventListener('click', createNewMemo);
deleteBtn.addEventListener('click', deleteCurrentMemo);

// Formatting
toolbarBtns.forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    const command = btn.getAttribute('data-command');
    const value = btn.getAttribute('data-value') || null;
    document.execCommand(command, false, value);
    contentInput.focus();
    handleInput();
  });
});

// Image insertion
addImageBtn.addEventListener('click', () => {
  imageInput.click();
});

imageInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    const base64Url = event.target.result;
    contentInput.focus();
    document.execCommand('insertImage', false, base64Url);
    handleInput();
  };
  reader.readAsDataURL(file);

  imageInput.value = '';
});

// Initial setup
if (memos.length === 0) {
  createNewMemo();
} else {
  // Select most recently updated
  const latest = [...memos].sort((a, b) => b.updatedAt - a.updatedAt)[0];
  selectMemo(latest.id);
}
