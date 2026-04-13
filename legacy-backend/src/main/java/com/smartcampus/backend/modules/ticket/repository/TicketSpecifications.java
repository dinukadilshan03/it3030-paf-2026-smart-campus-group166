package com.smartcampus.backend.modules.ticket.repository;

import com.smartcampus.backend.modules.ticket.entity.Ticket;
import com.smartcampus.backend.modules.ticket.enums.TicketPriority;
import com.smartcampus.backend.modules.ticket.enums.TicketStatus;
import org.springframework.data.jpa.domain.Specification;

public final class TicketSpecifications {

    private TicketSpecifications() {
    }

    public static Specification<Ticket> hasStatus(TicketStatus status) {
        return (root, query, criteriaBuilder) ->
                status == null ? null : criteriaBuilder.equal(root.get("status"), status);
    }

    public static Specification<Ticket> hasPriority(TicketPriority priority) {
        return (root, query, criteriaBuilder) ->
                priority == null ? null : criteriaBuilder.equal(root.get("priority"), priority);
    }

    public static Specification<Ticket> hasCategory(String category) {
        return (root, query, criteriaBuilder) ->
                category == null || category.isBlank()
                        ? null
                        : criteriaBuilder.like(criteriaBuilder.lower(root.get("category")), "%" + category.toLowerCase() + "%");
    }

    public static Specification<Ticket> matchesSearch(String search) {
        return (root, query, criteriaBuilder) -> {
            if (search == null || search.isBlank()) {
                return null;
            }

            String pattern = "%" + search.toLowerCase() + "%";

            return criteriaBuilder.or(
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("description")), pattern),
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("category")), pattern),
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("resource").get("name")), pattern),
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("resource").get("location")), pattern),
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("reportedBy").get("name")), pattern),
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("reportedBy").get("email")), pattern)
            );
        };
    }
}
