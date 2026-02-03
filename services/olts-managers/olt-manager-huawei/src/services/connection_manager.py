import re
from netmiko import ConnectHandler
from ..core.config import settings
from ..core.logging import get_logger
from netmiko import ConnectHandler

logger = get_logger(__name__)



def _resolve_device_type(protocol: str) -> str:
    # Usamos huawei_telnet para Telnet
    if protocol == "telnet":
        return "huawei_telnet"
    return "huawei"


def _prompt_core(raw_prompt: str) -> str:
    """Extrai o núcleo do prompt (nome do dispositivo sem contexto)."""
    if not raw_prompt:
        return ""
    prompt = raw_prompt.strip()
    # Remove caracteres iniciais < [ 
    if prompt.startswith("<") or prompt.startswith("["):
        prompt = prompt[1:]
    # Remove caracteres finais > ] #
    prompt = re.sub(r"[>\]#]+$", "", prompt).strip()
    # Remove contexto entre parênteses ou após hífen de contexto
    # Ex: "001-OLT-PRINCIPAL-gpon-0/5" -> "001-OLT-PRINCIPAL"
    # Ex: "001-OLT-PRINCIPAL(config)" -> "001-OLT-PRINCIPAL"
    if "(" in prompt:
        prompt = prompt.split("(", 1)[0].rstrip()
    # Remove sufixos de contexto como -gpon-0/5
    if "-gpon-" in prompt:
        prompt = prompt.split("-gpon-", 1)[0]
    if "-if-" in prompt:
        prompt = prompt.split("-if-", 1)[0]
    prompt = re.sub(r"[>\]#]+$", "", prompt).strip()
    return prompt


def _prompt_regex(base_prompt: str) -> str:
    """
    Gera um regex flexível para detectar o prompt da OLT.
    Aceita prompts em diversos contextos (config, interface, etc).
    """
    core = _prompt_core(base_prompt)
    escaped = re.escape(core or base_prompt.strip())
    # Se começa com número, permite zeros à esquerda opcionais
    if core and core[0].isdigit():
        escaped = rf"0*{escaped}"
    # Regex flexível: aceita o core seguido de qualquer contexto, terminando em > ] ou #
    # Exemplos que devem casar:
    #   <001-OLT-PRINCIPAL>
    #   [001-OLT-PRINCIPAL]
    #   [001-OLT-PRINCIPAL-gpon-0/5]#
    #   001-OLT-PRINCIPAL(config)#
    return rf"(?:<|\[)?{escaped}[^\n]*?(?:>|\]|#)\s*$"


# Comandos que mudam de contexto e não precisam de detecção de prompt precisa
NAVIGATION_COMMANDS = frozenset({
    "config", "system-view", "return", "quit", "exit",
    "enable", "disable", "end"
})


def _is_navigation_command(cmd: str) -> bool:
    """Verifica se é um comando de navegação de contexto."""
    cmd_lower = cmd.strip().lower()
    # Comando exato de navegação
    if cmd_lower in NAVIGATION_COMMANDS:
        return True
    # Comando que começa com 'interface'
    if cmd_lower.startswith("interface "):
        return True
    return False


class ConnectionManager:
    def __init__(self, host, username, password, protocol: str = "ssh", port: int = None, device_type: str = None):
        """
        Initializes the ConnectionManager with dynamic credentials for a specific OLT.

        Args:
            host (str): The IP address or hostname of the OLT.
            username (str): The SSH username.
            password (str): The SSH password.
            protocol (str): Protocolo de acesso (ssh ou telnet).
            port (int): Porta de acesso.
            device_type (str): Tipo de dispositivo Netmiko (opcional).
        """
        self.connection = None
        resolved_protocol = (protocol or "ssh").lower()
        resolved_device_type = device_type or _resolve_device_type(resolved_protocol)
        resolved_port = port or (23 if resolved_protocol == "telnet" else 22)
        self.protocol = resolved_protocol
        self.device_params = {
            'device_type': resolved_device_type,
            'host': host,
            'username': username,
            'password': password,
            'port': resolved_port,
            # Configurações para evitar concatenação de comandos em OLTs Huawei
            'global_delay_factor': 10,      # Delay entre caracteres (aumentado para evitar concat)
            'fast_cli': False,              # Desativa modo rápido
            'global_cmd_verify': False,     # Desativa verificação de eco
        }
        self.prompt = None
        if settings.netmiko_session_log:
            self.device_params['session_log'] = f'netmiko_session_{host}.log'
            self.device_params['session_log_record_writes'] = True

    def _is_user_view(self, prompt: str | None) -> bool:
        if not prompt:
            return False
        return prompt.rstrip().endswith(">")

    def _ensure_enable_mode(self):
        if not self.connection or not self.connection.is_alive():
            return
        try:
            prompt = self.connection.find_prompt()
        except Exception:
            prompt = None

        if not self._is_user_view(prompt):
            return

        logger.info("Entrando em modo enable...")
        output = self.connection.send_command_timing(
            "enable",
            strip_prompt=False,
            strip_command=False,
            cmd_verify=False,
        )
        if re.search(r"password", output, re.IGNORECASE):
            secret = self.device_params.get("password")
            if secret:
                output += self.connection.send_command_timing(
                    secret,
                    strip_prompt=False,
                    strip_command=False,
                    cmd_verify=False,
                )

        try:
            self.prompt = self.connection.find_prompt()
        except Exception:
            self.prompt = None

        if self._is_user_view(self.prompt):
            logger.warning("Nao foi possivel entrar em modo enable; prompt permanece em user-view.")

    def connect(self):
        """Establishes an SSH connection to the OLT."""
        if self.connection and self.connection.is_alive():
            logger.debug(f"Conexão com {self.device_params['host']} já estabelecida.")
            return
        
        try:
            logger.info(f"Conectando a {self.device_params['host']} ({self.device_params['device_type']})...")
            
            if self.device_params.get('device_type') == 'huawei_telnet':
               # Para Telnet, removemos o device_type do dicionario se fosse custom class
               # mas como estamos usando ConnectHandler padrao (que espera device_type), mantemos.
               # Porem, ConnectHandler nao aceita disable_paging no init em versoes antigas,
               # entao confiamos no global_delay_factor e fast_cli=False do __init__.
               self.connection = ConnectHandler(**self.device_params)
            else:
                self.connection = ConnectHandler(**self.device_params)
                
            logger.info(f"Conexão com {self.device_params['host']} bem-sucedida.")
            try:
                self.prompt = self.connection.find_prompt()
            except Exception:
                self.prompt = None
            
            # IMPORTANTE: Precisa entrar em enable para comandos de configuração
            self._ensure_enable_mode()
            
            # (Removido scroll manual pois HuaweiTelnetSafe já faz isso no session_preparation)
        except Exception as e:
            logger.error(f"Falha ao conectar a {self.device_params['host']}: {e}")
            self.connection = None
            raise

    def disconnect(self):
        """Disconnects from the OLT."""
        if self.connection:
            self.connection.disconnect()
            logger.info(f"Conexão com {self.device_params['host']} desconectada.")
            self.connection = None

    def send_command(self, command_string, **kwargs):
        """
        Sends a command to the OLT and returns the output.
        
        Para comandos de navegação (config, return, interface, etc), usa timing-based
        para evitar problemas de detecção de prompt.
        """
        if not self.connection or not self.connection.is_alive():
            raise ConnectionError(f"Não conectado à OLT {self.device_params['host']}.")

        cmd = command_string.strip()
        cmd_lower = cmd.lower()
        
        # Garante enable mode antes de config
        if cmd_lower in {"config", "system-view"}:
            self._ensure_enable_mode()

        # Para comandos de navegação, usa timing-based (mais confiável)
        if _is_navigation_command(cmd):
            return self._send_navigation_command(cmd, **kwargs)

        # Para comandos normais, tenta usar expect_string
        try:
            if self.protocol == "telnet":
                # Telnet usa nossa implementacao segura que lida com paginacao (-- More --)
                # que o ConnectHandler padrao falha em tratar se screen-length 0 nao for enviado.
                return self.send_command_safe(command_string)
            output = self.connection.send_command(command_string, **kwargs)
            return output
        except Exception as e:
            logger.error(f"Falha ao enviar comando '{command_string}' para {self.device_params['host']}: {e}")
            raise

    def _send_navigation_command(self, command_string: str, **kwargs) -> str:
        """
        Envia comandos de navegação usando timing-based reads.
        Mais confiável para comandos que mudam o contexto (config, return, interface).
        """
        import time
        
        try:
            # Limpa buffer antes
            if hasattr(self.connection, 'clear_buffer'):
                self.connection.clear_buffer()
            
            timing_kwargs = {
                "strip_prompt": False,
                "strip_command": False,
                "cmd_verify": False,
                "delay_factor": 2,  # Aumentado para dar tempo da OLT processar
            }
            timing_kwargs.update(kwargs)
            
            output = self.connection.send_command_timing(command_string, **timing_kwargs)
            
            # IMPORTANTE: Aguarda um pouco para a OLT processar e atualizar o prompt
            time.sleep(0.5)
            
            # Limpa buffer residual para não afetar o próximo comando
            if hasattr(self.connection, 'clear_buffer'):
                self.connection.clear_buffer()
            
            # Tenta atualizar o prompt após navegação
            try:
                self.prompt = self.connection.find_prompt()
            except Exception:
                pass  # Ignora erro na atualização de prompt
            
            return output
        except Exception as e:
            logger.error(f"Falha ao enviar comando de navegação '{command_string}': {e}")
            raise

    def send_command_timing(self, command_string, **kwargs):
        """Sends a command using timing-based reads (useful for Telnet)."""
        if not self.connection or not self.connection.is_alive():
            raise ConnectionError(f"Não conectado à OLT {self.device_params['host']}.")

        timing_kwargs = {
            "strip_prompt": False,
            "strip_command": False,
            "cmd_verify": False,
        }
        timing_kwargs.update(kwargs)
        return self.connection.send_command_timing(command_string, **timing_kwargs)

    def send_command_safe(
        self,
        command_string: str,
        timeout: float = 10.0,
        auto_confirm: bool = True,
        expect_prompt: bool = True,
    ) -> str:
        """
        Envia um comando com controle total do buffer usando write_channel.
        
        Este método resolve o problema de comandos concatenados:
        1. Limpa o buffer ANTES de enviar
        2. Envia o comando via write_channel (controle direto)
        3. Aguarda e lê a resposta
        4. Detecta prompts interativos e responde automaticamente
        5. Limpa o buffer DEPOIS de receber resposta
        
        Args:
            command_string: Comando a enviar
            timeout: Timeout em segundos para aguardar resposta
            auto_confirm: Se True, responde automaticamente a prompts interativos
            expect_prompt: Se True, aguarda o prompt aparecer antes de retornar
            
        Returns:
            Output do comando
        """
        import time
        
        if not self.connection or not self.connection.is_alive():
            raise ConnectionError(f"Não conectado à OLT {self.device_params['host']}.")
        
        try:
            # 1. Limpa buffer residual
            if hasattr(self.connection, 'clear_buffer'):
                self.connection.clear_buffer()
            time.sleep(0.1)
            
            # 2. Envia comando via write_channel (controle direto)
            self.connection.write_channel(command_string + "\n")
            logger.debug(f"Comando enviado: {command_string}")
            
            # 3. Aguarda resposta
            time.sleep(1.0)  # Delay de 1s para OLT processar
            
            # 4. Lê a resposta
            output = ""
            start_time = time.time()
            
            while (time.time() - start_time) < timeout:
                chunk = self.connection.read_channel()
                if chunk:
                    output += chunk
                    
                    # Detecta prompts interativos e responde
                    if auto_confirm:
                        # Prompt de confirmação com opções { <cr>|... }:
                        if "{ <cr>" in output or "{<cr>" in output:
                            logger.debug("Detectado prompt interativo, enviando ENTER...")
                            time.sleep(0.3)
                            self.connection.write_channel("\n")
                            time.sleep(0.5)
                            continue
                        
                        # Prompt (y/n)
                        if "(y/n)" in output.lower():
                            logger.debug("Detectado confirmação (y/n), enviando 'y'...")
                            time.sleep(0.3)
                            self.connection.write_channel("y\n")
                            time.sleep(0.5)
                            continue
                        
                        # Prompt ---- More ----
                        if "---- More" in output:
                            logger.debug("Detectado paginação, enviando espaço...")
                            time.sleep(0.1)
                            self.connection.write_channel(" ")
                            continue
                    
                    # Verifica se chegou no prompt (comando terminou)
                    if expect_prompt:
                        # Procura por prompt típico Huawei
                        if re.search(r'(?:<|[\[\(]).*?(?:>|[\]\)#])\s*$', output):
                            break
                else:
                    time.sleep(0.2)
            
            # 5. Limpa buffer residual
            time.sleep(0.2)
            if hasattr(self.connection, 'clear_buffer'):
                self.connection.clear_buffer()
            
            return output
            
        except Exception as e:
            logger.error(f"Falha em send_command_safe '{command_string}': {e}")
            raise

    def get_password(self) -> str | None:
        """Returns the login password used for the current connection."""
        return self.device_params.get("password")

    # Context manager support for automatic connection handling
    def __enter__(self):
        self.connect()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.disconnect()
