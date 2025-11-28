"""Adicionar criptografia de credenciais OLT

Revision ID: c4d5e6f7g8h9
Revises: b3c4d5e6f7g8
Create Date: 2025-09-21 00:00:00.000000

"""
from typing import Sequence, Union
import os
import logging

from alembic import op
import sqlalchemy as sa
from sqlalchemy import text

# revision identifiers, used by Alembic.
revision: str = 'c4d5e6f7g8h9'
down_revision: Union[str, None] = 'b3c4d5e6f7g8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

logger = logging.getLogger(__name__)


def upgrade() -> None:
    """Migração para adicionar criptografia de credenciais OLT."""

    # 1. Adicionar novas colunas criptografadas
    op.add_column('olts', sa.Column('_ssh_password_encrypted', sa.String(), nullable=True))
    op.add_column('olts', sa.Column('_snmp_community_encrypted', sa.String(), nullable=True))

    # 2. Migrar dados existentes (apenas se tiver chave de criptografia configurada)
    encrypt_key = os.getenv('CREDENTIAL_ENCRYPTION_KEY')
    if encrypt_key:
        logger.info("Chave de criptografia encontrada. Migrando credenciais existentes...")

        # Importar o sistema de criptografia
        try:
            # Importação inline para evitar problemas de dependência durante migração
            import sys
            sys.path.append('/app')
            from app.core.crypto import encrypt_credential

            # Migrar senhas SSH existentes
            connection = op.get_bind()

            # Buscar OLTs com credenciais em texto plano
            result = connection.execute(text("""
                SELECT id, ssh_password
                FROM olts
                WHERE ssh_password IS NOT NULL
                AND ssh_password != ''
                AND _ssh_password_encrypted IS NULL
            """))

            for row in result:
                olt_id, ssh_password = row
                try:
                    encrypted_password = encrypt_credential(ssh_password)
                    connection.execute(text("""
                        UPDATE olts
                        SET _ssh_password_encrypted = :encrypted_password
                        WHERE id = :olt_id
                    """), {"encrypted_password": encrypted_password, "olt_id": olt_id})

                except Exception as e:
                    logger.error(f"Erro ao criptografar senha da OLT {olt_id}: {e}")

            # Definir community SNMP padrão criptografada para OLTs sem community
            default_community_encrypted = encrypt_credential("public")
            connection.execute(text("""
                UPDATE olts
                SET _snmp_community_encrypted = :encrypted_community
                WHERE _snmp_community_encrypted IS NULL
            """), {"encrypted_community": default_community_encrypted})

            logger.info("Migração de credenciais concluída com sucesso")

        except ImportError as e:
            logger.warning(f"Não foi possível importar sistema de criptografia: {e}")
            logger.warning("Credenciais existentes não foram migradas. Execute a migração manual após configurar o ambiente.")
        except Exception as e:
            logger.error(f"Erro durante migração de credenciais: {e}")
            raise
    else:
        logger.warning("CREDENTIAL_ENCRYPTION_KEY não configurada. Credenciais não foram migradas.")
        logger.warning("Configure a chave e execute a migração manual das credenciais.")

    # 3. Após um período de transição, as colunas antigas podem ser removidas
    # Por segurança, mantemos as colunas antigas por enquanto para rollback
    # op.drop_column('olts', 'ssh_password')  # Descomentar em migração futura


def downgrade() -> None:
    """Rollback da migração de criptografia."""

    # Remover colunas criptografadas
    op.drop_column('olts', '_snmp_community_encrypted')
    op.drop_column('olts', '_ssh_password_encrypted')

    logger.info("Rollback da criptografia concluído. Credenciais voltaram ao formato original.")