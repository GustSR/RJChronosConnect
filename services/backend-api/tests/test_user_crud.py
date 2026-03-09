"""Testes das funcoes CRUD de User."""

import pytest
from app.models.user import User
from app.crud.user import get_user_by_external_id, get_or_create_user_from_edge


class TestGetUserByExternalId:
    def test_returns_none_when_not_found(self, db_session):
        result = get_user_by_external_id(db_session, "nonexistent-id")
        assert result is None

    def test_returns_user_when_found(self, db_session):
        user = User(
            external_id="ba-123",
            full_name="Test User",
            email="test@example.com",
        )
        db_session.add(user)
        db_session.flush()

        result = get_user_by_external_id(db_session, "ba-123")
        assert result is not None
        assert result.external_id == "ba-123"
        assert result.email == "test@example.com"


class TestGetOrCreateUserFromEdge:
    def test_creates_new_user_when_not_exists(self, db_session):
        user = get_or_create_user_from_edge(
            db_session,
            external_id="ba-new-456",
            email="new@example.com",
        )
        assert user is not None
        assert user.external_id == "ba-new-456"
        assert user.email == "new@example.com"
        assert user.full_name == "new@example.com"
        assert user.password_hash is None
        assert user.is_active is True

    def test_returns_existing_user_when_found(self, db_session):
        existing = User(
            external_id="ba-existing-789",
            full_name="Existing User",
            email="existing@example.com",
        )
        db_session.add(existing)
        db_session.flush()

        user = get_or_create_user_from_edge(
            db_session,
            external_id="ba-existing-789",
            email="existing@example.com",
        )
        assert user.id == existing.id
        assert user.full_name == "Existing User"

    def test_updates_email_if_changed(self, db_session):
        existing = User(
            external_id="ba-update-101",
            full_name="Old Name",
            email="old@example.com",
        )
        db_session.add(existing)
        db_session.flush()

        user = get_or_create_user_from_edge(
            db_session,
            external_id="ba-update-101",
            email="new@example.com",
        )
        assert user.id == existing.id
        assert user.email == "new@example.com"
