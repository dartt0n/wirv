import os

from piccolo.conf.apps import AppRegistry
from piccolo.engine.postgres import PostgresEngine

DB = PostgresEngine(
    config={
        "host": os.environ["PG_HOSTNAME"],
        "user": os.environ["PG_USERNAME"],
        "password": os.environ["PG_PASSWORD"],
        "database": os.environ["PG_DATABASE"],
    }
)


APP_REGISTRY = AppRegistry(apps=["wirv.server.database.piccolo_app"])
