import asyncio
from pathlib import Path

import piccolo.apps.migrations.commands.forwards
from flask import Blueprint, Flask, send_from_directory

from wirv.server import controllers

STATIC_DIR = Path(__file__).parent / "static"


def factory() -> Flask:
    # run migrations
    asyncio.run(piccolo.apps.migrations.commands.forwards.forwards("all"))

    app = Flask("wirv.server", static_folder=STATIC_DIR)

    api = Blueprint("api", __name__, url_prefix="/api")
    api.register_blueprint(controllers.health)
    api.register_blueprint(controllers.request_log)

    app.register_blueprint(api)
    app.register_blueprint(controllers.index)
    return app


if __name__ == "__main__":
    factory().run(host="0.0.0.0", port=8080)
