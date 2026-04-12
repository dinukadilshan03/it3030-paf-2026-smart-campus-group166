package com.smartcampus.backend.modules.resource.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import com.smartcampus.backend.modules.resource.dto.ResourceAvailabilityWindowResponse;
import com.smartcampus.backend.modules.resource.service.ResourceAvailabilityService;
import java.lang.reflect.Method;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.prepost.PreAuthorize;

@ExtendWith(MockitoExtension.class)
class ResourceAvailabilityControllerTest {

    @Mock private ResourceAvailabilityService resourceAvailabilityService;

    @InjectMocks private ResourceAvailabilityController resourceAvailabilityController;

    @Test
    void replaceAvailabilityIsRestrictedToAdmins() throws NoSuchMethodException {
        Method method =
                ResourceAvailabilityController.class.getDeclaredMethod(
                        "replaceAvailability",
                        Long.class,
                        com.smartcampus.backend.modules.resource.dto.ReplaceResourceAvailabilityRequest
                                .class);
        PreAuthorize annotation = method.getAnnotation(PreAuthorize.class);

        assertThat(annotation).isNotNull();
        assertThat(annotation.value()).isEqualTo("hasRole('ADMIN')");
    }

    @Test
    void returnsAvailabilityFromService() {
        ResourceAvailabilityWindowResponse response =
                new ResourceAvailabilityWindowResponse(
                        1L,
                        (short) 1,
                        LocalTime.of(8, 0),
                        LocalTime.of(10, 0),
                        true,
                        LocalDate.of(2026, 4, 13),
                        LocalDate.of(2026, 6, 13));
        when(resourceAvailabilityService.getAvailability(5L)).thenReturn(List.of(response));

        List<ResourceAvailabilityWindowResponse> responses =
                resourceAvailabilityController.getAvailability(5L);

        assertThat(responses).hasSize(1);
        assertThat(responses.getFirst().id()).isEqualTo(1L);
    }
}
