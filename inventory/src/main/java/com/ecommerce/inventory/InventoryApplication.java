package com.ecommerce.inventory;

import com.ecommerce.inventory.model.Product;
import com.ecommerce.inventory.repository.ProductRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.kafka.annotation.EnableKafka;

import java.util.List;

@SpringBootApplication
@EnableKafka
public class InventoryApplication {

	public static void main(String[] args) {
		SpringApplication.run(InventoryApplication.class, args);
	}

	@Bean
	CommandLineRunner seedProducts(ProductRepository productRepository) {
		return args -> {
			if (productRepository.count() == 0) {
				productRepository.saveAll(List.of(
						new Product("iPhone 15", "Latest Apple flagship phone", 79999.0, 35, "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80", "Mobiles"),
						new Product("Samsung Galaxy S24", "Premium AMOLED experience", 69999.0, 24, "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=800&q=80", "Mobiles"),
						new Product("Noise Smart Watch", "Track fitness and notifications", 3499.0, 120, "https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=800&q=80", "Electronics"),
						new Product("Nike Air Jacket", "Lightweight comfort wear", 4999.0, 80, "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80", "Fashion")
				));
			}
		};
	}
}
