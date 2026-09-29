from ..deps import RegistryDep
from ..schemas import ModelsResponse
from fastapi import APIRouter, Query

router = APIRouter(prefix="/models", tags=["models"])


@router.get("", response_model=ModelsResponse)
async def list_models(
    registry: RegistryDep,
    refresh: bool = Query(default=False, description="Bypass the short-lived model cache"),
) -> ModelsResponse:
    """Local Ollama models plus models from every configured cloud provider."""
    return await registry.models_response(refresh=refresh)
