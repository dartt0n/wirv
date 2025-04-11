import ipaddress
from datetime import datetime
from typing import Self
from uuid import UUID

import flask
import msgspec
from flask import Blueprint, Response
from loguru import logger

from wirv.server.database.tables import RequestLog
from wirv.server.responses import ERROR, INVALID, JSON, NOT_FOUND

bp = Blueprint("request_log", __name__, url_prefix="/request_log")


class CreateRequestLogReq(msgspec.Struct):
    ip: str
    timestamp: datetime
    latitude: float
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
    id: str


@bp.post("/")
def create_request_log() -> Response:
    try:
        dto = msgspec.json.decode(flask.request.get_data(), type=CreateRequestLogReq)
        dto.validate()

        data = (
            RequestLog.insert(
                RequestLog(
                    ip=dto.ip,
                    timestamp=dto.timestamp,
                    latitude=dto.latitude,
                    longitude=dto.longitude,
                    suspicious=dto.suspicious,
                )
            )
            .returning(RequestLog.id)
            .run_sync()
        )
        if len(data) == 0 or "id" not in data[0] or not isinstance(data[0]["id"], UUID):
            return ERROR("failed to save log")
        id = data[0]["id"]

        return JSON(CreateRequestLogRes(id=id.hex))
    except msgspec.ValidationError as e:
        logger.debug(f"client send invalid request: {e}")
        return INVALID(e)
    except Exception as e:
        logger.error(f"save log request failed with error: {e}")
        return ERROR()


class GetRequestLogRes(msgspec.Struct):
    id: str
    ip: str
    timestamp: datetime
    latitude: float
    longitude: float
    suspicious: float

    @classmethod
    def from_db(cls, log: RequestLog) -> Self:
        return cls(
            id=log.id.hex,
            ip=log.ip,
            timestamp=log.timestamp,
            latitude=log.latitude,
            longitude=log.longitude,
            suspicious=log.suspicious,
        )


@bp.get("/<id>")
def get_log_by_id(id: str) -> Response:
    try:
        log_id = UUID(id)

        log = RequestLog.objects().where(RequestLog.id == log_id).first().run_sync()
        if log is None:
            return NOT_FOUND("no such log")

        return JSON(GetRequestLogRes.from_db(log))
    except ValueError as e:
        logger.debug(f"client send invalid request: {e}")
        return INVALID(msgspec.ValidationError("id must be UUID"))
    except Exception as e:
        logger.error(f"get log request failed with error: {e}")
        return ERROR()


class GetAllRequestLogRes(msgspec.Struct):
    logs: list[GetRequestLogRes]


@bp.get("/")
def get_all_logs() -> Response:
    try:
        logs = RequestLog.objects().order_by(RequestLog.timestamp, ascending=True).run_sync()
        return JSON(GetAllRequestLogRes([GetRequestLogRes.from_db(log) for log in logs]))
    except Exception as e:
        logger.error(f"get log request failed with error: {e}")
        return ERROR()


class RangeRequestLogRes(msgspec.Struct):
    logs: list[GetRequestLogRes]


@bp.get("/")
def range_query_logs(*_) -> Response:
    try:
        raw_from = flask.request.args.get("from", None, type=str)
        if raw_from is None:
            return INVALID(msgspec.ValidationError("missing 'from' parameter"))
        raw_to = flask.request.args.get("to", None, type=str)
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
