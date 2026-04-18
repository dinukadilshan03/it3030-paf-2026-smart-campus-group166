package com.smartcampus.backend.modules.auth.repository;

import com.smartcampus.backend.common.enums.AuthEventType;
import com.smartcampus.backend.modules.auth.entity.AuthEvent;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AuthEventRepository extends JpaRepository<AuthEvent, Long> {

    @Query(
            """
            select ae
            from AuthEvent ae
            left join fetch ae.user u
            where ae.createdAt >= :start
              and ae.createdAt < :end
            order by ae.createdAt desc, ae.id desc
            """)
    List<AuthEvent> findByCreatedAtBetween(
            @Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    long countByEventTypeInAndCreatedAtGreaterThanEqualAndCreatedAtLessThan(
            Collection<AuthEventType> eventTypes, LocalDateTime start, LocalDateTime end);
}
