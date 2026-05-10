import os
from typing import Any, Dict, Optional
from pydantic import BaseModel, Field
from pydantic_settings import BaseSettings, SettingsConfigDict
import yaml


class LLMSettings(BaseModel):
    provider: str = Field(default="openai")
    model: str = Field(default="gpt-4o")
    api_key: Optional[str] = Field(default=None)
    api_base: Optional[str] = Field(default=None)
    temperature: float = Field(default=0.7)
    max_tokens: int = Field(default=4096)


class MemorySettings(BaseModel):
    window_size: int = Field(default=10)
    vector_db_type: str = Field(default="chromadb")
    vector_db_path: str = Field(default="./chroma_db")
    embedding_model: str = Field(default="text-embedding-ada-002")


class RAGSettings(BaseModel):
    chunk_size: int = Field(default=1000)
    chunk_overlap: int = Field(default=200)
    top_k: int = Field(default=5)


class SecuritySettings(BaseModel):
    tool_timeout_seconds: int = Field(default=30)
    rpm_limit: int = Field(default=60)
    tpm_limit: int = Field(default=100000)


class AgentConfig(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        env_nested_delimiter="__",
        extra="allow",
    )

    llm: LLMSettings = Field(default_factory=LLMSettings)
    memory: MemorySettings = Field(default_factory=MemorySettings)
    rag: RAGSettings = Field(default_factory=RAGSettings)
    security: SecuritySettings = Field(default_factory=SecuritySettings)
    debug: bool = Field(default=False)

    @classmethod
    def from_yaml(cls, path: str) -> "AgentConfig":
        with open(path, "r", encoding="utf-8") as f:
            data = yaml.safe_load(f)
        return cls(**(data or {}))

    @classmethod
    def from_dict(cls, d: Dict[str, Any]) -> "AgentConfig":
        return cls(**d)

    def to_dict(self) -> Dict[str, Any]:
        return self.model_dump()
