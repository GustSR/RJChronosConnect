#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script de teste para sistema de traps SNMP.
Simula diferentes tipos de eventos para verificar se o sistema está funcionando.
"""

import socket
import struct
import time
from pysnmp.entity import engine, config
from pysnmp.carrier.asyncio.dgram import udp
from pysnmp.entity.rfc3413 import ntforg
from pysnmp.proto.api import v2c
from pysnmp.proto.rfc1902 import Integer, OctetString, ObjectName
from datetime import datetime

class TrapTester:
    """Classe para testar envio de traps SNMP simulados."""
    
    def __init__(self, target_host='localhost', target_port=1162, community='public'):
        """
        Inicializa o testador de traps.
        
        Args:
            target_host: Host onde está rodando o trap listener
            target_port: Porta do trap listener (padrão 1162 para teste)
            community: Comunidade SNMP
        """
        self.target_host = target_host
        self.target_port = target_port
        self.community = community
        
        # Inicializa engine SNMP
        self.snmp_engine = engine.SnmpEngine()
        
        # Configura transporte
        config.addTransport(
            self.snmp_engine,
            udp.domainName,
            udp.UdpTransport().openClientMode()
        )
        
        # Configura target
        config.addTargetAddr(
            self.snmp_engine,
            'test-target',
            udp.domainName,
            (self.target_host, self.target_port),
            self.community
        )
        
        config.addV1System(self.snmp_engine, 'test-area', self.community)
    
    def send_dying_gasp_trap(self, olt_ip='192.168.1.100', ont_serial='ALCL12345678', port='0/1/0'):
        """
        Simula trap de dying gasp (perda de energia da ONT).
        
        Args:
            olt_ip: IP da OLT simulada
            ont_serial: Serial da ONT
            port: Porta onde está a ONT
        """
        print(f"🔴 Enviando DYING GASP trap - ONT {ont_serial} em {port}")
        
        # OIDs específicos para dying gasp
        var_binds = [
            # Trap OID
            (ObjectName('1.3.6.1.6.3.1.1.4.1.0'), 
             ObjectName('1.3.6.1.4.1.2011.6.128.1.1.2.0.22')),  # Dying gasp trap
            
            # ifIndex (simulated)
            (ObjectName('1.3.6.1.2.1.2.2.1.1'), Integer(4194305)),
            
            # ONT Serial Number
            (ObjectName('1.3.6.1.4.1.2011.6.128.1.1.2.43.1.1'), 
             OctetString(ont_serial)),
            
            # ONT ID
            (ObjectName('1.3.6.1.4.1.2011.6.128.1.1.2.43.1.7'), Integer(1)),
            
            # Dying gasp time
            (ObjectName('1.3.6.1.4.1.2011.6.128.1.1.2.43.1.20'), 
             OctetString(datetime.now().strftime('%Y-%m-%d %H:%M:%S'))),
            
            # Last down cause (2 = dying gasp)
            (ObjectName('1.3.6.1.4.1.2011.6.128.1.1.2.43.1.21'), Integer(2))
        ]
        
        self._send_trap(var_binds, olt_ip)
        time.sleep(1)
    
    def send_port_down_trap(self, olt_ip='192.168.1.100', port='0/1/0'):
        """
        Simula trap de porta PON down (possível rompimento de fibra).
        
        Args:
            olt_ip: IP da OLT simulada
            port: Porta PON que ficou down
        """
        print(f"🔴 Enviando PORT DOWN trap - Porta {port}")
        
        var_binds = [
            # Trap OID
            (ObjectName('1.3.6.1.6.3.1.1.4.1.0'), 
             ObjectName('1.3.6.1.4.1.2011.6.128.1.1.2.0.7')),  # Port down trap
            
            # ifIndex
            (ObjectName('1.3.6.1.2.1.2.2.1.1'), Integer(67108865)),
            
            # Port Index
            (ObjectName('1.3.6.1.4.1.2011.6.128.1.1.2.21.1.1'), Integer(4194305)),
            
            # Optical Power (crítico)
            (ObjectName('1.3.6.1.4.1.2011.6.128.1.1.2.53.1.6'), Integer(-32000))  # -32.0 dBm
        ]
        
        self._send_trap(var_binds, olt_ip)
        time.sleep(1)
    
    def send_ont_state_change_trap(self, olt_ip='192.168.1.100', ont_serial='ALCL12345678', 
                                  status=2, port='0/1/0'):
        """
        Simula trap de mudança de estado da ONT.
        
        Args:
            olt_ip: IP da OLT simulada
            ont_serial: Serial da ONT
            status: Status (1=online, 2=offline)
            port: Porta da ONT
        """
        status_text = "OFFLINE" if status == 2 else "ONLINE"
        print(f"🟡 Enviando ONT STATE CHANGE trap - {ont_serial} agora {status_text}")
        
        var_binds = [
            # Trap OID
            (ObjectName('1.3.6.1.6.3.1.1.4.1.0'), 
             ObjectName('1.3.6.1.4.1.2011.6.128.1.1.2.0.6')),  # State change trap
            
            # ifIndex
            (ObjectName('1.3.6.1.2.1.2.2.1.1'), Integer(4194305)),
            
            # ONT Run Status
            (ObjectName('1.3.6.1.4.1.2011.6.128.1.1.2.43.1.9'), Integer(status)),
            
            # ONT Serial Number
            (ObjectName('1.3.6.1.4.1.2011.6.128.1.1.2.43.1.1'), 
             OctetString(ont_serial))
        ]
        
        self._send_trap(var_binds, olt_ip)
        time.sleep(1)
    
    def send_los_alarm_trap(self, olt_ip='192.168.1.100', ont_serial='ALCL87654321', 
                           alarm_status=1, port='0/1/0'):
        """
        Simula trap de alarme LOS (Loss of Signal).
        
        Args:
            olt_ip: IP da OLT simulada
            ont_serial: Serial da ONT
            alarm_status: Status do alarme (1=active, 2=cleared)
            port: Porta da ONT
        """
        status_text = "ATIVO" if alarm_status == 1 else "LIMPO"
        print(f"🟠 Enviando LOS ALARM trap - {ont_serial} alarme {status_text}")
        
        var_binds = [
            # Trap OID
            (ObjectName('1.3.6.1.6.3.1.1.4.1.0'), 
             ObjectName('1.3.6.1.4.1.2011.6.128.1.1.2.0.9')),  # LOS alarm trap
            
            # ifIndex
            (ObjectName('1.3.6.1.2.1.2.2.1.1'), Integer(4194305)),
            
            # Alarm Status
            (ObjectName('1.3.6.1.4.1.2011.6.128.1.1.2.51.1.1.3'), Integer(alarm_status))
        ]
        
        self._send_trap(var_binds, olt_ip)
        time.sleep(1)
    
    def _send_trap(self, var_binds, source_ip='192.168.1.100'):
        """
        Envia trap SNMP com os varbinds especificados.
        
        Args:
            var_binds: Lista de (OID, valor) para o trap
            source_ip: IP de origem simulado
        """
        # Cria notificação
        ntfOrg = ntforg.NotificationOriginator()
        
        try:
            # Envia trap
            ntfOrg.sendVarBinds(
                self.snmp_engine,
                'test-target',
                None,  # contextEngineId
                '',    # contextName
                var_binds
            )
            print(f"✅ Trap enviado com sucesso para {self.target_host}:{self.target_port}")
            
        except Exception as e:
            print(f"❌ Erro ao enviar trap: {e}")
    
    def run_test_sequence(self):
        """
        Executa uma sequência completa de testes simulando cenários reais.
        """
        print("🚀 Iniciando sequência de testes de traps SNMP")
        print(f"📡 Target: {self.target_host}:{self.target_port}")
        print("=" * 60)
        
        # Cenário 1: Dying Gasp (Perda de energia)
        print("\n📋 CENÁRIO 1: Simulando perda de energia (Dying Gasp)")
        self.send_dying_gasp_trap(ont_serial='ALCL12345001', port='0/1/0')
        
        time.sleep(2)
        
        # Cenário 2: Rompimento de fibra (Port Down)
        print("\n📋 CENÁRIO 2: Simulando rompimento de fibra (Port Down)")
        self.send_port_down_trap(port='0/1/0')
        
        time.sleep(2)
        
        # Cenário 3: ONTs ficando offline gradualmente
        print("\n📋 CENÁRIO 3: Simulando ONTs ficando offline (State Change)")
        onts_afetadas = ['ALCL12345002', 'ALCL12345003', 'ALCL12345004']
        for ont in onts_afetadas:
            self.send_ont_state_change_trap(ont_serial=ont, status=2, port='0/1/0')
            time.sleep(0.5)  # Intervalo menor para simular gradual
        
        time.sleep(2)
        
        # Cenário 4: Alarme LOS
        print("\n📋 CENÁRIO 4: Simulando alarme de perda de sinal (LOS)")
        self.send_los_alarm_trap(ont_serial='ALCL12345005', alarm_status=1, port='0/2/0')
        
        time.sleep(2)
        
        # Cenário 5: Recuperação (Port Up)
        print("\n📋 CENÁRIO 5: Simulando recuperação da porta (Port Up)")
        self.send_trap_port_up(port='0/1/0')
        
        print("\n✅ Sequência de testes concluída!")
        print("🔍 Verifique os logs do OLT Manager para ver se os eventos foram processados")
    
    def send_trap_port_up(self, olt_ip='192.168.1.100', port='0/1/0'):
        """Simula trap de porta PON up (recuperação)."""
        print(f"🟢 Enviando PORT UP trap - Porta {port} recuperada")
        
        var_binds = [
            # Trap OID
            (ObjectName('1.3.6.1.6.3.1.1.4.1.0'), 
             ObjectName('1.3.6.1.4.1.2011.6.128.1.1.2.0.8')),  # Port up trap
            
            # ifIndex
            (ObjectName('1.3.6.1.2.1.2.2.1.1'), Integer(67108865)),
            
            # Port Index
            (ObjectName('1.3.6.1.4.1.2011.6.128.1.1.2.21.1.1'), Integer(4194305))
        ]
        
        self._send_trap(var_binds, olt_ip)
        time.sleep(1)


def main():
    """Função principal para executar os testes."""
    print("🧪 Sistema de Teste de Traps SNMP - OLT Manager")
    print("=" * 50)
    
    # Configuração do teste
    target_host = input("Host do trap listener [localhost]: ").strip() or 'localhost'
    target_port = input("Porta do trap listener [1162]: ").strip() or '1162'
    community = input("Comunidade SNMP [public]: ").strip() or 'public'
    
    try:
        target_port = int(target_port)
    except ValueError:
        print("❌ Porta inválida, usando 1162")
        target_port = 1162
    
    print(f"\n🔧 Configuração:")
    print(f"   Host: {target_host}")
    print(f"   Porta: {target_port}")
    print(f"   Comunidade: {community}")
    print(f"   Data/Hora: {datetime.now()}")
    
    # Criar tester e executar
    tester = TrapTester(target_host, target_port, community)
    
    print("\n⚠️  ATENÇÃO: Certifique-se de que o OLT Manager esteja rodando!")
    input("Pressione ENTER para começar os testes...")
    
    try:
        tester.run_test_sequence()
    except KeyboardInterrupt:
        print("\n🛑 Testes interrompidos pelo usuário")
    except Exception as e:
        print(f"\n❌ Erro durante os testes: {e}")
    
    print("\n🏁 Fim dos testes")


if __name__ == "__main__":
    main()
