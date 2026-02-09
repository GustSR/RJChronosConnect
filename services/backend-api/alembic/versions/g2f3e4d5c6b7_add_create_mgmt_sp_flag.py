"""add create mgmt service port flag to olt

Revision ID: g2f3e4d5c6b7
Revises: f1e2d3c4b5a6
Create Date: 2026-02-08 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'g2f3e4d5c6b7'
down_revision: Union[str, None] = 'f1e2d3c4b5a6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Adicionar flag para criação de service-port de gerência (default False)
    op.add_column('olts', sa.Column('create_mgmt_service_port', sa.Boolean(), nullable=False, server_default='false'))


def downgrade() -> None:
    op.drop_column('olts', 'create_mgmt_service_port')
