# Vibe Terminal 🖥️
<img width="360" height="344" alt="image" src="https://github.com/user-attachments/assets/077a7a0c-4766-4c0b-9d4b-2526d0b1875c" />

> 바이브코딩을 위한 브라우저 기반 터미널 + 파일 탐색기 IDE

## 데모

GitHub Pages에 배포 후 자동으로 접속 가능합니다:  
`https://boy1arthur.github.io/Arch-vibe-terminal`

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


## 파일 구조

```
Arch-vibe-terminal/
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
  

## 라이선스

MIT
