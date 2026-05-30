# AloneWork

<div align="center">

[![Python](https://img.shields.io/badge/Python-3.11%2B-3776AB?style=flat&logo=python&logoColor=white)](https://www.python.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?style=flat&logo=node.js&logoColor=white)](https://nodejs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.109%2B-009688?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=flat&logo=next.js&logoColor=white)](https://nextjs.org/)
[![License](https://img.shields.io/badge/License-Non--Commercial%20Open%20Source-yellow.svg)](LICENSE)

**Production-Grade AI Agent Collaboration Platform**

Real-time Chat × Intelligent Agent × RAG Retrieval × Multi-Agent Orchestration

[Quick Start](#quick-start) · [Documentation](#documentation) · [Examples](#usage-examples) · [Roadmap](#roadmap) · [中文文档](README_CN.md)

</div>

---

## Introduction

**AloneWork** is a full-stack collaboration platform integrating real-time chat application with a production-grade AI Agent framework.

### Core Capabilities

| Capability | Description |
|------------|-------------|
| **Real-time Chat** | WebSocket-based instant messaging with private chat, groups, history, file sharing |
| **Agent Gateway** | Production-grade Agent runtime with ReAct reasoning, tool calling, session management |
| **Multi-Agent Orchestration** | Multi-Agent team collaboration with sequential discussion, broadcast, DAG workflow |
| **RAG Retrieval** | ChromaDB vector storage with document loading, chunking, embedding, retrieval |
| **MCP Marketplace** | Model Context Protocol server management for dynamic Agent capability extension |
| **DeepSeek Optimization** | Million-token context optimization: semantic cache, message compression, importance ranking |
| **Intent Clarification** | MTC Mode: automatic vague requirement detection, question form generation, task decomposition |
| **Multi-format File Processing** | Support for PDF, Word, Excel, PPT, Code files with OCR image recognition |
| **i18n Support** | Bilingual support (English/Chinese) with next-intl |
| **Enterprise Security** | JWT authentication, bcrypt password hashing, rate limiting, input validation, audit logging |
| **Data Persistence** | SQLite WAL mode with auto-migration, FTS5 full-text search, connection pooling |

---

## Project Structure

```
AloneWork-workspace/
├── alonework-cli/                # Command Line Interface
│   └── src/alonechat/
│       ├── tui/                  # TUI Interactive Interface
│       ├── orchestration/        # Workflow Orchestration Engine
│       ├── agents/               # Multi-Agent Collaboration
│       ├── environment/          # Action Environment System
│       └── data/                 # Data Collection
│
├── agent-framework/              # Core Logic Layer
│   └── agent_framework/
│       ├── security/             # Enterprise Security Module
│       │   ├── auth.py           # Authentication System
│       │   ├── rate_limiter.py   # Rate Limiter
│       │   ├── input_validation.py # Input Validation
│       │   └── config.py         # Security Configuration
│       ├── storage/              # Storage Module
│       │   └── database_manager.py # Database Manager
│       ├── core/                 # Core Infrastructure
│       │   ├── cache.py          # High-Performance Cache
│       │   └── error_handling.py # Error Handling
│       ├── gateway/              # API Gateway Layer
│       ├── agent/                # Agent Implementations
│       │   ├── react_agent.py    # ReAct Agent
│       │   ├── multi_agent.py    # Multi-Agent Team
│       │   ├── mtc_agent.py      # MTC Agent
│       │   └── intent_clarifier.py
│       ├── orchestration/        # Orchestration Engine
│       ├── sandbox/              # Sandbox Environment
│       └── locale/               # Internationalization
│
├── alonechat-desktop/            # Desktop Application Layer
│   └── src/
│       ├── components/
│       │   ├── welcome-page.tsx  # Codex-Style Welcome Page
│       │   ├── layout/           # Layout Components
│       │   ├── agent/            # Agent Chat Components
│       │   └── ui/               # UI Base Components
│       ├── stores/               # State Management
│       └── app/                  # Page Routes
│
├── docs/                         # Documentation
├── bugs/                         # Bug Tracking
└── Makefile                      # Build Script
```

---

## Tech Stack

### Backend

| Tech | Version | Purpose |
|------|---------|---------|
| FastAPI | 0.109+ | High-performance async web framework |
| SQLAlchemy | 2.0 | ORM and database interaction |
| Alembic | 1.13 | Database migrations |
| SQLite | 3.35+ | Embedded database with WAL mode |
| WebSockets | 12.0 | Real-time bidirectional communication |
| bcrypt | 4.1+ | Password hashing (200K iterations) |
| PyJWT | 2.8+ | JWT token management |

### Frontend

| Tech | Version | Purpose |
|------|---------|---------|
| Next.js | 16 | React full-stack framework |
| React | 19 | UI library |
| Tailwind CSS | 4 | Atomic CSS |
| shadcn/ui | - | Component library |
| next-intl | 3.21+ | Internationalization |

### Agent Framework

| Tech | Version | Purpose |
|------|---------|---------|
| LiteLLM | 1.40+ | Multi-model LLM unified gateway |
| ChromaDB | 0.4+ | Vector database |
| NetworkX | 3.2+ | DAG workflow orchestration |
| PaddleOCR | 2.7+ | OCR image recognition |

---

## Quick Start

### Requirements

- Python 3.11+
- Node.js 18+

### 1. Clone Repository

```bash
git clone https://github.com/AlonechatWorkspace/AloneWork.git
cd AloneWork
```

### 2. Install Dependencies

```bash
make install
```

### 3. Configure Environment

```bash
cp agent-framework/.env.example agent-framework/.env
```

Edit `.env` files:

```env
# LLM Configuration
LLM_PROVIDER=deepseek
LLM_MODEL=deepseek-chat
LLM_API_KEY=sk-your-api-key
LLM_API_BASE=https://api.deepseek.com/v1

# Security Configuration
JWT_SECRET_KEY=your-super-secret-key-min-32-chars
JWT_EXPIRE_MINUTES=30
PASSWORD_HASH_ALGORITHM=bcrypt
MAX_LOGIN_ATTEMPTS=5
LOCKOUT_DURATION_MINUTES=15

# Rate Limiting
RATE_LIMIT_RPM=100
RATE_LIMIT_PER_IP_RPM=20
RATE_LIMIT_PER_USER_RPM=30
```

### 4. Initialize Security Components

```bash
cd agent-framework
python -c "
from agent_framework.security.config import initialize_security_components
config = initialize_security_components()
print('Security components initialized')
"
```

### 5. Start Services

```bash
make dev              # Start backend + frontend
make dev-backend      # http://localhost:8000
make dev-frontend     # http://localhost:3000

cd agent-framework && python gateway_main.py  # http://localhost:18789
```

---

## Usage Examples

### ReAct Agent

```python
from agent_framework.agent.react_agent import ReActAgent
from agent_framework.tools.registry import ToolRegistry
from agent_framework.tools.builtin.calculator import CalculatorTool

registry = ToolRegistry()
registry.register(CalculatorTool())

agent = ReActAgent(llm=llm, tool_registry=registry)
result = agent.run("Calculate 25 + 36 * 2")
print(result.answer)
```

### Multi-Agent Team

```python
from agent_framework.agent.multi_agent import MultiAgentTeam

team = MultiAgentTeam()
team.add_agent("researcher", agent1, role="Researcher")
team.add_agent("writer", agent2, role="Writer")
team.add_agent("reviewer", agent3, role="Reviewer")

result = team.sequential_discussion("Write an article about AI Agents")
print(result["final_output"])
```

### MTC Agent (Intent Clarification)

```python
from agent_framework.agent.mtc_agent import MTCAgent

agent = MTCAgent(llm=llm)
clarification = agent.clarify_intent("Help me write a document")

if clarification["needs_clarification"]:
    for q in clarification["questions"]:
        print(f"Q: {q['question']}")
        if q.get("options"):
            print(f"Options: {q['options']}")

agent.collect_clarification_answers({
    "output_format": "Markdown",
    "detail_level": "Standard",
})

result = agent.run("Help me write a document")
```

### Agent Gateway WebSocket

```javascript
const ws = new WebSocket("ws://localhost:18789/ws");

ws.send(JSON.stringify({ user_id: "user123", session_key: "session-001" }));

ws.send(JSON.stringify({ type: "message", body: "Calculate 25 + 36 * 2" }));

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  switch (data.type) {
    case "thinking": console.log("Thinking:", data.message); break;
    case "acting": console.log("Executing:", data.message); break;
    case "final": console.log("Answer:", data.content); break;
  }
};
```

---

## API Endpoints

### Backend API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/register` | POST | User registration |
| `/api/auth/login` | POST | User login |
| `/api/conversations` | GET | Get conversation list |
| `/api/agent/sessions` | POST | Create Agent session |
| `/api/v1/mcp-marketplace/servers` | GET | List MCP servers |
| `/api/v1/mcp-marketplace/servers/{id}/tools/call` | POST | Call MCP tool |
| `/api/v1/files/parse` | POST | Parse file to text |
| `/api/v1/files/generate/{type}` | POST | Generate file |
| `/api/v1/tasks/decompose` | POST | Decompose task |
| `/api/v1/skills` | GET | List skills |

### Agent Gateway API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/status` | GET | Gateway status |
| `/ws` | WebSocket | Real-time conversation |

---

## Security Features

### Authentication System

- **bcrypt Password Hashing**: 12 rounds salt, automatic fallback to PBKDF2 (200K iterations)
- **Strong Password Policy**: uppercase + lowercase + numbers + minimum 8 characters + weak password blacklist
- **Token Blacklist**: support for logout, batch revocation, automatic cleanup of expired entries
- **Account Lockout**: configurable failure count and lockout duration to prevent brute force attacks
- **Audit Logging**: complete recording of all authentication events (timestamp/IP/User-Agent)
- **Thread Safety**: RLock protection for UserManager, supporting high-concurrency scenarios

### Rate Limiting

- **Four-Layer Protection**: Global → Per-IP → Per-User → Per-API-Key
- **Sliding Window Algorithm**: more precise rate control than fixed windows
- **Token Metering**: TPM (Tokens Per Minute) limits to protect LLM API costs
- **Auto Cleanup**: periodic cleanup of inactive client states to prevent memory leaks
- **Admin Interface**: `reset_client()` to manually lift restrictions

### Input Validation

- **SQL Injection Detection**: pattern matching for dangerous SQL statements
- **XSS Attack Prevention**: HTML sanitization and escaping
- **Command Injection Detection**: filtering of dangerous characters and commands
- **Path Traversal Protection**: filename sanitization to prevent directory traversal

### Data Persistence

- **SQLite WAL Mode**: 10x+ improvement in read/write concurrency performance
- **Auto Migration**: schema versioning with zero-downtime upgrades
- **FTS5 Full-text Search**: millisecond-level message content retrieval
- **Audit Logging**: 90-day retention period with automatic cleanup of expired data

---

## Roadmap

### v0.3.1 (Current)

- [x] Real-time chat application
- [x] ReAct Agent implementation
- [x] Multi-Agent team collaboration
- [x] RAG retrieval pipeline
- [x] Agent Gateway service
- [x] DeepSeek optimization module
- [x] MCP Marketplace API
- [x] MTC Mode (Intent Clarification)
- [x] Multi-format file processing (PDF/Word/Excel/PPT/Code)
- [x] OCR image recognition
- [x] Skills registration system
- [x] Task decomposition and execution
- [x] i18n support (English/Chinese)
- [x] Enterprise security system
- [x] Data persistence layer
- [x] Desktop UI redesign (Codex style)

### v0.4.0 (Planned)

- [ ] PostgreSQL support
- [ ] Redis cache integration
- [ ] OpenTelemetry observability
- [ ] Multi-tenant support design
- [ ] Commercial version features

### v1.0.0 (Future)

- [ ] Production deployment guide
- [ ] Kubernetes deployment
- [ ] Complete security audit fixes
- [ ] Performance benchmarks

---

## Documentation

| Document | Description |
|----------|-------------|
| [Architecture Design](docs/轻量级Agent框架架构设计.md) | Agent framework design |
| [Gateway Design](docs/生产级Agent网关架构设计.md) | Gateway architecture |
| [Gateway Quick Start](agent-framework/GATEWAY_README.md) | Gateway usage guide |
| [MCP Setup Guide](docs/guides/MCP_MARKETPLACE_SETUP_GUIDE.md) | MCP configuration |
| [Security Audit](docs/security/SECURITY_AUDIT_REPORT.md) | Security vulnerabilities |
| [Bug Tracking](bugs/README.md) | Bug list |
| [Release Notes](docs/releases/) | Version history |
| [中文文档](README_CN.md) | Chinese documentation |

---

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Create Pull Request

---

## License

This project is licensed under the [AloneChatWorkspace Non-Commercial Open Source License](LICENSE).

**Key Terms:**
- ✓ You CAN use, study, modify, and share this software
- ✓ You CAN create derivative works for non-commercial purposes
- ✓ You CAN contribute back to the project
- ✗ You CANNOT use this software for commercial purposes
- ✗ You CANNOT create closed-source derivatives
- ✗ You CANNOT sell or commercially license this software or derivatives

For commercial licensing inquiries, please contact: alonechatworkspace@163.com

---

<div align="center">

**GitHub**: [https://github.com/AlonechatWorkspace/AloneWork](https://github.com/AlonechatWorkspace/AloneWork)

**Email**: alonechatworkspace@163.com

Made with ❤️ by AloneWork Team

</div>