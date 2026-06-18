package it.unical.progettoweb.dao.impl;

import it.unical.progettoweb.dao.PostDao;
import it.unical.progettoweb.mapper.PostRowMapper;
import it.unical.progettoweb.model.Photo;
import it.unical.progettoweb.model.Post;
import lombok.AllArgsConstructor;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
@AllArgsConstructor
public class PostDaoImpl implements PostDao {

    private final JdbcTemplate jdbcTemplate;
    private final RowMapper<Post> rowMapper;

    @Override
    public Post save(Post post) {
        jdbcTemplate.update(
                "INSERT INTO posts (id, title, description, previous_price, current_price, " +
                        "created_at, id_seller, id_real_estate, listing_type, rental_price_monthly, sold) " +
                        "VALUES (?, ?, ?, ?, ?, NOW(), ?, ?, ?, ?, ?)",
                post.getId(), post.getTitle(), post.getDescription(),
                post.getPreviousPrice(), post.getCurrentPrice(),
                post.getSellerId(), post.getRealEstateId(),
                post.getListingType() != null ? post.getListingType() : "SALE",
                post.getRentalPriceMonthly(),
                post.isSold()
        );
        return post;
    }

    @Override
    public Optional<Post> get(Integer id) {
        try {
            return Optional.ofNullable(
                    jdbcTemplate.queryForObject("SELECT * FROM posts WHERE id=?", rowMapper, id)
            );
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    @Override
    public List<Post> getAll() {
        return jdbcTemplate.query(
                "SELECT * FROM posts ORDER BY created_at DESC",
                rowMapper
        );
    }

    @Override
    public Post update(Post post) {
        jdbcTemplate.update(
                "UPDATE posts SET title=?, description=?, previous_price=?, current_price=?, " +
                        "id_seller=?, id_real_estate=?, listing_type=?, rental_price_monthly=?, sold=? WHERE id=?",
                post.getTitle(), post.getDescription(),
                post.getPreviousPrice(), post.getCurrentPrice(),
                post.getSellerId(), post.getRealEstateId(),
                post.getListingType(), post.getRentalPriceMonthly(),
                post.isSold(),
                post.getId()
        );

        if (post.getPhotos() != null) {
            replacePhotos(post.getId(), post.getPhotos());
        }
        return post;
    }

    private void replacePhotos(int postId, List<Photo> photos) {
        if (photos.isEmpty()) {
            jdbcTemplate.update("DELETE FROM photos WHERE post_id = ?", postId);
            return;
        }
        List<String> existingUrls = jdbcTemplate.queryForList(
                "SELECT url FROM photos WHERE post_id = ?",
                String.class, postId
        );
        List<String> newUrls = photos.stream().map(Photo::getUrl).toList();
        List<String> toDelete = existingUrls.stream()
                .filter(url -> !newUrls.contains(url))
                .toList();
        for (String url : toDelete) {
            jdbcTemplate.update("DELETE FROM photos WHERE post_id = ? AND url = ?", postId, url);
        }
    }

    @Override
    public void delete(Integer id) {
        jdbcTemplate.update("DELETE FROM posts WHERE id=?", id);
    }

    @Override
    public List<Post> findBySellerId(int sellerId) {
        return jdbcTemplate.query(
                "SELECT * FROM posts WHERE id_seller=? ORDER BY created_at DESC",
                rowMapper, sellerId
        );
    }

    @Override
    public List<Post> findByRealEstateId(int realEstateId) {
        return jdbcTemplate.query(
                "SELECT * FROM posts WHERE id_real_estate=? ORDER BY created_at DESC",
                rowMapper, realEstateId
        );
    }

    @Override
    public List<Post> findAllOrderByPriceAsc() {
        return jdbcTemplate.query(
                "SELECT * FROM posts ORDER BY current_price ASC",
                rowMapper
        );
    }

    @Override
    public List<Post> findAllOrderByPriceDesc() {
        return jdbcTemplate.query(
                "SELECT * FROM posts ORDER BY current_price DESC",
                rowMapper
        );
    }

    @Override
    public void reducePrice(int postId, double newPrice) {
        jdbcTemplate.update(
                "UPDATE posts SET previous_price=current_price, current_price=? WHERE id=?",
                newPrice, postId
        );
    }

    @Override
    public List<Post> findByListingType(String listingType) {
        return jdbcTemplate.query(
                "SELECT * FROM posts WHERE listing_type=? ORDER BY created_at DESC",
                rowMapper, listingType
        );
    }

    public void markAsSold(int postId) {
        jdbcTemplate.update(
                "UPDATE posts SET sold=true WHERE id=?",
                postId
        );
    }
}