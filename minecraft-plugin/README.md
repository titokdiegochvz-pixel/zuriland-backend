# ZuriLand Towny Sync

This Paper plugin reads nation, town, resident, and claimed-plot counts from Towny 0.103.2.0 and sends a snapshot to the ZuriLand API over HTTPS. It also sends the online player count every five seconds and immediately after a player joins or leaves. The Minecraft server makes the outbound connection; no inbound ports or direct website access to the game server/database are required.

## Build

Install JDK 25 (the latest LTS release) and Maven, then run this directory:

```powershell
mvn package
```

The plugin JAR is created at `target/zuriland-towny-sync-1.0.0.jar`.

## Configure

1. In Render, add `TOWNY_SYNC_TOKEN` as a secret environment variable on the `zuriland-api-ajeu` service. Generate a long random token; never commit it or share it in chat.
2. Save the environment change and wait for the API deployment to finish.
3. Copy the plugin JAR into the Minecraft server's `plugins` directory. Towny 0.103.2.0 must already be installed.
4. Start the server once, then edit `plugins/ZuriLandTownySync/config.yml` and set `sync-token` to the same token. Keep `api-url` on the HTTPS Render API URL.
5. Restart the server. It sends the first player count shortly after startup and then every five seconds. The website refreshes its display every five seconds. Towny rankings continue to sync every five minutes.
6. Open `/api/towny/ranking` on the API to confirm the public snapshot contains the nations.

The public website only exposes the published ranking. The ingest endpoint requires the bearer token and accepts complete snapshots, so an invalid or unauthenticated request cannot replace the ranking.
