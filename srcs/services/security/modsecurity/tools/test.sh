#!/bin/bash
# test.sh

echo "=== Test Suite ModSecurity WAF ==="

echo -e "\n✅ Test 1 - Requête légitime:"
curl -k -s -w "HTTP %{http_code}\n" -o /dev/null "https://localhost/test?name=Alice&age=25"

echo -e "\n🛡️ Test 2 - SQL Injection (OR):"
curl -k -s -w "HTTP %{http_code}\n" -o /dev/null "https://localhost/test?id=1%27%20OR%20%271%27=%271"

echo -e "\n🛡️ Test 3 - SQL Injection (UNION):"
curl -k -s -w "HTTP %{http_code}\n" -o /dev/null "https://localhost/test?id=1%20UNION%20SELECT%20*%20FROM%20users"

echo -e "\n🛡️ Test 4 - XSS Script Tag:"
curl -k -s -w "HTTP %{http_code}\n" -o /dev/null "https://localhost/test?q=%3Cscript%3Ealert(1)%3C/script%3E"

echo -e "\n🛡️ Test 5 - XSS Img Tag:"
curl -k -s -w "HTTP %{http_code}\n" -o /dev/null "https://localhost/test?comment=%3Cimg%20src=x%20onerror=alert(1)%3E"

echo -e "\n🛡️ Test 6 - Path Traversal:"
curl -k -s -w "HTTP %{http_code}\n" -o /dev/null "https://localhost/../../../etc/passwd"

echo -e "\n🛡️ Test 7 - Command Injection:"
curl -k -s -w "HTTP %{http_code}\n" -o /dev/null "https://localhost/test?cmd=ls%20-la;cat%20/etc/passwd"

echo -e "\n📊 Résumé des logs (5 dernières attaques):"
docker exec modsecurity grep -E "Access denied.*403" /var/log/nginx/error.log | tail -5 | awk '{print $11, $12, $13}'