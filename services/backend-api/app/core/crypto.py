"""
Utilitário de Criptografia para Credenciais
Fornece criptografia AES-256 para proteger credenciais SSH/SNMP no banco de dados.
"""

import os
import base64
import logging
from typing import Optional
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC

logger = logging.getLogger(__name__)


class CredentialCrypto:
    """
    Classe para criptografia/descriptografia de credenciais.

    Usa AES-256 via Fernet para proteger senhas SSH e communities SNMP.
    A chave é derivada de uma variável de ambiente usando PBKDF2.
    """

    def __init__(self):
        """Inicializa o sistema de criptografia com chave derivada do ambiente."""
        self._cipher = None
        self._initialize_cipher()

    def _initialize_cipher(self):
        """Inicializa o cipher Fernet com chave derivada."""
        try:
            # Obtém a chave mestra do ambiente
            master_key = os.getenv('CREDENTIAL_ENCRYPTION_KEY')
            if not master_key:
                raise ValueError("CREDENTIAL_ENCRYPTION_KEY não definida no ambiente")

            # Deriva uma chave Fernet usando PBKDF2
            salt = b'rjchronos_olt_credentials_salt_2024'  # Salt fixo para consistência
            kdf = PBKDF2HMAC(
                algorithm=hashes.SHA256(),
                length=32,
                salt=salt,
                iterations=100000,  # 100k iterações para segurança
            )

            key = base64.urlsafe_b64encode(kdf.derive(master_key.encode()))
            self._cipher = Fernet(key)

            logger.info("Sistema de criptografia de credenciais inicializado com sucesso")

        except Exception as e:
            logger.error(f"Erro ao inicializar criptografia: {e}")
            raise

    def encrypt(self, plaintext: str) -> str:
        """
        Criptografa uma string.

        Args:
            plaintext: Texto em claro para criptografar

        Returns:
            String criptografada em base64

        Raises:
            ValueError: Se o plaintext for vazio ou None
            Exception: Erros de criptografia
        """
        if not plaintext:
            raise ValueError("Texto para criptografia não pode ser vazio")

        try:
            encrypted_bytes = self._cipher.encrypt(plaintext.encode('utf-8'))
            return encrypted_bytes.decode('utf-8')
        except Exception as e:
            logger.error(f"Erro ao criptografar dados: {e}")
            raise

    def decrypt(self, ciphertext: str) -> str:
        """
        Descriptografa uma string.

        Args:
            ciphertext: String criptografada em base64

        Returns:
            Texto em claro

        Raises:
            ValueError: Se o ciphertext for vazio ou None
            Exception: Erros de descriptografia
        """
        if not ciphertext:
            raise ValueError("Texto criptografado não pode ser vazio")

        try:
            decrypted_bytes = self._cipher.decrypt(ciphertext.encode('utf-8'))
            return decrypted_bytes.decode('utf-8')
        except Exception as e:
            logger.error(f"Erro ao descriptografar dados: {e}")
            raise

    def is_encrypted(self, text: str) -> bool:
        """
        Verifica se um texto está criptografado.

        Args:
            text: Texto para verificar

        Returns:
            True se o texto parecer estar criptografado
        """
        if not text:
            return False

        try:
            # Tenta descriptografar para verificar se é um texto criptografado válido
            self.decrypt(text)
            return True
        except:
            return False


# Instância global do sistema de criptografia
_crypto_instance: Optional[CredentialCrypto] = None


def get_crypto() -> CredentialCrypto:
    """
    Retorna a instância global do sistema de criptografia.

    Returns:
        Instância configurada do CredentialCrypto
    """
    global _crypto_instance
    if _crypto_instance is None:
        _crypto_instance = CredentialCrypto()
    return _crypto_instance


def encrypt_credential(plaintext: str) -> str:
    """
    Função de conveniência para criptografar credenciais.

    Args:
        plaintext: Credencial em texto claro

    Returns:
        Credencial criptografada
    """
    return get_crypto().encrypt(plaintext)


def decrypt_credential(ciphertext: str) -> str:
    """
    Função de conveniência para descriptografar credenciais.

    Args:
        ciphertext: Credencial criptografada

    Returns:
        Credencial em texto claro
    """
    return get_crypto().decrypt(ciphertext)


def is_credential_encrypted(text: str) -> bool:
    """
    Função de conveniência para verificar se uma credencial está criptografada.

    Args:
        text: Texto para verificar

    Returns:
        True se estiver criptografado
    """
    return get_crypto().is_encrypted(text)