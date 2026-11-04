import asyncio
import httpx
from backend.app.main import app

async def run_checks():
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Root
        r = await client.get("/")
        print("GET / ->", r.status_code, r.json()["name"])
        assert r.status_code == 200

        # 2. Health
        r = await client.get("/health")
        print("GET /health ->", r.status_code, r.json()["status"])
        assert r.status_code == 200

        # 3. Analytics
        r = await client.get("/api/v1/analytics/overview")
        data = r.json()
        print("GET /api/v1/analytics/overview -> Total Discovered:", data["total_discovered_businesses"])
        assert r.status_code == 200
        assert data["total_discovered_businesses"] > 0

        # 4. Businesses
        r = await client.get("/api/v1/businesses")
        leads = r.json()
        print("GET /api/v1/businesses -> Count:", len(leads))
        assert r.status_code == 200
        assert len(leads) > 0
        first_lead = leads[0]
        print(f"Sample lead: {first_lead['name']} ({first_lead['city']}, {first_lead['country']}) - Score: {first_lead['lead_scores'][0]['total_opportunity_score']}")

        # 5. Filter Bengaluru
        r = await client.get("/api/v1/businesses?city=Bengaluru")
        blr_leads = r.json()
        print("GET /api/v1/businesses?city=Bengaluru -> Count:", len(blr_leads))
        assert r.status_code == 200

        # 6. Filter Austin
        r = await client.get("/api/v1/businesses?city=Austin")
        atx_leads = r.json()
        print("GET /api/v1/businesses?city=Austin -> Count:", len(atx_leads))
        assert r.status_code == 200

        # 7. Sources
        r = await client.get("/api/v1/discovery/sources")
        sources = r.json()
        print("GET /api/v1/discovery/sources -> Sources:", [s["name"] for s in sources])
        assert r.status_code == 200

    print("ALL API ENDPOINT INTEGRATION CHECKS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    asyncio.run(run_checks())
