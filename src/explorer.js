/**
 * explorer.js — File Explorer UI
 * 드래그앤드롭, 우클릭 메뉴, 인라인 이름 변경, 모달
 */

let selectedId  = null;
let dragId      = null;
let dragOverId  = null;
let modalMode   = null;
let modalParentId = null;

const ctxMenu   = document.getElementById('ctxMenu');
const modalWrap = document.getElementById('modalWrap');

// ── Tree Rendering ────────────────────────────────────────────────────
function renderTree() {
  const treeEl = document.getElementById('tree');
  treeEl.innerHTML = '';
  const total = countFiles(fs);
  document.getElementById('stFiles').textContent = 'files: ' + total;
  renderNode(fs, treeEl, 0, true);
}

function renderNode(node, container, depth, isRoot) {
  if (isRoot) {
    for (const c of (node.children || [])) renderNode(c, container, depth);
    return;
  }

  const div = document.createElement('div');
  div.className = 'node' + (selectedId === node.id ? ' selected' : '');
  div.dataset.id = node.id;
  div.style.paddingLeft = (8 + depth * 14) + 'px';
  div.draggable = true;

  const icon = document.createElement('span');
  icon.className = 'node-icon';
  icon.style.color = node.type === 'folder' ? '#f0c060' : 'var(--fg3)';
  icon.textContent = node.type === 'folder' ? folderIcon(node.open) : fileIcon(node.name);

  const nameEl = document.createElement('span');
  nameEl.className = 'node-name' + (node.type === 'folder' ? ' folder' : ' ' + getExt(node.name));
  nameEl.textContent = node.name;

  div.appendChild(icon);
  div.appendChild(nameEl);
  container.appendChild(div);

  // Events
  div.addEventListener('click', e => { e.stopPropagation(); onNodeClick(node, icon); });
  div.addEventListener('dblclick', e => { e.stopPropagation(); startRename(node.id, nameEl); });
  div.addEventListener('contextmenu', e => { e.preventDefault(); e.stopPropagation(); showCtx(e, node.id); });

  // Drag
  div.addEventListener('dragstart', e => {
    dragId = node.id;
    div.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
  });
  div.addEventListener('dragend', () => {
    dragId = null;
    div.classList.remove('dragging');
    clearDragOver();
  });
  div.addEventListener('dragover', e => {
    e.preventDefault();
    if (node.type === 'folder' && dragId !== node.id) {
      clearDragOver();
      dragOverId = node.id;
      div.classList.add('drag-over');
    }
  });
  div.addEventListener('drop', e => {
    e.preventDefault();
    e.stopPropagation();
    handleDrop(node.type === 'folder' ? node.id : null);
  });

  // Recurse
  if (node.type === 'folder' && node.open && node.children) {
    for (const c of node.children) renderNode(c, container, depth + 1);
  }
}

function clearDragOver() {
  document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
  dragOverId = null;
}

// ── Events ─────────────────────────────────────────────────────────────
function onNodeClick(node, iconEl) {
  selectedId = node.id;
  if (node.type === 'folder') {
    node.open = !node.open;
    if (iconEl) iconEl.textContent = folderIcon(node.open);
  } else {
    printOutput(`[${node.name}] 열림`, 'oi');
    addSpacer();
  }
  renderTree();
  hideCtx();
}

function onTreeDragOver(e) { e.preventDefault(); }

function onTreeDrop(e, targetId) {
  e.preventDefault();
  handleDrop(targetId);
}

function handleDrop(targetId) {
  if (!dragId) return;
  const dragNode = findNode(dragId);
  if (!dragNode) return;
  const moved = fsMoveNode(dragId, targetId);
  if (moved) {
    printExplorerMsg(dragNode.name + ' → 이동 완료', 'ok');
    renderTree();
  }
  clearDragOver();
}

// ── Inline Rename ─────────────────────────────────────────────────────
function startRename(id, nameEl) {
  const node = findNode(id);
  if (!node) return;
  const inp = document.createElement('input');
  inp.className = 'node-name editing';
  inp.value = node.name;
  nameEl.replaceWith(inp);
  inp.focus();
  inp.select();

  const finish = () => {
    const v = inp.value.trim();
    if (v && v !== node.name) {
      node.name = v;
      printExplorerMsg(v + ' (이름 변경됨)', 'ok');
    }
    renderTree();
  };
  inp.addEventListener('blur', finish);
  inp.addEventListener('keydown', e => {
    if (e.key === 'Enter') inp.blur();
    if (e.key === 'Escape') { inp.value = node.name; inp.blur(); }
  });
}

// ── Context Menu ───────────────────────────────────────────────────────
function showCtx(e, id) {
  hideCtx();
  const node = findNode(id);
  if (!node) return;

  ctxMenu.innerHTML = '';
  const items = node.type === 'folder'
    ? [
        { label: '새 파일',    fn: () => showModal('newfile', id) },
        { label: '새 폴더',    fn: () => showModal('newfolder', id) },
        { sep: true },
        { label: '이름 변경',  fn: () => { hideCtx(); const el = document.querySelector(`.node[data-id="${id}"] .node-name`); if (el) startRename(id, el); } },
        { label: '삭제',       fn: () => confirmDelete(id), cls: 'ctx-del' },
      ]
    : [
        { label: '이름 변경',  fn: () => { hideCtx(); const el = document.querySelector(`.node[data-id="${id}"] .node-name`); if (el) startRename(id, el); } },
        { label: '복사',       fn: () => { const c = fsCopyNode(id); if (c) { printExplorerMsg(c.name + ' 복사됨', 'oi'); renderTree(); } hideCtx(); } },
        { sep: true },
        { label: '삭제',       fn: () => confirmDelete(id), cls: 'ctx-del' },
      ];

  for (const item of items) {
    if (item.sep) {
      const s = document.createElement('div');
      s.className = 'ctx-sep';
      ctxMenu.appendChild(s);
      continue;
    }
    const d = document.createElement('div');
    d.textContent = item.label;
    if (item.cls) d.className = item.cls;
    d.addEventListener('click', () => { hideCtx(); item.fn(); });
    ctxMenu.appendChild(d);
  }

  // Position relative to .ide
  const ide  = document.getElementById('ide');
  const rect = ide.getBoundingClientRect();
  const mx   = e.clientX - rect.left;
  const my   = e.clientY - rect.top;

  ctxMenu.style.display = 'block';
  ctxMenu.style.left = Math.min(mx, rect.width  - 170) + 'px';
  ctxMenu.style.top  = Math.min(my, rect.height - 160) + 'px';
}

function hideCtx() {
  ctxMenu.style.display = 'none';
}

document.addEventListener('click', hideCtx);

// ── Delete Confirm ────────────────────────────────────────────────────
function confirmDelete(id) {
  const node = findNode(id);
  if (!node) return;
  showConfirm(`"${node.name}" 을(를) 삭제할까요?`, () => {
    const ok = fsDeleteNode(id);
    if (ok) {
      if (selectedId === id) selectedId = null;
      printExplorerMsg(node.name + ' 삭제됨', 'oe');
      renderTree();
    }
  });
}

// ── Modals ─────────────────────────────────────────────────────────────
function showModal(mode, parentId = null) {
  hideCtx();
  modalMode = mode;
  modalParentId = parentId;

  const labels       = { newfile: '새 파일 만들기', newfolder: '새 폴더 만들기' };
  const placeholders = { newfile: '예: MyComponent.tsx', newfolder: '예: stores' };

  modalWrap.innerHTML = `
    <div class="modal-back">
      <div class="modal">
        <h3>${labels[mode] || mode}</h3>
        <input id="minp" placeholder="${placeholders[mode] || ''}" />
        <div class="modal-btns">
          <button class="mbtn" onclick="closeModal()">취소</button>
          <button class="mbtn primary" onclick="confirmModal()">만들기</button>
        </div>
      </div>
    </div>`;
  modalWrap.style.display = 'block';

  setTimeout(() => {
    const inp = document.getElementById('minp');
    if (inp) {
      inp.focus();
      inp.addEventListener('keydown', e => {
        if (e.key === 'Enter') confirmModal();
        if (e.key === 'Escape') closeModal();
      });
    }
  }, 50);
}

function showConfirm(msg, onOk) {
  modalWrap.innerHTML = `
    <div class="modal-back">
      <div class="modal">
        <h3>${msg}</h3>
        <div class="modal-btns">
          <button class="mbtn" onclick="closeModal()">취소</button>
          <button class="mbtn danger" onclick="closeModal(true)">삭제</button>
        </div>
      </div>
    </div>`;
  modalWrap.style.display = 'block';
  modalWrap._onOk = onOk;
}

function closeModal(ok = false) {
  if (ok && modalWrap._onOk) {
    modalWrap._onOk();
    modalWrap._onOk = null;
  }
  modalWrap.style.display = 'none';
  modalWrap.innerHTML = '';
}

function confirmModal() {
  const inp = document.getElementById('minp');
  const val = inp ? inp.value.trim() : '';
  if (!val) { inp && inp.focus(); return; }

  const newNode = {
    id:   getId(),
    name: val,
    type: modalMode === 'newfolder' ? 'folder' : 'file',
  };
  if (newNode.type === 'folder') newNode.children = [];

  fsAddNode(modalParentId, newNode);
  printExplorerMsg(newNode.name + (newNode.type === 'folder' ? '/ 폴더 생성됨' : ' 파일 생성됨'), 'ok');
  addSpacer();
  closeModal();
  renderTree();
}

// ── Resizer ────────────────────────────────────────────────────────────
(function initResizer() {
  const resizerEl  = document.getElementById('resizer');
  const explorerEl = document.getElementById('explorer');
  let resizing = false, startX = 0, startW = 0;

  resizerEl.addEventListener('mousedown', e => {
    resizing = true;
    startX = e.clientX;
    startW = explorerEl.offsetWidth;
    resizerEl.classList.add('active');
    e.preventDefault();
  });

  document.addEventListener('mousemove', e => {
    if (!resizing) return;
    const w = Math.min(360, Math.max(160, startW + (e.clientX - startX)));
    explorerEl.style.width = w + 'px';
  });

  document.addEventListener('mouseup', () => {
    resizing = false;
    resizerEl.classList.remove('active');
  });
})();
