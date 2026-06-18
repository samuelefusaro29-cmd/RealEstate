package it.unical.progettoweb.mapper;

import it.unical.progettoweb.model.User;
import org.springframework.stereotype.Component;

import java.sql.ResultSet;
import java.sql.SQLException;


@Component
public class UserRowMapper extends PersonRowMapper<User> {

    @Override
    public User mapRow(ResultSet rs, int rowNum) throws SQLException {
        User user = new User();
        mapPersonFields(user, rs);
        java.sql.Date birthDate = rs.getDate("birthdate");
        user.setBirthDate(birthDate != null ? birthDate.toLocalDate() : null);
        user.setAuthProvider(rs.getString("auth_provider"));
        user.setBanned(rs.getBoolean("is_banned"));
        return user;
    }
}
