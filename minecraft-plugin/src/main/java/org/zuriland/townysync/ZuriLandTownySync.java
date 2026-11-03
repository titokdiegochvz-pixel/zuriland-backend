package org.zuriland.townysync;

import com.palmergames.bukkit.towny.TownyUniverse;
import com.palmergames.bukkit.towny.object.Nation;
import org.bukkit.Bukkit;
import org.bukkit.plugin.java.JavaPlugin;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.logging.Level;

public final class ZuriLandTownySync extends JavaPlugin {
    private HttpClient httpClient;
    private URI endpoint;
    private String syncToken;
    private int syncIntervalSeconds;

    @Override
    public void onEnable() {
        saveDefaultConfig();

        String apiUrl = getConfig().getString("api-url", "").trim();
        syncToken = getConfig().getString("sync-token", "").trim();
        syncIntervalSeconds = getConfig().getInt("sync-interval-seconds", 300);

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

        try {
            URI baseUri = URI.create(apiUrl.replaceAll("/+$", ""));
            if (!"https".equalsIgnoreCase(baseUri.getScheme()) || baseUri.getHost() == null) {
                getLogger().severe("api-url must be a valid HTTPS URL.");
                getServer().getPluginManager().disablePlugin(this);
                return;
            }
            endpoint = baseUri.resolve("/api/towny/ranking");
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
        getLogger().info("Towny rankings will sync to ZuriLand every " + syncIntervalSeconds + " seconds.");
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
                nation.getTownBlocks().size()
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
                .append('}');
        }
        return new Snapshot(json.append("]}").toString(), nations.size());
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

    private record NationSnapshot(String name, int towns, int residents, int land) {
    }

    private record Snapshot(String payload, int nationCount) {
    }
}
