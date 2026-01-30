# API Endpoints Backend (Atual)

> Mapa rapido dos endpoints expostos pelo `services/backend-api`.
> Base publica via Edge: `http://localhost:8081/api`

## Auth
- `POST /api/auth/token`
- `GET /api/auth/me`

## Devices
- `GET /api/devices/cpes`
- `GET /api/devices/onus`
- `GET /api/devices/olts`
- `GET /api/devices/olts/{olt_id}/stats`

## Monitoring
- `GET /api/alerts`
- `GET /api/dashboard/metrics`

## Provisioning
- `GET /api/provisioning/pending`
- `POST /api/provisioning/{onu_id}/authorize`
- `DELETE /api/provisioning/{onu_id}/reject`
- `GET /api/provisioning/clients`
- `GET /api/provisioning/clients/{onu_id}`
- `PUT /api/provisioning/clients/{onu_id}`

## WiFi (GenieACS)
- `GET /api/wifi/configs`
- `GET /api/wifi/configs/{device_id}`
- `PUT /api/wifi/configs/{device_id}`
- `POST /api/wifi/refresh/{device_id}`

## Activity History
- `GET /api/activity-history/`
- `GET /api/activity-history/{activity_id}`

## OLT Management
- `GET /api/olts/`
- `GET /api/olts/unconfigured`
- `GET /api/olts/{olt_id}`
- `POST /api/olts/`
- `PUT /api/olts/{olt_id}`
- `DELETE /api/olts/{olt_id}`
- `POST /api/olts/discover`
- `POST /api/olts/discover/range`
- `POST /api/olts/{olt_id}/setup`
- `POST /api/olts/setup/batch`
- `GET /api/olts/{olt_id}/logs`
- `GET /api/olts/logs/recent`
- `GET /api/olts/{olt_id}/live`
- `GET /api/olts/stats/overview`

## Internal (OLT Credentials)
- `GET /internal/olts/{olt_id}/credentials`

