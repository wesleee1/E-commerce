package com.ecommerce.inventory;

import com.ecommerce.inventory.model.Product;
import com.ecommerce.inventory.service.InventoryService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import static org.junit.jupiter.api.Assertions.assertNotNull;

@SpringBootTest
@ActiveProfiles("test")
class InventoryControllerTest {

    @Autowired
    private InventoryService inventoryService;

    @Test
    void shouldCreateAndReturnProducts() {
        Product created = inventoryService.createProduct(new Product("Test Phone", "Great device", 999.0, 10, "https://picsum.photos/200", "Mobiles"));
        assertNotNull(created.getId());
    }
}
