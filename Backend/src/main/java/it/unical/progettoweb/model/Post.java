package it.unical.progettoweb.model;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class Post {
    private Integer id;
    private String title;
    private String description;
    private double previousPrice;
    private double currentPrice;
    private LocalDateTime createdAt;
    private int sellerId;
    private int realEstateId;
    private String listingType;
    private Double rentalPriceMonthly;
    private boolean sold;
    private List<Photo> photos;
    private List<Review> reviews;
}