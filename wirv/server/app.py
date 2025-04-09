from flask import Blueprint, Flask

from wirv.server import controllers

app = Flask("wirv.server")


api = Blueprint("api", __name__, url_prefix="/api")
api.register_blueprint(controllers.health)

app.register_blueprint(api)
app.register_blueprint(controllers.index)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8080)
