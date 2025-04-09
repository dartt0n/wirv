import ujson
from flask import Blueprint, Request, Response

bp = Blueprint("health", __name__, url_prefix="/health")


@bp.get("/")
def health(request: Request) -> Response:
    return Response(ujson.dumps({"status": "OK"}), status=200)
