# -*- coding: utf-8 -*-
"""
Módulo de Connection Pool para gerenciar conexões SSH reutilizáveis com OLTs.
Resolve o problema de criar uma nova conexão para cada comando.
"""

import threading
import time
from datetime import datetime, timedelta
from typing import Dict, Optional, List
from queue import Queue, Empty
from dataclasses import dataclass

from .connection_manager import ConnectionManager
from ..core.config import settings
from ..core.logging import get_logger

logger = get_logger(__name__)

@dataclass
class PooledConnection:
    """Representa uma conexão no pool com metadados."""
    connection: ConnectionManager
    created_at: datetime
    last_used: datetime
    in_use: bool = False
    is_alive: bool = True

class ConnectionPool:
    """Pool de conexões SSH para uma OLT específica."""
    
    def __init__(self, host: str, username: str, password: str, max_size: int = 3):
        """
        Inicializa o pool de conexões para uma OLT.
        
        Args:
            host: IP/hostname da OLT
            username: Usuário SSH
            password: Senha SSH
            max_size: Número máximo de conexões no pool
        """
        self.host = host
        self.username = username
        self.password = password
        self.max_size = max_size
        
        self._connections: List[PooledConnection] = []
        self._lock = threading.RLock()
        self._created_count = 0
        
        logger.info(f"Pool criado para OLT {host} (max_size: {max_size})")

    def get_connection(self, timeout: int = 30) -> Optional[ConnectionManager]:
        """
        Obtém uma conexão do pool ou cria uma nova se necessário.
        
        Args:
            timeout: Timeout em segundos para obter conexão
            
        Returns:
            ConnectionManager: Conexão pronta para uso
        """
        start_time = time.time()
        
        while time.time() - start_time < timeout:
            with self._lock:
                # Procura por conexão disponível e viva
                for pooled_conn in self._connections:
                    if not pooled_conn.in_use and pooled_conn.is_alive:
                        if self._test_connection(pooled_conn.connection):
                            pooled_conn.in_use = True
                            pooled_conn.last_used = datetime.now()
                            logger.debug(f"Reutilizando conexão existente para {self.host}")
                            return pooled_conn.connection
                        else:
                            # Conexão morta, marca para remoção
                            pooled_conn.is_alive = False
                            logger.warning(f"Conexão morta detectada para {self.host}")
                
                # Remove conexões mortas
                self._connections = [conn for conn in self._connections if conn.is_alive]
                
                # Cria nova conexão se houver espaço no pool
                if len(self._connections) < self.max_size:
                    new_conn = self._create_connection()
                    if new_conn:
                        pooled_conn = PooledConnection(
                            connection=new_conn,
                            created_at=datetime.now(),
                            last_used=datetime.now(),
                            in_use=True,
                            is_alive=True
                        )
                        self._connections.append(pooled_conn)
                        self._created_count += 1
                        logger.info(f"Nova conexão criada para {self.host} (total: {len(self._connections)})")
                        return new_conn
            
            # Se não conseguiu conexão, espera um pouco
            time.sleep(0.1)
        
        logger.error(f"Timeout ao obter conexão para {self.host}")
        return None

    def return_connection(self, connection: ConnectionManager):
        """
        Retorna uma conexão para o pool.
        
        Args:
            connection: Conexão a ser retornada
        """
        with self._lock:
            for pooled_conn in self._connections:
                if pooled_conn.connection == connection:
                    pooled_conn.in_use = False
                    logger.debug(f"Conexão retornada ao pool para {self.host}")
                    return
            
            logger.warning(f"Tentativa de retornar conexão não encontrada no pool para {self.host}")

    def _create_connection(self) -> Optional[ConnectionManager]:
        """Cria uma nova conexão SSH."""
        try:
            conn = ConnectionManager(self.host, self.username, self.password)
            conn.connect()
            logger.debug(f"Conexão SSH criada com sucesso para {self.host}")
            return conn
        except Exception as e:
            logger.error(f"Falha ao criar conexão SSH para {self.host}: {e}")
            return None

    def _test_connection(self, connection: ConnectionManager) -> bool:
        """Testa se uma conexão está viva."""
        try:
            if not connection.connection or not connection.connection.is_alive():
                return False
            # Teste simples para verificar se a conexão responde
            connection.send_command("display clock", delay_factor=0.1)
            return True
        except Exception:
            return False

    def cleanup_idle_connections(self, max_idle_time: int = 300):
        """
        Remove conexões que estão idle há muito tempo.
        
        Args:
            max_idle_time: Tempo máximo em segundos para manter conexão idle
        """
        with self._lock:
            now = datetime.now()
            cutoff_time = now - timedelta(seconds=max_idle_time)
            
            connections_to_remove = []
            for pooled_conn in self._connections:
                if (not pooled_conn.in_use and 
                    pooled_conn.last_used < cutoff_time):
                    connections_to_remove.append(pooled_conn)
            
            for pooled_conn in connections_to_remove:
                try:
                    pooled_conn.connection.disconnect()
                    self._connections.remove(pooled_conn)
                    logger.info(f"Conexão idle removida para {self.host}")
                except Exception as e:
                    logger.warning(f"Erro ao remover conexão idle para {self.host}: {e}")

    def close_all(self):
        """Fecha todas as conexões do pool."""
        with self._lock:
            for pooled_conn in self._connections:
                try:
                    pooled_conn.connection.disconnect()
                except Exception as e:
                    logger.warning(f"Erro ao fechar conexão para {self.host}: {e}")
            
            self._connections.clear()
            logger.info(f"Todas as conexões fechadas para {self.host}")

    def get_stats(self) -> Dict:
        """Retorna estatísticas do pool."""
        with self._lock:
            total = len(self._connections)
            in_use = sum(1 for conn in self._connections if conn.in_use)
            alive = sum(1 for conn in self._connections if conn.is_alive)
            
            return {
                'host': self.host,
                'total_connections': total,
                'in_use': in_use,
                'available': total - in_use,
                'alive': alive,
                'created_total': self._created_count,
                'max_size': self.max_size
            }


class ConnectionPoolManager:
    """Gerenciador global de pools de conexão por OLT."""
    
    def __init__(self):
        self._pools: Dict[str, ConnectionPool] = {}
        self._lock = threading.RLock()
        self._cleanup_thread = None
        self._running = True
        
        # Inicia thread de limpeza automática
        self._start_cleanup_thread()
        
        logger.info("ConnectionPoolManager inicializado")

    def get_connection(self, host: str, username: str, password: str) -> Optional[ConnectionManager]:
        """
        Obtém uma conexão do pool apropriado.
        
        Args:
            host: IP/hostname da OLT
            username: Usuário SSH
            password: Senha SSH
            
        Returns:
            ConnectionManager: Conexão pronta para uso
        """
        pool_key = f"{host}:{username}"
        
        with self._lock:
            if pool_key not in self._pools:
                self._pools[pool_key] = ConnectionPool(
                    host=host, 
                    username=username, 
                    password=password,
                    max_size=settings.ssh_pool_max_size
                )
        
        return self._pools[pool_key].get_connection()

    def return_connection(self, host: str, username: str, connection: ConnectionManager):
        """
        Retorna uma conexão para o pool apropriado.
        
        Args:
            host: IP/hostname da OLT
            username: Usuário SSH
            connection: Conexão a ser retornada
        """
        pool_key = f"{host}:{username}"
        
        with self._lock:
            if pool_key in self._pools:
                self._pools[pool_key].return_connection(connection)

    def _start_cleanup_thread(self):
        """Inicia thread para limpeza automática de conexões idle."""
        def cleanup_worker():
            while self._running:
                try:
                    time.sleep(60)  # Executa limpeza a cada minuto
                    with self._lock:
                        for pool in self._pools.values():
                            pool.cleanup_idle_connections(settings.ssh_pool_idle_timeout)
                except Exception as e:
                    logger.error(f"Erro na limpeza automática de pools: {e}")
        
        self._cleanup_thread = threading.Thread(target=cleanup_worker, daemon=True)
        self._cleanup_thread.start()
        logger.info("Thread de limpeza automática iniciada")

    def close_all(self):
        """Fecha todos os pools e conexões."""
        self._running = False
        
        with self._lock:
            for pool in self._pools.values():
                pool.close_all()
            self._pools.clear()
        
        logger.info("Todos os connection pools fechados")

    def get_all_stats(self) -> List[Dict]:
        """Retorna estatísticas de todos os pools."""
        with self._lock:
            return [pool.get_stats() for pool in self._pools.values()]


# Instância global do pool manager
pool_manager = ConnectionPoolManager()