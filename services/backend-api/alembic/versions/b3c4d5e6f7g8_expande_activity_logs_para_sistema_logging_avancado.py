"""Expande activity_logs para sistema de logging avançado

Revision ID: b3c4d5e6f7g8
Revises: a2b3c4d5e6f7
Create Date: 2025-09-20 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'b3c4d5e6f7g8'
down_revision: Union[str, None] = 'a2b3c4d5e6f7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Expandir activity_logs para suportar sistema de logging avançado

    # Adicionar campos de identificação únicos
    op.add_column('activity_logs', sa.Column('trace_id', postgresql.UUID(as_uuid=True), nullable=True))
    op.add_column('activity_logs', sa.Column('message_id', postgresql.UUID(as_uuid=True), nullable=True))

    # Adicionar metadados do serviço
    op.add_column('activity_logs', sa.Column('service_name', sa.String(100), nullable=True))
    op.add_column('activity_logs', sa.Column('service_version', sa.String(20), nullable=True))

    # Expandir informações do evento
    op.add_column('activity_logs', sa.Column('event_type', sa.String(100), nullable=True))
    op.add_column('activity_logs', sa.Column('category', sa.String(50), nullable=True))
    op.add_column('activity_logs', sa.Column('message', sa.Text(), nullable=True))

    # Dados do usuário com cuidado LGPD
    op.add_column('activity_logs', sa.Column('session_id', sa.String(100), nullable=True))
    op.add_column('activity_logs', sa.Column('customer_id_ref', sa.BigInteger(), nullable=True))

    # Compliance e auditoria
    op.add_column('activity_logs', sa.Column('compliance_tags', postgresql.JSONB(astext_type=sa.Text()), nullable=True))
    op.add_column('activity_logs', sa.Column('legal_basis', sa.String(100), nullable=True))
    op.add_column('activity_logs', sa.Column('retention_period', sa.String(50), nullable=True))
    op.add_column('activity_logs', sa.Column('classification', sa.String(20), nullable=True))

    # Timestamps expandidos
    op.add_column('activity_logs', sa.Column('event_timestamp', sa.DateTime(timezone=True), nullable=True))
    op.add_column('activity_logs', sa.Column('processed_at', sa.DateTime(timezone=True), nullable=True))

    # Metadados de processamento
    op.add_column('activity_logs', sa.Column('routing_key', sa.String(200), nullable=True))
    op.add_column('activity_logs', sa.Column('queue_name', sa.String(100), nullable=True))
    op.add_column('activity_logs', sa.Column('destination', sa.String(20), nullable=True))

    # Criar índices para performance
    op.create_index('idx_activity_logs_trace_id', 'activity_logs', ['trace_id'])
    op.create_index('idx_activity_logs_service_name', 'activity_logs', ['service_name'])
    op.create_index('idx_activity_logs_event_type', 'activity_logs', ['event_type'])
    op.create_index('idx_activity_logs_customer_id_ref', 'activity_logs', ['customer_id_ref'])
    op.create_index('idx_activity_logs_event_timestamp', 'activity_logs', ['event_timestamp'])
    op.create_index('idx_activity_logs_classification', 'activity_logs', ['classification'])

    # Criar tabela auxiliar para compliance
    op.create_table('log_compliance_rules',
        sa.Column('id', sa.BigInteger(), nullable=False),
        sa.Column('event_type', sa.String(100), nullable=False),
        sa.Column('compliance_type', sa.String(50), nullable=False),
        sa.Column('retention_period', sa.String(50), nullable=False),
        sa.Column('legal_basis', sa.String(100), nullable=True),
        sa.Column('pii_fields', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )

    # Índices para tabela de compliance
    op.create_index('idx_log_compliance_rules_event_type', 'log_compliance_rules', ['event_type'])
    op.create_index('idx_log_compliance_rules_compliance_type', 'log_compliance_rules', ['compliance_type'])
    op.create_index('idx_log_compliance_rules_active', 'log_compliance_rules', ['is_active'])


def downgrade() -> None:
    # Remover índices
    op.drop_index('idx_log_compliance_rules_active')
    op.drop_index('idx_log_compliance_rules_compliance_type')
    op.drop_index('idx_log_compliance_rules_event_type')

    # Remover tabela de compliance
    op.drop_table('log_compliance_rules')

    # Remover índices de activity_logs
    op.drop_index('idx_activity_logs_classification')
    op.drop_index('idx_activity_logs_event_timestamp')
    op.drop_index('idx_activity_logs_customer_id_ref')
    op.drop_index('idx_activity_logs_event_type')
    op.drop_index('idx_activity_logs_service_name')
    op.drop_index('idx_activity_logs_trace_id')

    # Remover colunas expandidas
    op.drop_column('activity_logs', 'destination')
    op.drop_column('activity_logs', 'queue_name')
    op.drop_column('activity_logs', 'routing_key')
    op.drop_column('activity_logs', 'processed_at')
    op.drop_column('activity_logs', 'event_timestamp')
    op.drop_column('activity_logs', 'classification')
    op.drop_column('activity_logs', 'retention_period')
    op.drop_column('activity_logs', 'legal_basis')
    op.drop_column('activity_logs', 'compliance_tags')
    op.drop_column('activity_logs', 'customer_id_ref')
    op.drop_column('activity_logs', 'session_id')
    op.drop_column('activity_logs', 'message')
    op.drop_column('activity_logs', 'category')
    op.drop_column('activity_logs', 'event_type')
    op.drop_column('activity_logs', 'service_version')
    op.drop_column('activity_logs', 'service_name')
    op.drop_column('activity_logs', 'message_id')
    op.drop_column('activity_logs', 'trace_id')