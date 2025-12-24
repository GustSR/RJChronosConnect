from typing import Any


def apply_updates(model: Any, update_schema: Any) -> Any:
    update_data = update_schema.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(model, key, value)
    return model
