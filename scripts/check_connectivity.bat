@echo off
echo ========================================
echo   RJChronos - Verificacao de Conectividade
echo ========================================
echo.

echo [1] Verificando IP local...
ipconfig | findstr "IPv4"
echo.

echo [2] Testando GenieACS CWMP (TR-069)...
curl -s -m 5 "http://192.168.7.119:7547" >nul 2>&1
if %errorlevel% == 0 (
    echo ✅ GenieACS CWMP acessivel na porta 7547
) else (
    echo ❌ GenieACS CWMP nao acessivel
)
echo.

echo [3] Testando GenieACS UI...
curl -s -m 5 "http://192.168.7.119:3000" >nul 2>&1
if %errorlevel% == 0 (
    echo ✅ GenieACS UI acessivel na porta 3000
) else (
    echo ❌ GenieACS UI nao acessivel
)
echo.

echo [4] Testando RJChronos Frontend...
curl -s -m 5 "http://192.168.7.119:8081" >nul 2>&1
if %errorlevel% == 0 (
    echo ✅ RJChronos Frontend acessivel na porta 8081
) else (
    echo ❌ RJChronos Frontend nao acessivel
)
echo.

echo [5] Verificando containers Docker...
docker-compose ps
echo.

echo ========================================
echo Para provisionar seu roteador:
echo ========================================
echo 1. Configure ACS URL: http://192.168.7.119:7547
echo 2. Acesse GenieACS UI: http://192.168.7.119:3000
echo 3. Monitore no RJChronos: http://192.168.7.119:8081
echo.
echo Consulte PROVISIONING_GUIDE.md para detalhes completos
echo ========================================

pause