# Ensolv Portfolio API - cURL Examples

This document provides cURL command examples for testing the Ensolv Portfolio API endpoints.

## Base Configuration

```bash
# Set the base URL (adjust port if different)
export API_BASE_URL="http://localhost:4000"

# Example wallet address for testing
export TEST_ADDRESS="0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6"
```

## Health Check

Check if the API service is running and healthy:

```bash
curl -X GET "${API_BASE_URL}/health" \
  -H "Accept: application/json" \
  -w "\nResponse Time: %{time_total}s\nHTTP Code: %{http_code}\n"
```

**Expected Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "service": "Ensolv Portfolio API",
  "version": "1.0.0"
}
```

## Portfolio Data Retrieval

### Valid Address Request

Fetch portfolio data for a valid Ethereum address:

```bash
curl -X GET "${API_BASE_URL}/portfolio?address=${TEST_ADDRESS}" \
  -H "Accept: application/json" \
  -w "\nResponse Time: %{time_total}s\nHTTP Code: %{http_code}\n"
```

### Alternative Valid Address (Manual)

```bash
curl -X GET "http://localhost:4000/portfolio?address=0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6" \
  -H "Accept: application/json" \
  -w "\nResponse Time: %{time_total}s\nHTTP Code: %{http_code}\n"
```

### Case Insensitive Address

Test that the API handles uppercase addresses correctly:

```bash
curl -X GET "${API_BASE_URL}/portfolio?address=0X742D35CC6634C0532925A3B8D4C9DB96C4B4D8B6" \
  -H "Accept: application/json" \
  -w "\nResponse Time: %{time_total}s\nHTTP Code: %{http_code}\n"
```

### Pretty Printed Response

Get portfolio data with formatted JSON output:

```bash
curl -X GET "${API_BASE_URL}/portfolio?address=${TEST_ADDRESS}" \
  -H "Accept: application/json" \
  -s | jq '.'
```

## Error Testing

### Invalid Address Format

Test error handling for malformed Ethereum addresses:

```bash
curl -X GET "${API_BASE_URL}/portfolio?address=invalid-address" \
  -H "Accept: application/json" \
  -w "\nResponse Time: %{time_total}s\nHTTP Code: %{http_code}\n"
```

**Expected Response (400 Bad Request):**
```json
{
  "error": "Invalid Ethereum address format",
  "message": "The provided address is not a valid Ethereum address"
}
```

### Missing Address Parameter

Test error handling when address parameter is missing:

```bash
curl -X GET "${API_BASE_URL}/portfolio" \
  -H "Accept: application/json" \
  -w "\nResponse Time: %{time_total}s\nHTTP Code: %{http_code}\n"
```

**Expected Response (400 Bad Request):**
```json
{
  "error": "Missing required parameter",
  "message": "Address parameter is required"
}
```

### Empty Address Parameter

Test error handling for empty address parameter:

```bash
curl -X GET "${API_BASE_URL}/portfolio?address=" \
  -H "Accept: application/json" \
  -w "\nResponse Time: %{time_total}s\nHTTP Code: %{http_code}\n"
```

## API Documentation

Get comprehensive API documentation:

```bash
curl -X GET "${API_BASE_URL}/api-docs" \
  -H "Accept: application/json" \
  -s | jq '.'
```

## Performance Testing

### Response Time Measurement

Measure API response time:

```bash
curl -X GET "${API_BASE_URL}/portfolio?address=${TEST_ADDRESS}" \
  -H "Accept: application/json" \
  -w "Response Time: %{time_total}s\nHTTP Code: %{http_code}\nSize: %{size_download} bytes\n" \
  -o /dev/null -s
```

### Cache Performance Test

Test caching by making consecutive requests:

```bash
echo "First request (cache miss):"
curl -X GET "${API_BASE_URL}/portfolio?address=${TEST_ADDRESS}" \
  -H "Accept: application/json" \
  -w "Response Time: %{time_total}s\n" \
  -o /dev/null -s

echo "Second request (cache hit):"
curl -X GET "${API_BASE_URL}/portfolio?address=${TEST_ADDRESS}" \
  -H "Accept: application/json" \
  -w "Response Time: %{time_total}s\n" \
  -o /dev/null -s
```

### Multiple Concurrent Requests

Test API under load with multiple concurrent requests:

```bash
# Run 5 concurrent requests
for i in {1..5}; do
  curl -X GET "${API_BASE_URL}/portfolio?address=${TEST_ADDRESS}" \
    -H "Accept: application/json" \
    -w "Request $i - Response Time: %{time_total}s\n" \
    -o /dev/null -s &
done
wait
```

## Advanced Testing

### Custom Headers

Test with custom headers:

```bash
curl -X GET "${API_BASE_URL}/portfolio?address=${TEST_ADDRESS}" \
  -H "Accept: application/json" \
  -H "User-Agent: Ensolv-API-Test/1.0" \
  -H "X-Request-ID: test-$(date +%s)" \
  -w "\nResponse Time: %{time_total}s\nHTTP Code: %{http_code}\n"
```

### Verbose Output

Get detailed request/response information:

```bash
curl -X GET "${API_BASE_URL}/portfolio?address=${TEST_ADDRESS}" \
  -H "Accept: application/json" \
  -v
```

### Save Response to File

Save the response to a file for analysis:

```bash
curl -X GET "${API_BASE_URL}/portfolio?address=${TEST_ADDRESS}" \
  -H "Accept: application/json" \
  -o portfolio_response.json \
  -w "Response saved to portfolio_response.json\nResponse Time: %{time_total}s\nHTTP Code: %{http_code}\n"
```

### Extract Specific Data

Extract specific fields from the response:

```bash
# Get total USD value
curl -X GET "${API_BASE_URL}/portfolio?address=${TEST_ADDRESS}" \
  -H "Accept: application/json" \
  -s | jq '.summary.totalUsdValue'

# Get token count
curl -X GET "${API_BASE_URL}/portfolio?address=${TEST_ADDRESS}" \
  -H "Accept: application/json" \
  -s | jq '.summary.tokenCount'

# Get network totals
curl -X GET "${API_BASE_URL}/portfolio?address=${TEST_ADDRESS}" \
  -H "Accept: application/json" \
  -s | jq '.summary.networkTotals'

# List all token symbols
curl -X GET "${API_BASE_URL}/portfolio?address=${TEST_ADDRESS}" \
  -H "Accept: application/json" \
  -s | jq '.tokenHoldings[].symbol'
```

## Batch Testing Script

Create a comprehensive test script:

```bash
#!/bin/bash

# Ensolv Portfolio API Test Script
API_BASE_URL="http://localhost:4000"
TEST_ADDRESS="0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6"

echo "=== Ensolv Portfolio API Test Suite ==="
echo "Base URL: $API_BASE_URL"
echo "Test Address: $TEST_ADDRESS"
echo ""

# Test 1: Health Check
echo "1. Testing Health Check..."
curl -X GET "$API_BASE_URL/health" \
  -H "Accept: application/json" \
  -w "Response Time: %{time_total}s | HTTP Code: %{http_code}\n" \
  -o /dev/null -s
echo ""

# Test 2: Valid Portfolio Request
echo "2. Testing Valid Portfolio Request..."
curl -X GET "$API_BASE_URL/portfolio?address=$TEST_ADDRESS" \
  -H "Accept: application/json" \
  -w "Response Time: %{time_total}s | HTTP Code: %{http_code}\n" \
  -o /dev/null -s
echo ""

# Test 3: Invalid Address
echo "3. Testing Invalid Address..."
curl -X GET "$API_BASE_URL/portfolio?address=invalid" \
  -H "Accept: application/json" \
  -w "Response Time: %{time_total}s | HTTP Code: %{http_code}\n" \
  -o /dev/null -s
echo ""

# Test 4: Missing Address
echo "4. Testing Missing Address..."
curl -X GET "$API_BASE_URL/portfolio" \
  -H "Accept: application/json" \
  -w "Response Time: %{time_total}s | HTTP Code: %{http_code}\n" \
  -o /dev/null -s
echo ""

# Test 5: API Documentation
echo "5. Testing API Documentation..."
curl -X GET "$API_BASE_URL/api-docs" \
  -H "Accept: application/json" \
  -w "Response Time: %{time_total}s | HTTP Code: %{http_code}\n" \
  -o /dev/null -s
echo ""

echo "=== Test Suite Complete ==="
```

Save this script as `test_api.sh`, make it executable with `chmod +x test_api.sh`, and run it with `./test_api.sh`.

## Notes

- Replace `localhost:4000` with your actual API server address and port
- The `jq` command is used for JSON formatting and requires installation (`brew install jq` on macOS)
- Response times may vary based on network conditions and server load
- Cache behavior will affect response times on subsequent requests
- Ensure the API server is running before executing these commands