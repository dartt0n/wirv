import msgspec
from flask import Blueprint, Request, Response

from wirv.server.responses import JSON

bp = Blueprint("health", __name__, url_prefix="/health")


class HealthDTO(msgspec.Struct):
    status: str


@bp.get("/")
def health(request: Request) -> Response:
    return JSON(HealthDTO(status="ok"))
