package it.unical.progettoweb.mapper;

import it.unical.progettoweb.model.RentalRequest;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Component;

import java.sql.ResultSet;
import java.sql.SQLException;

@Component
public class RentalRequestRowMapper implements RowMapper<RentalRequest> {

    @Override
    public RentalRequest mapRow(ResultSet rs, int rowNum) throws SQLException {
        RentalRequest r = new RentalRequest();
        r.setId(rs.getInt("id"));
        r.setPostId(rs.getInt("post_id"));
        r.setBuyerId(rs.getInt("buyer_id"));
        r.setMessage(rs.getString("message"));
        var ds = rs.getDate("desired_start");
        if (ds != null) r.setDesiredStart(ds.toLocalDate());
        var de = rs.getDate("desired_end");
        if (de != null) r.setDesiredEnd(de.toLocalDate());
        r.setStatus(rs.getString("status"));
        r.setCreatedAt(rs.getTimestamp("created_at").toLocalDateTime());
        return r;
    }
}