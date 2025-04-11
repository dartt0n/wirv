from piccolo.apps.migrations.auto.migration_manager import MigrationManager
from piccolo.table import Table

from wirv.server.database.tables import RequestLog

ID = "2025-04-12T00:18:02:838603"
VERSION = "1.24.2"
DESCRIPTION = ""


class SQL(Table): ...


async def forwards():
    manager = MigrationManager(migration_id=ID, app_name="", description=DESCRIPTION)

    async def run():
        await RequestLog.create_table(if_not_exists=True).run()
        await RequestLog.create_index([RequestLog.ip], if_not_exists=True).run()

    manager.add_raw(run)

    async def run_backwards():
        await RequestLog.drop_index([RequestLog.ip], if_exists=True).run()
        await SQL.raw("DROP TABLE IF EXISTS request_log").run()

    manager.add_raw_backwards(run_backwards)

    return manager
