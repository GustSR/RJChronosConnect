"""add vlan fields to olt

Revision ID: f1e2d3c4b5a6
Revises: c4d5e6f7g8h9
Create Date: 2026-02-07 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f1e2d3c4b5a6'
down_revision: Union[str, None] = 'e2f3a4b5c6d7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Adicionar mgmt_vlan com padrão 200
    op.add_column('olts', sa.Column('mgmt_vlan', sa.Integer(), nullable=False, server_default='200'))
    
    # 2. Adicionar service_vlan como opcional
    op.add_column('olts', sa.Column('service_vlan', sa.Integer(), nullable=True))


def downgrade() -> None:
    op.drop_column('olts', 'service_vlan')
    op.drop_column('olts', 'mgmt_vlan')
