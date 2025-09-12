# -*- coding: utf-8 -*-
"""
Módulo de validação para os endpoints da API.
Contém validadores personalizados para parâmetros de entrada.
"""

from fastapi import HTTPException
from typing import Union
import re

def validate_olt_id(olt_id: int) -> int:
    """
    Valida o ID da OLT.
    
    Args:
        olt_id: ID da OLT a ser validado
        
    Returns:
        int: ID validado da OLT
        
    Raises:
        HTTPException: Se o ID for inválido
    """
    if olt_id is None:
        raise HTTPException(status_code=400, detail="ID da OLT é obrigatório")
    
    if not isinstance(olt_id, int):
        raise HTTPException(status_code=400, detail="ID da OLT deve ser um número inteiro")
    
    if olt_id <= 0:
        raise HTTPException(status_code=400, detail="ID da OLT deve ser um número positivo")
    
    if olt_id > 9999:  # Limite razoável para IDs de OLT
        raise HTTPException(status_code=400, detail="ID da OLT deve ser menor ou igual a 9999")
    
    return olt_id

def validate_port(port: str) -> str:
    """
    Valida o formato da porta PON (frame/slot/port).
    
    Args:
        port: String da porta no formato "frame/slot/port"
        
    Returns:
        str: Porta validada
        
    Raises:
        HTTPException: Se o formato for inválido
    """
    if not port:
        raise HTTPException(status_code=400, detail="Porta é obrigatória")
    
    # Formato esperado: frame/slot/port (ex: 0/1/0)
    port_pattern = r"^\d+/\d+/\d+$"
    if not re.match(port_pattern, port):
        raise HTTPException(
            status_code=400, 
            detail="Formato de porta inválido. Use o formato 'frame/slot/port' (ex: 0/1/0)"
        )
    
    # Validar ranges básicos
    parts = port.split("/")
    frame, slot, port_num = map(int, parts)
    
    if frame < 0 or frame > 31:
        raise HTTPException(status_code=400, detail="Frame deve estar entre 0 e 31")
    
    if slot < 0 or slot > 31:
        raise HTTPException(status_code=400, detail="Slot deve estar entre 0 e 31")
    
    if port_num < 0 or port_num > 31:
        raise HTTPException(status_code=400, detail="Porta deve estar entre 0 e 31")
    
    return port

def validate_ont_id(ont_id: int) -> int:
    """
    Valida o ID da ONT.
    
    Args:
        ont_id: ID da ONT a ser validado
        
    Returns:
        int: ID validado da ONT
        
    Raises:
        HTTPException: Se o ID for inválido
    """
    if ont_id is None:
        raise HTTPException(status_code=400, detail="ID da ONT é obrigatório")
    
    if not isinstance(ont_id, int):
        raise HTTPException(status_code=400, detail="ID da ONT deve ser um número inteiro")
    
    if ont_id < 0:
        raise HTTPException(status_code=400, detail="ID da ONT deve ser um número não negativo")
    
    if ont_id > 127:  # Limite padrão GPON
        raise HTTPException(status_code=400, detail="ID da ONT deve ser menor ou igual a 127")
    
    return ont_id

def validate_frame_id(frame_id: int) -> int:
    """
    Valida o ID do frame.
    
    Args:
        frame_id: ID do frame a ser validado
        
    Returns:
        int: ID validado do frame
        
    Raises:
        HTTPException: Se o ID for inválido
    """
    if frame_id is None:
        raise HTTPException(status_code=400, detail="ID do frame é obrigatório")
    
    if not isinstance(frame_id, int):
        raise HTTPException(status_code=400, detail="ID do frame deve ser um número inteiro")
    
    if frame_id < 0 or frame_id > 31:
        raise HTTPException(status_code=400, detail="ID do frame deve estar entre 0 e 31")
    
    return frame_id

def validate_eth_port_id(eth_port_id: int) -> int:
    """
    Valida o ID da porta Ethernet.
    
    Args:
        eth_port_id: ID da porta Ethernet a ser validado
        
    Returns:
        int: ID validado da porta Ethernet
        
    Raises:
        HTTPException: Se o ID for inválido
    """
    if eth_port_id is None:
        raise HTTPException(status_code=400, detail="ID da porta Ethernet é obrigatório")
    
    if not isinstance(eth_port_id, int):
        raise HTTPException(status_code=400, detail="ID da porta Ethernet deve ser um número inteiro")
    
    if eth_port_id < 1 or eth_port_id > 8:  # Limite típico para portas ETH em ONTs
        raise HTTPException(status_code=400, detail="ID da porta Ethernet deve estar entre 1 e 8")
    
    return eth_port_id

def validate_serial_number(serial_number: str) -> str:
    """
    Valida o número de série da ONT.
    
    Args:
        serial_number: Número de série a ser validado
        
    Returns:
        str: Número de série validado
        
    Raises:
        HTTPException: Se o formato for inválido
    """
    if not serial_number:
        raise HTTPException(status_code=400, detail="Número de série é obrigatório")
    
    if not isinstance(serial_number, str):
        raise HTTPException(status_code=400, detail="Número de série deve ser uma string")
    
    # Remove espaços em branco
    serial_number = serial_number.strip()
    
    # Formato básico: 4 caracteres ASCII + 8 dígitos hexadecimais
    # Exemplo: HWTC12345678 ou similar
    if len(serial_number) < 8 or len(serial_number) > 16:
        raise HTTPException(
            status_code=400, 
            detail="Número de série deve ter entre 8 e 16 caracteres"
        )
    
    # Verificar se contém apenas caracteres alfanuméricos
    if not serial_number.isalnum():
        raise HTTPException(
            status_code=400, 
            detail="Número de série deve conter apenas caracteres alfanuméricos"
        )
    
    return serial_number.upper()  # Padronizar em maiúsculas