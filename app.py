#!/usr/bin/env python3
from __future__ import annotations

import json
import os
import urllib.error
import urllib.request
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any


BASE_DIR = Path(__file__).resolve().parent
OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses"
DEFAULT_MODEL = os.environ.get("OPENAI_MODEL", "gpt-5.4-mini")
MAX_BODY_BYTES = 128 * 1024


def extract_response_text(data: dict[str, Any]) -> str:
    if isinstance(data.get("output_text"), str) and data["output_text"].strip():
        return data["output_text"].strip()

    text_parts: list[str] = []
    for item in data.get("output", []):
        if not isinstance(item, dict):
            continue
        for content in item.get("content", []):
            if (
                isinstance(content, dict)
                and content.get("type") == "output_text"
                and isinstance(content.get("text"), str)
            ):
                text_parts.append(content["text"])

    return "\n".join(text_parts).strip() or "응답 텍스트를 찾지 못했습니다."


def read_json(handler: SimpleHTTPRequestHandler) -> dict[str, Any]:
    content_length = int(handler.headers.get("Content-Length", "0"))
    if content_length <= 0:
        raise ValueError("요청 본문이 비어 있습니다.")
    if content_length > MAX_BODY_BYTES:
        raise ValueError("요청이 너무 큽니다.")

    raw_body = handler.rfile.read(content_length)
    try:
        payload = json.loads(raw_body.decode("utf-8"))
    except json.JSONDecodeError as exc:
        raise ValueError("JSON 형식이 올바르지 않습니다.") from exc

    if not isinstance(payload, dict):
        raise ValueError("JSON 객체를 보내야 합니다.")
    return payload


def call_openai(payload: dict[str, Any]) -> dict[str, Any]:
    api_key = os.environ.get("OPENAI_API_KEY", "").strip()
    if not api_key:
        raise RuntimeError("서버에 OPENAI_API_KEY 환경변수가 설정되어 있지 않습니다.")

    messages = payload.get("messages")
    if not isinstance(messages, list) or not messages:
        raise ValueError("messages 배열이 필요합니다.")

    request_payload = {
        "model": payload.get("model") or DEFAULT_MODEL,
        "instructions": "You are a concise, helpful Korean AI chat assistant.",
        "input": messages,
        "max_output_tokens": 1200,
    }

    request = urllib.request.Request(
        OPENAI_RESPONSES_URL,
        data=json.dumps(request_payload).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}",
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(request, timeout=60) as response:
            response_data = json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        error_body = exc.read().decode("utf-8", errors="replace")
        try:
            error_data = json.loads(error_body)
            message = error_data.get("error", {}).get("message") or error_body
        except json.JSONDecodeError:
            message = error_body or f"OpenAI 요청 실패: HTTP {exc.code}"
        raise RuntimeError(message) from exc
    except urllib.error.URLError as exc:
        raise RuntimeError(f"OpenAI API에 연결하지 못했습니다: {exc.reason}") from exc

    return {"text": extract_response_text(response_data)}


class ChatHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, directory=str(BASE_DIR), **kwargs)

    def do_POST(self) -> None:
        if self.path != "/api/chat":
            self.send_json({"error": "Not found"}, HTTPStatus.NOT_FOUND)
            return

        try:
            payload = read_json(self)
            result = call_openai(payload)
        except ValueError as exc:
            self.send_json({"error": str(exc)}, HTTPStatus.BAD_REQUEST)
            return
        except RuntimeError as exc:
            self.send_json({"error": str(exc)}, HTTPStatus.BAD_GATEWAY)
            return

        self.send_json(result)

    def send_json(self, payload: dict[str, Any], status: HTTPStatus = HTTPStatus.OK) -> None:
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)


def main() -> None:
    port = int(os.environ.get("PORT", "8000"))
    server = ThreadingHTTPServer(("0.0.0.0", port), ChatHandler)
    print(f"Serving AI Chat at http://localhost:{port}")
    server.serve_forever()


if __name__ == "__main__":
    main()
