"""add_external_id_to_users

Revision ID: h3g4f5e6d7c8
Revises: g2f3e4d5c6b7
Create Date: 2026-03-09
"""
from alembic import op
import sqlalchemy as sa

revision = 'h3g4f5e6d7c8'
down_revision = 'g2f3e4d5c6b7'
branch_labels = None
depends_on = None

def upgrade() -> None:
    op.add_column('users', sa.Column('external_id', sa.String(), nullable=True))
    op.create_index('ix_users_external_id', 'users', ['external_id'], unique=True)
    op.alter_column('users', 'password_hash', nullable=True)

def downgrade() -> None:
    op.alter_column('users', 'password_hash', nullable=False)
    op.drop_index('ix_users_external_id', table_name='users')
    op.drop_column('users', 'external_id')
