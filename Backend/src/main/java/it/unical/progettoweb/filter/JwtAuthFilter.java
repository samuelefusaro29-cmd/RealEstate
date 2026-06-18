package it.unical.progettoweb.filter;

import it.unical.progettoweb.dao.impl.SellerDao;
import it.unical.progettoweb.dao.impl.UserDao;
import it.unical.progettoweb.model.Seller;
import it.unical.progettoweb.model.User;
import it.unical.progettoweb.service.JwtUtil;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.Optional;

public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final UserDao userDao;
    private final SellerDao sellerDao;

    public JwtAuthFilter(JwtUtil jwtUtil, UserDao userDao, SellerDao sellerDao) {
        this.jwtUtil = jwtUtil;
        this.userDao = userDao;
        this.sellerDao = sellerDao;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);

            if (jwtUtil.isTokenValid(token)) {
                String email = jwtUtil.extractEmail(token);
                String ruolo = jwtUtil.extractRole(token);

                if ("BUYER".equals(ruolo)) {
                    Optional<User> userOpt = userDao.findByEmail(email);
                    if (userOpt.isPresent() && userOpt.get().isBanned()) {
                        SecurityContextHolder.clearContext();
                        response.sendError(HttpServletResponse.SC_FORBIDDEN, "Il tuo account è stato bannato.");
                        return;
                    }
                }

                if ("SELLER".equals(ruolo)) {
                    Optional<Seller> sellerOpt = sellerDao.findByEmail(email);
                    if (sellerOpt.isPresent() && sellerOpt.get().isBanned()) {
                        SecurityContextHolder.clearContext();
                        response.sendError(HttpServletResponse.SC_FORBIDDEN, "Il tuo account è stato bannato.");
                        return;
                    }
                }

                List<SimpleGrantedAuthority> authorities =
                        List.of(new SimpleGrantedAuthority("ROLE_" + ruolo));

                UsernamePasswordAuthenticationToken auth =
                        new UsernamePasswordAuthenticationToken(email, null, authorities);

                SecurityContextHolder.getContext().setAuthentication(auth);
            }
        }

        filterChain.doFilter(request, response);
    }
}