# Environment switching script for PiggyBank frontend
# Usage: .\scripts\switch-env.ps1 {local|sepolia|mainnet}
# PowerShell version for Windows users

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("local", "sepolia", "mainnet")]
    [string]$Environment
)

Write-Host "🔧 PiggyBank Frontend Environment Switcher (PowerShell)" -ForegroundColor Cyan
Write-Host "=========================================================" -ForegroundColor Cyan
Write-Host ""

# Check if environment parameter provided
if (-not $Environment) {
    Write-Host "❌ Error: No environment specified" -ForegroundColor Red
    Write-Host ""
    Write-Host "Usage: .\scripts\switch-env.ps1 {local|sepolia|mainnet}" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Available environments:" -ForegroundColor Green
    Write-Host "  local     - Local Anvil/Hardhat development" -ForegroundColor White
    Write-Host "  sepolia   - Base Sepolia testnet" -ForegroundColor White
    Write-Host "  mainnet   - Base mainnet" -ForegroundColor White
    exit 1
}

# Define environment variables
$contractAddress = ""
$networkInfo = ""

switch ($Environment) {
    "local" {
        Write-Host "🏠 Switching to LOCAL development environment" -ForegroundColor Green
        Write-Host "Using local Anvil/Hardhat blockchain" -ForegroundColor Gray
        $contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3"  # Default Anvil address
        $networkInfo = @{
            "Network" = "Local (Anvil/Hardhat)"
            "Contract" = $contractAddress
            "RPC" = "http://localhost:8545"
        }
        Write-Host ""
        Write-Host "📋 Environment Setup:" -ForegroundColor Yellow
    }
    "sepolia" {
        Write-Host "🧪 Switching to BASE SEPOLIA testnet" -ForegroundColor Yellow
        Write-Host "Using Base Sepolia testnet" -ForegroundColor Gray
        Write-Host ""
        Write-Host "⚠️  IMPORTANT: Replace with your actual testnet contract address" -ForegroundColor Yellow
        $contractAddress = "0x1234567890123456789012345678901234567890"  # Placeholder
        $networkInfo = @{
            "Network" = "Base Sepolia Testnet"
            "Contract" = "$contractAddress (PLACEHOLDER - UPDATE ME)"
            "RPC" = "https://sepolia.base.org"
        }
        Write-Host ""
        Write-Host "📋 Environment Setup:" -ForegroundColor Yellow
        Write-Host "📌 To deploy your own testnet contract:" -ForegroundColor Cyan
        Write-Host "   1. Run: forge create PiggyBank --rpc-url `$RPC_URL --private-key `$PRIVATE_KEY --constructor-args 3600" -ForegroundColor White
        Write-Host "   2. Update CONTRACT_ADDRESS with your deployed address" -ForegroundColor White
    }
    "mainnet" {
        Write-Host "🚀 Switching to BASE MAINNET" -ForegroundColor Red
        Write-Host "Using Base mainnet" -ForegroundColor Gray
        Write-Host ""
        Write-Host "⚠️  WARNING: This is PRODUCTION environment!" -ForegroundColor Red
        Write-Host "⚠️  IMPORTANT: Replace with your actual mainnet contract address" -ForegroundColor Yellow
        $contractAddress = "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd"  # Placeholder
        $networkInfo = @{
            "Network" = "Base Mainnet (PRODUCTION)"
            "Contract" = "$contractAddress (PLACEHOLDER - UPDATE ME)"
            "RPC" = "https://mainnet.base.org"
        }
        Write-Host ""
        Write-Host "📋 Environment Setup:" -ForegroundColor Yellow
        Write-Host "📌 To deploy your own mainnet contract:" -ForegroundColor Cyan
        Write-Host "   1. Run: forge create PiggyBank --rpc-url `$RPC_URL --private-key `$PRIVATE_KEY --constructor-args 31536000" -ForegroundColor White
        Write-Host "   2. Update CONTRACT_ADDRESS with your deployed address" -ForegroundColor White
    }
    default {
        Write-Host "❌ Error: Unknown environment '$Environment'" -ForegroundColor Red
        Write-Host ""
        Write-Host "Usage: .\scripts\switch-env.ps1 {local|sepolia|mainnet}" -ForegroundColor Yellow
        exit 1
    }
}

# Display network information
foreach ($key in $networkInfo.Keys) {
    Write-Host "  $key`: $($networkInfo[$key])" -ForegroundColor White
}

# Check if .env.example exists
if (-not (Test-Path ".env.example")) {
    Write-Host ""
    Write-Host "❌ Error: .env.example not found" -ForegroundColor Red
    Write-Host "Make sure you're running this script from the frontend directory" -ForegroundColor Yellow
    exit 1
}

# Copy .env.example to .env if .env doesn't exist
if (-not (Test-Path ".env")) {
    Write-Host ""
    Write-Host "📝 Creating .env from .env.example..." -ForegroundColor Cyan
    Copy-Item ".env.example" ".env"
}

# Update VITE_PIGGYBANK_ADDRESS in .env
Write-Host ""
Write-Host "🔄 Updating VITE_PIGGYBANK_ADDRESS in .env..." -ForegroundColor Cyan

try {
    $envContent = Get-Content ".env" -Raw
    $updatedContent = $envContent -replace "^VITE_PIGGYBANK_ADDRESS=.*", "VITE_PIGGYBANK_ADDRESS=$contractAddress"
    $updatedContent | Set-Content ".env"
    
    Write-Host ""
    Write-Host "✅ Environment configuration updated:" -ForegroundColor Green
    Write-Host "   VITE_PIGGYBANK_ADDRESS=$contractAddress" -ForegroundColor White
} catch {
    Write-Host ""
    Write-Host "⚠️  Cannot automatically update .env file" -ForegroundColor Yellow
    Write-Host "📝 Please manually update VITE_PIGGYBANK_ADDRESS in your .env file:" -ForegroundColor Cyan
    Write-Host "   Current: VITE_PIGGYBANK_ADDRESS=your_deployed_piggybank_contract_address_here" -ForegroundColor Gray
    Write-Host "   Replace with: VITE_PIGGYBANK_ADDRESS=$contractAddress" -ForegroundColor White
}

# Verify the update
Write-Host ""
Write-Host "📄 Current .env configuration:" -ForegroundColor Yellow
try {
    $envLines = Get-Content ".env" | Where-Object { $_ -match "^VITE_(REOWN_PROJECT_ID|PIGGYBANK_ADDRESS)" }
    if ($envLines) {
        $envLines | ForEach-Object { Write-Host "   $_" -ForegroundColor White }
    } else {
        Write-Host "   (Check .env file manually)" -ForegroundColor Gray
    }
} catch {
    Write-Host "   (Unable to read .env file)" -ForegroundColor Gray
}

Write-Host ""
Write-Host "🎯 Next Steps:" -ForegroundColor Yellow

switch ($Environment) {
    "local" {
        Write-Host "1. Start local blockchain: anvil" -ForegroundColor White
        Write-Host "2. Deploy contract if needed: forge create PiggyBank --rpc-url http://localhost:8545 --constructor-args 3600" -ForegroundColor White
        Write-Host "3. Start frontend: npm run dev" -ForegroundColor White
        Write-Host "4. Connect MetaMask to localhost network" -ForegroundColor White
    }
    "sepolia" {
        Write-Host "1. Deploy to testnet if needed" -ForegroundColor White
        Write-Host "2. Update .env with your actual testnet contract address" -ForegroundColor White
        Write-Host "3. Start frontend: npm run dev" -ForegroundColor White
        Write-Host "4. Connect MetaMask to Base Sepolia network" -ForegroundColor White
        Write-Host "5. Get testnet ETH from faucet" -ForegroundColor White
    }
    "mainnet" {
        Write-Host "1. Deploy to mainnet if needed" -ForegroundColor White
        Write-Host "2. Update .env with your actual mainnet contract address" -ForegroundColor White
        Write-Host "3. Start frontend: npm run dev" -ForegroundColor White
        Write-Host "4. Connect MetaMask to Base network" -ForegroundColor White
        Write-Host "5. Use with real ETH" -ForegroundColor White
    }
}

Write-Host ""
Write-Host "📚 For detailed setup instructions, see:" -ForegroundColor Cyan
Write-Host "   - CONTRACTS.md#-local-development-setup" -ForegroundColor White
Write-Host "   - frontend/README.md" -ForegroundColor White
Write-Host ""
Write-Host "🚀 Ready to start development with $Environment environment!" -ForegroundColor Green
Write-Host ""

# Offer to start development server
$response = Read-Host "🤔 Would you like to start the development server now? (y/N)"
if ($response -match "^[Yy]$") {
    Write-Host ""
    Write-Host "🚀 Starting development server..." -ForegroundColor Green
    Write-Host "   Frontend will be available at: http://localhost:3000" -ForegroundColor Cyan
    Write-Host "   Press Ctrl+C to stop the server" -ForegroundColor Gray
    Write-Host ""
    npm run dev
} else {
    Write-Host "👍 Environment setup complete! Run 'npm run dev' when ready to start the frontend." -ForegroundColor Green
}