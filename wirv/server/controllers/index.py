from flask import Blueprint, Request, Response

bp = Blueprint("health", __name__, url_prefix="/")


@bp.get("/")
def health(request: Request) -> Response:
    return Response("<p>website would be here</p>", status=200)
