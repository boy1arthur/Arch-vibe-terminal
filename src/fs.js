/**
 * fs.js — Virtual File System
 * 바이브 터미널의 가상 파일 시스템 모듈
 */

const INIT_FS = {
  id: 'root',
  name: 'my-app',
  type: 'folder',
  open: true,
  children: [
    {
      id: 'src', name: 'src', type: 'folder', open: true, children: [
        {
          id: 'app', name: 'app', type: 'folder', open: true, children: [
            { id: 'page.tsx',    name: 'page.tsx',    type: 'file' },
            { id: 'layout.tsx',  name: 'layout.tsx',  type: 'file' },
            { id: 'globals.css', name: 'globals.css', type: 'file' },
          ]
        },
        {
          id: 'components', name: 'components', type: 'folder', open: false, children: [
            { id: 'Header.tsx', name: 'Header.tsx', type: 'file' },
            { id: 'Footer.tsx', name: 'Footer.tsx', type: 'file' },
            { id: 'Button.tsx', name: 'Button.tsx', type: 'file' },
            { id: 'Card.tsx',   name: 'Card.tsx',   type: 'file' },
          ]
        },
        {
          id: 'lib', name: 'lib', type: 'folder', open: false, children: [
            { id: 'utils.ts', name: 'utils.ts', type: 'file' },
            { id: 'api.ts',   name: 'api.ts',   type: 'file' },
          ]
        },
        {
          id: 'hooks', name: 'hooks', type: 'folder', open: false, children: [
            { id: 'useAuth.ts',  name: 'useAuth.ts',  type: 'file' },
            { id: 'useFetch.ts', name: 'useFetch.ts', type: 'file' },
          ]
        },
        {
          id: 'types', name: 'types', type: 'folder', open: false, children: [
            { id: 'index.d.ts', name: 'index.d.ts', type: 'file' },
          ]
        },
      ]
    },
    {
      id: 'public', name: 'public', type: 'folder', open: false, children: [
        { id: 'favicon.ico', name: 'favicon.ico', type: 'file' },
        { id: 'logo.svg',    name: 'logo.svg',    type: 'file' },
        { id: 'og-image.png',name: 'og-image.png',type: 'file' },
      ]
    },
    { id: 'package.json',        name: 'package.json',        type: 'file' },
    { id: '.env.local',          name: '.env.local',          type: 'file' },
    { id: '.env.example',        name: '.env.example',        type: 'file' },
    { id: 'next.config.js',      name: 'next.config.js',      type: 'file' },
    { id: 'tailwind.config.ts',  name: 'tailwind.config.ts',  type: 'file' },
    { id: 'tsconfig.json',       name: 'tsconfig.json',       type: 'file' },
    { id: '.gitignore',          name: '.gitignore',          type: 'file' },
    { id: 'README.md',           name: 'README.md',           type: 'file' },
  ]
};

// ── State ──────────────────────────────────────────────────────────────
let fs = JSON.parse(JSON.stringify(INIT_FS));

// ── Helpers ────────────────────────────────────────────────────────────
function getId() {
  return '_' + Math.random().toString(36).slice(2, 8);
}

function findNode(id, node) {
  if (!node) node = fs;
  if (node.id === id) return node;
  if (node.children) {
    for (const c of node.children) {
      const r = findNode(id, c);
      if (r) return r;
    }
  }
  return null;
}

function findParent(id, node, parent = null) {
  if (!node) node = fs;
  if (node.id === id) return parent;
  if (node.children) {
    for (const c of node.children) {
      const r = findParent(id, c, node);
      if (r) return r;
    }
  }
  return null;
}

function countFiles(node) {
  if (node.type === 'file') return 1;
  return (node.children || []).reduce((a, c) => a + countFiles(c), 0);
}

function getExt(name) {
  const parts = name.split('.');
  return parts.length > 1 ? parts[parts.length - 1] : '';
}

function fileIcon(name) {
  const ext = getExt(name);
  const map = {
    tsx: '⚛', jsx: '⚛',
    ts: '⬡', js: '⬡',
    css: '◈', scss: '◈',
    json: '{}', md: '≡',
    env: '⚙', ico: '◻',
    svg: '◇', png: '◻', jpg: '◻', gif: '◻',
    gitignore: '⚙', lock: '⚿',
    config: '⚙', example: '⚙',
  };
  return map[ext] || '·';
}

function folderIcon(open) {
  return open ? '▾' : '▸';
}

function pathOf(id, node, acc) {
  if (!node) node = fs;
  if (!acc) acc = '~/projects/my-app';
  if (node.id === id) return acc;
  if (node.children) {
    for (const c of node.children) {
      const r = pathOf(id, c, acc + '/' + c.name);
      if (r) return r;
    }
  }
  return null;
}

function fsAddNode(parentId, newNode) {
  const parent = parentId ? findNode(parentId) : fs;
  if (parent && parent.children !== undefined) {
    parent.children = parent.children || [];
    parent.children.push(newNode);
    if (parent.type === 'folder') parent.open = true;
    return true;
  }
  return false;
}

function fsDeleteNode(id) {
  const parent = findParent(id);
  if (!parent) return false;
  const idx = parent.children.findIndex(n => n.id === id);
  if (idx < 0) return false;
  parent.children.splice(idx, 1);
  return true;
}

function fsMoveNode(dragId, targetFolderId) {
  const dragNode  = findNode(dragId);
  const dragParent = findParent(dragId);
  if (!dragNode || !dragParent) return false;

  // prevent moving into itself
  if (targetFolderId) {
    let check = findNode(targetFolderId);
    while (check) {
      if (check.id === dragId) return false;
      check = findParent(check.id);
    }
  }

  const idx = dragParent.children.indexOf(dragNode);
  dragParent.children.splice(idx, 1);

  if (targetFolderId) {
    const target = findNode(targetFolderId);
    if (target && target.type === 'folder') {
      target.children = target.children || [];
      target.children.push(dragNode);
      target.open = true;
    }
  } else {
    fs.children.push(dragNode);
  }
  return true;
}

function fsCopyNode(id) {
  const node   = findNode(id);
  const parent = findParent(id);
  if (!node || !parent) return null;

  const clone = JSON.parse(JSON.stringify(node));
  clone.id = getId();
  const ext = getExt(node.name);
  clone.name = node.name.replace(ext ? '.' + ext : '', '') + '-copy' + (ext ? '.' + ext : '');

  const idx = parent.children.indexOf(node);
  parent.children.splice(idx + 1, 0, clone);
  return clone;
}

// flat list of all file names at root level for cat/rm
function rootFiles() {
  return (fs.children || []).map(n => n.name);
}
