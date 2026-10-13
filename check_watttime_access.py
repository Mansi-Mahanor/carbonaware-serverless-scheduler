
import getpass
import requests
import json

BASE_URL = "https://api.watttime.org"

username = input("WattTime username: ").strip()
password = getpass.getpass("WattTime password: ")

try:
    login = requests.get(
        f"{BASE_URL}/login",
        auth=(username, password),
        timeout=20
    )

    print("Login HTTP status:", login.status_code)

    if not login.ok:
        print("Login failed. Check your credentials.")
        raise SystemExit(1)

    token = login.json().get("token")

    if not token:
        print("No API token was returned.")
        raise SystemExit(1)

    access = requests.get(
        f"{BASE_URL}/v3/my-access",
        headers={"Authorization": f"Bearer {token}"},
        timeout=20
    )

    print("Access-check HTTP status:", access.status_code)

    try:
        print(json.dumps(access.json(), indent=2))
    except ValueError:
        print(access.text[:1000])

except requests.RequestException as error:
    print("Request failed:", error)
