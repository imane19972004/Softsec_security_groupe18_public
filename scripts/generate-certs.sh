#!/bin/bash

CERT_DIR="../backend/shared/certs"
KEY_FILE="$CERT_DIR/key.pem"
CERT_FILE="$CERT_DIR/cert.pem"

mkdir -p "$CERT_DIR"
rm -f "$KEY_FILE" "$CERT_FILE"

openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout "$KEY_FILE" \
  -out "$CERT_FILE" \
  -subj "//C=FR/ST=State/L=City/O=Org/OU=Dev/CN=localhost" \
  -addext "subjectAltName=DNS:localhost,IP:127.0.0.1"

echo "Clé privée : $KEY_FILE"
echo "Certificat : $CERT_FILE"

openssl x509 -in "$CERT_FILE" -text -noout
