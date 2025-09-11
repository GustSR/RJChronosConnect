import logging
import sys

# Configuração básica do logger
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - [%(levelname)s] - %(name)s - %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)

def get_logger(name: str) -> logging.Logger:
    """Retorna uma instância de logger com o nome especificado."""
    return logging.getLogger(name)
