from piccolo.columns import UUID, Float, Timestamptz, Varchar
from piccolo.table import Table


class RequestLog(Table, tablename="request_log"):
    id = UUID(primary_key=True)
    ip = Varchar(length=46, null=False)
    timestamp = Timestamptz(null=False)
    latitude = Float(null=False)
    longitude = Float(null=False)
    suspicious = Float(null=False)
