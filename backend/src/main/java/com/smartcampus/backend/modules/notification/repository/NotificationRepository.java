package com.smartcampus.backend.modules.notification.repository;

import com.smartcampus.backend.modules.notification.entity.Notification;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    @Query(
            """
            select n
            from Notification n
            where n.user.id = :userId
              and (:unreadOnly = false or n.isRead = false)
            order by n.createdAt desc, n.id desc
            """)
    List<Notification> findVisibleToUser(
            @Param("userId") Long userId,
            @Param("unreadOnly") boolean unreadOnly,
            Pageable pageable);

    long countByUser_IdAndIsReadFalse(Long userId);

    List<Notification> findByUser_IdAndIsReadFalseOrderByCreatedAtDesc(Long userId);

    Optional<Notification> findByIdAndUser_Id(Long id, Long userId);
}
