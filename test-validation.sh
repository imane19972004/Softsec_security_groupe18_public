#!/bin/bash
# test-validation.sh
# Script de test pour vérifier l'implémentation de la validation

echo "🧪 Tests de validation - Server A"
echo "=================================="

# Couleurs pour l'output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

BASE_URL="https://localhost:3001"

# Fonction pour tester un endpoint
test_endpoint() {
  local name=$1
  local method=$2
  local endpoint=$3
  local data=$4
  local expected_status=$5
  local token=$6
  
  echo -n "Testing: $name... "
  
  if [ -z "$token" ]; then
    response=$(curl -k -s -w "\n%{http_code}" -X $method \
      -H "Content-Type: application/json" \
      -d "$data" \
      "$BASE_URL$endpoint")
  else
    response=$(curl -k -s -w "\n%{http_code}" -X $method \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $token" \
      -d "$data" \
      "$BASE_URL$endpoint")
  fi
  
  status=$(echo "$response" | tail -n1)
  body=$(echo "$response" | sed '$d')
  
  if [ "$status" -eq "$expected_status" ]; then
    echo -e "${GREEN}✓ PASS${NC} (Status: $status)"
    return 0
  else
    echo -e "${RED}✗ FAIL${NC} (Expected: $expected_status, Got: $status)"
    echo "Response: $body"
    return 1
  fi
}

# Compteurs
total=0
passed=0

echo ""
echo "📋 Tests d'authentification"
echo "----------------------------"

# Test 1: Email invalide
((total++))
if test_endpoint "Register - Email invalide" "POST" "/auth/register" \
  '{"email":"invalid-email","password":"P@ssw0rd2025!"}' 400; then
  ((passed++))
fi

# Test 2: Mot de passe faible
((total++))
if test_endpoint "Register - Mot de passe faible" "POST" "/auth/register" \
  '{"email":"test@example.com","password":"weak"}' 400; then
  ((passed++))
fi

# Test 3: Login valide pour obtenir le token
echo ""
echo "🔐 Obtention du token..."
login_response=$(curl -k -s -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"P@ssw0rd2025!"}' \
  "$BASE_URL/auth/login")

TOKEN=$(echo $login_response | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo -e "${YELLOW}⚠ Impossible d'obtenir le token, certains tests seront sautés${NC}"
else
  echo -e "${GREEN}✓ Token obtenu${NC}"
  
  echo ""
  echo "📝 Tests de gestion des notes"
  echo "------------------------------"
  
  # Test 4: Titre trop long
  ((total++))
  long_title=$(printf 'a%.0s' {1..150})
  if test_endpoint "Create Note - Titre trop long" "POST" "/notes" \
    "{\"title\":\"$long_title\",\"content\":\"Contenu valide\"}" 400 "$TOKEN"; then
    ((passed++))
  fi
  
  # Test 5: Contenu vide
  ((total++))
  if test_endpoint "Create Note - Contenu vide" "POST" "/notes" \
    '{"title":"Titre valide","content":""}' 400 "$TOKEN"; then
    ((passed++))
  fi
  
  # Test 6: ID invalide (non-UUID)
  ((total++))
  if test_endpoint "Get Note - ID invalide" "GET" "/notes/invalid-id-123" \
    "" 400 "$TOKEN"; then
    ((passed++))
  fi
  
  # Test 7: Création valide pour tester l'update
  echo ""
  echo "Creating test note..."
  create_response=$(curl -k -s -X POST \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{"title":"Test Note","content":"Test content"}' \
    "$BASE_URL/notes")
  
  NOTE_ID=$(echo $create_response | grep -o '"id":"[^"]*' | cut -d'"' -f4)
  
  if [ ! -z "$NOTE_ID" ]; then
    # Test 8: Contenu trop long
    ((total++))
    long_content=$(printf 'a%.0s' {1..25000})
    if test_endpoint "Update Note - Contenu trop long" "PUT" "/notes/$NOTE_ID" \
      "{\"content\":\"$long_content\"}" 413 "$TOKEN"; then
      ((passed++))
    fi
    
    # Test 9: Validation réussie (update valide)
    ((total++))
    if test_endpoint "Update Note - Valide" "PUT" "/notes/$NOTE_ID" \
      '{"content":"Updated content"}' 200 "$TOKEN"; then
      ((passed++))
    fi
  fi
fi

# Test 10: Vérifier que les anciens tests fonctionnent toujours
echo ""
echo "🔄 Vérification de non-régression"
echo "----------------------------------"

((total++))
if test_endpoint "Register - Valide" "POST" "/auth/register" \
  "{\"email\":\"newuser$(date +%s)@example.com\",\"password\":\"P@ssw0rd2025!\"}" 201; then
  ((passed++))
fi

# Résumé
echo ""
echo "=================================="
echo "📊 Résultats des tests"
echo "=================================="
echo -e "Total: $total tests"
echo -e "${GREEN}Passed: $passed${NC}"
echo -e "${RED}Failed: $((total - passed))${NC}"

if [ $passed -eq $total ]; then
  echo -e "\n${GREEN}✓ Tous les tests sont passés!${NC}"
  exit 0
else
  echo -e "\n${RED}✗ Certains tests ont échoué${NC}"
  exit 1
fi