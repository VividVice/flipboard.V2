# Define the base URL of your FastAPI application
$baseUrl = "http://127.0.0.1:8000"

# --- Test Signup ---
Write-Host "--- Testing Signup ---"

# Generate unique username and email for each test run
$timestamp = Get-Date -Format "yyyyMMddHHmmss"
$username = "testuser_$timestamp"
$email = "test_$timestamp@example.com"
$password = "testpassword123"

$signupBody = @{
    username = $username
    email = $email
    password = $password
} | ConvertTo-Json

Write-Host "Attempting to sign up user: $username with email: $email"
try {
    $signupResponse = Invoke-RestMethod -Uri "$baseUrl/auth/signup" -Method Post -ContentType "application/json" -Body $signupBody
    Write-Host "Signup successful. User ID: $($signupResponse.id), Username: $($signupResponse.username)"
} catch {
    Write-Host "Signup failed. Status Code: $($_.Exception.Response.StatusCode.value__), Response: $($_.Exception.Response.Content)"
    exit 1 # Exit if signup fails, as login will depend on it
}

Write-Host "" # New line for readability

# --- Test Login ---
Write-Host "--- Testing Login ---"

$loginBody = @{
    username = $username
    password = $password
}

Write-Host "Attempting to log in user: $username"
try {
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -ContentType "application/x-www-form-urlencoded" -Body $loginBody
    Write-Host "Login successful. Access Token: $($loginResponse.access_token), Token Type: $($loginResponse.token_type)"

    # Optional: Test a protected endpoint with the token (if one exists)
    # Write-Host "Testing protected endpoint with access token..."
    # $headers = @{
    #     "Authorization" = "$($loginResponse.token_type) $($loginResponse.access_token)"
    # }
    # try {
    #     $protectedResponse = Invoke-RestMethod -Uri "$baseUrl/protected-route" -Headers $headers -Method Get
    #     Write-Host "Protected endpoint successful. Response: $($protectedResponse | ConvertTo-Json)"
    # } catch {
    #     Write-Host "Protected endpoint failed. Status Code: $($_.Exception.Response.StatusCode.value__), Response: $($_.Exception.Response.Content)"
    # }

} catch {
    Write-Host "Login failed. Status Code: $($_.Exception.Response.StatusCode.value__), Response: $($_.Exception.Response.Content)"
    exit 1 # Exit if login fails
}

Write-Host "`nAll tests completed successfully!"
