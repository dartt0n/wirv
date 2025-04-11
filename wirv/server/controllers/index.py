from flask import Blueprint, Response

from wirv.server.responses import HTML

bp = Blueprint("health", __name__, url_prefix="/")


@bp.get("/")
def health() -> Response:
    return HTML("<p>website would be here</p>")
