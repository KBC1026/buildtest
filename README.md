# AI Chat 웹페이지

브라우저에는 API 키를 노출하지 않고, 서버의 `OPENAI_API_KEY` 환경변수로 OpenAI API를 호출하는 간단한 AI Chat 페이지입니다.

## 실행

```bash
OPENAI_API_KEY="sk-..." python3 app.py
```

로컬 주소:

```text
http://localhost:8000
```

## Cloudflare Pages 배포

Cloudflare Pages에서는 정적 화면과 `/api/chat` Functions API를 같은 프로젝트로 배포합니다.

Cloudflare Pages 프로젝트 설정:

```text
Build command: npm run build
Build output directory: dist
Environment variable: OPENAI_API_KEY=sk-...
```

Cloudflare Pages에 GitHub 저장소를 연결해두면 `main` 브랜치 push 시 자동 배포됩니다.

수동 배포를 하려면 Cloudflare 로그인 후 아래 명령을 실행합니다.

```bash
./deploy.sh
```

커밋 메시지를 직접 지정할 수도 있습니다.

```bash
./deploy.sh "Update chat UI"
```

## GitHub Pages 주소

```text
https://KBC1026.github.io/buildtest/
```

GitHub Pages는 정적 파일만 실행합니다. AI 채팅까지 운영하려면 Cloudflare Pages 주소를 사용하세요.

## Cloudflare Pages Functions

`functions/api/chat.js`가 `/api/chat` 요청을 처리합니다.

API 키는 브라우저에 노출하지 않고 Cloudflare Pages 환경변수 `OPENAI_API_KEY`에서 읽습니다.

## Render 서버 배포

Render를 쓰는 경우에는 `render.yaml`로 `app.py` 서버를 별도 배포할 수 있습니다. Cloudflare Pages Functions 방식을 쓰면 Render는 필요하지 않습니다.

별도 백엔드 서버를 쓰는 경우에는 `config.js`의 값을 서버 주소로 바꿉니다.

```js
window.AI_CHAT_API_URL = "https://your-server.example.com/api/chat";
```
