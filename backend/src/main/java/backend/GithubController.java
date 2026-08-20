package backend;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;

@CrossOrigin(origins = "http://localhost:5173")
@RestController
public class GithubController {


@Value("${github.token}")
private String githubToken;

@GetMapping("/github")
public String github(@RequestParam String repo) {

    String url = "https://api.github.com/repos/" + repo;

    return githubRequest(url);
}

@GetMapping("/github/pulls")
public String pulls(@RequestParam String repo) {

    String url = "https://api.github.com/repos/" + repo
            + "/pulls?state=all&per_page=100";

    return githubRequest(url);
}

@GetMapping("/github/reviews")
public String reviews(
        @RequestParam String repo,
        @RequestParam int number) {

    String url = "https://api.github.com/repos/" + repo
            + "/pulls/" + number + "/reviews";

    return githubRequest(url);
}

private String githubRequest(String url) {

    HttpHeaders headers = new HttpHeaders();
    headers.set("Authorization", "Bearer " + githubToken);
    headers.set("Accept", "application/vnd.github+json");

    HttpEntity<String> entity = new HttpEntity<>(headers);

    RestTemplate restTemplate = new RestTemplate();

    ResponseEntity<String> response = restTemplate.exchange(
            url,
            HttpMethod.GET,
            entity,
            String.class
    );

    return response.getBody();
}


}
