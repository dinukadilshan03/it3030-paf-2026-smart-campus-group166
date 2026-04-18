package com.smartcampus.backend.modules.ticket.entity;

import com.smartcampus.backend.common.entity.User;
import com.smartcampus.backend.common.enums.TicketReportFormat;
import com.smartcampus.backend.common.enums.TicketReportStatus;
import com.smartcampus.backend.common.enums.TicketReportType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "ticket_reports")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TicketReport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "generated_by_user_id", nullable = false)
    private User generatedByUser;

    @Enumerated(EnumType.STRING)
    @Column(name = "report_type", nullable = false, length = 20)
    private TicketReportType reportType;

    @Enumerated(EnumType.STRING)
    @Column(name = "format", nullable = false, length = 10)
    private TicketReportFormat format;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private TicketReportStatus status;

    @Column(name = "record_count", nullable = false)
    private Integer recordCount;

    @Column(name = "file_name", nullable = false, length = 255)
    private String fileName;

    @Column(name = "mime_type", nullable = false, length = 100)
    private String mimeType;

    @Column(name = "filter_json")
    private String filterJson;

    @Column(name = "filter_summary", length = 500)
    private String filterSummary;

    @Column(name = "summary_text")
    private String summaryText;

    @Column(name = "natural_language_request")
    private String naturalLanguageRequest;

    @JdbcTypeCode(SqlTypes.VARBINARY)
    @Column(name = "file_data", nullable = false, columnDefinition = "bytea")
    private byte[] fileData;

    @Column(name = "generated_at", nullable = false, updatable = false)
    private LocalDateTime generatedAt;

    @PrePersist
    protected void onCreate() {
        if (generatedAt == null) {
            generatedAt = LocalDateTime.now();
        }
    }
}
