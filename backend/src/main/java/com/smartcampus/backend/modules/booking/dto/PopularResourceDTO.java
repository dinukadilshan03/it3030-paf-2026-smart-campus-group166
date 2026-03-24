package com.smartcampus.backend.modules.booking.dto;

public class PopularResourceDTO {

    private Long resourceId;
    private String resourceName;
    private Long usageCount;

    public PopularResourceDTO() {}

    public PopularResourceDTO(Long resourceId, String resourceName, Long usageCount) {
        this.resourceId = resourceId;
        this.resourceName = resourceName;
        this.usageCount = usageCount;
    }

    public Long getResourceId() {
        return resourceId;
    }

    public void setResourceId(Long resourceId) {
        this.resourceId = resourceId;
    }

    public String getResourceName() {
        return resourceName;
    }

    public void setResourceName(String resourceName) {
        this.resourceName = resourceName;
    }

    public Long getUsageCount() {
        return usageCount;
    }

    public void setUsageCount(Long usageCount) {
        this.usageCount = usageCount;
    }
}
