import argparse
import asyncio
import csv
from datetime import UTC, datetime

import httpx


async def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("url", type=str, help="server url")
    parser.add_argument("data", type=argparse.FileType("r"), help="csv file with data")
    args = parser.parse_args()

    async with httpx.AsyncClient(base_url=args.url) as client:
        reader = csv.DictReader(args.data)

        for index, row in enumerate(reader):
            ip = row["ip address"]
            latitiude = float(row["Latitude"])
            longitude = float(row["Longitude"])
            timestamp = datetime.fromtimestamp(int(row["Timestamp"])).replace(tzinfo=UTC).isoformat()
            suspicious = float(row["suspicious"])

            response = await client.post(
                "/api/request_log/",
                json={
                    "ip": ip,
                    "timestamp": timestamp,
                    "latitude": latitiude,
                    "longitude": longitude,
                    "suspicious": suspicious,
                },
            )
            response.raise_for_status()
            log_id = response.json()["id"]
            print(f"[{index:05d}] inserted log with id:", log_id)


if __name__ == "__main__":
    asyncio.run(main())
