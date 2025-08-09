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
        "overview": "This is a comprehensive overview of the Physics Olympiad competition.",
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

    def test_competition_detail_includes_overview(
        self, client: TestClient, admin_headers
    ):
        """Test that competition detail endpoint includes overview field."""
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

        # Create competition with overview
        comp_resp = client.post(
            "/api/v1/competitions",
            json=_create_competition_payload(
                title="Test Competition",
                overview="This is a comprehensive overview of the test competition.",
            ),
            headers=creator_headers,
        )
        assert comp_resp.status_code == 200
        comp_id = comp_resp.json()["id"]

        # Approve the competition
        approve_resp = client.put(
            f"/api/v1/admin/competitions/{comp_id}/approve", headers=admin_headers
        )
        assert approve_resp.status_code == 200

        # Get competition detail
        detail_resp = client.get(f"/api/v1/competitions/{comp_id}")
        assert detail_resp.status_code == 200

        competition_data = detail_resp.json()
        assert "overview" in competition_data
        assert (
            competition_data["overview"]
            == "This is a comprehensive overview of the test competition."
        )

    def test_competition_list_includes_overview(
        self, client: TestClient, admin_headers
    ):
        """Test that competition list endpoint includes overview field."""
        creator_login = {
            "email": "creator4@example.com",
            "full_name": "Creator Four",
            "organization": "Org",
            "phone_number": "+4444444444",
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

        # Create competition with overview
        comp_resp = client.post(
            "/api/v1/competitions",
            json=_create_competition_payload(
                title="List Test Competition",
                overview="This overview should appear in the list response.",
            ),
            headers=creator_headers,
        )
        assert comp_resp.status_code == 200
        comp_id = comp_resp.json()["id"]

        # Approve the competition
        approve_resp = client.put(
            f"/api/v1/admin/competitions/{comp_id}/approve", headers=admin_headers
        )
        assert approve_resp.status_code == 200

        # Get competition list
        list_resp = client.get("/api/v1/competitions")
        assert list_resp.status_code == 200

        competitions = list_resp.json()["competitions"]
        # Find our competition in the list
        our_competition = next((c for c in competitions if c["id"] == comp_id), None)
        assert our_competition is not None
        assert "overview" in our_competition
        assert (
            our_competition["overview"]
            == "This overview should appear in the list response."
        )

    def test_featured_competitions_endpoint(self, client: TestClient, admin_headers):
        """Test the featured competitions endpoint."""
        creator_login = {
            "email": "creator5@example.com",
            "full_name": "Creator Five",
            "organization": "Org",
            "phone_number": "+5555555555",
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

        # Create competitions
        comp1_resp = client.post(
            "/api/v1/competitions",
            json=_create_competition_payload(title="Featured Competition"),
            headers=creator_headers,
        )
        assert comp1_resp.status_code == 200
        comp1_id = comp1_resp.json()["id"]

        comp2_resp = client.post(
            "/api/v1/competitions",
            json=_create_competition_payload(title="Regular Competition"),
            headers=creator_headers,
        )
        assert comp2_resp.status_code == 200
        comp2_id = comp2_resp.json()["id"]

        # Approve both competitions
        client.put(
            f"/api/v1/admin/competitions/{comp1_id}/approve", headers=admin_headers
        )
        client.put(
            f"/api/v1/admin/competitions/{comp2_id}/approve", headers=admin_headers
        )

        # Feature the first competition
        feature_resp = client.put(
            f"/api/v1/admin/competitions/{comp1_id}/feature", headers=admin_headers
        )
        assert feature_resp.status_code == 200

        # Get featured competitions
        featured_resp = client.get("/api/v1/competitions/featured")
        assert featured_resp.status_code == 200

        featured_competitions = featured_resp.json()["competitions"]
        featured_ids = [c["id"] for c in featured_competitions]
        assert comp1_id in featured_ids
        assert comp2_id not in featured_ids

    def test_pagination_and_limits(self, client: TestClient, admin_headers):
        """Test pagination and limit parameters."""
        creator_login = {
            "email": "creator6@example.com",
            "full_name": "Creator Six",
            "organization": "Org",
            "phone_number": "+6666666666",
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

        # Create multiple competitions
        created_ids = []
        for i in range(5):
            resp = client.post(
                "/api/v1/competitions",
                json=_create_competition_payload(title=f"Competition {i}"),
                headers=creator_headers,
            )
            assert resp.status_code == 200
            comp_id = resp.json()["id"]
            created_ids.append(comp_id)
            # Approve all competitions
            client.put(
                f"/api/v1/admin/competitions/{comp_id}/approve", headers=admin_headers
            )

        # Test pagination
        list_resp = client.get("/api/v1/competitions", params={"skip": 0, "limit": 3})
        assert list_resp.status_code == 200
        data = list_resp.json()
        assert len(data["competitions"]) == 3
        assert data["total"] == 5
        assert data["skip"] == 0
        assert data["limit"] == 3

        # Test second page
        list_resp2 = client.get("/api/v1/competitions", params={"skip": 3, "limit": 3})
        assert list_resp2.status_code == 200
        data2 = list_resp2.json()
        assert len(data2["competitions"]) == 2
        assert data2["total"] == 5
        assert data2["skip"] == 3
        assert data2["limit"] == 3

    def test_invalid_competition_id(self, client: TestClient):
        """Test handling of invalid competition IDs."""
        # Test with invalid UUID format
        resp = client.get("/api/v1/competitions/invalid-uuid")
        assert resp.status_code == 400

        # Test with non-existent UUID
        resp = client.get("/api/v1/competitions/12345678-1234-1234-1234-123456789012")
        assert resp.status_code == 404

    def test_invalid_competition_id_on_modify_delete(
        self, client: TestClient, auth_headers
    ):
        """Invalid UUID format should return 400 on update/delete routes."""
        bad_id = "not-a-uuid"
        resp_put = client.put(
            f"/api/v1/competitions/{bad_id}", json={"title": "X"}, headers=auth_headers
        )
        assert resp_put.status_code == 400

        resp_del = client.delete(f"/api/v1/competitions/{bad_id}", headers=auth_headers)
        assert resp_del.status_code == 400

    def test_update_validation_error_returns_422(
        self, client: TestClient, auth_headers
    ):
        """Updating with invalid data (e.g., past deadline) should 422."""
        # Create a valid competition first
        create_resp = client.post(
            "/api/v1/competitions",
            json=_create_competition_payload(title="Validate Update"),
            headers=auth_headers,
        )
        assert create_resp.status_code == 200
        comp_id = create_resp.json()["id"]

        # Attempt to set past registration_deadline
        past_deadline = (datetime.now(timezone.utc) - timedelta(days=1)).isoformat()
        update_resp = client.put(
            f"/api/v1/competitions/{comp_id}",
            json={"registration_deadline": past_deadline},
            headers=auth_headers,
        )
        assert update_resp.status_code == 422

    def test_admin_invalid_competition_id_returns_400(
        self, client: TestClient, admin_headers
    ):
        """Admin endpoints should return 400 for invalid UUID format."""
        bad_id = "invalid-uuid"
        resp = client.put(
            f"/api/v1/admin/competitions/{bad_id}/approve", headers=admin_headers
        )
        assert resp.status_code == 400

    def test_competition_validation_errors(self, client: TestClient, auth_headers):
        """Test competition creation validation errors."""
        # Test past deadline
        past_deadline = (datetime.now(timezone.utc) - timedelta(days=1)).isoformat()
        bad_deadline = _create_competition_payload(registration_deadline=past_deadline)
        resp = client.post(
            "/api/v1/competitions", json=bad_deadline, headers=auth_headers
        )
        assert resp.status_code == 422

        # Test invalid age range
        bad_age = _create_competition_payload(target_age_min=20, target_age_max=15)
        resp = client.post("/api/v1/competitions", json=bad_age, headers=auth_headers)
        assert resp.status_code == 422

        # Test invalid URLs
        bad_urls = _create_competition_payload(
            competition_link="ftp://bad.example", background_image_url="not-http"
        )
        resp = client.post("/api/v1/competitions", json=bad_urls, headers=auth_headers)
        assert resp.status_code == 422


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

    def test_competition_update_with_overview(
        self, client: TestClient, auth_headers, admin_headers
    ):
        """Test updating a competition with overview field."""
        # Create a competition
        comp_resp = client.post(
            "/api/v1/competitions",
            json=_create_competition_payload(title="Update Test Competition"),
            headers=auth_headers,
        )
        assert comp_resp.status_code == 200
        comp_id = comp_resp.json()["id"]

        # Approve the competition
        approve_resp = client.put(
            f"/api/v1/admin/competitions/{comp_id}/approve", headers=admin_headers
        )
        assert approve_resp.status_code == 200

        # Update the competition with new overview
        update_data = {
            "title": "Updated Competition Title",
            "overview": "This is an updated overview for the competition.",
            "introduction": "Updated introduction",
        }
        update_resp = client.put(
            f"/api/v1/competitions/{comp_id}",
            json=update_data,
            headers=auth_headers,
        )
        assert update_resp.status_code == 200

        updated_competition = update_resp.json()
        assert updated_competition["title"] == "Updated Competition Title"
        assert (
            updated_competition["overview"]
            == "This is an updated overview for the competition."
        )
        assert updated_competition["introduction"] == "Updated introduction"

    def test_competition_permissions(self, client: TestClient, auth_headers):
        """Test competition permissions (creator can only modify their own)."""
        # Create two creators
        creator1_login = {
            "email": "creator1@example.com",
            "full_name": "Creator One",
            "organization": "Org",
            "phone_number": "+1111111111",
            "password": "Pass12345",
        }
        creator2_login = {
            "email": "creator2@example.com",
            "full_name": "Creator Two",
            "organization": "Org",
            "phone_number": "+2222222222",
            "password": "Pass12345",
        }

        # Register both creators
        client.post("/api/v1/auth/signup", json=creator1_login)
        client.post("/api/v1/auth/signup", json=creator2_login)

        # Login as creator1
        login1_resp = client.post(
            "/api/v1/auth/login",
            json={
                "email": creator1_login["email"],
                "password": creator1_login["password"],
            },
        )
        creator1_headers = {
            "Authorization": f"Bearer {login1_resp.json()['access_token']}"
        }

        # Login as creator2
        login2_resp = client.post(
            "/api/v1/auth/login",
            json={
                "email": creator2_login["email"],
                "password": creator2_login["password"],
            },
        )
        creator2_headers = {
            "Authorization": f"Bearer {login2_resp.json()['access_token']}"
        }

        # Creator1 creates a competition
        comp_resp = client.post(
            "/api/v1/competitions",
            json=_create_competition_payload(title="Creator1's Competition"),
            headers=creator1_headers,
        )
        assert comp_resp.status_code == 200
        comp_id = comp_resp.json()["id"]

        # Creator2 tries to update Creator1's competition (should fail)
        update_data = {"title": "Unauthorized Update"}
        update_resp = client.put(
            f"/api/v1/competitions/{comp_id}",
            json=update_data,
            headers=creator2_headers,
        )
        assert update_resp.status_code == 403

        # Creator2 tries to delete Creator1's competition (should fail)
        delete_resp = client.delete(
            f"/api/v1/competitions/{comp_id}",
            headers=creator2_headers,
        )
        assert delete_resp.status_code == 403

        # Creator1 can update their own competition
        update_resp = client.put(
            f"/api/v1/competitions/{comp_id}",
            json=update_data,
            headers=creator1_headers,
        )
        assert update_resp.status_code == 200

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

    def test_admin_competition_management(self, client: TestClient, admin_headers):
        """Test admin-specific competition management features."""
        # Create a creator
        creator_login = {
            "email": "admin-test-creator@example.com",
            "full_name": "Admin Test Creator",
            "organization": "Org",
            "phone_number": "+9999999999",
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

        # Create a competition
        comp_resp = client.post(
            "/api/v1/competitions",
            json=_create_competition_payload(title="Admin Test Competition"),
            headers=creator_headers,
        )
        assert comp_resp.status_code == 200
        comp_id = comp_resp.json()["id"]

        # Test admin can activate/deactivate
        deactivate_resp = client.put(
            f"/api/v1/admin/competitions/{comp_id}/deactivate", headers=admin_headers
        )
        assert deactivate_resp.status_code == 200

        activate_resp = client.put(
            f"/api/v1/admin/competitions/{comp_id}/activate", headers=admin_headers
        )
        assert activate_resp.status_code == 200

        # Test admin can approve and then feature
        approve_resp = client.put(
            f"/api/v1/admin/competitions/{comp_id}/approve", headers=admin_headers
        )
        assert approve_resp.status_code == 200

        feature_resp = client.put(
            f"/api/v1/admin/competitions/{comp_id}/feature", headers=admin_headers
        )
        assert feature_resp.status_code == 200

        # Verify it appears in featured list
        featured_resp = client.get("/api/v1/competitions/featured")
        assert featured_resp.status_code == 200
        featured_ids = [c["id"] for c in featured_resp.json()["competitions"]]
        assert comp_id in featured_ids
