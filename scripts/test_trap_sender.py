#!/usr/bin/env python
"""
Script para enviar traps SNMP falsos para o olt-manager-huawei para fins de teste.

Este script pode simular dois tipos de eventos:
1. Mudança de estado de uma ONT (online/offline).
2. Um alarme óptico em uma ONT.

Requer a biblioteca pysnmp: pip install pysnmp
"""

import argparse
from pysnmp.hlapi import (
    sendNotification,
    SnmpEngine,
    UdpTransportTarget,
    ContextData,
    NotificationType,
    ObjectIdentity
)

# --- OIDs (devem espelhar os do listener.py) ---
SNMP_TRAP_OID_VARBIND = '1.3.6.1.6.3.1.1.4.1.0'

# Trap de Mudança de Estado
TRAP_OID_ONT_STATE_CHANGE = '1.3.6.1.4.1.2011.6.128.1.1.2.0.6'
VARBIND_OID_IF_INDEX = '1.3.6.1.2.1.2.2.1.1'
VARBIND_OID_ONT_RUN_STATUS = '1.3.6.1.4.1.2011.6.128.1.1.2.43.1.9'
VARBIND_OID_ONT_SERIAL = '1.3.6.1.4.1.2011.6.128.1.1.2.43.1.1'

# Trap de Alarme Óptico
TRAP_OID_ONT_ALARM = '1.3.6.1.4.1.2011.6.128.1.1.2.0.5'
VARBIND_OID_ALARM_ID = '1.3.6.1.4.1.2011.6.128.1.1.2.51.1.1.1'
VARBIND_OID_ALARM_VALUE = '1.3.6.1.4.1.2011.6.128.1.1.2.51.1.1.2'
VARBIND_OID_ALARM_STATUS = '1.3.6.1.4.1.2011.6.128.1.1.2.51.1.1.3'

def send_trap(target_host, target_port, community, var_binds):
    """Função genérica para construir e enviar um trap SNMPv2c."""
    snmp_engine = SnmpEngine()
    error_indication, error_status, error_index, _ = next(
        sendNotification(
            snmp_engine,
            ContextData(),
            UdpTransportTarget((target_host, target_port)),
            NotificationType(
                ObjectIdentity(TRAP_OID_ONT_STATE_CHANGE)
            ).addVarBinds(*var_binds)
        )
    )

    if error_indication:
        print(f"[Erro ao Enviar Trap] {error_indication}")
    elif error_status:
        print(f"[Erro ao Enviar Trap] {error_status.prettyPrint()} at {error_index and var_binds[int(error_index) - 1][0] or '??'}")
    else:
        print(f"--> Trap enviado com sucesso para {target_host}:{target_port}")

def main():
    parser = argparse.ArgumentParser(description="Envia traps SNMP falsos para o OLT Manager.")
    parser.add_argument("trap_type", choices=['state', 'alarm'], help="O tipo de trap a ser enviado.")
    parser.add_argument("--host", default="127.0.0.1", help="Host do listener de traps.")
    parser.add_argument("--port", type=int, default=162, help="Porta do listener de traps.")
    parser.add_argument("--community", default="public", help="Comunidade SNMP.")

    args = parser.parse_args()

    # ifIndex de exemplo para 0/1/0
    # 4194304000 + (1 * 8192) + (0 * 256) = 4194312192
    example_ifindex = 4194312192

    if args.trap_type == 'state':
        print("Construindo trap de MUDANÇA DE ESTADO (ONT offline)...")
        var_binds = [
            (SNMP_TRAP_OID_VARBIND, ObjectIdentity(TRAP_OID_ONT_STATE_CHANGE)),
            (VARBIND_OID_IF_INDEX, example_ifindex),
            (VARBIND_OID_ONT_RUN_STATUS, 2), # 2 = offline
            (VARBIND_OID_ONT_SERIAL, "HWTC12345678")
        ]
    elif args.trap_type == 'alarm':
        print("Construindo trap de ALARME ÓPTICO (Rx Power Low)...")
        var_binds = [
            (SNMP_TRAP_OID_VARBIND, ObjectIdentity(TRAP_OID_ONT_ALARM)),
            (VARBIND_OID_IF_INDEX, example_ifindex),
            (VARBIND_OID_ALARM_ID, 3), # Exemplo: 3 = Rx Power Low
            (VARBIND_OID_ALARM_VALUE, -30), # Exemplo: -30 dBm
            (VARBIND_OID_ALARM_STATUS, 1) # 1 = active
        ]
    
    send_trap(args.host, args.port, args.community, var_binds)

if __name__ == "__main__":
    main()
