from piccolo.columns import Float, Integer, Timestamptz, Varchar
from piccolo.table import Table


class RequestLog(Table, tablename="request_log"):
    id = Integer(primary_key=True, autoincrement=True)
    ip = Varchar(length=46, null=False)
    timestamp = Timestamptz(null=False)
    latitude = Float(null=False)
    longitude = Float(null=False)
    suspicious = Float(null=False)
