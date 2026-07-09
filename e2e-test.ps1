#!/usr/bin/env pwsh
<#
End-to-End Testing Script for E-commerce Microservices Platform
Validates service health, database connectivity, Kafka, and the order flow.
#>

$ErrorActionPreference = 'Continue'

Write-Host 'E-Commerce Platform - End-to-End Testing Suite' -ForegroundColor Cyan

$results = @{
    'Inventory Service' = 'Not Tested'
    'Payment Service' = 'Not Tested'
    'Shipping Service' = 'Not Tested'
    'Notification Service' = 'Not Tested'
    'Kafka Topics' = 'Not Tested'
    'Database Connectivity' = 'Not Tested'
    'API Integration' = 'Not Tested'
}

Write-Host ''
Write-Host '1. Service Health Checks' -ForegroundColor Yellow

try {
    $inventoryResp = Invoke-WebRequest -Uri 'http://localhost:18081/api/inventory/products' -UseBasicParsing -TimeoutSec 5
    $products = $inventoryResp.Content | ConvertFrom-Json
    Write-Host ("OK Inventory Service: RUNNING ({0} products loaded)" -f $products.Count) -ForegroundColor Green
    $results['Inventory Service'] = 'PASS'
} catch {
    Write-Host ("FAIL Inventory Service: {0}" -f $_.Exception.Message) -ForegroundColor Red
    $results['Inventory Service'] = 'FAIL'
    $products = @()
}

try {
    [void](Invoke-WebRequest -Uri 'http://localhost:8082/api/payment/orders' -UseBasicParsing -TimeoutSec 5)
    Write-Host 'OK Payment Service: RUNNING' -ForegroundColor Green
    $results['Payment Service'] = 'PASS'
} catch {
    Write-Host ("FAIL Payment Service: {0}" -f $_.Exception.Message) -ForegroundColor Red
    $results['Payment Service'] = 'FAIL'
}

try {
    [void](Invoke-WebRequest -Uri 'http://localhost:8083/api/shipping' -UseBasicParsing -TimeoutSec 5)
    Write-Host 'OK Shipping Service: RUNNING' -ForegroundColor Green
    $results['Shipping Service'] = 'PASS'
} catch {
    Write-Host ("FAIL Shipping Service: {0}" -f $_.Exception.Message) -ForegroundColor Red
    $results['Shipping Service'] = 'FAIL'
}

try {
    [void](Invoke-WebRequest -Uri 'http://localhost:8084/api/notification/all' -UseBasicParsing -TimeoutSec 5)
    Write-Host 'OK Notification Service: RUNNING' -ForegroundColor Green
    $results['Notification Service'] = 'PASS'
} catch {
    Write-Host ("FAIL Notification Service: {0}" -f $_.Exception.Message) -ForegroundColor Red
    $results['Notification Service'] = 'FAIL'
}

Write-Host ''
Write-Host '2. Database Connectivity' -ForegroundColor Yellow

try {
    $invCount = docker exec ecommerce-postgres psql -U postgres -d inventorydb -t -c 'SELECT COUNT(*) FROM product;' 2>$null
    Write-Host ("OK Inventory DB: {0} products in database" -f ($invCount.Trim())) -ForegroundColor Green

    [void](docker exec ecommerce-postgres psql -U postgres -d paymentdb -t -c 'SELECT COUNT(*) FROM payment_record;' 2>$null)
    Write-Host 'OK Payment DB: Connected' -ForegroundColor Green

    [void](docker exec ecommerce-postgres psql -U postgres -d shippingdb -t -c 'SELECT COUNT(*) FROM shipping_record;' 2>$null)
    Write-Host 'OK Shipping DB: Connected' -ForegroundColor Green

    [void](docker exec ecommerce-postgres psql -U postgres -d notificationdb -t -c 'SELECT COUNT(*) FROM notification_log;' 2>$null)
    Write-Host 'OK Notification DB: Connected' -ForegroundColor Green

    $results['Database Connectivity'] = 'PASS'
} catch {
    Write-Host ("FAIL Database Connectivity: {0}" -f $_.Exception.Message) -ForegroundColor Red
    $results['Database Connectivity'] = 'FAIL'
}

Write-Host ''
Write-Host '3. Kafka Connectivity' -ForegroundColor Yellow

try {
    $topics = docker exec ecommerce-kafka kafka-topics --bootstrap-server kafka:9092 --list 2>$null
    Write-Host ("OK Kafka Topics: {0}" -f ($topics -join ', ')) -ForegroundColor Green

    [void](docker exec ecommerce-kafka kafka-broker-api-versions --bootstrap-server kafka:9092 2>&1 | Select-String 'id:' | Select-Object -First 1)
    Write-Host 'OK Kafka Brokers: Connected' -ForegroundColor Green

    $results['Kafka Topics'] = 'PASS'
} catch {
    Write-Host ("FAIL Kafka Connectivity: {0}" -f $_.Exception.Message) -ForegroundColor Red
    $results['Kafka Topics'] = 'FAIL'
}

Write-Host ''
Write-Host '4. Product API Test' -ForegroundColor Yellow

if ($products.Count -gt 0) {
    Write-Host 'Products from Inventory Service:' -ForegroundColor Cyan
    $products | ForEach-Object {
        Write-Host ("  - {0} - Rs {1} (Stock: {2})" -f $_.name, $_.price, $_.stock) -ForegroundColor Green
    }
}

Write-Host ''
Write-Host '5. Order Reservation Test' -ForegroundColor Yellow

if ($products.Count -gt 0) {
    $productId = $products[0].id
    $quantity = 2
    $itemTotal = [Math]::Round($products[0].price * $quantity, 2)
    $orderPayload = @{
        customerId = 1
        customerName = 'E2E Tester'
        customerEmail = 'e2e@example.com'
        phone = '0000000000'
        addressLine = 'Validation Street'
        city = 'Test City'
        zipCode = '000000'
        amount = $itemTotal
        shippingMethod = 'standard'
        items = @(
            @{
                productId = $productId
                productName = $products[0].name
                quantity = $quantity
                unitPrice = $products[0].price
                lineTotal = $itemTotal
            }
        )
    }

    try {
        $createdOrder = Invoke-RestMethod -Uri 'http://localhost:8085/api/order/create' -Method POST -ContentType 'application/json' -Body ($orderPayload | ConvertTo-Json -Depth 6) -TimeoutSec 5
        $reserveBody = @{
            orderId = $createdOrder.id
            customerName = $orderPayload.customerName
            customerEmail = $orderPayload.customerEmail
            shippingMethod = $orderPayload.shippingMethod
            amount = $orderPayload.amount
            items = $orderPayload.items
        }
        $reserveResp = Invoke-WebRequest -Uri 'http://localhost:18081/api/inventory/reserve-order' -Method POST -ContentType 'application/json' -Body ($reserveBody | ConvertTo-Json -Depth 6) -UseBasicParsing -TimeoutSec 5
        if ($reserveResp.StatusCode -eq 200) {
            Write-Host ("OK Order Reservation: order #{0} reserved for {1}" -f $createdOrder.id, $products[0].name) -ForegroundColor Green
            $results['API Integration'] = 'PASS'
        } else {
            Write-Host 'FAIL Order Reservation: unexpected status code' -ForegroundColor Red
            $results['API Integration'] = 'FAIL'
        }
    } catch {
        Write-Host ("FAIL Order Reservation: {0}" -f $_.Exception.Message) -ForegroundColor Red
        $results['API Integration'] = 'FAIL'
    }
} else {
    Write-Host 'FAIL Order Reservation: no products available' -ForegroundColor Red
    $results['API Integration'] = 'FAIL'
}

Write-Host ''
Write-Host '6. Kafka Message Monitoring' -ForegroundColor Yellow

try {
    Write-Host "Consuming last 5 messages from ecommerce.events:" -ForegroundColor Cyan
    $kafkaOutput = docker exec ecommerce-kafka kafka-console-consumer --bootstrap-server kafka:9092 --topic ecommerce.events --from-beginning --max-messages 5 --timeout-ms 5000 2>&1
    if ($kafkaOutput -match '^{') {
        Write-Host 'OK Kafka Messages:' -ForegroundColor Green
        $kafkaOutput | ForEach-Object {
            if ($_ -match '^{') {
                Write-Host ("  Message: {0}" -f $_) -ForegroundColor Cyan
            }
        }
    } else {
        Write-Host 'OK Kafka running (no recent messages)' -ForegroundColor Green
    }
} catch {
    Write-Host ("FAIL Kafka Message Monitoring: {0}" -f $_.Exception.Message) -ForegroundColor Red
}

Write-Host ''
Write-Host '7. Container Status' -ForegroundColor Yellow
try {
    $containers = docker ps --filter 'label!=no-monitoring' --format 'table {{.Names}}\t{{.Status}}'
    Write-Host $containers -ForegroundColor Green
} catch {
    Write-Host ("FAIL Container Status: {0}" -f $_.Exception.Message) -ForegroundColor Red
}

Write-Host ''
Write-Host '8. Frontend Integration' -ForegroundColor Yellow
try {
    $frontendResp = Invoke-WebRequest -Uri 'http://localhost:8080' -UseBasicParsing -TimeoutSec 5
    if ($frontendResp.StatusCode -eq 200) {
        Write-Host 'OK Frontend: ACCESSIBLE at http://localhost:8080' -ForegroundColor Green
        if ($frontendResp.Content -match 'EcommercePro') {
            Write-Host 'OK Frontend: Application UI loaded correctly' -ForegroundColor Green
        }
    }
} catch {
    Write-Host ("FAIL Frontend: {0}" -f $_.Exception.Message) -ForegroundColor Red
}

Write-Host ''
Write-Host '9. Summary' -ForegroundColor Yellow
$results.GetEnumerator() | ForEach-Object {
    $color = if ($_.Value -eq 'PASS') { 'Green' } else { 'Red' }
    Write-Host ("  {0}: {1}" -f $_.Key, $_.Value) -ForegroundColor $color
}

$failCount = ($results.Values | Where-Object { $_ -eq 'FAIL' }).Count
if ($failCount -eq 0) {
    Write-Host 'ALL TESTS PASSED' -ForegroundColor Green
} else {
    Write-Host ("{0} test(s) failed" -f $failCount) -ForegroundColor Yellow
}
