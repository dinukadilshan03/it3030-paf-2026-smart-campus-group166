package com.smartcampus.backend.modules.ai;

import com.smartcampus.backend.modules.resource.dto.ResourceSummaryResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/ai")
public class AIController {

    @Autowired
    private AIRecommendationService aiService;

    @PostMapping(path = "/recommendations", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public List<ResourceSummaryResponse> recommendations(@RequestBody AIRequest request) {
        return aiService.getRecommendations(request);
    }
}
