package com.smartcampus.backend.modules.resource.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import com.smartcampus.backend.common.enums.ResourceStatus;
import com.smartcampus.backend.modules.resource.dto.ResourceSummaryResponse;
import com.smartcampus.backend.modules.resource.service.ResourceService;
import java.lang.reflect.Method;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.prepost.PreAuthorize;

@ExtendWith(MockitoExtension.class)
class ResourceControllerTest {

    @Mock private ResourceService resourceService;

    @InjectMocks private ResourceController resourceController;

    @Test
    void createResourceIsRestrictedToAdmins() throws NoSuchMethodException {
        Method method =
                ResourceController.class.getDeclaredMethod(
                        "createResource",
                        com.smartcampus.backend.modules.resource.dto.CreateResourceRequest.class);
        PreAuthorize annotation = method.getAnnotation(PreAuthorize.class);

        assertThat(annotation).isNotNull();
        assertThat(annotation.value()).isEqualTo("hasRole('ADMIN')");
    }

    @Test
    void returnsFilteredResourcesFromService() {
        ResourceSummaryResponse summary =
                new ResourceSummaryResponse(
                        1L,
                        "LAB-01",
                        "Computer Lab",
                        2L,
                        "LABS",
                        "Labs",
                        3L,
                        "BLD-A",
                        "Building A",
                        40,
                        ResourceStatus.ACTIVE,
                        true,
                        null);
        when(resourceService.getResources(2L, 3L, ResourceStatus.ACTIVE, 20, "lab"))
                .thenReturn(List.of(summary));

        List<ResourceSummaryResponse> responses =
                resourceController.getResources(2L, 3L, ResourceStatus.ACTIVE, 20, "lab");

        assertThat(responses).hasSize(1);
        assertThat(responses.getFirst().resourceCode()).isEqualTo("LAB-01");
    }
}
