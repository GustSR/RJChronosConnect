import re
from typing import List, Dict, Any

from ..base_command import OLTCommand
from ..olt.get_board_cli import GetBoardCliCommand
from .get_ont_autofind_cli import GetOntAutofindCliCommand


class GetAllAutofindOntsCommand(OLTCommand):
    """
    Comando para obter todas as ONUs em autofind de uma OLT inteira.
    Orquestra a busca em todos os slots/portas PON GPON disponíveis.
    """

    def __init__(self):
        pass

    def execute(self, connection_manager, olt_version: str) -> List[Dict[str, Any]]:
        """
        Executa a busca de ONUs em autofind em toda a OLT.
        
        1. Lista todas as placas instaladas
        2. Filtra apenas as placas GPON
        3. Para cada placa GPON, verifica todas as portas (0-15)
        4. Agrega todos os resultados
        """
        all_autofind_onts = []
        
        # Primeiro, obtém informações de todas as placas instaladas
        board_command = GetBoardCliCommand(frame_id=0)
        boards = board_command.execute(connection_manager, olt_version)
        
        # Filtra apenas placas GPON
        gpon_boards = self._filter_gpon_boards(boards)
        
        # Para cada placa GPON, verifica todas as portas
        for board in gpon_boards:
            slot_id = board.get('board_id')
            if slot_id is None:
                continue
                
            # Para cada porta da placa GPON (normalmente 0-15)
            for port in range(16):  # Portas 0 a 15
                port_str = f"0/{slot_id}/{port}"
                
                try:
                    # Executa autofind para esta porta específica
                    autofind_command = GetOntAutofindCliCommand(port=port_str)
                    port_autofind_onts = autofind_command.execute(connection_manager, olt_version)
                    
                    # Adiciona os resultados à lista geral
                    all_autofind_onts.extend(port_autofind_onts)
                    
                except Exception as e:
                    # Log do erro mas continua com as outras portas
                    # Pode ser normal não ter ONUs em algumas portas
                    continue
        
        return all_autofind_onts

    def _filter_gpon_boards(self, boards: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Filtra apenas as placas que são do tipo GPON.
        Identifica pelas designações comuns: GPBD, GPFD, GPUF, etc.
        """
        gpon_boards = []
        gpon_types = ['GPBD', 'GPFD', 'GPUF', 'GPON', 'EPFD', 'EPBD']
        
        for board in boards:
            board_type = board.get('board_type', '').upper()
            board_name = board.get('board_name', '').upper()
            
            # Verifica se é uma placa GPON pelos tipos conhecidos
            if any(gpon_type in board_type or gpon_type in board_name 
                   for gpon_type in gpon_types):
                gpon_boards.append(board)
        
        return gpon_boards
