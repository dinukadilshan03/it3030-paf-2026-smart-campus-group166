package com.smartcampus.backend.modules.resource.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.smartcampus.backend.common.entity.Role;
import com.smartcampus.backend.common.entity.User;
import com.smartcampus.backend.common.entity.UserRole;
import com.smartcampus.backend.common.enums.ResourceStatus;
import com.smartcampus.backend.common.enums.RoleCode;
import com.smartcampus.backend.common.enums.UserStatus;
import com.smartcampus.backend.common.exception.ResourceConflictException;
import com.smartcampus.backend.common.service.SupabaseStorageService;
import com.smartcampus.backend.modules.auth.service.CurrentUserService;
import com.smartcampus.backend.modules.resource.dto.CreateResourceRequest;
import com.smartcampus.backend.modules.resource.dto.ResourceDetailResponse;
import com.smartcampus.backend.modules.resource.entity.Location;
import com.smartcampus.backend.modules.resource.entity.Resource;
import com.smartcampus.backend.modules.resource.entity.ResourceCategory;
import com.smartcampus.backend.modules.resource.mapper.ResourceMapper;
import com.smartcampus.backend.modules.resource.repository.ResourceAvailabilityWindowRepository;
import com.smartcampus.backend.modules.resource.repository.ResourceRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.TypedQuery;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class ResourceServiceTest {

    @Mock private ResourceRepository resourceRepository;
    @Mock private ResourceAvailabilityWindowRepository resourceAvailabilityWindowRepository;
    @Mock private ResourceCategoryService resourceCategoryService;
    @Mock private LocationService locationService;
    @Mock private CurrentUserService currentUserService;
    @Mock private ResourceMapper resourceMapper;
    @Mock private EntityManager entityManager;
    @Mock private SupabaseStorageService storageService;
    @Mock private TypedQuery<Long> bookingCountQuery;
    @Mock private TypedQuery<Long> ticketCountQuery;

    private ResourceService resourceService;

    @BeforeEach
    void setUp() {
        resourceService =
                new ResourceService(
                        resourceRepository,
                        resourceAvailabilityWindowRepository,
                        resourceCategoryService,
                        locationService,
                        currentUserService,
                        resourceMapper,
                        entityManager,
                        storageService);
    }

    @Test
    void createSetsAuditUsersAndNormalizesResourceCode() {
        ResourceCategory category = ResourceCategory.builder().id(10L).code("ROOM").name("Rooms").build();
        Location location = Location.builder().id(20L).code("LIB").name("Library").build();
        User actingUser =
                User.builder().id(30L).email("admin@example.com").status(UserStatus.ACTIVE).build();
        UserRole currentRole =
                UserRole.builder()
                        .user(actingUser)
                        .role(Role.builder().id(1L).code(RoleCode.ADMIN).name("Admin").build())
                        .isActive(true)
                        .build();
        CreateResourceRequest request =
                new CreateResourceRequest(
                        10L,
                        20L,
                        " lab-01 ",
                        "Computer Lab",
                        "Lab for classes",
                        40,
                        ResourceStatus.ACTIVE,
                        null,
                        "Priority room",
                        "https://example.com/lab.png");

        when(resourceCategoryService.getManagedCategory(10L)).thenReturn(category);
        when(locationService.getManagedLocation(20L)).thenReturn(location);
        when(currentUserService.getCurrentUserRole()).thenReturn(Optional.of(currentRole));
        when(resourceRepository.save(any(Resource.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(resourceMapper.toResourceDetail(any(Resource.class)))
                .thenReturn(
                        new ResourceDetailResponse(
                                1L,
                                "LAB-01",
                                "Computer Lab",
                                "Lab for classes",
                                40,
                                ResourceStatus.ACTIVE,
                                true,
                                "https://example.com/lab.png",
                                "Priority room",
                                null,
                                null));

        ResourceDetailResponse response = resourceService.create(request);

        ArgumentCaptor<Resource> resourceCaptor = ArgumentCaptor.forClass(Resource.class);
        verify(resourceRepository).save(resourceCaptor.capture());
        Resource savedResource = resourceCaptor.getValue();
        assertThat(savedResource.getResourceCode()).isEqualTo("LAB-01");
        assertThat(savedResource.getCreatedByUser()).isEqualTo(actingUser);
        assertThat(savedResource.getUpdatedByUser()).isEqualTo(actingUser);
        assertThat(savedResource.getRequiresApproval()).isTrue();
        assertThat(response.resourceCode()).isEqualTo("LAB-01");
    }

    @Test
    void deleteRejectsWhenBookingsStillReferenceResource() {
        Resource resource = Resource.builder().id(99L).resourceCode("LAB-99").name("Lab").build();

        when(resourceRepository.findById(99L)).thenReturn(Optional.of(resource));
        when(entityManager.createQuery(
                        "select count(b) from Booking b where b.resource.id = :resourceId",
                        Long.class))
                .thenReturn(bookingCountQuery);
        when(bookingCountQuery.setParameter("resourceId", 99L)).thenReturn(bookingCountQuery);
        when(bookingCountQuery.getSingleResult()).thenReturn(1L);

        assertThatThrownBy(() -> resourceService.delete(99L))
                .isInstanceOf(ResourceConflictException.class)
                .hasMessageContaining("bookings");

        verify(resourceAvailabilityWindowRepository, never()).deleteByResource_Id(any(Long.class));
        verify(resourceRepository, never()).delete(any(Resource.class));
    }

    @Test
    void deleteRemovesAvailabilityBeforeDeletingResource() {
        Resource resource = Resource.builder().id(77L).resourceCode("HALL-1").name("Hall").build();

        when(resourceRepository.findById(77L)).thenReturn(Optional.of(resource));
        when(entityManager.createQuery(
                        "select count(b) from Booking b where b.resource.id = :resourceId",
                        Long.class))
                .thenReturn(bookingCountQuery);
        when(bookingCountQuery.setParameter("resourceId", 77L)).thenReturn(bookingCountQuery);
        when(bookingCountQuery.getSingleResult()).thenReturn(0L);
        when(entityManager.createQuery(
                        "select count(t) from Ticket t where t.resource.id = :resourceId",
                        Long.class))
                .thenReturn(ticketCountQuery);
        when(ticketCountQuery.setParameter("resourceId", 77L)).thenReturn(ticketCountQuery);
        when(ticketCountQuery.getSingleResult()).thenReturn(0L);

        resourceService.delete(77L);

        verify(resourceAvailabilityWindowRepository).deleteByResource_Id(77L);
        verify(resourceRepository).delete(resource);
    }
}
