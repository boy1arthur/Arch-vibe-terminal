# Vibe Terminal 🖥️

> 바이브코딩을 위한 브라우저 기반 터미널 + 파일 탐색기 IDE

## 데모

GitHub Pages에 배포 후 자동으로 접속 가능합니다:  
`https://<your-username>.github.io/vibe-terminal`

## 기능

### 파일 탐색기
- Next.js 앱 스캐폴딩 구조 기본 탑재 (`src/app`, `components`, `lib`, `hooks`)
- 드래그 앤 드롭으로 파일 · 폴더 이동
- 우클릭 컨텍스트 메뉴 (새 파일, 새 폴더, 이름 변경, 복사, 삭제)
- 더블클릭 인라인 이름 변경
- 탐색기 ↔ 터미널 실시간 연동

### 터미널
| 명령어 | 설명 |
|--------|------|
| `ls [-la]` | 파일 목록 |
| `pwd` | 현재 경로 |
| `tree` | 트리 구조 출력 |
| `cat <file>` | 파일 내용 보기 |
| `touch <file>` | 파일 생성 → 탐색기 즉시 반영 |
| `mkdir <folder>` | 폴더 생성 → 탐색기 즉시 반영 |
| `rm <file>` | 파일 삭제 → 탐색기 즉시 반영 |
| `git status/log/commit/push` | Git 워크플로우 시뮬레이션 |
| `npm install / run dev / run build` | npm 명령어 시뮬레이션 |
| `npx create-next-app@latest` | Next.js 앱 생성 시뮬레이션 |
| `clear` | 화면 지우기 |

### 편의 기능
- 명령어 히스토리 (`↑` `↓`)
- Tab 자동완성
- `Ctrl+L` 화면 지우기
- `Ctrl+C` 인터럽트
- 탐색기 너비 드래그 조절
- 빠른 실행 버튼 바

## GitHub Pages 배포 방법

### 1. 저장소 생성 & 푸시

```bash
# 저장소 초기화
git init
git add .
git commit -m "feat: 바이브 터미널 초기 릴리즈"

# GitHub 저장소 생성 후
git remote add origin https://github.com/<your-username>/vibe-terminal.git
git branch -M main
git push -u origin main
```

### 2. GitHub Pages 설정

1. 저장소 → **Settings** → **Pages**
2. Source: **GitHub Actions** 선택
3. 저장소에 `.github/workflows/deploy.yml` 이 이미 포함되어 있으므로 자동으로 배포됩니다

### 3. 접속

`https://<your-username>.github.io/vibe-terminal` 으로 접속하면 바로 사용 가능합니다.

## 파일 구조

```
vibe-terminal/
├── index.html                    # 메인 HTML
├── src/
│   ├── style.css                 # 스타일시트
│   ├── fs.js                     # 가상 파일 시스템
│   ├── terminal.js               # 터미널 엔진 & 명령어
│   ├── explorer.js               # 탐색기 UI (드래그앤드롭, 모달)
│   └── main.js                   # 진입점 & 키보드 바인딩
├── .github/
│   └── workflows/
│       └── deploy.yml            # GitHub Pages 자동 배포
└── README.md
```

## 기술 스택

- 순수 HTML / CSS / JavaScript (빌드 툴 없음)
- 외부 의존성: JetBrains Mono 폰트 (Google Fonts)
- GitHub Actions로 GitHub Pages 자동 배포

## 라이선스

MIT
