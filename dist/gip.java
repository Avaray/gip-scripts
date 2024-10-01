import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URI;
import java.net.URL;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

public class IpChecker {

    private static final String[] urls = {
"http://eth0.me",
"http://ipv4.whatismyip.akamai.com",
"https://api-ipv4.ip.sb/ip",
"https://api.ipify.org",
"https://api.myip.la",
"https://checkip.amazonaws.com",
"https://icanhazip.com",
"https://ifconfig.co",
"https://ifconfig.io",
"https://ifconfig.me/ip",
"https://ip.gs",
"https://ip.sb",
"https://ip.tyk.nu",
"https://ip.xdty.org",
"https://ipapi.co/ip",
"https://ipconfig.io",
"https://ipecho.net/plain",
"https://ipinfo.io/ip",
"https://ipv4.appspot.com",
"https://ipv4.icanhazip.com",
"https://ipv4.wtfismyip.com/text",
"https://l2.io/ip",
"https://myexternalip.com/raw",
"https://myip.dnsomatic.com",
"https://myip.ustclug.org",
"https://v4.ident.me",
"https://wgetip.com",
"https://www.uc.cn/ip",
};
    private static final int DEFAULT_CONSENSUS_THRESHOLD = 3;

    public static void main(String[] args) {
        int consensusThreshold = parseArguments(args);
        Map<String, Integer> ipCounts = new HashMap<>();

        List<CompletableFuture<Void>> futures = new ArrayList<>();

        for (String url : urls) {
            futures.add(CompletableFuture.supplyAsync(() -> checkIp(url))
              .thenAccept(ip -> {
                  if (ip != null) {
                      ipCounts.put(ip, ipCounts.getOrDefault(ip, 0) + 1);
                      if (ipCounts.get(ip) >= consensusThreshold) {
                          System.out.println(ip);
                          System.exit(0);
                      }
                  }
              }));
        }

        CompletableFuture<Void> allOf = CompletableFuture.allOf(futures.toArray(new CompletableFuture[0]));
        allOf.join(); // Wait for all futures to complete

        System.err.println("Could not determine external IPv4 address");
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
            URI uri = new URI(urlString); // Use URI instead of URL constructor
            HttpURLConnection connection = (HttpURLConnection) uri.toURL().openConnection();
            connection.setRequestMethod("GET");
            connection.setConnectTimeout(5000);
            connection.setReadTimeout(5000);
            
            if (connection.getResponseCode() != 200) return null;

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
