import msgspec
from flask import Response


class JSON(Response):
    def __init__(self, value: msgspec.Struct) -> None:
        super().__init__(
            msgspec.json.encode(value),
            status=200,
            mimetype="application/json",
        )


class HTML(Response):
    def __init__(self, value: str) -> None:
        super().__init__(
            value,
            status=200,
            mimetype="text/html",
        )


class INVALID(Response):
    def __init__(self, error: msgspec.ValidationError) -> None:
        super().__init__(
            msgspec.json.encode({"error": str(error)}),
            status=400,
            mimetype="application/json",
        )


class ERROR(Response):
    def __init__(self, msg: str | None = None) -> None:
        super().__init__(
            msgspec.json.encode({"error": "internal server error", "message": msg}),
            status=500,
            mimetype="application/json",
        )


class NOT_FOUND(Response):
    def __init__(self, msg: str) -> None:
        super().__init__(
            msgspec.json.encode({"error": "not found", "message": msg}),
            status=404,
            mimetype="application/json",
        )
