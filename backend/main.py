import os
import json
import httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="EduAgent API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
TAVILY_API_KEY = os.getenv("TAVILY_API_KEY", "")

GROQ_BASE_URL = "https://api.groq.com/openai/v1"
TAVILY_BASE_URL = "https://api.tavily.com"

# --- Категорії та їх пошукові стратегії ---
CATEGORY_SEARCH_CONFIG = {
    "навчальна програма": {
        "suffixes": ["навчальна програма курс", "curriculum syllabus"],
        "boost": "навчальна програма дисципліна",
    },
    "методичні вказівки": {
        "suffixes": ["методичні вказівки методичний посібник лабораторні роботи"],
        "boost": "методичні вказівки практичні завдання",
    },
    "навчальний план": {
        "suffixes": ["навчальний план спеціальність бакалавр магістр"],
        "boost": "навчальний план освітня програма",
    },
    "підручник посібник": {
        "suffixes": ["підручник навчальний посібник PDF завантажити"],
        "boost": "підручник автор видання",
    },
    "силабус курс": {
        "suffixes": ["силабус курс опис дисципліни"],
        "boost": "силабус навчальна дисципліна",
    },
    "наукова стаття дослідження": {
        "suffixes": ["наукова стаття дослідження публікація"],
        "boost": "наукова робота результати",
    },
    "": {
        "suffixes": [""],
        "boost": "",
    },
}

SYSTEM_PROMPT = """Ти — освітній AI-агент для університетської кафедри.
Твоя задача — аналізувати знайдені матеріали та давати структурований звіт.

КРИТИЧНО ВАЖЛИВІ ПРАВИЛА:
1. Відповідай виключно українською мовою
2. Аналізуй тільки те, що є в наданих джерелах — не вигадуй
3. НЕ додавай розділ "Корисні посилання" — посилання вже є в джерелах нижче
4. НЕ повторюй список джерел у відповіді — вони відображаються окремо в інтерфейсі
5. Якщо в джерелах мало інформації по темі — чесно вкажи це

СТРУКТУРА ВІДПОВІДІ (суворо дотримуйся):
## Огляд знахідок
(2-3 речення: що знайдено, наскільки релевантно)

## Детальний аналіз
(розбий по підрозділах залежно від знайденого контенту)

## Ключові висновки
(конкретні факти, цифри, назви з джерел)

## Рекомендації для кафедри
(практичні кроки на основі знайденого)

ЗАБОРОНЕНО:
- Вигадувати посилання або URL
- Додавати розділ з посиланнями
- Повторювати ті ж самі пункти в різних розділах"""


class AgentRequest(BaseModel):
    topic: str
    category: Optional[str] = "навчальна програма"


def build_search_query(topic: str, category: str) -> str:
    """
    Будує точний пошуковий запит.
    Зберігає власні назви (НУЛП, Харків тощо) та не розмиває їх загальними словами.
    """
    topic = topic.strip()
    category = (category or "").strip()

    config = CATEGORY_SEARCH_CONFIG.get(category, CATEGORY_SEARCH_CONFIG[""])

    if not category:
        return topic

    suffix = config["suffixes"][0]
    if suffix:
        return f"{topic} {suffix}"
    return topic


def deduplicate_sources(results: list) -> list:
    """Прибирає дублікати джерел за URL."""
    seen_urls = set()
    unique = []
    for r in results:
        url = r.get("url", "").rstrip("/").lower()
        if url and url not in seen_urls:
            seen_urls.add(url)
            unique.append(r)
    return unique


async def tavily_search(query: str, max_results: int = 7) -> dict:
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(
            f"{TAVILY_BASE_URL}/search",
            json={
                "api_key": TAVILY_API_KEY,
                "query": query,
                "search_depth": "advanced",
                "include_answer": True,
                "include_raw_content": False,
                "max_results": max_results,
            }
        )
        if response.status_code != 200:
            raise HTTPException(status_code=502, detail=f"Tavily error: {response.text}")
        return response.json()


@app.get("/health")
async def health():
    return {"status": "ok", "groq": bool(GROQ_API_KEY), "tavily": bool(TAVILY_API_KEY)}


@app.post("/api/agent")
async def run_agent_stream(req: AgentRequest):
    if not GROQ_API_KEY:
        raise HTTPException(status_code=400, detail="GROQ_API_KEY не встановлено")
    if not TAVILY_API_KEY:
        raise HTTPException(status_code=400, detail="TAVILY_API_KEY не встановлено")

    category = req.category or ""
    search_query = build_search_query(req.topic, category)

    search_results = await tavily_search(search_query, max_results=8)

    raw_results = search_results.get("results", [])
    unique_results = deduplicate_sources(raw_results)

    search_context = ""
    sources = []

    if search_results.get("answer"):
        search_context += f"Загальна відповідь пошуку:\n{search_results['answer']}\n\n"

    for i, result in enumerate(unique_results, 1):
        title = result.get("title", "")
        url = result.get("url", "")
        content = result.get("content", "")[:1000]
        search_context += f"[Джерело {i}]\nНазва: {title}\nURL: {url}\nЗміст: {content}\n\n"
        sources.append({
            "title": title,
            "url": url,
            "score": round(result.get("score", 0), 3)
        })

    category_label = category if category else "загальний пошук"

    user_message = f"""Тема запиту: "{req.topic}"
Тип матеріалу: {category_label}
Пошуковий запит що використовувався: "{search_query}"

=== ЗНАЙДЕНІ ДЖЕРЕЛА ===
{search_context}
=== КІНЕЦЬ ДЖЕРЕЛ ===

Проаналізуй знайдену інформацію. 
НЕ додавай розділ з посиланнями — вони відображаються окремо.
НЕ вигадуй інформацію якої немає в джерелах."""

    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": user_message}
    ]

    async def generate():
        yield f"data: {json.dumps({'type': 'sources', 'sources': sources, 'query': search_query}, ensure_ascii=False)}\n\n"

        async with httpx.AsyncClient(timeout=90.0) as client:
            async with client.stream(
                "POST",
                f"{GROQ_BASE_URL}/chat/completions",
                headers={
                    "Authorization": f"Bearer {GROQ_API_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "llama-3.3-70b-versatile",
                    "messages": messages,
                    "temperature": 0.2,
                    "max_tokens": 4096,
                    "stream": True
                }
            ) as response:
                async for line in response.aiter_lines():
                    if line.startswith("data: "):
                        data_str = line[6:]
                        if data_str == "[DONE]":
                            yield f"data: {json.dumps({'type': 'done'})}\n\n"
                            return
                        try:
                            data = json.loads(data_str)
                            delta = data["choices"][0]["delta"]
                            if "content" in delta and delta["content"]:
                                yield f"data: {json.dumps({'type': 'token', 'content': delta['content']}, ensure_ascii=False)}\n\n"
                        except Exception:
                            continue
        yield f"data: {json.dumps({'type': 'done'})}\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
