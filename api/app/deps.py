from typing import Annotated

from fastapi import Depends, Request

from .core.config import Settings
from .providers.registry import ProviderRegistry
from .services.chat import ChatService


def get_app_settings(request: Request) -> Settings:
    return request.app.state.settings


def get_registry(request: Request) -> ProviderRegistry:
    return request.app.state.registry


SettingsDep = Annotated[Settings, Depends(get_app_settings)]
RegistryDep = Annotated[ProviderRegistry, Depends(get_registry)]


def get_chat_service(registry: RegistryDep, settings: SettingsDep) -> ChatService:
    return ChatService(
        registry,
        settings.system_prompt,
        settings.allow_cloud_fallback,
    )


ChatServiceDep = Annotated[ChatService, Depends(get_chat_service)]
