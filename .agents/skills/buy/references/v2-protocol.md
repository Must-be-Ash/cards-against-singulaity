# x402 Protocol V2 Specification

## Table of Contents

1. [Headers](#headers)
2. [PaymentRequired Schema](#paymentrequired-schema)
3. [PaymentPayload Schema](#paymentpayload-schema)
4. [SettlementResponse Schema](#settlementresponse-schema)
5. [Network Identifiers (CAIP-2)](#network-identifiers-caip-2)
6. [Error Codes](#error-codes)
7. [Extensions](#extensions)

## Headers

| Purpose | Header Name |
|---------|-------------|
| Requirements from server | `PAYMENT-REQUIRED` (base64) |
| Payment from client | `PAYMENT-SIGNATURE` (base64) |
| Settlement response | `PAYMENT-RESPONSE` (base64) |

## PaymentRequired Schema

Returned in `PAYMENT-REQUIRED` header (base64 encoded JSON):

```json
{
  "x402Version": 2,
  "error": "PAYMENT-SIGNATURE header is required",
  "resource": {
    "url": "https://api.example.com/premium-data",
    "description": "Access to premium market data",
    "mimeType": "application/json"
  },
  "accepts": [
    {
      "scheme": "exact",
      "network": "eip155:84532",
      "amount": "10000",
      "asset": "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
      "payTo": "0x209693Bc6afc0C5328bA36FaF03C514EF312287C",
      "maxTimeoutSeconds": 60,
      "extra": {
        "name": "USDC",
        "version": "2"
      }
    }
  ],
  "extensions": {}
}
```

### Top-Level Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `x402Version` | number | Yes | Must be `2` |
| `error` | string | No | Human-readable error |
| `resource` | object | Yes | ResourceInfo object |
| `accepts` | array | Yes | Array of PaymentRequirements |
| `extensions` | object | No | Protocol extensions |

### ResourceInfo Object

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `url` | string | Yes | Protected resource URL |
| `description` | string | No | Human-readable description |
| `mimeType` | string | No | Response MIME type |

### PaymentRequirements Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `scheme` | string | Yes | Payment scheme (e.g., "exact") |
| `network` | string | Yes | CAIP-2 network ID (e.g., "eip155:84532") |
| `amount` | string | Yes | Amount in atomic units |
| `asset` | string | Yes | Token contract address or ISO 4217 code |
| `payTo` | string | Yes | Recipient wallet address |
| `maxTimeoutSeconds` | number | Yes | Payment timeout |
| `extra` | object | No | Scheme-specific data |

## PaymentPayload Schema

Sent in `PAYMENT-SIGNATURE` header (base64 encoded):

```json
{
  "x402Version": 2,
  "resource": {
    "url": "https://api.example.com/premium-data",
    "description": "Access to premium market data",
    "mimeType": "application/json"
  },
  "accepted": {
    "scheme": "exact",
    "network": "eip155:84532",
    "amount": "10000",
    "asset": "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
    "payTo": "0x209693Bc6afc0C5328bA36FaF03C514EF312287C",
    "maxTimeoutSeconds": 60,
    "extra": {
      "name": "USDC",
      "version": "2"
    }
  },
  "payload": {
    "signature": "0x2d6a7588d6acca505cbf0d9a4a227e0c52c6c34...",
    "authorization": {
      "from": "0x857b06519E91e3A54538791bDbb0E22373e36b66",
      "to": "0x209693Bc6afc0C5328bA36FaF03C514EF312287C",
      "value": "10000",
      "validAfter": "1740672089",
      "validBefore": "1740672154",
      "nonce": "0xf3746613c2d920b5fdabc0856f2aeb2d4f88ee6037b8cc5d04a71a4462f13480"
    }
  },
  "extensions": {}
}
```

### Top-Level Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `x402Version` | number | Yes | Must be `2` |
| `resource` | object | No | ResourceInfo object |
| `accepted` | object | Yes | Chosen PaymentRequirements |
| `payload` | object | Yes | Scheme-specific payload |
| `extensions` | object | No | Protocol extensions |

### Exact Scheme Payload (EVM)

| Field | Type | Description |
|-------|------|-------------|
| `signature` | string | EIP-712 signature |
| `authorization` | object | EIP-3009 authorization |

### Authorization Object (All Required)

| Field | Type | Description |
|-------|------|-------------|
| `from` | string | Payer wallet address |
| `to` | string | Recipient wallet address |
| `value` | string | Amount in atomic units |
| `validAfter` | string | Unix timestamp start |
| `validBefore` | string | Unix timestamp end |
| `nonce` | string | 32-byte random nonce |

## SettlementResponse Schema

Returned in `PAYMENT-RESPONSE` header (base64 encoded):

```json
{
  "success": true,
  "transaction": "0x1234567890abcdef...",
  "network": "eip155:84532",
  "payer": "0x857b06519E91e3A54538791bDbb0E22373e36b66",
  "extensions": {}
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `success` | boolean | Yes | Settlement success |
| `errorReason` | string | No | Error if failed |
| `transaction` | string | Yes | Transaction hash |
| `network` | string | Yes | CAIP-2 network ID |
| `payer` | string | No | Payer address |
| `extensions` | object | No | Protocol extensions |

## Network Identifiers (CAIP-2)

Format: `{namespace}:{reference}`

### EVM Networks

| Network | CAIP-2 ID | Chain ID |
|---------|-----------|----------|
| Base Sepolia | `eip155:84532` | 84532 |
| Base Mainnet | `eip155:8453` | 8453 |
| Ethereum Mainnet | `eip155:1` | 1 |
| Sepolia | `eip155:11155111` | 11155111 |
| Avalanche Fuji | `eip155:43113` | 43113 |
| Avalanche | `eip155:43114` | 43114 |

### Solana Networks

| Network | CAIP-2 ID |
|---------|-----------|
| Solana Mainnet | `solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp` |
| Solana Devnet | `solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1` |

### Wildcard Patterns

When registering schemes, use wildcards:
- `eip155:*` - All EVM networks
- `solana:*` - All Solana networks

## Error Codes

- `insufficient_funds` - Wallet lacks tokens
- `invalid_exact_evm_payload_authorization_valid_after` - Authorization not yet valid
- `invalid_exact_evm_payload_authorization_valid_before` - Authorization expired
- `invalid_exact_evm_payload_authorization_value` - Insufficient amount
- `invalid_exact_evm_payload_signature` - Invalid signature
- `invalid_exact_evm_payload_recipient_mismatch` - Wrong recipient
- `invalid_network` - Unsupported network
- `invalid_payload` - Malformed payload
- `invalid_payment_requirements` - Invalid requirements
- `invalid_scheme` - Unsupported scheme
- `unsupported_scheme` - Scheme not supported by facilitator
- `invalid_x402_version` - Version mismatch
- `invalid_transaction_state` - Transaction failed
- `unexpected_verify_error` - Verification error
- `unexpected_settle_error` - Settlement error

## Extensions

V2 supports protocol extensions via the `extensions` field. Extensions are key-value maps:

```json
{
  "extensions": {
    "extension-id": {
      "info": { /* extension-specific data */ },
      "schema": { /* JSON Schema for info */ }
    }
  }
}
```

Clients must echo extensions from PaymentRequired in their PaymentPayload. Additional info may be appended but existing info cannot be deleted or modified.
