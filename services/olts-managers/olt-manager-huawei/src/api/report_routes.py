from io import BytesIO
from typing import Optional

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from ..core.validators import validate_olt_id, validate_port
from ..schemas.report import route_report as route_report_schema
from ..services import olt_service

router = APIRouter(prefix="/api/v1", tags=["Reports"])


@router.post("/olts/{olt_id}/reports/route")
def generate_route_report(
    olt_id: int, request: route_report_schema.RouteReportRequest
):
    validate_olt_id(olt_id)

    report_format = (request.format or "json").lower()
    if report_format not in {"json", "xlsx", "xml"}:
        raise HTTPException(status_code=400, detail="Formato invalido")

    port = _resolve_port(request)
    service = olt_service.get_route_report_service(
        olt_id, timeout=request.timeout, retries=request.retries
    )
    report = service.build_report(
        olt_id=olt_id,
        if_index=request.if_index,
        port=port,
        los_threshold=request.los_threshold,
    )

    if report_format == "xlsx":
        payload, filename = service.export_xlsx(report)
        return _file_response(payload, filename, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")

    if report_format == "xml":
        payload, filename = service.export_xml(report)
        return _file_response(payload, filename, "application/xml")

    return report


def _resolve_port(request: route_report_schema.RouteReportRequest) -> Optional[str]:
    if request.port:
        return validate_port(request.port)
    if request.slot is not None and request.pon is not None:
        port = f"{request.frame}/{request.slot}/{request.pon}"
        return validate_port(port)
    return None


def _file_response(payload: bytes, filename: str, media_type: str) -> StreamingResponse:
    headers = {"Content-Disposition": f'attachment; filename="{filename}"'}
    return StreamingResponse(BytesIO(payload), media_type=media_type, headers=headers)
