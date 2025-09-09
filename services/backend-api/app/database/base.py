from sqlalchemy.orm import declarative_base

# Cria uma classe Base que nossos modelos de tabela do SQLAlchemy irão herdar.
# O Alembic e o SQLAlchemy usarão esta Base para entender a estrutura das tabelas
# a partir das classes Python que vamos definir.
Base = declarative_base()
