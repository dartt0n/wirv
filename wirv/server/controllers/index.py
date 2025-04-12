from flask import Blueprint, Response, make_response, render_template

bp = Blueprint("index", __name__)


@bp.get("/")
def index() -> Response:
    return make_response(render_template("index.html"))
