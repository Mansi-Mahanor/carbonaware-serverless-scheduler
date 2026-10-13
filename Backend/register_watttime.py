
import getpass
import requests
import json
import os

print("=== WattTime Account Registration ===")

username = input("Enter a new username: ").strip()
password = getpass.getpass("Create a password: ")
email = input("Enter your email address: ").strip()
organization = input("Enter your college name (optional): ").strip()

payload = {
    "username": username,
    "password": password,
    "email": email,
}

if organization:
    payload["org"] = organization

try:
    response = requests.post(
        "https://api.watttime.org/register",
        json=payload,
        timeout=20
    )

    print("\nHTTP status:", response.status_code)

    try:
        result = response.json()
        print(json.dumps(result, indent=2))
    except ValueError:
        print(response.text)

    if response.ok:
        print("\nRegistration request succeeded.")
        print("Keep your username and password private.")
    else:
        print("\nRegistration was not successful.")
        print("Check the response above before trying again.")

except requests.RequestException as error:
    print("Could not contact WattTime:", error)
