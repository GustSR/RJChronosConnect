"""Pacote de transformadores GenieACS, organizado por dominio."""

from .utils import safe_get_nested, determine_device_status, extract_manufacturer_model
from .cpe import transform_genieacs_to_cpe
from .onu import transform_genieacs_to_onu
from .faults import transform_genieacs_fault_to_alert
from .metrics import calculate_dashboard_metrics
from .wifi import (
    extract_wifi_config_from_device,
    create_wifi_parameter_updates,
    format_wifi_configs_for_frontend,
)

__all__ = [
    "safe_get_nested",
    "determine_device_status",
    "extract_manufacturer_model",
    "transform_genieacs_to_cpe",
    "transform_genieacs_to_onu",
    "transform_genieacs_fault_to_alert",
    "calculate_dashboard_metrics",
    "extract_wifi_config_from_device",
    "create_wifi_parameter_updates",
    "format_wifi_configs_for_frontend",
]
