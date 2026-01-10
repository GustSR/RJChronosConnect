"""Adiciona protocolo de acesso na OLT

Revision ID: d1e2f3a4b5c6
Revises: c4d5e6f7g8h9
Create Date: 2026-01-09 18:05:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "d1e2f3a4b5c6"
down_revision: Union[str, None] = "c4d5e6f7g8h9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "olts",
        sa.Column(
            "access_protocol",
            sa.String(),
            nullable=False,
            server_default="ssh",
        ),
    )


def downgrade() -> None:
    op.drop_column("olts", "access_protocol")
