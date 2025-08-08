from datetime import datetime, timedelta, timezone
from typing import TypedDict

from fastapi.testclient import TestClient

from app.models.common import CompetitionFormat, CompetitionScale


def _future_deadline(days: int = 10) -> str:
    return (datetime.now(timezone.utc) + timedelta(days=days)).isoformat()


def _create_competition_payload(**overrides):
    payload = {
        "title": "Physics Olympiad",
        "introduction": "A prestigious physics competition.",
        "question_type": "Multiple Choice",
        "selection_process": "Regional -> National",
        "history": "Since 1967",
        "scoring_and_format": "Standardized",
        "awards": "Medals",
        "penalties_and_bans": None,
        "notable_achievements": None,
        "competition_link": "https://example.com/physics",
        "background_image_url": "https://example.com/bg.jpg",
        "detail_image_urls": [
            "https://example.com/d1.jpg",
            "https://example.com/d2.jpg",
        ],
        "location": "Hanoi",
        "format": CompetitionFormat.OFFLINE,
        "scale": CompetitionScale.REGIONAL,
        "registration_deadline": _future_deadline(30),
        "size": 200,
        "target_age_min": 15,
        "target_age_max": 18,
    }
    payload.update(overrides)
    return payload


class TestPublicCompetitions:
    def test_public_list_shows_only_approved(self, client: TestClient, admin_headers):
        creator_login = {
            "email": "creator1@example.com",
            "full_name": "Creator One",
            "organization": "Org",
            "phone_number": "+1111111111",
            "password": "Pass12345",
        }
        client.post("/api/v1/auth/signup", json=creator_login)
        login_resp = client.post(
            "/api/v1/auth/login",
            json={
                "email": creator_login["email"],
                "password": creator_login["password"],
            },
        )
        creator_headers = {
            "Authorization": f"Bearer {login_resp.json()['access_token']}"
        }

        c1_resp = client.post(
            "/api/v1/competitions",
            json=_create_competition_payload(title="Comp A"),
            headers=creator_headers,
        )
        assert c1_resp.status_code == 200
        c1_id = c1_resp.json()["id"]

        c2_resp = client.post(
            "/api/v1/competitions",
            json=_create_competition_payload(title="Comp B"),
            headers=creator_headers,
        )
        assert c2_resp.status_code == 200
        c2_id = c2_resp.json()["id"]
        approve_resp = client.put(
            f"/api/v1/admin/competitions/{c2_id}/approve", headers=admin_headers
        )
        assert approve_resp.status_code == 200

        list_resp = client.get("/api/v1/competitions")
        assert list_resp.status_code == 200
        ids = [c["id"] for c in list_resp.json()["competitions"]]
        assert c2_id in ids
        assert c1_id not in ids

        detail_unapproved = client.get(f"/api/v1/competitions/{c1_id}")
        assert detail_unapproved.status_code == 404

        detail_approved = client.get(f"/api/v1/competitions/{c2_id}")
        assert detail_approved.status_code == 200

    def test_search_and_filters_and_sorting(self, client: TestClient, admin_headers):
        creator_login = {
            "email": "creator2@example.com",
            "full_name": "Creator Two",
            "organization": "Org",
            "phone_number": "+2222222222",
            "password": "Pass12345",
        }
        client.post("/api/v1/auth/signup", json=creator_login)
        login_resp = client.post(
            "/api/v1/auth/login",
            json={
                "email": creator_login["email"],
                "password": creator_login["password"],
            },
        )
        creator_headers = {
            "Authorization": f"Bearer {login_resp.json()['access_token']}"
        }

        class Spec(TypedDict):
            title: str
            location: str
            format: CompetitionFormat
            days: int

        specs: list[Spec] = [
            {
                "title": "Alpha Robotics",
                "location": "Hanoi",
                "format": CompetitionFormat.ONLINE,
                "days": 40,
            },
            {
                "title": "beta biology",
                "location": "Saigon",
                "format": CompetitionFormat.OFFLINE,
                "days": 50,
            },
            {
                "title": "Gamma Math",
                "location": "Da Nang",
                "format": CompetitionFormat.HYBRID,
                "days": 60,
            },
        ]
        created_ids = []
        for spec in specs:
            resp = client.post(
                "/api/v1/competitions",
                json=_create_competition_payload(
                    title=spec["title"],
                    location=spec["location"],
                    format=spec["format"],
                    registration_deadline=_future_deadline(days=spec["days"]),
                ),
                headers=creator_headers,
            )
            assert resp.status_code == 200
            cid = resp.json()["id"]
            created_ids.append(cid)
            client.put(
                f"/api/v1/admin/competitions/{cid}/approve", headers=admin_headers
            )

        s = client.get("/api/v1/competitions", params={"search": "BeTa"})
        assert s.status_code == 200
        titles = [c["title"] for c in s.json()["competitions"]]
        assert any("beta biology" == t for t in titles)

        f = client.get("/api/v1/competitions", params={"location": "hAn"})
        assert f.status_code == 200
        titles = [c["title"] for c in f.json()["competitions"]]
        assert any("Alpha Robotics" == t for t in titles)

        r = client.get(
            "/api/v1/competitions", params={"sort_by": "title", "order": "desc"}
        )
        assert r.status_code == 200
        titles = [c["title"] for c in r.json()["competitions"]]
        assert titles == sorted(titles, reverse=True)


class TestCreatorAndAdminFlows:
    def test_creator_my_competitions_and_moderation(
        self, client: TestClient, admin_headers
    ):
        creator_login = {
            "email": "creator3@example.com",
            "full_name": "Creator Three",
            "organization": "Org",
            "phone_number": "+3333333333",
            "password": "Pass12345",
        }
        client.post("/api/v1/auth/signup", json=creator_login)
        login_resp = client.post(
            "/api/v1/auth/login",
            json={
                "email": creator_login["email"],
                "password": creator_login["password"],
            },
        )
        creator_headers = {
            "Authorization": f"Bearer {login_resp.json()['access_token']}"
        }

        c1 = client.post(
            "/api/v1/competitions",
            json=_create_competition_payload(title="C1"),
            headers=creator_headers,
        )
        c2 = client.post(
            "/api/v1/competitions",
            json=_create_competition_payload(title="C2"),
            headers=creator_headers,
        )
        assert c1.status_code == 200 and c2.status_code == 200
        c1_id = c1.json()["id"]
        c2_id = c2.json()["id"]

        my_list = client.get(
            "/api/v1/competitions/my/competitions", headers=creator_headers
        )
        assert my_list.status_code == 200
        my_ids = [c["id"] for c in my_list.json()["competitions"]]
        assert c1_id in my_ids and c2_id in my_ids

        pending = client.get(
            "/api/v1/admin/competitions/pending", headers=admin_headers
        )
        assert pending.status_code == 200
        pend_ids = [c["id"] for c in pending.json()["competitions"]]
        assert c1_id in pend_ids and c2_id in pend_ids

        approve = client.put(
            f"/api/v1/admin/competitions/{c1_id}/approve", headers=admin_headers
        )
        reject = client.put(
            f"/api/v1/admin/competitions/{c2_id}/reject",
            json={"rejection_reason": "Incomplete details"},
            headers=admin_headers,
        )
        assert approve.status_code == 200
        assert reject.status_code == 200

        pub = client.get("/api/v1/competitions")
        ids = [c["id"] for c in pub.json()["competitions"]]
        assert c1_id in ids and c2_id not in ids

        feat = client.put(
            f"/api/v1/admin/competitions/{c1_id}/feature", headers=admin_headers
        )
        assert feat.status_code == 200
        featured = client.get("/api/v1/competitions/featured")
        f_ids = [c["id"] for c in featured.json()["competitions"]]
        assert c1_id in f_ids

        unfeat = client.put(
            f"/api/v1/admin/competitions/{c1_id}/unfeature", headers=admin_headers
        )
        assert unfeat.status_code == 200
        featured2 = client.get("/api/v1/competitions/featured")
        f_ids2 = [c["id"] for c in featured2.json()["competitions"]]
        assert c1_id not in f_ids2

    def test_url_validation_and_deadline(self, client: TestClient, auth_headers):
        bad = _create_competition_payload(
            competition_link="ftp://bad.example", background_image_url="not-http"
        )
        r = client.post("/api/v1/competitions", json=bad, headers=auth_headers)
        assert r.status_code == 422

        bad_deadline = _create_competition_payload(
            registration_deadline=(
                datetime.now(timezone.utc) - timedelta(days=1)
            ).isoformat()
        )
        r2 = client.post(
            "/api/v1/competitions", json=bad_deadline, headers=auth_headers
        )
        assert r2.status_code == 422
