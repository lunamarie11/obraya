# Rate Limiting & CORS Configuration

## Rate Limiting Strategy

The backend now uses `@nestjs/throttler` to protect against abuse. Different endpoints have different limits:

### Limits by Endpoint Type

| Type | Limit | Window | Purpose |
|------|-------|--------|---------|
| **Auth** (login/register) | 5 requests | 15 minutes | Prevent brute force attacks |
| **API** (general) | 50 requests | 1 minute | Prevent API abuse |
| **Search** | 30 requests | 1 minute | Optimize search performance |
| **Default** | 100 requests | 15 minutes | General protection |

### Implementation Details

```typescript
// In auth.controller.ts
@Throttle({ default: 5 })
@Post('login')
login(@Body() dto: LoginBody) { ... }
```

### Response Codes

- **200-299**: Request succeeded
- **429**: Rate limit exceeded (ThrottlerException)
  ```json
  {
    "statusCode": 429,
    "message": "ThrottlerException: Too Many Requests"
  }
  ```

---

## CORS Configuration

CORS is now configured with a whitelist of allowed origins. Dynamic origin validation prevents unauthorized API access.

### Allowed Origins

**Development:**
- `http://localhost:3000`
- `http://localhost:3002`
- `http://localhost:3004`
- `http://localhost:5173` (Vite default)

**Production:**
- `https://app.obraya.com`
- `https://admin.obraya.com`

### Custom Origins

Add via environment variable:
```bash
ALLOWED_ORIGINS="https://custom1.com,https://custom2.com"
```

### CORS Headers

**Allowed Methods:** GET, POST, PUT, PATCH, DELETE, OPTIONS
**Allowed Headers:** Content-Type, Authorization, X-Requested-With, X-Request-ID
**Exposed Headers:** X-Request-ID, X-RateLimit-Limit, X-RateLimit-Remaining
**Max Age:** 3600 seconds (1 hour)

---

## Testing Rate Limits

```bash
# Test auth endpoint (5 requests limit)
for i in {1..6}; do
  curl -X POST http://localhost:3003/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"test"}'
done
# 6th request returns: 429 Too Many Requests
```

## Testing CORS

```bash
# Allowed origin
curl -H "Origin: http://localhost:3002" http://localhost:3003/api/health
# Returns: Access-Control-Allow-Origin: http://localhost:3002

# Denied origin
curl -H "Origin: http://evil.com" http://localhost:3003/api/health
# Returns: No CORS headers
```

---

## Enabling/Disabling Per-Endpoint

### Skip Rate Limiting

```typescript
import { SkipThrottle } from '@nestjs/throttler';

@SkipThrottle()
@Get('public-endpoint')
publicEndpoint() { ... }
```

### Custom Limit Per Method

```typescript
@Throttle({ default: 100 }) // Override default limit
@Get('heavy-operation')
heavyOperation() { ... }
```

---

## Production Considerations

1. **Rate Limit Headers**: Clients can read `X-RateLimit-Limit` and `X-RateLimit-Remaining` headers
2. **IP-based**: Rate limiting is per-IP by default
3. **Distributed System**: If using multiple servers, consider Redis store for rate limit state
4. **Monitoring**: Check logs for rate limit violations
5. **Adjustment**: Tune limits based on monitoring data

---

## Future Enhancements

- [ ] Redis store for distributed rate limiting
- [ ] User-based rate limits (different for authenticated users)
- [ ] Per-endpoint dynamic limits via admin panel
- [ ] Whitelist/blacklist management
- [ ] Rate limit analytics dashboard
