from piccolo.apps.migrations.auto.migration_manager import MigrationManager

from wirv.server.database.tables import RequestLog

ID = "2025-04-12T01:18:35:949382"
VERSION = "1.24.2"
DESCRIPTION = ""


async def forwards():
    manager = MigrationManager(migration_id=ID, app_name="", description=DESCRIPTION)

    async def run():
        await RequestLog.create_index([RequestLog.timestamp], if_not_exists=True).run()

    manager.add_raw(run)

    async def run_backwards():
        await RequestLog.drop_index([RequestLog.timestamp], if_exists=True).run()

    manager.add_raw_backwards(run_backwards)

    return manager
