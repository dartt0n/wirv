import ipaddress
from datetime import datetime
from typing import Self

import msgspec
from flask import Blueprint, Request, Response
from loguru import logger

from wirv.server.database.tables import RequestLog
from wirv.server.responses import ERROR, INVALID, JSON, NOT_FOUND

bp = Blueprint("request_log", __name__, url_prefix="/request_log")


class CreateRequestLogReq(msgspec.Struct):
    ip: str
    timestamp: datetime
    lantitude: float
    longitude: float
    suspicious: float

    def validate(self):
        try:
            _ = ipaddress.ip_address(self.ip)
        except ValueError as e:
            raise msgspec.ValidationError("invalid ip address") from e

        if self.timestamp.tzinfo is None:
            raise msgspec.ValidationError("timestamp must have timezone")

        if self.suspicious < 0 or self.suspicious > 1:
            raise msgspec.ValidationError("suspicious must be in range [0, 1]")


class CreateRequestLogRes(msgspec.Struct):
    id: int


@bp.post("/")
def create_request_log(request: Request) -> Response:
    try:
        dto = msgspec.json.decode(request.get_data(), type=CreateRequestLogReq)
        dto.validate()

        RequestLog.insert(
            RequestLog(
                ip=dto.ip,
                timestamp=dto.timestamp,
                latitude=dto.lantitude,
                longitude=dto.longitude,
                suspicious=dto.suspicious,
            )
        ).run_sync()

        return JSON(CreateRequestLogRes(id=0))
    except msgspec.ValidationError as e:
        logger.debug(f"client send invalid request: {e}")
        return INVALID(e)
    except Exception as e:
        logger.error(f"save log request failed with error: {e}")
        return ERROR()


class GetRequestLogRes(msgspec.Struct):
    id: int
    ip: str
    timestamp: datetime
    latitude: float
    longitude: float
    suspicious: float

    @classmethod
    def from_db(cls, log: RequestLog) -> Self:
        return cls(
            id=log.id,
            ip=log.ip,
            timestamp=log.timestamp,
            latitude=log.latitude,
            longitude=log.longitude,
            suspicious=log.suspicious,
        )


@bp.get("/<id>")
def get_log_by_id(request: Request) -> Response:
    try:
        if request.view_args is None:
            return INVALID(msgspec.ValidationError("missing path parameter"))
        log_id = int(request.view_args["id"])

        log = RequestLog.objects().where(RequestLog.id == log_id).first().run_sync()
        if log is None:
            return NOT_FOUND("no such log")

        return JSON(GetRequestLogRes.from_db(log))
    except ValueError as e:
        logger.debug(f"client send invalid request: {e}")
        return INVALID(msgspec.ValidationError("id must be integer"))
    except Exception as e:
        logger.error(f"get log request failed with error: {e}")
        return ERROR()


class RangeRequestLogRes(msgspec.Struct):
    logs: list[GetRequestLogRes]


@bp.get("/")
def range_query_logs(request: Request) -> Response:
    try:
        raw_from = request.args.get("from", None, type=str)
        if raw_from is None:
            return INVALID(msgspec.ValidationError("missing 'from' parameter"))
        raw_to = request.args.get("to", None, type=str)
        if raw_to is None:
            return INVALID(msgspec.ValidationError("missing 'to' parameter"))

        from_ = datetime.fromisoformat(raw_from)
        to = datetime.fromisoformat(raw_to)

        logs = (
            RequestLog.objects()
            .where(
                RequestLog.timestamp >= from_,
                RequestLog.timestamp <= to,
            )
            .order_by(RequestLog.timestamp, ascending=True)
            .run_sync()
        )

        return JSON(RangeRequestLogRes([GetRequestLogRes.from_db(log) for log in logs]))
    except ValueError as e:
        logger.debug(f"client send invalid request: {e}")
        return INVALID(msgspec.ValidationError("expected datetime in isoformat"))
    except Exception as e:
        logger.error(f"get log request failed with error: {e}")
        return ERROR()
