# ZuriLand Towny Sync

This Paper plugin reads nation, town, resident, and claimed-plot counts from Towny 0.103.2.0, adds each nation's total player kills, and sends snapshots to the ZuriLand API over HTTPS. Every 30 seconds and after a player joins, leaves, or gets a PvP kill, it publishes both each town's non-NPC residents and every known server player, including players without a town. The public ranking includes those known players and their Minecraft player-kill statistics; the Towny roster keeps residents grouped by city and shows their current connection status. Kill counts come from the server statistic rather than only kills recorded after the plugin was installed. Each player-versus-player kill event is also recorded with the killer's town, the eliminated player's name, and the event time. The plugin sends the online player count every five seconds and immediately after a player joins or leaves. Ranking sync is limited per configured sync token, not per shared server IP. HTTP 429 responses include the retry delay in the plugin log. The Minecraft server makes the outbound connection; no inbound ports or direct website access to the game server/database are required.

## Build

Install JDK 25 (the latest LTS release) and Maven, then run this directory:

```powershell
mvn package
```

The plugin JAR is created at `target/zuriland-towny-sync-1.0.2.jar`.

## Configure

1. In Render, add `TOWNY_SYNC_TOKEN` as a secret environment variable on the `zuriland-api-ajeu` service. Generate a long random token; never commit it or share it in chat.
2. Save the environment change and wait for the API deployment to finish.
3. Stop the Minecraft server and copy the plugin JAR into its `plugins` directory. When updating an existing install, replace only the JAR and preserve `plugins/ZuriLandTownySync/config.yml`. Towny 0.103.2.0 must already be installed.
4. Start the server once, then edit `plugins/ZuriLandTownySync/config.yml` and set `sync-token` to the same token. Keep `api-url` on the HTTPS Render API URL.
5. Restart the server. It sends the first player count and online Towny roster shortly after startup, then player counts every five seconds and Towny/all-player snapshots every 30 seconds and after joins/leaves/PvP kills.
6. Open `/api/towny/kills` on the API to confirm the public town roster, the complete `players` ranking, and recent kill events. Each player entry includes `name`, `kills`, and an `online` boolean.

The public website lists all Towny residents by city, with online residents shown in green and offline residents in red. The latest 18 PvP events remain available in the API. All ingest endpoints require the bearer token. Kill event IDs prevent duplicate rows if the same event is submitted more than once.
