# AI Assistant — API

FastAPI backend. Local Ollama models are used first; cloud providers
(Anthropic, OpenAI, Gemini, Grok, Meta Llama) are the fallback.

## Run

```bash
uv sync
cp .env.example .env          # add any cloud API keys you have
uv run fastapi dev app/main.py   # http://localhost:8000/docs
```

## Quality

```bash
uv run ruff check .
uv run ruff format --check .
uv run pytest
```

## Endpoints

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/health` | Liveness check |
| GET | `/api/models?refresh=true` | Installed Ollama models + cloud models, grouped by provider, with the default pick |
| POST | `/api/chat` | Streams a reply as server-sent events |

`POST /api/chat` body:

```json
{ "messages": [{"role": "user", "content": "Hi"}], "provider": "ollama", "model": "llama3.2:latest" }
```

`provider` and `model` are optional; without them the API picks the first
local model, then the first configured cloud provider.

Stream events:

```
event: meta
data: {"provider":"ollama","model":"llama3.2:latest","local":true,"fallback":false,"notice":null}

data: {"delta":"Hello"}

event: done        (or)   event: error
data: {}                  data: {"message":"..."}
```

## How fallback works

1. The model picked in the UI is tried first.
2. If it fails **before** sending any text, the API tries the first installed
   Ollama model, then each cloud provider in `CLOUD_PRIORITY` order.
3. The `meta` event says which model actually answered (`fallback: true`, with
   the reason in `notice`) so the UI can tell the user.
4. If a model fails mid-answer, the API reports an error rather than switching,
   so replies never mix two models.

Set `ALLOW_CLOUD_FALLBACK=false` to keep everything on the chosen model.

## Layout

```
app/
  main.py              app factory, CORS, lifespan
  core/config.py       settings from env / .env
  schemas.py           request/response models
  deps.py              FastAPI dependencies
  routes/              health, models, chat
  providers/
    base.py            Provider interface
    ollama.py          local models (ollama SDK)
    anthropic.py       Claude (anthropic SDK)
    openai_compat.py   OpenAI, Gemini, Grok, Meta (OpenAI-compatible APIs)
    registry.py        builds providers, lists models, picks candidates
  services/chat.py     streaming + fallback logic
tests/                 pytest suite with fake providers (no network needed)
```

## Voice mode (LiveKit)

Voice mode appears as a sound-wave button in the empty message box once the
API has LiveKit credentials. It needs a [LiveKit Cloud](https://cloud.livekit.io)
project, because speech-to-text, text-to-speech, turn detection and noise
cancellation run on LiveKit Inference.

```bash
# api/.env and agent/.env: the same three values from your LiveKit project
LIVEKIT_URL=wss://<your-project>.livekit.cloud
LIVEKIT_API_KEY=...
LIVEKIT_API_SECRET=...

# Voice agent (new terminal; API must be running)
cd agent
uv sync
uv run python voice_agent.py dev
```

With Docker: fill in agent/.env, then `docker compose --profile voice up --build`.

How a session flows:

```
Browser ──POST /api/voice/session──► API: new room + token that dispatches the agent
   │                                     (remembers the chosen model and earlier chat)
   └──WebRTC (mic + speaker)──► LiveKit ◄── agent: STT → turn detection → reply → TTS
                                                │
                                   POST /api/voice/chat  (same model dropdown,
                                   Ollama first, cloud fallback as text chat)
```

- Replies use the model picked in the dropdown, with the same fallback as
  text chat. The agent shows which model answered.
- Talking over the assistant interrupts it; **Stop** and **Esc** do too.
- Transcripts are saved into the chat (tagged *Spoken*), so a voice
  conversation can continue by typing and vice versa.
- If a model fails the assistant says so out loud and the UI shows the
  reason; if the agent is not running the UI says so after 20 seconds.
- Anyone who can reach `/api/voice/session` can start a (billed) voice
  session, so put it behind your login before going public, and set the same
  `VOICE_AGENT_TOKEN` in api/.env and agent/.env so only the agent can call
  `/api/voice/chat`.

Voice settings (agent/.env): `VOICE_STT_MODEL`, `VOICE_STT_LANGUAGE`,
`VOICE_TTS_MODEL`, `VOICE_TTS_VOICE`, `VOICE_GREETING`, `VOICE_INSTRUCTIONS`,
`VOICE_NOISE_CANCELLATION`, and `VOICE_LLM` (`app`, or a LiveKit Inference model
id to bypass the app). Offer a voice picker with `VOICE_VOICES` in api/.env.
