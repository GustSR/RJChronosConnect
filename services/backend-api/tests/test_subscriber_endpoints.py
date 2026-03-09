"""Testes dos endpoints CRUD de Subscriber (/api/subscribers)."""

import pytest

BASE_URL = "/api/subscribers"


@pytest.fixture()
def sample_subscriber(client):
    """Cria um subscriber de exemplo para testes que precisam de dado existente."""
    payload = {
        "full_name": "João da Silva",
        "cpf_cnpj": "12345678901",
        "email": "joao@example.com",
        "phone_number": "21999999999",
        "address_street": "Rua das Flores, 123",
    }
    response = client.post(f"{BASE_URL}", json=payload)
    assert response.status_code == 201
    return response.json()


# ── TestCreateSubscriber ─────────────────────────────────────────────────


class TestCreateSubscriber:
    """Testes de criacao de Subscriber (POST /api/subscribers)."""

    def test_create_subscriber_returns_201(self, client):
        payload = {
            "full_name": "Maria Oliveira",
            "cpf_cnpj": "98765432100",
            "email": "maria@example.com",
            "phone_number": "21988888888",
            "address_street": "Av. Brasil, 456",
        }
        response = client.post(f"{BASE_URL}", json=payload)

        assert response.status_code == 201
        data = response.json()
        assert data["full_name"] == payload["full_name"]
        assert data["cpf_cnpj"] == payload["cpf_cnpj"]
        assert data["email"] == payload["email"]
        assert data["phone_number"] == payload["phone_number"]
        assert data["address_street"] == payload["address_street"]
        assert "id" in data
        assert "created_at" in data
        assert "updated_at" in data

    def test_create_subscriber_minimal(self, client):
        payload = {
            "full_name": "Carlos Souza",
            "cpf_cnpj": "11122233344",
        }
        response = client.post(f"{BASE_URL}", json=payload)

        assert response.status_code == 201
        data = response.json()
        assert data["full_name"] == payload["full_name"]
        assert data["cpf_cnpj"] == payload["cpf_cnpj"]

    def test_create_subscriber_duplicate_cpf_cnpj_returns_400(self, client):
        base = {
            "full_name": "Pedro Lima",
            "cpf_cnpj": "55566677788",
        }
        client.post(f"{BASE_URL}", json=base)

        duplicate = {
            "full_name": "Outro Nome",
            "cpf_cnpj": "55566677788",
        }
        response = client.post(f"{BASE_URL}", json=duplicate)

        assert response.status_code == 400

    def test_create_subscriber_missing_name_returns_422(self, client):
        payload = {
            "cpf_cnpj": "99988877766",
        }
        response = client.post(f"{BASE_URL}", json=payload)

        assert response.status_code == 422


# ── TestListSubscribers ──────────────────────────────────────────────────


class TestListSubscribers:
    """Testes de listagem de Subscribers (GET /api/subscribers)."""

    def test_list_subscribers_empty(self, client):
        response = client.get(f"{BASE_URL}")

        assert response.status_code == 200
        assert isinstance(response.json(), list)

    def test_list_subscribers_returns_created(self, client, sample_subscriber):
        response = client.get(f"{BASE_URL}")

        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 1
        ids = [s["id"] for s in data]
        assert sample_subscriber["id"] in ids

    def test_list_subscribers_with_pagination(self, client):
        client.post(f"{BASE_URL}", json={
            "full_name": "Assinante Pag 1",
            "cpf_cnpj": "11100011100",
        })
        client.post(f"{BASE_URL}", json={
            "full_name": "Assinante Pag 2",
            "cpf_cnpj": "22200022200",
        })

        response = client.get(f"{BASE_URL}", params={"skip": 0, "limit": 1})

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1

    def test_list_subscribers_search_by_name(self, client, sample_subscriber):
        response = client.get(f"{BASE_URL}", params={"search": "João"})

        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 1
        names = [s["full_name"] for s in data]
        assert sample_subscriber["full_name"] in names

    def test_list_subscribers_search_by_cpf(self, client, sample_subscriber):
        response = client.get(f"{BASE_URL}", params={"search": "12345678901"})

        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 1
        cpfs = [s["cpf_cnpj"] for s in data]
        assert sample_subscriber["cpf_cnpj"] in cpfs


# ── TestCountSubscribers ─────────────────────────────────────────────────


class TestCountSubscribers:
    """Testes de contagem de Subscribers (GET /api/subscribers/count)."""

    def test_count_subscribers(self, client, sample_subscriber):
        response = client.get(f"{BASE_URL}/count")

        assert response.status_code == 200
        data = response.json()
        assert data["count"] >= 1

    def test_count_subscribers_with_search(self, client, sample_subscriber):
        response = client.get(f"{BASE_URL}/count", params={"search": "João"})

        assert response.status_code == 200
        data = response.json()
        assert data["count"] >= 1


# ── TestGetSubscriber ────────────────────────────────────────────────────


class TestGetSubscriber:
    """Testes de obtencao de Subscriber por ID (GET /api/subscribers/{{id}})."""

    def test_get_subscriber_by_id(self, client, sample_subscriber):
        sub_id = sample_subscriber["id"]
        response = client.get(f"{BASE_URL}/{sub_id}")

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == sub_id
        assert data["full_name"] == sample_subscriber["full_name"]
        assert data["cpf_cnpj"] == sample_subscriber["cpf_cnpj"]
        assert data["email"] == sample_subscriber["email"]
        assert data["phone_number"] == sample_subscriber["phone_number"]
        assert data["address_street"] == sample_subscriber["address_street"]

    def test_get_subscriber_not_found(self, client):
        response = client.get(f"{BASE_URL}/99999")

        assert response.status_code == 404


# ── TestUpdateSubscriber ─────────────────────────────────────────────────


class TestUpdateSubscriber:
    """Testes de atualizacao de Subscriber (PUT /api/subscribers/{{id}})."""

    def test_update_subscriber_name(self, client, sample_subscriber):
        sub_id = sample_subscriber["id"]
        response = client.put(
            f"{BASE_URL}/{sub_id}",
            json={"full_name": "João Atualizado"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["full_name"] == "João Atualizado"
        # Campos nao alterados permanecem iguais
        assert data["cpf_cnpj"] == sample_subscriber["cpf_cnpj"]
        assert data["email"] == sample_subscriber["email"]

    def test_update_subscriber_cpf_cnpj_duplicate_returns_400(self, client):
        # Cria dois subscribers com CPFs distintos
        client.post(f"{BASE_URL}", json={
            "full_name": "Subscriber A",
            "cpf_cnpj": "33344455566",
        })
        resp_b = client.post(f"{BASE_URL}", json={
            "full_name": "Subscriber B",
            "cpf_cnpj": "77788899900",
        })
        sub_b_id = resp_b.json()["id"]

        # Tenta atualizar B para usar o CPF de A
        response = client.put(
            f"{BASE_URL}/{sub_b_id}",
            json={"cpf_cnpj": "33344455566"},
        )

        assert response.status_code == 400

    def test_update_subscriber_not_found(self, client):
        response = client.put(
            f"{BASE_URL}/99999",
            json={"full_name": "Fantasma"},
        )

        assert response.status_code == 404


# ── TestDeleteSubscriber ─────────────────────────────────────────────────


class TestDeleteSubscriber:
    """Testes de remocao de Subscriber (DELETE /api/subscribers/{{id}})."""

    def test_delete_subscriber(self, client, sample_subscriber):
        sub_id = sample_subscriber["id"]

        del_response = client.delete(f"{BASE_URL}/{sub_id}")
        assert del_response.status_code == 204

        get_response = client.get(f"{BASE_URL}/{sub_id}")
        assert get_response.status_code == 404

    def test_delete_subscriber_not_found(self, client):
        response = client.delete(f"{BASE_URL}/99999")

        assert response.status_code == 404
