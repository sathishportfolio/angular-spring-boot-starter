package com.example.angularspring.config;

import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE) // Runs before Spring Security filters to capture total
// execution time
public class MdcLoggingFilter implements Filter {

    private static final Logger logger = LoggerFactory.getLogger(MdcLoggingFilter.class);
    private static final String TRACE_ID_KEY = "traceId";

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {

        HttpServletRequest httpRequest = (HttpServletRequest) request;
        HttpServletResponse httpResponse = (HttpServletResponse) response;

        // 1. Generate or extract Trace ID (allows Angular frontend to pass its own
        // traceId header if needed)
        String traceId = httpRequest.getHeader("X-Trace-ID");
        if (traceId == null || traceId.isBlank()) {
            traceId = UUID.randomUUID().toString();
        }

        // 2. Bind the traceId to the current thread's MDC context
        MDC.put(TRACE_ID_KEY, traceId);

        // 3. Inject traceId into response header so Angular can see it in network logs
        httpResponse.setHeader("X-Trace-ID", traceId);

        long startTime = System.currentTimeMillis();
        String method = httpRequest.getMethod();
        String url = httpRequest.getRequestURI();
        String queryString =
                httpRequest.getQueryString() != null ? "?" + httpRequest.getQueryString() : "";

        // Log transaction start
        logger.info(">>> Transaction Started | Method: {} | URL: {}{} ", method, url, queryString);

        try {
            // Forward the transaction down the filter chain to your controllers
            chain.doFilter(request, response);
        } finally {
            long duration = System.currentTimeMillis() - startTime;
            int status = httpResponse.getStatus();

            // Log transaction end with status and accurate duration metrics
            logger.info(
                    "<<< Transaction Ended | Method: {} | URL: {} | Status: {} | Duration: {}ms",
                    method,
                    url,
                    status,
                    duration);

            // 4. CRITICAL: Clear the MDC thread local context map to prevent memory leaks
            // in the Tomcat thread pool
            MDC.clear();
        }
    }
}
