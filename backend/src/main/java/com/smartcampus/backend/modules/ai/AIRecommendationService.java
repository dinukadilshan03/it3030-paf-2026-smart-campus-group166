package com.smartcampus.backend.modules.ai;

import com.smartcampus.backend.common.enums.ResourceStatus;
import com.smartcampus.backend.modules.resource.dto.ResourceSummaryResponse;
import com.smartcampus.backend.modules.resource.entity.Resource;
import com.smartcampus.backend.modules.resource.mapper.ResourceMapper;
import com.smartcampus.backend.modules.resource.repository.ResourceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
public class AIRecommendationService {

    @Autowired
    private ResourceRepository resourceRepository;

    @Autowired
    private ResourceMapper resourceMapper;

    @Transactional(readOnly = true)
    public List<ResourceSummaryResponse> getRecommendations(AIRequest request) {

        // Convert natural language → structured request
        if (request != null && request.getQuery() != null && !request.getQuery().isEmpty()) {
            request = parseQuery(request.getQuery());
        }

        List<Resource> resources = resourceRepository.findAll();

        AIRequest effectiveRequest = request != null ? request : new AIRequest();

        String lowerQuery = effectiveRequest.getQuery() != null ? effectiveRequest.getQuery().toLowerCase() : "";

        // perform filtering and scoring while session is open, then map to DTOs
        List<Resource> filtered = resources.stream()

                // only ACTIVE resources
                .filter(r -> r.getStatus() == ResourceStatus.ACTIVE)

                // TYPE → match resourceCategory name (contains, case-insensitive)
                .filter(r -> {
                    if (effectiveRequest.getType() == null) return true;
                    if (r.getResourceCategory() == null || r.getResourceCategory().getName() == null) return false;
                    String cat = r.getResourceCategory().getName().toLowerCase();
                    return cat.contains(effectiveRequest.getType().toLowerCase());
                })

                // CAPACITY (null-safe)
                .filter(r -> effectiveRequest.getCapacity() == 0 ||
                        (r.getCapacity() != null && r.getCapacity() >= effectiveRequest.getCapacity()))

                // AI scoring - composite score
                .sorted((a, b) -> Integer.compare(scoreResource(a, effectiveRequest, lowerQuery), scoreResource(b, effectiveRequest, lowerQuery)))

                .limit(10)
                .collect(Collectors.toList());

        return filtered.stream()
                .map(resourceMapper::toResourceSummary)
                .limit(5)
                .collect(Collectors.toList());
    }

    private AIRequest parseQuery(String query) {
        AIRequest req = new AIRequest();
        String lower = query.toLowerCase();

        // preserve original query for token matching
        req.setQuery(lower);
        // basic canonical type mapping + synonyms
        if (lower.contains("lab")) req.setType("Computer Lab");
        else if (lower.contains("seminar")) req.setType("Seminar Room");
        else if (lower.contains("meeting") || lower.contains("conference") || lower.contains("boardroom") || lower.contains("meetings")) req.setType("Meeting Room");
        else if (lower.contains("lecture") || lower.contains("hall")) req.setType("Lecture Hall");
        else if (lower.contains("room")) req.setType("Room");
        else if (lower.contains("equipment")) req.setType("Equipment");

        // attempt to match against known category and location names present in DB resources
        try {
            List<Resource> all = resourceRepository.findAll();
            for (Resource res : all) {
                if (res.getResourceCategory() != null && res.getResourceCategory().getName() != null) {
                    String cat = res.getResourceCategory().getName().toLowerCase();
                    if (lower.contains(cat)) {
                        req.setType(res.getResourceCategory().getName());
                        break;
                    }
                }
            }
            for (Resource res : all) {
                if (res.getLocation() != null && res.getLocation().getName() != null) {
                    String loc = res.getLocation().getName().toLowerCase();
                    if (lower.contains(loc)) {
                        req.setPreferredLocation(res.getLocation().getName());
                        break;
                    }
                }
            }
        } catch (Exception ignored) {
            // repository access best-effort during parsing; fall back to token mapping above
        }

        Pattern pattern = Pattern.compile("\\d+");
        Matcher matcher = pattern.matcher(lower);
        if (matcher.find()) {
            req.setCapacity(Integer.parseInt(matcher.group()));
        }

        return req;
    }

    // composite scoring: capacity diff + type mismatch penalty - textual match bonuses
    private int scoreResource(Resource r, AIRequest req, String lowerQuery) {
        int score = 0;

        // capacity component (smaller difference preferred)
        int reqCap = req.getCapacity();
        int cap = r.getCapacity() != null ? r.getCapacity() : 0;
        if (reqCap > 0) {
            // smaller difference preferred, but scale down influence
            score += Math.abs(cap - reqCap) / 2;
            // prefer exact or slightly larger capacities; smaller penalty for undersized
            if (cap < reqCap) score += 10;
        }

        // type match - boost if resource category/name contains requested type token
        String typeToken = req.getType() != null ? req.getType().toLowerCase() : null;
        boolean typeMatch = false;
        if (typeToken != null && !typeToken.isEmpty()) {
            if (r.getResourceCategory() != null && r.getResourceCategory().getName() != null && r.getResourceCategory().getName().toLowerCase().contains(typeToken)) typeMatch = true;
            if (!typeMatch && r.getName() != null && r.getName().toLowerCase().contains(typeToken)) typeMatch = true;
            if (!typeMatch && r.getResourceCode() != null && r.getResourceCode().toLowerCase().contains(typeToken)) typeMatch = true;
            if (!typeMatch) score += 20; // penalty for missing explicit type match (reduced)
        }

        // preferred location boost/penalty
        String prefLoc = req.getPreferredLocation() != null ? req.getPreferredLocation().toLowerCase() : null;
        if (prefLoc != null && !prefLoc.isEmpty()) {
            boolean locMatch = false;
            if (r.getLocation() != null && r.getLocation().getName() != null && r.getLocation().getName().toLowerCase().contains(prefLoc)) locMatch = true;
            if (locMatch) score -= 30; // strong bonus for preferred location
            else score += 5; // small penalty if not in preferred location
        }

        // textual query token matches across name, description, category, location
        if (lowerQuery != null && !lowerQuery.isBlank()) {
            String[] tokens = lowerQuery.split("\\s+");
            int matchCount = 0;
            for (String t : tokens) {
                if (t.length() < 2) continue;
                if (r.getName() != null && r.getName().toLowerCase().contains(t)) matchCount += 2;
                if (r.getDescription() != null && r.getDescription().toLowerCase().contains(t)) matchCount++;
                if (r.getResourceCategory() != null && r.getResourceCategory().getName() != null && r.getResourceCategory().getName().toLowerCase().contains(t)) matchCount += 2;
                if (r.getLocation() != null && r.getLocation().getName() != null && r.getLocation().getName().toLowerCase().contains(t)) matchCount++;
            }
            score -= matchCount * 12; // reward textual matches more strongly
        }

        return score;
    }
}
