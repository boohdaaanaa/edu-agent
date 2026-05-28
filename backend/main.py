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

@app.get("/")
async def root():
    return {
        "message": "EduAgent API працює",
        "docs": "http://127.0.0.1:8000/docs"
    }

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

SYSTEM_PROMPT = """Ти — освітній AI-агент для університетської кафедри. 
Твоя задача — знаходити, аналізувати та структурувати навчальні матеріали: 
навчальні програми, методичні вказівки, навчальні плани, підручники та освітні проекти.

Правила:
1. Відповідай ЗАВЖДИ українською мовою
2. Структуруй відповідь чітко: заголовки, розділи, пункти
3. Виділяй найважливіші знахідки
4. Вказуй джерела якщо є
5. Будь конкретним та корисним для академічного використання
6. Якщо знайдені матеріали містять посилання — включай їх

Формат відповіді:
- Короткий огляд знайденого
- Детальний аналіз по розділах
- Рекомендації для кафедри
- Корисні посилання (якщо є)"""


class SearchRequest(BaseModel):
    query: str
    search_depth: Optional[str] = "advanced"
    max_results: Optional[int] = 5


class AgentRequest(BaseModel):
    topic: str
    category: Optional[str] = "навчальна програма"


async def tavily_search(query: str, search_depth: str = "advanced", max_results: int = 5) -> dict:
    """Search the web using Tavily API"""
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(
            f"{TAVILY_BASE_URL}/search",
            json={
                "api_key": TAVILY_API_KEY,
                "query": query,
                "search_depth": search_depth,
                "include_answer": True,
                "include_raw_content": False,
                "max_results": max_results,
                "include_domains": [],
                "exclude_domains": []
            }
        )
        if response.status_code != 200:
            raise HTTPException(status_code=502, detail=f"Tavily error: {response.text}")
        return response.json()


async def groq_chat(messages: list, model: str = "llama-3.3-70b-versatile") -> str:
    """Call Groq API for chat completion"""
    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(
            f"{GROQ_BASE_URL}/chat/completions",
            headers={
                "Authorization": f"Bearer {GROQ_API_KEY}",
                "Content-Type": "application/json"
            },
            json={
                "model": model,
                "messages": messages,
                "temperature": 0.3,
                "max_tokens": 4000,
            }
        )
        if response.status_code != 200:
            raise HTTPException(status_code=502, detail=f"Groq error: {response.text}")
        data = response.json()
        return data["choices"][0]["message"]["content"]


@app.get("/health")
async def health():
    return {"status": "ok", "groq": bool(GROQ_API_KEY), "tavily": bool(TAVILY_API_KEY)}


@app.post("/api/search")
async def search_only(req: SearchRequest):
    """Raw web search endpoint"""
    if not TAVILY_API_KEY:
        raise HTTPException(status_code=400, detail="TAVILY_API_KEY not set")
    results = await tavily_search(req.query, req.search_depth, req.max_results)
    return results


@app.post("/api/agent")
async def run_agent(req: AgentRequest):
    """Main agent endpoint: search + analyze + respond"""
    if not GROQ_API_KEY:
        raise HTTPException(status_code=400, detail="GROQ_API_KEY not set")
    if not TAVILY_API_KEY:
        raise HTTPException(status_code=400, detail="TAVILY_API_KEY not set")

    # Step 1: Build search query
    search_query = f"{req.category} {req.topic} університет навчальна програма"

    # Step 2: Web search
    search_results = await tavily_search(search_query, max_results=6)

    # Step 3: Prepare context from search results
    search_context = ""
    sources = []

    if search_results.get("answer"):
        search_context += f"Загальна відповідь пошуку:\n{search_results['answer']}\n\n"

    for i, result in enumerate(search_results.get("results", []), 1):
        title = result.get("title", "")
        url = result.get("url", "")
        content = result.get("content", "")[:800]
        search_context += f"[Джерело {i}] {title}\nURL: {url}\nЗміст: {content}\n\n"
        sources.append({"title": title, "url": url, "score": result.get("score", 0)})

    # Step 4: AI analysis
    user_message = f"""Тема запиту: "{req.topic}"
Категорія: {req.category}

Результати веб-пошуку:
{search_context}

Проаналізуй знайдену інформацію та надай детальний звіт для університетської кафедри.
Структуруй відповідь з чіткими розділами. Включи конкретні знахідки, приклади та рекомендації."""

    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": user_message}
    ]

    analysis = await groq_chat(messages)

    return {
        "topic": req.topic,
        "category": req.category,
        "search_query": search_query,
        "analysis": analysis,
        "sources": sources,
        "total_sources": len(sources)
    }


@app.post("/api/agent/stream")
async def run_agent_stream(req: AgentRequest):
    """Streaming version of agent endpoint"""
    if not GROQ_API_KEY:
        raise HTTPException(status_code=400, detail="GROQ_API_KEY not set")
    if not TAVILY_API_KEY:
        raise HTTPException(status_code=400, detail="TAVILY_API_KEY not set")

    search_query = f"{req.category} {req.topic} університет"
    search_results = await tavily_search(search_query, max_results=6)

    search_context = ""
    sources = []

    if search_results.get("answer"):
        search_context += f"Загальна відповідь:\n{search_results['answer']}\n\n"

    for i, result in enumerate(search_results.get("results", []), 1):
        title = result.get("title", "")
        url = result.get("url", "")
        content = result.get("content", "")[:800]
        search_context += f"[{i}] {title}\n{url}\n{content}\n\n"
        sources.append({"title": title, "url": url})

    user_message = f"""Тема: "{req.topic}", Категорія: {req.category}

Результати пошуку:
{search_context}

Надай детальний аналіз для кафедри."""

    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": user_message}
    ]

    async def generate():
        # First yield sources as metadata
        yield f"data: {json.dumps({'type': 'sources', 'sources': sources, 'query': search_query})}\n\n"

        # Stream from Groq
        async with httpx.AsyncClient(timeout=60.0) as client:
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
                    "temperature": 0.3,
                    "max_tokens": 4000,
                    "stream": True
                }
            ) as response:
                async for line in response.aiter_lines():
                    if line.startswith("data: "):
                        data_str = line[6:]
                        if data_str == "[DONE]":
                            yield f"data: {json.dumps({'type': 'done'})}\n\n"
                            break
                        try:
                            data = json.loads(data_str)
                            delta = data["choices"][0]["delta"]
                            if "content" in delta and delta["content"]:
                                yield f"data: {json.dumps({'type': 'token', 'content': delta['content']})}\n\n"
                        except Exception:
                            continue

    return StreamingResponse(generate(), media_type="text/event-stream")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)