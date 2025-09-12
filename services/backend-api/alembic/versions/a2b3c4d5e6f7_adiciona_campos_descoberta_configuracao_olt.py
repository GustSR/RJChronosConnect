"""Adiciona campos de descoberta e configuração para OLTs

Revision ID: a2b3c4d5e6f7
Revises: eb80c7938475
Create Date: 2025-09-12 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'a2b3c4d5e6f7'
down_revision: Union[str, None] = 'eb80c7938475'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Adiciona novos campos à tabela olts
    op.add_column('olts', sa.Column('ssh_username', sa.String(), nullable=True))
    op.add_column('olts', sa.Column('ssh_password', sa.String(), nullable=True))
    op.add_column('olts', sa.Column('ssh_port', sa.Integer(), nullable=False, server_default='22'))
    op.add_column('olts', sa.Column('setup_status', sa.String(), nullable=False, server_default='pending'))
    op.add_column('olts', sa.Column('is_configured', sa.Boolean(), nullable=False, server_default='false'))
    op.add_column('olts', sa.Column('discovered_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('olts', sa.Column('last_sync_at', sa.DateTime(timezone=True), nullable=True))

    # Cria tabela olt_setup_logs
    op.create_table('olt_setup_logs',
        sa.Column('id', sa.BigInteger(), nullable=False),
        sa.Column('action', sa.String(), nullable=False),
        sa.Column('status', sa.String(), nullable=False),
        sa.Column('message', sa.Text(), nullable=True),
        sa.Column('details', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('started_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('duration_seconds', sa.BigInteger(), nullable=True),
        sa.Column('olt_id', sa.BigInteger(), nullable=False),
        sa.Column('executed_by_user_id', sa.BigInteger(), nullable=True),
        sa.ForeignKeyConstraint(['olt_id'], ['olts.id'], ),
        sa.ForeignKeyConstraint(['executed_by_user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )


def downgrade() -> None:
    # Remove tabela olt_setup_logs
    op.drop_table('olt_setup_logs')
    
    # Remove colunas adicionadas à tabela olts
    op.drop_column('olts', 'last_sync_at')
    op.drop_column('olts', 'discovered_at')
    op.drop_column('olts', 'is_configured')
    op.drop_column('olts', 'setup_status')
    op.drop_column('olts', 'ssh_port')
    op.drop_column('olts', 'ssh_password')
    op.drop_column('olts', 'ssh_username')