# x402 Protocol V1 Specification

## Table of Contents

1. [Headers](#headers)
2. [PaymentRequirementsResponse Schema](#paymentrequirementsresponse-schema)
3. [PaymentPayload Schema](#paymentpayload-schema)
4. [SettlementResponse Schema](#settlementresponse-schema)
5. [Network Identifiers](#network-identifiers)
6. [Error Codes](#error-codes)

## Headers

| Purpose | Header Name |
|---------|-------------|
| Payment from client | `X-PAYMENT` |
| Settlement response | `X-PAYMENT-RESPONSE` |
| Requirements location | Response body (JSON) |

## PaymentRequirementsResponse Schema

Returned in the 402 response body:

```json
{
  "x402Version": 1,
  "error": "X-PAYMENT header is required",
  "accepts": [
    {
      "scheme": "exact",
      "network": "base-sepolia",
      "maxAmountRequired": "10000",
      "asset": "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
      "payTo": "0x209693Bc6afc0C5328bA36FaF03C514EF312287C",
      "resource": "https://api.example.com/premium-data",
      "description": "Access to premium market data",
      "mimeType": "application/json",
      "outputSchema": null,
      "maxTimeoutSeconds": 60,
      "extra": {
        "name": "USDC",
        "version": "2"
      }
    }
  ]
}
```

### Top-Level Fields (All Required)

| Field | Type | Description |
|-------|------|-------------|
| `x402Version` | number | Must be `1` |
| `error` | string | Human-readable error message |
| `accepts` | array | Array of PaymentRequirements objects |

### PaymentRequirements Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `scheme` | string | Yes | Payment scheme (e.g., "exact") |
| `network` | string | Yes | Network identifier (e.g., "base-sepolia") |
| `maxAmountRequired` | string | Yes | Amount in atomic units |
| `asset` | string | Yes | Token contract address |
| `payTo` | string | Yes | Recipient wallet address |
| `resource` | string | Yes | Protected resource URL |
| `description` | string | Yes | Human-readable description |
| `mimeType` | string | No | Response MIME type |
| `outputSchema` | object | No | JSON schema for response |
| `maxTimeoutSeconds` | number | Yes | Payment timeout |
| `extra` | object | No | Scheme-specific data (name, version for EIP-712) |

## PaymentPayload Schema

Sent in `X-PAYMENT` header (base64 encoded):

```json
{
  "x402Version": 1,
  "scheme": "exact",
  "network": "base-sepolia",
  "payload": {
    "signature": "0x2d6a7588d6acca505cbf0d9a4a227e0c52c6c34008c8e8986a1283259764173608a2ce6496642e377d6da8dbbf5836e9bd15092f9ecab05ded3d6293af148b571c",
    "authorization": {
      "from": "0x857b06519E91e3A54538791bDbb0E22373e36b66",
      "to": "0x209693Bc6afc0C5328bA36FaF03C514EF312287C",
      "value": "10000",
      "validAfter": "1740672089",
      "validBefore": "1740672154",
      "nonce": "0xf3746613c2d920b5fdabc0856f2aeb2d4f88ee6037b8cc5d04a71a4462f13480"
    }
  }
}
```

### Top-Level Fields (All Required)

| Field | Type | Description |
|-------|------|-------------|
| `x402Version` | number | Must be `1` |
| `scheme` | string | Payment scheme identifier |
| `network` | string | Network identifier |
| `payload` | object | Scheme-specific payload |

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

Returned in `X-PAYMENT-RESPONSE` header (base64 encoded):

```json
{
  "success": true,
  "transaction": "0x1234567890abcdef...",
  "network": "base-sepolia",
  "payer": "0x857b06519E91e3A54538791bDbb0E22373e36b66"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `success` | boolean | Yes | Settlement success |
| `errorReason` | string | No | Error if failed |
| `transaction` | string | Yes | Transaction hash |
| `network` | string | Yes | Network identifier |
| `payer` | string | Yes | Payer address |

## Network Identifiers

### EVM Networks

| Network | V1 Identifier |
|---------|---------------|
| Base Sepolia | `base-sepolia` |
| Base Mainnet | `base` |
| Ethereum Mainnet | `ethereum` |
| Sepolia | `sepolia` |
| Avalanche Fuji | `avalanche-fuji` |
| Avalanche | `avalanche` |

### Solana Networks

| Network | V1 Identifier |
|---------|---------------|
| Solana Mainnet | `solana` |
| Solana Devnet | `solana-devnet` |

## Error Codes

- `insufficient_funds` - Wallet lacks tokens
- `invalid_exact_evm_payload_authorization_valid_after` - Authorization not yet valid
- `invalid_exact_evm_payload_authorization_valid_before` - Authorization expired
- `invalid_exact_evm_payload_authorization_value` - Insufficient amount
- `invalid_exact_evm_payload_signature` - Invalid signature
- `invalid_exact_evm_payload_recipient_mismatch` - Wrong recipient
- `invalid_network` - Unsupported network
- `invalid_payload` - Malformed payload
- `invalid_scheme` - Unsupported scheme
- `invalid_x402_version` - Version mismatch
