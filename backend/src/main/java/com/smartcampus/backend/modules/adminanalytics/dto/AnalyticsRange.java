package com.smartcampus.backend.modules.adminanalytics.dto;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum AnalyticsRange {
    RANGE_7D("7D", 7),
    RANGE_30D("30D", 30),
    RANGE_90D("90D", 90);

    private final String wireValue;
    private final int days;

    AnalyticsRange(String wireValue, int days) {
        this.wireValue = wireValue;
        this.days = days;
    }

    @JsonValue
    public String wireValue() {
        return wireValue;
    }

    public int days() {
        return days;
    }

    @JsonCreator
    public static AnalyticsRange fromValue(String value) {
        for (AnalyticsRange range : values()) {
            if (range.wireValue.equalsIgnoreCase(value)) {
                return range;
            }
        }
        throw new IllegalArgumentException("Unsupported analytics range: " + value);
    }
}
