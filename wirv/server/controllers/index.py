from flask import Blueprint, Response, render_template

from wirv.server import templates
from wirv.server.responses import HTML

bp = Blueprint("health", __name__, url_prefix="/")


@bp.get("/")
def index() -> Response:
    return HTML(render_template(templates.index))
