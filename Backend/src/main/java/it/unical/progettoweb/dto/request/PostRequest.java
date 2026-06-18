package it.unical.progettoweb.dto.request;

import it.unical.progettoweb.model.Photo;
import lombok.Data;

import java.util.List;

@Data
public class PostRequest {

    private String title;
    private String description;
    private double currentPrice;
    private int realEstateId;
    private List<Photo> photoUrls;
    private String listingType; //SALE o Request ma SALE di default
    private Double rentalPriceMonthly;
}