package com.smartcampus.backend.modules.auth.config;

import com.smartcampus.backend.modules.auth.service.GoogleOAuth2UserService;
import com.smartcampus.backend.modules.auth.service.GoogleOidcUserService;
import jakarta.servlet.http.HttpServletResponse;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.AnonymousAuthenticationFilter;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final GoogleOAuth2UserService googleOAuth2UserService;
    private final GoogleOidcUserService googleOidcUserService;
    private final OAuth2LoginSuccessHandler oAuth2LoginSuccessHandler;
    private final OAuth2LoginFailureHandler oAuth2LoginFailureHandler;
    private final ActiveUserSessionFilter activeUserSessionFilter;

    @Value("${app.frontend-url:http://localhost:3000}")
    private String frontendBaseUrl;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http.csrf(csrf -> csrf.disable())
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .securityContext(
                        context ->
                                context.securityContextRepository(securityContextRepository())
                                        .requireExplicitSave(false))
                .authorizeHttpRequests(
                        auth ->
                                auth.requestMatchers(HttpMethod.OPTIONS, "/**")
                                        .permitAll()
                                        .requestMatchers(
                                                "/oauth2/**", "/login/**", "/error", "/actuator/health")
                                        .permitAll()
                                        .requestMatchers(HttpMethod.GET, "/api/v1/health")
                                        .permitAll()
                                        .requestMatchers(HttpMethod.GET, "/api/v1/auth/me")
                                        .permitAll()
                                        .requestMatchers(HttpMethod.POST, "/api/v1/auth/login")
                                        .permitAll()
                                        .requestMatchers(HttpMethod.POST, "/api/v1/auth/change-password")
                                        .authenticated()
                                        .requestMatchers(HttpMethod.POST, "/api/v1/auth/logout")
                                        .authenticated()
                                        .requestMatchers("/api/v1/users/**")
                                        .hasRole("ADMIN")
                                        .requestMatchers(HttpMethod.POST, "/api/v1/bookings/**")
                                        .hasAnyRole("STUDENT", "ADMIN")
                                        .requestMatchers(HttpMethod.PATCH, "/api/v1/bookings/*/review")
                                        .hasRole("ADMIN")
                                        .requestMatchers(HttpMethod.PATCH, "/api/v1/bookings/*/cancel")
                                        .hasAnyRole("STUDENT", "ADMIN")
                                        .requestMatchers(HttpMethod.GET, "/api/v1/bookings/**")
                                        .hasAnyRole("STUDENT", "ADMIN")
                                        .requestMatchers(HttpMethod.DELETE, "/api/v1/bookings/**")
                                        .hasAnyRole("STUDENT", "ADMIN")
                                        .requestMatchers(
                                                HttpMethod.POST,
                                                "/api/v1/resource-categories/**",
                                                "/api/v1/locations/**",
                                                "/api/v1/resources/**")
                                        .hasRole("ADMIN")
                                        .requestMatchers(
                                                HttpMethod.PATCH,
                                                "/api/v1/resource-categories/**",
                                                "/api/v1/locations/**",
                                                "/api/v1/resources/**")
                                        .hasRole("ADMIN")
                                        .requestMatchers(
                                                HttpMethod.PUT,
                                                "/api/v1/resource-categories/**",
                                                "/api/v1/locations/**",
                                                "/api/v1/resources/**")
                                        .hasRole("ADMIN")
                                        .requestMatchers(
                                                HttpMethod.DELETE,
                                                "/api/v1/resource-categories/**",
                                                "/api/v1/locations/**",
                                                "/api/v1/resources/**")
                                        .hasRole("ADMIN")
                                        .anyRequest()
                                        .authenticated())
                .addFilterAfter(activeUserSessionFilter, AnonymousAuthenticationFilter.class)
                .exceptionHandling(
                        exceptions ->
                                exceptions.authenticationEntryPoint(
                                                (request, response, exception) -> {
                                                    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                                                    response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                                                    response.getWriter()
                                                            .write(
                                                                    "{\"message\":\"Authentication required\"}");
                                                })
                                        .accessDeniedHandler(
                                                (request, response, exception) -> {
                                                    response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                                                    response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                                                    response.getWriter()
                                                            .write(
                                                                    "{\"message\":\"You do not have permission to access this resource\"}");
                                                }))
                .oauth2Login(
                        oauth ->
                                oauth.userInfoEndpoint(
                                                userInfo ->
                                                        userInfo.userService(googleOAuth2UserService)
                                                                .oidcUserService(
                                                                        googleOidcUserService))
                                        .successHandler(oAuth2LoginSuccessHandler)
                                        .failureHandler(oAuth2LoginFailureHandler))
                .logout(Customizer.withDefaults())
                .formLogin(form -> form.disable())
                .httpBasic(basic -> basic.disable())
                .sessionManagement(
                        session ->
                                session.sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED));

        return http.build();
    }

    @Bean
    public SecurityContextRepository securityContextRepository() {
        return new HttpSessionSecurityContextRepository();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of(frontendBaseUrl));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
