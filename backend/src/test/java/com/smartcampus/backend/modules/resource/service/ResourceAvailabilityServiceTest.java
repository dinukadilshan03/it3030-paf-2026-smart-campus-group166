package com.smartcampus.backend.modules.resource.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.smartcampus.backend.modules.resource.dto.ReplaceResourceAvailabilityRequest;
import com.smartcampus.backend.modules.resource.dto.ResourceAvailabilityWindowRequest;
import com.smartcampus.backend.modules.resource.dto.ResourceAvailabilityWindowResponse;
import com.smartcampus.backend.modules.resource.entity.Resource;
import com.smartcampus.backend.modules.resource.entity.ResourceAvailabilityWindow;
import com.smartcampus.backend.modules.resource.mapper.ResourceMapper;
import com.smartcampus.backend.modules.resource.repository.ResourceAvailabilityWindowRepository;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class ResourceAvailabilityServiceTest {

    @Mock private ResourceAvailabilityWindowRepository resourceAvailabilityWindowRepository;
    @Mock private ResourceService resourceService;
    @Mock private ResourceMapper resourceMapper;

    private ResourceAvailabilityService resourceAvailabilityService;

    @BeforeEach
    void setUp() {
        resourceAvailabilityService =
                new ResourceAvailabilityService(
                        resourceAvailabilityWindowRepository, resourceService, resourceMapper);
    }

    @Test
    void replaceAvailabilityRejectsInvalidTimeRanges() {
        Resource resource = Resource.builder().id(12L).resourceCode("LAB-12").name("Lab").build();
        ReplaceResourceAvailabilityRequest request =
                new ReplaceResourceAvailabilityRequest(
                        List.of(
                                new ResourceAvailabilityWindowRequest(
                                        (short) 1,
                                        LocalTime.of(12, 0),
                                        LocalTime.of(10, 0),
                                        true,
                                        null,
                                        null)));

        when(resourceService.getManagedResource(12L)).thenReturn(resource);

        assertThatThrownBy(() -> resourceAvailabilityService.replaceAvailability(12L, request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("start time");

        verify(resourceAvailabilityWindowRepository, never()).deleteByResource_Id(12L);
        verify(resourceAvailabilityWindowRepository, never()).saveAll(anyList());
    }

    @Test
    void replaceAvailabilityDeletesExistingWindowsAndReturnsMappedResponses() {
        Resource resource = Resource.builder().id(14L).resourceCode("LAB-14").name("Lab").build();
        ResourceAvailabilityWindow window =
                ResourceAvailabilityWindow.builder()
                        .id(1L)
                        .resource(resource)
                        .dayOfWeek((short) 2)
                        .startTime(LocalTime.of(9, 0))
                        .endTime(LocalTime.of(11, 0))
                        .isAvailable(true)
                        .effectiveFrom(LocalDate.of(2026, 4, 13))
                        .effectiveTo(LocalDate.of(2026, 6, 30))
                        .build();
        ReplaceResourceAvailabilityRequest request =
                new ReplaceResourceAvailabilityRequest(
                        List.of(
                                new ResourceAvailabilityWindowRequest(
                                        (short) 2,
                                        LocalTime.of(9, 0),
                                        LocalTime.of(11, 0),
                                        true,
                                        LocalDate.of(2026, 4, 13),
                                        LocalDate.of(2026, 6, 30))));

        when(resourceService.getManagedResource(14L)).thenReturn(resource);
        when(resourceAvailabilityWindowRepository.findByResource_IdOrderByDayOfWeekAscStartTimeAsc(14L))
                .thenReturn(List.of(window));
        when(resourceMapper.toAvailabilityResponse(window))
                .thenReturn(
                        new ResourceAvailabilityWindowResponse(
                                1L,
                                (short) 2,
                                LocalTime.of(9, 0),
                                LocalTime.of(11, 0),
                                true,
                                LocalDate.of(2026, 4, 13),
                                LocalDate.of(2026, 6, 30)));

        List<ResourceAvailabilityWindowResponse> responses =
                resourceAvailabilityService.replaceAvailability(14L, request);

        verify(resourceAvailabilityWindowRepository).deleteByResource_Id(14L);
        verify(resourceAvailabilityWindowRepository).saveAll(anyList());
        verify(resourceAvailabilityWindowRepository)
                .findByResource_IdOrderByDayOfWeekAscStartTimeAsc(eq(14L));
        assertThat(responses).hasSize(1);
        assertThat(responses.getFirst().dayOfWeek()).isEqualTo((short) 2);
    }
}
