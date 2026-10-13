
import getpass
import requests
import json

BASE_URL = "https://api.watttime.org"

username = input("WattTime username: ").strip()
password = getpass.getpass("WattTime password: ")

try:
    # Authenticate
    login = requests.get(
        f"{BASE_URL}/login",
        auth=(username, password),
        timeout=20
    )
    print("Login status:", login.status_code)
    login.raise_for_status()

    token = login.json()["token"]

    # Request a forecast for the region your account supports
    response = requests.get(
        f"{BASE_URL}/v3/forecast",
        headers={"Authorization": f"Bearer {token}"},
        params={
            "region": "CAISO_NORTH",
            "signal_type": "co2_moer",
            "horizon_hours": 24
        },
        timeout=30
    )

    print("Forecast HTTP status:", response.status_code)

    try:
        data = response.json()
        print(json.dumps(data, indent=2)[:4000])
    except ValueError:
        print(response.text[:1000])

except requests.RequestException as error:
    print("Request failed:", error)
except (KeyError, TypeError):
    print("The login response did not contain the expected token.")
