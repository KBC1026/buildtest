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

## 배포

변경사항을 GitHub `main`에 push하고, 정적 파일을 `gh-pages` 브랜치로 배포하려면 아래 명령을 실행합니다.

```bash
./deploy.sh
```

커밋 메시지를 직접 지정할 수도 있습니다.

```bash
./deploy.sh "Update chat UI"
```

배포 주소:

```text
https://KBC1026.github.io/buildtest/
```

GitHub Pages는 정적 파일만 실행합니다. 따라서 위 링크에서는 화면은 열리지만 `/api/chat` 서버 기능은 동작하지 않습니다. AI 채팅까지 운영하려면 `app.py`를 서버 호스팅에 별도로 배포하고, 해당 서버에 `OPENAI_API_KEY` 환경변수를 설정해야 합니다.
