"""
Schema para requisição de alteração de sysname (hostname) da OLT.
"""

from pydantic import BaseModel, validator
import re


class SysnameRequest(BaseModel):
    """
    Requisição para alterar o sysname (nome do sistema) da OLT.

    Permite definir um nome amigável para a OLT que será usado
    como identificador principal no sistema.
    """

    sysname: str

    @validator('sysname')
    def validate_sysname(cls, v):
        """
        Valida o formato do sysname.

        Args:
            v: Valor do sysname

        Returns:
            Valor validado

        Raises:
            ValueError: Se formato inválido
        """
        if not v or not v.strip():
            raise ValueError('Sysname não pode estar vazio')

        v = v.strip()

        # Validar comprimento
        if len(v) < 1 or len(v) > 246:
            raise ValueError('Sysname deve ter entre 1 e 246 caracteres')

        # Validar formato: apenas alfanuméricos, hífen e underscore
        if not re.match(r'^[a-zA-Z0-9_-]+$', v):
            raise ValueError(
                'Sysname deve conter apenas letras, números, hífen e underscore'
            )

        # Não pode começar com hífen
        if v.startswith('-'):
            raise ValueError('Sysname não pode começar com hífen')

        # Não pode ser apenas números (pode causar confusão)
        if v.isdigit():
            raise ValueError('Sysname não pode ser apenas números')

        # Validar palavras reservadas da Huawei
        reserved_words = [
            'huawei', 'console', 'aux', 'vty', 'system', 'default',
            'config', 'interface', 'vlan', 'ip', 'snmp', 'trap'
        ]

        if v.lower() in reserved_words:
            raise ValueError(f'"{v}" é uma palavra reservada e não pode ser usada')

        return v

    class Config:
        """Configuração do schema."""
        schema_extra = {
            "example": {
                "sysname": "OLT_CENTRAL_RJ"
            }
        }