package com.smartcampus.backend.modules.adminanalytics.service;

import com.smartcampus.backend.modules.adminanalytics.dto.AdminAnalyticsAskResponse;
import com.smartcampus.backend.modules.adminanalytics.dto.AdminAnalyticsInsightsResponse;
import java.util.Map;

public interface AnalyticsAiService {

    AdminAnalyticsInsightsResponse generateInsights(Map<String, Object> snapshot);

    AdminAnalyticsAskResponse answerQuestion(String question, Map<String, Object> snapshot);
}
