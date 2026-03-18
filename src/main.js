/**
 * main.js — Boot & Keyboard Bindings
 */

// ── Global refs ────────────────────────────────────────────────────────
const termBody  = document.getElementById('termBody');
const termInput = document.getElementById('termInput');
const cwdLbl    = document.getElementById('cwdLbl');
const stBranch  = document.getElementById('stBranch');
let cwd = '~/projects/my-app';

// ── Keyboard ───────────────────────────────────────────────────────────
termInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    const v = termInput.value;
    termInput.value = '';
    runCmd(v);
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    if (histIdx < cmdHistory.length - 1) {
      histIdx++;
      termInput.value = cmdHistory[histIdx] || '';
    }
  } else if (e.key === 'ArrowDown') {
    e.preventDefault();
    if (histIdx > 0) {
      histIdx--;
      termInput.value = cmdHistory[histIdx] || '';
    } else {
      histIdx = -1;
      termInput.value = '';
    }
  } else if (e.key === 'Tab') {
    e.preventDefault();
    // Simple tab-complete from root children
    const val   = termInput.value;
    const words = val.split(' ');
    const last  = words[words.length - 1];
    if (last) {
      const match = (fs.children || []).find(n => n.name.startsWith(last));
      if (match) { words[words.length - 1] = match.name; termInput.value = words.join(' '); }
    }
  } else if (e.key === 'l' && e.ctrlKey) {
    e.preventDefault();
    termBody.innerHTML = '';
  } else if (e.key === 'c' && e.ctrlKey) {
    e.preventDefault();
    addLine([{ c: 'od', t: '^C' }]);
    termInput.value = '';
  }
});

document.getElementById('aiInp').addEventListener('keydown', e => {
  if (e.key === 'Enter') askAI();
});

// ── Welcome Screen ────────────────────────────────────────────────────
function printWelcome() {
  const lines = [
    [{ c: 'oh', t: '  ╔══════════════════════════════════╗' }],
    [{ c: 'oh', t: '  ║  VIBE TERMINAL  v1.0.0           ║' }],
    [{ c: 'oi', t: '  ║  바이브코딩 IDE — 터미널 + 탐색기 ║' }],
    [{ c: 'oi', t: '  ╚══════════════════════════════════╝' }],
    [{ c: '', t: '' }],
    [{ c: 'od', t: '  Next.js 스캐폴딩 프로젝트가 탐색기에 로드됐어요.' }],
    [{ c: 'od', t: '  탐색기: 드래그앤드롭 · 우클릭 메뉴 · 더블클릭 이름변경' }],
    [{ c: 'od', t: '  터미널: touch/mkdir/rm 명령어는 탐색기에 즉시 반영돼요' }],
    [{ c: 'od', t: '  \'help\' 를 입력하면 전체 명령어 목록을 볼 수 있어요.' }],
    [{ c: '', t: '' }],
  ];
  for (const l of lines) addLine(l);
}

// ── Boot ───────────────────────────────────────────────────────────────
renderTree();
printWelcome();
termInput.focus();
