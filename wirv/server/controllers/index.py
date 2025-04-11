from flask import Blueprint, Request, Response

from wirv.server.responses import HTML

bp = Blueprint("health", __name__, url_prefix="/")


@bp.get("/")
def health(request: Request) -> Response:
    return HTML("<p>website would be here</p>")
