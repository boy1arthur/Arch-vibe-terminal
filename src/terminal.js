/**
 * terminal.js — Terminal Engine
 * 명령어 파싱, 실행, 출력 관리
 */

let cmdHistory = [];
let histIdx = -1;

// ── Output Helpers ────────────────────────────────────────────────────
function addLine(parts) {
  const div = document.createElement('div');
  div.className = 'line';
  for (const p of parts) {
    const s = document.createElement('span');
    s.className = p.c || '';
    s.textContent = p.t;
    div.appendChild(s);
  }
  termBody.appendChild(div);
  termBody.scrollTop = termBody.scrollHeight;
}

function addSpacer() {
  const sp = document.createElement('div');
  sp.style.height = '4px';
  termBody.appendChild(sp);
  termBody.scrollTop = termBody.scrollHeight;
}

function printPrompt(cmd) {
  addLine([
    { c: 'pu', t: '현우' },
    { c: 'pat', t: '@' },
    { c: 'pd', t: cwd },
    { c: 'ps', t: ' $' },
    { c: '', t: ' ' },
    { c: 'ct', t: cmd },
  ]);
}

function printOutput(text, cls = 'os') {
  if (!text) return;
  const lines = text.split('\n');
  for (const l of lines) addLine([{ c: cls, t: l }]);
}

function printExplorerMsg(msg, cls = 'ok') {
  addLine([{ c: 'od', t: '[탐색기] ' }, { c: cls, t: msg }]);
}

// ── File Content Stubs ─────────────────────────────────────────────────
const FILE_CONTENTS = {
  'package.json': `{
  "name": "my-app",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "14.2.3",
    "react": "^18",
    "react-dom": "^18"
  },
  "devDependencies": {
    "typescript": "^5",
    "tailwindcss": "^3",
    "@types/react": "^18"
  }
}`,
  '.env.local': `NEXT_PUBLIC_API_URL=http://localhost:3000
DATABASE_URL=postgresql://user:pass@localhost:5432/mydb
NEXTAUTH_SECRET=your-secret-here
NEXTAUTH_URL=http://localhost:3000`,
  '.env.example': `NEXT_PUBLIC_API_URL=
DATABASE_URL=
NEXTAUTH_SECRET=
NEXTAUTH_URL=http://localhost:3000`,
  '.gitignore': `# dependencies
/node_modules
/.pnp
.pnp.js

# testing
/coverage

# next.js
/.next/
/out/

# production
/build

# misc
.DS_Store
*.pem
.env*.local

# debug
npm-debug.log*

# typescript
*.tsbuildinfo
next-env.d.ts`,
  'README.md': `# my-app

바이브코딩으로 만든 Next.js 앱입니다.

## 시작하기

\`\`\`bash
npm install
npm run dev
\`\`\`

## 기술 스택

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- ESLint
`,
  'tsconfig.json': `{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}`,
};

// ── Command Definitions ────────────────────────────────────────────────
const CMDS = {
  ls(args) {
    const items = fs.children || [];
    const long = args.includes('-la') || args.includes('-l') || args.includes('-al');
    const all  = args.includes('-a') || args.includes('-la') || args.includes('-al');
    let list = all ? items : items.filter(n => !n.name.startsWith('.'));
    if (long) {
      const lines = ['total ' + (list.length * 4)];
      for (const n of list) {
        const perm = n.type === 'folder' ? 'drwxr-xr-x' : '-rw-r--r--';
        const size = n.type === 'folder' ? '4096' : String(Math.floor(Math.random() * 9000 + 100)).padStart(6);
        lines.push(`${perm}  1 현우  staff  ${size}  Mar 19 12:00  ${n.name}`);
      }
      return { text: lines.join('\n'), cls: 'os' };
    }
    return {
      text: list.map(n => n.type === 'folder' ? n.name + '/' : n.name).join('   '),
      cls: 'os',
    };
  },

  pwd() {
    return { text: cwd.replace('~', '/Users/현우'), cls: 'os' };
  },

  tree() {
    const lines = ['my-app/'];
    function walk(node, prefix) {
      const children = node.children || [];
      for (let i = 0; i < children.length; i++) {
        const c = children[i], last = i === children.length - 1;
        lines.push(prefix + (last ? '└── ' : '├── ') + c.name + (c.type === 'folder' ? '/' : ''));
        if (c.type === 'folder' && c.children) walk(c, prefix + (last ? '    ' : '│   '));
      }
    }
    walk(fs, '');
    lines.push('');
    const fileCount = countFiles(fs);
    lines.push(`${fs.children.filter(n=>n.type==='folder').length} directories, ${fileCount} files`);
    return { text: lines.join('\n'), cls: 'os' };
  },

  cat(args) {
    const name = args[0];
    if (!name) return { text: 'cat: 파일명 필요', cls: 'oe' };
    if (FILE_CONTENTS[name]) return { text: FILE_CONTENTS[name], cls: 'os' };
    const node = (fs.children || []).find(n => n.name === name);
    if (node) return { text: `[${name}의 내용 — 편집 기능은 추후 지원 예정]`, cls: 'oi' };
    return { text: `cat: ${name}: 파일을 찾을 수 없습니다`, cls: 'oe' };
  },

  echo(args) {
    return { text: args.join(' '), cls: 'os' };
  },

  touch(args) {
    const name = args[0];
    if (!name) return { text: 'touch: 파일명 필요', cls: 'oe' };
    const newNode = { id: getId(), name, type: 'file' };
    fsAddNode(null, newNode);
    printExplorerMsg(name + ' 생성됨', 'ok');
    renderTree();
    return null;
  },

  mkdir(args) {
    const name = args[0];
    if (!name) return { text: 'mkdir: 폴더명 필요', cls: 'oe' };
    const newNode = { id: getId(), name, type: 'folder', children: [], open: false };
    fsAddNode(null, newNode);
    printExplorerMsg(name + '/ 폴더 생성됨', 'ok');
    renderTree();
    return null;
  },

  rm(args) {
    const name = args[args.length - 1];
    const node = (fs.children || []).find(n => n.name === name);
    if (!node) return { text: `rm: ${name}: 없음`, cls: 'oe' };
    fsDeleteNode(node.id);
    printExplorerMsg(name + ' 삭제됨', 'oe');
    renderTree();
    return null;
  },

  git(args) {
    const sub = args[0];
    if (sub === 'status') return { text: 'On branch main\nYour branch is up to date with \'origin/main\'.\n\nChanges not staged for commit:\n  modified:   src/app/page.tsx\n  modified:   src/components/Header.tsx\n\nUntracked files:\n  .env.local', cls: 'os' };
    if (sub === 'log') return { text: 'a1b2c3d (HEAD -> main) feat: 다크모드 추가\ne4f5a6b fix: 헤더 반응형 수정\nc7d8e9f refactor: API 모듈 분리\n1a2b3c4 docs: README 업데이트\n5d6e7f8 init: 프로젝트 초기화', cls: 'os' };
    if (sub === 'add') return { text: '', cls: 'os' };
    if (sub === 'commit') {
      const m = args.join(' ').match(/-m\s+"?([^"]+)"?/);
      return m
        ? { text: `[main a1b2c3d] ${m[1]}\n 2 files changed, 14 insertions(+), 3 deletions(-)`, cls: 'ok' }
        : { text: 'error: switch `m\' requires a value', cls: 'oe' };
    }
    if (sub === 'push') return { text: 'Enumerating objects: 5, done.\nCounting objects: 100%\nTo github.com:현우/my-app.git\n   e4f5a6b..a1b2c3d  main -> main', cls: 'ok' };
    if (sub === 'pull') return { text: 'Already up to date.', cls: 'ok' };
    if (sub === 'branch') return { text: '* main\n  dev\n  feature/new-ui\n  hotfix/login', cls: 'os' };
    if (sub === 'checkout') return { text: `Switched to branch '${args[1] || 'main'}'`, cls: 'ok' };
    if (sub === 'diff') return { text: 'diff --git a/src/app/page.tsx b/src/app/page.tsx\n--- a/src/app/page.tsx\n+++ b/src/app/page.tsx\n@@ -1,5 +1,6 @@\n+import Header from \'@/components/Header\'\n export default function Home() {', cls: 'os' };
    if (sub === 'stash') return { text: 'Saved working directory and index state WIP on main: a1b2c3d feat: 다크모드 추가', cls: 'ok' };
    if (sub === 'init') return { text: 'Initialized empty Git repository in ~/projects/my-app/.git/', cls: 'ok' };
    return { text: `git: '${sub}' is not a git command. See 'git --help'.`, cls: 'oe' };
  },

  npm(args) {
    const sub = args[0];
    if (sub === 'install' || sub === 'i') {
      return { text: '\nadded 284 packages in 3.8s\n\n114 packages are looking for funding\n  run `npm fund` for details', cls: 'os' };
    }
    if (sub === 'run') {
      const script = args[1];
      if (script === 'dev') return { text: '\n> my-app@0.1.0 dev\n> next dev\n\n  ▲ Next.js 14.2.3\n  - Local:        http://localhost:3000\n  - Network:      http://192.168.1.5:3000\n\n ✓ Starting...\n ✓ Ready in 1.2s', cls: 'oi' };
      if (script === 'build') return { text: '\n> next build\n✓ Compiled successfully\n✓ Linting and checking validity of types...\n✓ Collecting page data...\n✓ Generating static pages (4/4)\n✓ Finalizing page optimization\n\nRoute (app)          Size     First Load JS\n┌ ○ /                5.2 kB        93.2 kB\n└ ○ /about           2.1 kB        90.1 kB\n\n○  (Static) prerendered as static content', cls: 'ok' };
      if (script === 'lint') return { text: '\n✓ No ESLint warnings or errors', cls: 'ok' };
      return { text: `npm error Missing script: "${script}"`, cls: 'oe' };
    }
    if (sub === 'list' || sub === 'ls') return { text: 'my-app@0.1.0\n├── next@14.2.3\n├── react@18.3.1\n└── react-dom@18.3.1', cls: 'os' };
    if (sub === 'uninstall' || sub === 'rm') return { text: `\nremoved 1 package in 0.8s`, cls: 'os' };
    return { text: 'Usage: npm <command>\nRun "npm help" for help', cls: 'os' };
  },

  npx(args) {
    if (args.join(' ').includes('create-next-app')) {
      return { text: '\n✔ What is your project named? » my-next-app\n✔ TypeScript? … Yes\n✔ ESLint? … Yes\n✔ Tailwind CSS? … Yes\n✔ App Router? … Yes\n\nCreating a new Next.js app...\n\n✓ Installing dependencies...\n\nSuccess! Created my-next-app\n\n  cd my-next-app\n  npm run dev', cls: 'oi' };
    }
    return { text: `npx: could not determine executable to run`, cls: 'oe' };
  },

  node(args) {
    if (args[0] === '--version' || args[0] === '-v') return { text: 'v20.11.0', cls: 'os' };
    if (args[0] === '-e') return { text: args.slice(1).join(' '), cls: 'os' };
    return { text: 'Welcome to Node.js v20.11.0.\nType ".exit" to quit the REPL.', cls: 'od' };
  },

  code(args) {
    const name = args[0];
    if (name) return { text: `[VS Code] ${name} 열기 요청 (실제 환경에서 동작합니다)`, cls: 'oi' };
    return { text: '[VS Code] 현재 폴더 열기 요청 (실제 환경에서 동작합니다)', cls: 'oi' };
  },

  clear() { return '__clear__'; },

  help() {
    return {
      text: [
        '── 바이브 터미널 사용 가능한 명령어 ──────────────',
        'ls [-la]          파일 목록',
        'cd <dir>          디렉토리 이동',
        'pwd               현재 경로',
        'tree              트리 구조 출력',
        'cat <file>        파일 내용 보기',
        'touch <file>      파일 생성 (탐색기 반영)',
        'mkdir <folder>    폴더 생성 (탐색기 반영)',
        'rm <file>         파일 삭제 (탐색기 반영)',
        'echo <text>       텍스트 출력',
        'git <sub>         status/log/add/commit/push/pull/branch/diff',
        'npm <sub>         install/run/list',
        'npx create-next-app@latest',
        'node [-v]         Node.js 정보',
        'code [file]       VS Code로 열기',
        'clear             화면 지우기',
        '──────────────────────────────────────────────────',
        '탐색기: 드래그앤드롭 · 우클릭 · 더블클릭 이름변경',
      ].join('\n'),
      cls: 'oi',
    };
  },
};

// ── Runner ────────────────────────────────────────────────────────────
function runCmd(raw) {
  const cmd = raw.trim();
  if (!cmd) return;
  cmdHistory.unshift(cmd);
  histIdx = -1;

  if (cmd === 'clear') {
    termBody.innerHTML = '';
    return;
  }

  // chain with &&
  if (cmd.includes('&&')) {
    const parts = cmd.split('&&').map(s => s.trim());
    for (const p of parts) runSingle(p);
    return;
  }

  runSingle(cmd);
}

function runSingle(cmd) {
  const parts = cmd.split(/\s+/);
  const name  = parts[0];
  const args  = parts.slice(1);
  const fn    = CMDS[name];

  printPrompt(cmd);

  if (fn) {
    const result = fn(args);
    if (result === '__clear__') { termBody.innerHTML = ''; return; }
    if (result && result.text !== undefined) printOutput(result.text, result.cls);
  } else if (name) {
    printOutput(`${name}: command not found`, 'oe');
    printOutput(`'help' 를 입력하면 사용 가능한 명령어를 볼 수 있어요`, 'od');
  }

  addSpacer();
}

function rq(cmd) {
  termInput.value = cmd;
  termInput.focus();
  runCmd(cmd);
  termInput.value = '';
}

function addTermTab() {
  const tabBar = document.querySelector('.tab-bar-term');
  const addBtn = tabBar.querySelector('.ttab-add');
  const t = document.createElement('div');
  t.className = 'ttab';
  t.textContent = 'bash';
  t.onclick = () => {
    document.querySelectorAll('.ttab').forEach(el => el.classList.remove('active'));
    t.classList.add('active');
  };
  tabBar.insertBefore(t, addBtn);
  document.querySelectorAll('.ttab').forEach(el => el.classList.remove('active'));
  t.classList.add('active');
}

function askAI() {
  const q = document.getElementById('aiInp').value.trim();
  if (!q) return;
  document.getElementById('aiInp').value = '';
  // In standalone mode, open a search
  const query = encodeURIComponent('바이브 터미널 명령어: ' + q);
  alert(`AI 도움말: "${q}"\n\n실제 배포 환경에서는 Claude API와 연결됩니다.`);
}
