package org.zuriland.townysync;

import com.palmergames.bukkit.towny.TownyUniverse;
import com.palmergames.bukkit.towny.object.Nation;
import com.palmergames.bukkit.towny.object.Resident;
import com.palmergames.bukkit.towny.object.Town;
import org.bukkit.Bukkit;
import org.bukkit.Statistic;
import org.bukkit.scheduler.BukkitTask;
import org.bukkit.event.EventHandler;
import org.bukkit.event.Listener;
import org.bukkit.event.entity.PlayerDeathEvent;
import org.bukkit.entity.Player;
import org.bukkit.event.player.PlayerJoinEvent;
import org.bukkit.event.player.PlayerQuitEvent;
import org.bukkit.plugin.java.JavaPlugin;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.logging.Level;

public final class ZuriLandTownySync extends JavaPlugin implements Listener {
    private HttpClient httpClient;
    private URI endpoint;
    private URI playerStatusEndpoint;
    private URI killEventsEndpoint;
    private URI townsEndpoint;
    private String syncToken;
    private int syncIntervalSeconds;
    private int townRosterSyncIntervalSeconds;
    private int playerSyncIntervalSeconds;
    private BukkitTask pendingTownRosterSync;

    @Override
    public void onEnable() {
        saveDefaultConfig();

        String apiUrl = getConfig().getString("api-url", "").trim();
        syncToken = getConfig().getString("sync-token", "").trim();
        syncIntervalSeconds = getConfig().getInt("sync-interval-seconds", 300);
        townRosterSyncIntervalSeconds = getConfig().getInt("town-roster-sync-interval-seconds", 30);
        playerSyncIntervalSeconds = getConfig().getInt("player-sync-interval-seconds", 5);

        if (apiUrl.isEmpty() || syncToken.isEmpty()) {
            getLogger().severe("Set api-url and sync-token in plugins/ZuriLandTownySync/config.yml.");
            getServer().getPluginManager().disablePlugin(this);
            return;
        }

        if (syncIntervalSeconds < 60) {
            getLogger().severe("sync-interval-seconds must be at least 60.");
            getServer().getPluginManager().disablePlugin(this);
            return;
        }

        if (playerSyncIntervalSeconds < 5) {
            getLogger().severe("player-sync-interval-seconds must be at least 5.");
            getServer().getPluginManager().disablePlugin(this);
            return;
        }

        if (townRosterSyncIntervalSeconds < 10) {
            getLogger().severe("town-roster-sync-interval-seconds must be at least 10.");
            getServer().getPluginManager().disablePlugin(this);
            return;
        }

        try {
            URI baseUri = URI.create(apiUrl.replaceAll("/+$", ""));
            if (!"https".equalsIgnoreCase(baseUri.getScheme()) || baseUri.getHost() == null) {
                getLogger().severe("api-url must be a valid HTTPS URL.");
                getServer().getPluginManager().disablePlugin(this);
                return;
            }
            endpoint = baseUri.resolve("/api/towny/ranking");
            playerStatusEndpoint = baseUri.resolve("/api/minecraft/status");
            killEventsEndpoint = baseUri.resolve("/api/towny/kills");
            townsEndpoint = baseUri.resolve("/api/towny/towns");
        } catch (IllegalArgumentException exception) {
            getLogger().log(Level.SEVERE, "api-url is not a valid URL.", exception);
            getServer().getPluginManager().disablePlugin(this);
            return;
        }

        httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

        long intervalTicks = syncIntervalSeconds * 20L;
        Bukkit.getScheduler().runTaskTimer(
            this,
            this::syncSnapshot,
            20L,
            intervalTicks
        );
        Bukkit.getScheduler().runTaskTimer(
            this,
            this::syncTownSnapshot,
            20L,
            townRosterSyncIntervalSeconds * 20L
        );
        Bukkit.getScheduler().runTaskTimer(
            this,
            this::syncPlayerCount,
            20L,
            playerSyncIntervalSeconds * 20L
        );
        getServer().getPluginManager().registerEvents(this, this);
        getLogger().info("Towny rankings will sync to ZuriLand every " + syncIntervalSeconds + " seconds.");
        getLogger().info(
            "Towny residents and connection statuses will sync to ZuriLand every "
                + townRosterSyncIntervalSeconds + " seconds."
        );
        getLogger().info("Minecraft player counts will sync to ZuriLand every " + playerSyncIntervalSeconds + " seconds.");
    }

    @EventHandler
    public void onPlayerJoin(PlayerJoinEvent event) {
        syncPlayerCountNextTick();
        scheduleTownSnapshotSync();
    }

    @EventHandler
    public void onPlayerQuit(PlayerQuitEvent event) {
        syncPlayerCountNextTick();
        scheduleTownSnapshotSync();
    }

    private void scheduleTownSnapshotSync() {
        if (pendingTownRosterSync != null) {
            return;
        }

        pendingTownRosterSync = Bukkit.getScheduler().runTaskLater(this, () -> {
            pendingTownRosterSync = null;
            syncTownSnapshot();
        }, 40L);
    }

    @EventHandler
    public void onPlayerDeath(PlayerDeathEvent event) {
        Player victim = event.getEntity();
        Player killer = victim.getKiller();
        if (killer == null || killer.getUniqueId().equals(victim.getUniqueId())) {
            return;
        }

        Resident resident = TownyUniverse.getInstance().getResident(killer.getUniqueId());
        String killerTown = resident != null && resident.hasTown()
            ? resident.getTownOrNull().getName()
            : null;
        KillEvent killEvent = new KillEvent(
            UUID.randomUUID().toString(),
            killer.getName(),
            killerTown,
            victim.getName(),
            Instant.now().toString()
        );

        Bukkit.getScheduler().runTaskAsynchronously(
            this,
            () -> sendKillEvent(killEvent)
        );
        scheduleTownSnapshotSync();
    }

    private void syncPlayerCountNextTick() {
        Bukkit.getScheduler().runTask(this, this::syncPlayerCount);
    }

    private void syncPlayerCount() {
        int onlinePlayers = Bukkit.getOnlinePlayers().size();
        int maxPlayers = Bukkit.getMaxPlayers();
        String payload = "{\"online\":true,\"players\":{\"online\":" + onlinePlayers
            + ",\"max\":" + maxPlayers + "}}";

        Bukkit.getScheduler().runTaskAsynchronously(
            this,
            () -> sendPlayerCount(payload, onlinePlayers)
        );
    }

    private void sendPlayerCount(String payload, int onlinePlayers) {
        HttpRequest request = HttpRequest.newBuilder(playerStatusEndpoint)
            .timeout(Duration.ofSeconds(10))
            .header("Authorization", "Bearer " + syncToken)
            .header("Content-Type", "application/json")
            .POST(HttpRequest.BodyPublishers.ofString(payload))
            .build();

        try {
            HttpResponse<Void> response = httpClient.send(request, HttpResponse.BodyHandlers.discarding());
            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                getLogger().fine("Synced the Minecraft player count (" + onlinePlayers + ").");
            } else {
                getLogger().warning("Minecraft player count sync failed with HTTP " + response.statusCode() + ".");
            }
        } catch (IOException exception) {
            getLogger().log(Level.WARNING, "Could not send the Minecraft player count to ZuriLand.", exception);
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            getLogger().log(Level.WARNING, "Minecraft player count sync was interrupted.", exception);
        }
    }

    private void syncSnapshot() {
        Snapshot snapshot = createSnapshotJson();
        Bukkit.getScheduler().runTaskAsynchronously(
            this,
            () -> sendSnapshot(snapshot.payload(), snapshot.nationCount())
        );
    }

    private Snapshot createSnapshotJson() {
        List<NationSnapshot> nations = new ArrayList<>();

        for (Nation nation : TownyUniverse.getInstance().getNations()) {
            nations.add(new NationSnapshot(
                nation.getName(),
                nation.getTowns().size(),
                nation.getResidents().size(),
                nation.getTownBlocks().size(),
                nationKills(nation)
            ));
        }

        nations.sort(Comparator.comparing(NationSnapshot::name, String.CASE_INSENSITIVE_ORDER));

        StringBuilder json = new StringBuilder("{\"nations\":[");
        for (int index = 0; index < nations.size(); index++) {
            if (index > 0) {
                json.append(',');
            }

            NationSnapshot nation = nations.get(index);
            json.append("{\"name\":\"")
                .append(escapeJson(nation.name()))
                .append("\",\"towns\":")
                .append(nation.towns())
                .append(",\"residents\":")
                .append(nation.residents())
                .append(",\"land\":")
                .append(nation.land())
                .append(",\"kills\":")
                .append(nation.kills())
                .append('}');
        }
        return new Snapshot(json.append("]}").toString(), nations.size());
    }

    private void syncTownSnapshot() {
        List<TownSnapshot> towns = new ArrayList<>();
        Map<UUID, PlayerSnapshot> onlinePlayers = new HashMap<>();
        for (Player player : Bukkit.getOnlinePlayers()) {
            onlinePlayers.put(
                player.getUniqueId(),
                new PlayerSnapshot(player.getName(), player.getStatistic(Statistic.PLAYER_KILLS), true)
            );
        }

        for (Town town : TownyUniverse.getInstance().getTowns()) {
            List<PlayerSnapshot> players = town.getResidents().stream()
                .filter(resident -> !resident.isNPC())
                .filter(Resident::hasUUID)
                .map(resident -> {
                    PlayerSnapshot onlinePlayer = onlinePlayers.get(resident.getUUID());
                    int kills = onlinePlayer != null
                        ? onlinePlayer.kills()
                        : Bukkit.getOfflinePlayer(resident.getUUID()).getStatistic(Statistic.PLAYER_KILLS);
                    return new PlayerSnapshot(resident.getName(), kills, onlinePlayer != null);
                })
                .sorted(Comparator.comparing(PlayerSnapshot::name, String.CASE_INSENSITIVE_ORDER))
                .toList();
            towns.add(new TownSnapshot(town.getName(), players));
        }

        towns.sort(Comparator.comparing(TownSnapshot::name, String.CASE_INSENSITIVE_ORDER));
        StringBuilder json = new StringBuilder("{\"towns\":[");
        for (int townIndex = 0; townIndex < towns.size(); townIndex++) {
            if (townIndex > 0) {
                json.append(',');
            }

            TownSnapshot town = towns.get(townIndex);
            json.append("{\"name\":\"")
                .append(escapeJson(town.name()))
                .append("\",\"players\":[");
            for (int playerIndex = 0; playerIndex < town.players().size(); playerIndex++) {
                if (playerIndex > 0) {
                    json.append(',');
                }
                PlayerSnapshot player = town.players().get(playerIndex);
                json.append("{\"name\":\"")
                    .append(escapeJson(player.name()))
                    .append("\",\"kills\":")
                    .append(player.kills())
                    .append(",\"online\":")
                    .append(player.online())
                    .append('}');
            }
            json.append("]}");
        }

        String payload = json.append("]}").toString();
        Bukkit.getScheduler().runTaskAsynchronously(
            this,
            () -> sendTownSnapshot(payload, towns.size())
        );
    }

    private long nationKills(Nation nation) {
        long kills = 0;

        for (Resident resident : nation.getResidents()) {
            if (!resident.isNPC() && resident.hasUUID()) {
                kills += Bukkit.getOfflinePlayer(resident.getUUID())
                    .getStatistic(Statistic.PLAYER_KILLS);
            }
        }

        return kills;
    }

    private void sendSnapshot(String payload, int nationCount) {
        HttpRequest request = HttpRequest.newBuilder(endpoint)
            .timeout(Duration.ofSeconds(20))
            .header("Authorization", "Bearer " + syncToken)
            .header("Content-Type", "application/json")
            .POST(HttpRequest.BodyPublishers.ofString(payload))
            .build();

        try {
            HttpResponse<Void> response = httpClient.send(request, HttpResponse.BodyHandlers.discarding());
            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                getLogger().info("Synced the Towny ranking (" + nationCount + " nations).");
            } else if (response.statusCode() == 429) {
                String retryAfter = response.headers().firstValue("Retry-After").orElse("unknown");
                getLogger().warning(
                    "Towny ranking sync was rate-limited (HTTP 429); retry after "
                        + retryAfter + " seconds."
                );
            } else {
                getLogger().warning("Towny ranking sync failed with HTTP " + response.statusCode() + ".");
            }
        } catch (IOException exception) {
            getLogger().log(Level.WARNING, "Could not send the Towny ranking to ZuriLand.", exception);
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            getLogger().log(Level.WARNING, "Towny ranking sync was interrupted.", exception);
        }
    }

    private void sendKillEvent(KillEvent event) {
        String payload = "{\"event_id\":\"" + event.eventId()
            + "\",\"killer_name\":\"" + escapeJson(event.killerName())
            + "\",\"killer_town\":"
            + (event.killerTown() == null ? "null" : "\"" + escapeJson(event.killerTown()) + "\"")
            + ",\"victim_name\":\"" + escapeJson(event.victimName())
            + "\",\"occurred_at\":\"" + event.occurredAt() + "\"}";
        HttpRequest request = HttpRequest.newBuilder(killEventsEndpoint)
            .timeout(Duration.ofSeconds(10))
            .header("Authorization", "Bearer " + syncToken)
            .header("Content-Type", "application/json")
            .POST(HttpRequest.BodyPublishers.ofString(payload))
            .build();

        try {
            HttpResponse<Void> response = httpClient.send(request, HttpResponse.BodyHandlers.discarding());
            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                getLogger().fine("Synced player kill: " + event.killerName() + " eliminated " + event.victimName() + ".");
            } else {
                getLogger().warning("Player kill sync failed with HTTP " + response.statusCode() + ".");
            }
        } catch (IOException exception) {
            getLogger().log(Level.WARNING, "Could not send the player kill to ZuriLand.", exception);
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            getLogger().log(Level.WARNING, "Player kill sync was interrupted.", exception);
        }
    }

    private void sendTownSnapshot(String payload, int townCount) {
        HttpRequest request = HttpRequest.newBuilder(townsEndpoint)
            .timeout(Duration.ofSeconds(20))
            .header("Authorization", "Bearer " + syncToken)
            .header("Content-Type", "application/json")
            .POST(HttpRequest.BodyPublishers.ofString(payload))
            .build();

        try {
            HttpResponse<Void> response = httpClient.send(request, HttpResponse.BodyHandlers.discarding());
            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                getLogger().info("Synced the Towny city roster (" + townCount + " towns).");
            } else {
                getLogger().warning("Towny city roster sync failed with HTTP " + response.statusCode() + ".");
            }
        } catch (IOException exception) {
            getLogger().log(Level.WARNING, "Could not send the Towny city roster to ZuriLand.", exception);
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            getLogger().log(Level.WARNING, "Towny city roster sync was interrupted.", exception);
        }
    }

    private String escapeJson(String value) {
        StringBuilder escaped = new StringBuilder(value.length());
        for (int index = 0; index < value.length(); index++) {
            char character = value.charAt(index);
            switch (character) {
                case '"' -> escaped.append("\\\"");
                case '\\' -> escaped.append("\\\\");
                case '\b' -> escaped.append("\\b");
                case '\f' -> escaped.append("\\f");
                case '\n' -> escaped.append("\\n");
                case '\r' -> escaped.append("\\r");
                case '\t' -> escaped.append("\\t");
                default -> {
                    if (character < 0x20) {
                        escaped.append(String.format("\\u%04x", (int) character));
                    } else {
                        escaped.append(character);
                    }
                }
            }
        }
        return escaped.toString();
    }

    private record NationSnapshot(String name, int towns, int residents, int land, long kills) {
    }

    private record KillEvent(String eventId, String killerName, String killerTown, String victimName, String occurredAt) {
    }

    private record PlayerSnapshot(String name, int kills, boolean online) {
    }

    private record TownSnapshot(String name, List<PlayerSnapshot> players) {
    }

    private record Snapshot(String payload, int nationCount) {
    }
}
