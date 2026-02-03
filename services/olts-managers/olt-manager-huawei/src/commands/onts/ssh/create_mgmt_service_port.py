from typing import Dict, Any, Optional
import time
from ....core.logging import get_logger
from ....services.connection_manager import ConnectionManager

logger = get_logger(__name__)

class CreateMgmtServicePortCommand:
    def __init__(
        self,
        port: str,
        ont_id: int,
        vlan: int = 200,
        gemport: int = 2,
        service_port_id: Optional[int] = None,
    ):
        self.port = port
        self.ont_id = ont_id
        self.vlan = vlan
        self.gemport = gemport
        self.service_port_id = service_port_id

    def execute(self, connection: ConnectionManager, olt_version: str) -> Dict[str, Any]:
        """
        Cria a service-port de gerência para a ONU.
        
        IMPORTANTE: 
        - Este comando deve ser executado no modo CONFIG raiz.
        - O comando service-port é INTERATIVO na OLT Huawei, pede confirmação.
        """
        logger.info(
            f"Criando service-port de gerência na ONU {self.ont_id} "
            f"(Porta {self.port}, VLAN {self.vlan})..."
        )

        try:
            # Garante que estamos no modo config e NÃO dentro de interface
            connection.send_command("config")
            
            # Monta o comando
            tokens = ["service-port"]
            if self.service_port_id:
                tokens.append(str(self.service_port_id))
            tokens += [
                "vlan",
                str(self.vlan),
                "gpon",
                str(self.port),
                "ont",
                str(self.ont_id),
                "gemport",
                str(self.gemport),
                "multi-service",
                "user-vlan",
                str(self.vlan),
                "tag-transform",
                "translate",
            ]
            cmd = " ".join(tokens)
            
            # O comando service-port é INTERATIVO na Huawei
            # Após enviar, a OLT pergunta: { <cr>|bundle<K>|inbound<K>|rx-cttr<K> }:
            # Precisamos enviar ENTER para confirmar (<cr>)
            channel = connection.connection
            
            # Envia o comando
            channel.write_channel(f"{cmd}\n")
            time.sleep(1)
            
            # Lê a resposta parcial
            output = channel.read_channel()
            
            # Se a OLT está pedindo mais parâmetros, envia ENTER para confirmar
            if "{" in output or "<cr>" in output.lower():
                logger.debug("Comando service-port pede confirmação, enviando ENTER...")
                channel.write_channel("\n")
                time.sleep(1)
                output += channel.read_channel()
            
            output_lower = output.lower()
            
            # Verifica se já existe
            if "already exists" in output_lower:
                logger.info("Service-port de gerência já existe.")
                return {"status": "success", "message": "Already exists"}

            # Verifica erros
            if any(marker in output_lower for marker in ("failure", "error", "unknown command", "too many parameters", "incomplete command")):
                logger.error(f"Falha ao criar service-port: {output}")
                return {"status": "error", "message": output}

            logger.info("Service-port criada com sucesso.")
            return {"status": "success", "message": "Created", "details": output}

        except Exception as e:
            logger.error(f"Erro na execução da service-port: {e}")
            raise e

