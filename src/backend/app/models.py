from pydantic import BaseModel, Field
from typing import Optional, List, Literal
import uuid


_base = {"populate_by_name": True, "serialize_by_alias": True}


class Parameter(BaseModel):
    name: str
    location: Literal["path", "query", "header", "cookie"] = Field(alias="in")
    required: bool
    type: str
    description: str

    model_config = _base


class RequestBody(BaseModel):
    required: bool
    content_type: str
    schema_: dict = Field(alias="schema", default_factory=dict)

    model_config = _base


class AuthScheme(BaseModel):
    type: Literal["apiKey", "bearer", "basic"]
    location: Literal["header", "query", "cookie"]
    name: str


class ToolCard(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    enabled: bool = True
    tool_name: str = Field(alias="toolName")
    description: str
    method: Literal["GET", "POST", "PUT", "DELETE", "PATCH"]
    path: str
    parameters: List[Parameter] = []
    request_body: Optional[RequestBody] = Field(alias="requestBody", default=None)
    auth: Optional[AuthScheme] = None
    quality_score: Literal["green", "yellow", "red"] = Field(alias="qualityScore", default="red")
    llm_preview: str = Field(alias="llmPreview", default="")

    model_config = _base


class SpecMetadata(BaseModel):
    title: str
    version: str
    base_url: str = Field(alias="baseUrl")

    model_config = _base


# --- Request / Response models ---

class DiscoverRequest(BaseModel):
    base_url: str = Field(alias="baseUrl")

    model_config = _base


class DiscoverResponse(BaseModel):
    spec_url: str = Field(alias="specUrl")

    model_config = _base


class ParseRequest(BaseModel):
    spec_url: Optional[str] = Field(alias="specUrl", default=None)
    spec_content: Optional[str] = Field(alias="specContent", default=None)
    spec_format: Optional[Literal["json", "yaml"]] = Field(alias="specFormat", default=None)

    model_config = _base


class ParseResponse(BaseModel):
    metadata: SpecMetadata
    tool_cards: List[ToolCard] = Field(alias="toolCards")
    session_token: str = Field(alias="sessionToken")

    model_config = _base


class RewriteRequest(BaseModel):
    tool_card: ToolCard = Field(alias="toolCard")
    session_token: str = Field(alias="sessionToken")

    model_config = _base


class RewriteResponse(BaseModel):
    tool_name: str = Field(alias="toolName")
    description: str

    model_config = _base


class GenerateOptions(BaseModel):
    framework: Literal["fastmcp"] = "fastmcp"


class GenerateRequest(BaseModel):
    tool_cards: List[ToolCard] = Field(alias="toolCards")
    metadata: SpecMetadata
    options: GenerateOptions = Field(default_factory=GenerateOptions)

    model_config = _base
