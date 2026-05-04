import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URI;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicBoolean;

class IpChecker {

    private static final String[] urls = {};
    private static final int DEFAULT_CONSENSUS_THRESHOLD = 3;

    public static void main(String[] args) {
        int consensusThreshold = parseArguments(args);
        Map<String, Integer> ipCounts = new ConcurrentHashMap<>();
        AtomicBoolean found = new AtomicBoolean(false);

        List<CompletableFuture<Void>> futures = new ArrayList<>();

        for (String url : urls) {
            futures.add(CompletableFuture.supplyAsync(() -> checkIp(url))
                    .thenAccept(ip -> {
                        if (ip != null && !found.get()) {
                            ipCounts.merge(ip, 1, Integer::sum);
                            if (ipCounts.get(ip) >= consensusThreshold) {
                                if (found.compareAndSet(false, true)) {
                                    System.out.println(ip);
                                    System.exit(0);
                                }
                            }
                        }
                    }));
        }

        CompletableFuture<Void> allOf = CompletableFuture.allOf(futures.toArray(new CompletableFuture[0]));
        allOf.join();

        // Find the best IP for error message
        String bestIp = null;
        int bestCount = 0;
        for (Map.Entry<String, Integer> entry : ipCounts.entrySet()) {
            if (entry.getValue() > bestCount) {
                bestCount = entry.getValue();
                bestIp = entry.getKey();
            }
        }

        if (bestIp != null) {
            System.err.printf("Not enough IP addresses found to meet ensure count of %d. Found: %s (%d)%n", consensusThreshold, bestIp, bestCount);
        } else {
            System.err.printf("Not enough IP addresses found to meet ensure count of %d. No valid IP found.%n", consensusThreshold);
        }
        System.exit(1);
    }

    private static int parseArguments(String[] args) {
        for (int i = 0; i < args.length; i++) {
            if ("--ensure".equals(args[i]) && i + 1 < args.length) {
                try {
                    return Integer.parseInt(args[i + 1]);
                } catch (NumberFormatException e) {
                    // Ignore and return default
                }
            }
        }
        return DEFAULT_CONSENSUS_THRESHOLD;
    }

    private static boolean validateIp(String ip) {
        return ip.matches("^(\\d{1,3}\\.){3}\\d{1,3}$");
    }

    private static String checkIp(String urlString) {
        try {
            URI uri = new URI(urlString);
            HttpURLConnection connection = (HttpURLConnection) uri.toURL().openConnection();
            connection.setRequestMethod("GET");
            connection.setConnectTimeout(5000);
            connection.setReadTimeout(5000);

            if (connection.getResponseCode() != 200)
                return null;

            BufferedReader in = new BufferedReader(new InputStreamReader(connection.getInputStream()));
            StringBuilder response = new StringBuilder();
            String inputLine;

            while ((inputLine = in.readLine()) != null) {
                response.append(inputLine);
            }
            in.close();

            String ip = response.toString().trim();
            return validateIp(ip) ? ip : null;

        } catch (Exception e) {
            return null;
        }
    }
}
