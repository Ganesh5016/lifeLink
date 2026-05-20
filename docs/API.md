# LifeLink API Documentation

Base URL: `https://your-backend.onrender.com/api`

All protected endpoints require: `Authorization: Bearer <access_token>`

---

## Authentication Endpoints

### POST /auth/register
Register a new user.

**Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123",
  "phone": "+91 98765 43210",
  "role": "donor",
  "bloodGroup": "O+",
  "age": 28,
  "weight": 70
}
```
**Response:** `201 Created`
```json
{
  "message": "Registration successful",
  "user": { "_id": "...", "name": "John Doe", "role": "donor", ... },
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc..."
}
```

### POST /auth/login
**Body:** `{ "email": "...", "password": "..." }`
**Response:** Same as register (200 OK)

### POST /auth/firebase
Exchange Firebase ID token for LifeLink JWT.
**Body:** `{ "idToken": "firebase_id_token_here" }`

### GET /auth/me
Get current user profile. **Protected.**

### POST /auth/refresh
**Body:** `{ "refreshToken": "..." }`
**Response:** `{ "accessToken": "...", "refreshToken": "..." }`

### POST /auth/forgot-password
**Body:** `{ "email": "..." }`

### POST /auth/reset-password
**Body:** `{ "token": "reset_token", "password": "newPass123" }`

### POST /auth/logout
**Protected.** Invalidates refresh token.

---

## Donor Endpoints

### GET /donors/nearby
Find nearby available donors.

**Query params:**
- `lat` (required): Latitude
- `lng` (required): Longitude
- `radius`: Search radius in km (default: 10)
- `bloodGroup`: Filter by blood group
- `page`, `limit`: Pagination

**Response:**
```json
{
  "donors": [
    {
      "_id": "...",
      "name": "Arjun Sharma",
      "bloodGroup": "O+",
      "isAvailable": true,
      "totalDonations": 12,
      "location": { "coordinates": [80.27, 13.08] }
    }
  ],
  "pagination": { "total": 45, "page": 1, "pages": 3 }
}
```

### GET /donors/leaderboard
Top donors ranked by total donations.

### GET /donors/:id
Get donor profile by ID.

### PUT /donors/profile *(Protected)*
Update donor profile. Body: any combination of updatable fields.

### PUT /donors/availability *(Protected)*
Toggle donation availability.
**Response:** `{ "isAvailable": true, "message": "You are now available..." }`

### PUT /donors/location *(Protected)*
Update GPS location.
**Body:** `{ "lat": 13.08, "lng": 80.27, "address": "Chennai, TN" }`

### GET /donors/me/donations *(Protected)*
Get own donation history.

### GET /donors/me/eligibility *(Protected)*
Check donation eligibility.
```json
{
  "eligible": true,
  "reasons": [],
  "nextEligibleDate": null
}
```

---

## Blood Request Endpoints

### GET /requests
Get blood requests with optional filters.

**Query params:**
- `status`: active | fulfilled | cancelled (default: active)
- `bloodGroup`: e.g., O+
- `priority`: critical | high | medium | low
- `lat`, `lng`, `radius`: Location-based search
- `page`, `limit`

### GET /requests/stats
Get platform statistics.
```json
{
  "total": 342,
  "active": 28,
  "fulfilled": 198,
  "emergency": 5,
  "byBloodGroup": [{ "_id": "O+", "count": 45 }, ...]
}
```

### GET /requests/:id
Get single request with full details including responses.

### POST /requests *(Protected)*
Create a new blood request.

**Body:**
```json
{
  "patientName": "Jane Doe",
  "patientAge": 35,
  "contactNumber": "+91 98765 43210",
  "bloodGroup": "AB+",
  "unitsRequired": 2,
  "hospitalName": "Apollo Hospital Chennai",
  "location": {
    "type": "Point",
    "coordinates": [80.2707, 13.0827],
    "address": "Apollo Hospital, Greams Road, Chennai"
  },
  "priority": "critical",
  "medicalReason": "Emergency surgery",
  "isEmergency": true,
  "requiredBy": "2024-01-15T18:00:00.000Z"
}
```

**Response:** `201`
```json
{
  "request": { ... },
  "donorsNotified": 23
}
```

### PUT /requests/:id/accept *(Protected)*
Accept a blood request as a donor.

### PUT /requests/:id/complete *(Protected)*
Mark donation as completed.
**Body:** `{ "units": 1 }`

### DELETE /requests/:id *(Protected)*
Cancel a request (own request or admin).

---

## Hospital Endpoints

### GET /hospitals
Get all hospitals. Supports `lat`, `lng`, `radius` for nearby search.

### GET /hospitals/:id/inventory
Get blood inventory for a hospital.

### PUT /hospitals/inventory *(Protected — hospital/admin)*
Update blood inventory.
```json
{
  "bloodGroup": "O+",
  "units": 5,
  "action": "added",
  "reason": "Donation drive"
}
```
Actions: `added` | `used` | `expired`

### GET /hospitals/dashboard/stats *(Protected — hospital)*
Hospital-specific dashboard statistics.

---

## Admin Endpoints *(All require admin role)*

### GET /admin/stats
Full platform statistics including user growth.

### GET /admin/users
List all users with search and role filter.
**Query:** `role`, `search`, `page`, `limit`

### PUT /admin/users/:id/block
Toggle user block status.
**Body:** `{ "reason": "Fake account" }` (optional)

### PUT /admin/hospitals/:id/verify
Verify a hospital account.

### GET /admin/fraud-alerts
Get requests with high fraud scores.

### DELETE /admin/requests/:id
Permanently delete a request.

---

## Chat Endpoints *(All Protected)*

### POST /chat/start
Start or get existing chat.
```json
{
  "participantId": "user_id",
  "requestId": "request_id"
}
```

### GET /chat
Get all user's chats.

### GET /chat/:id/messages
Get chat messages (paginated).
**Query:** `page`, `limit`

---

## Notification Endpoints *(All Protected)*

### GET /notifications
Get user notifications.
**Response:** `{ "notifications": [...], "unreadCount": 5 }`

### PUT /notifications/:id/read
Mark single notification as read.

### PUT /notifications/read-all
Mark all notifications as read.

### POST /notifications/fcm-token
Register device FCM token.
**Body:** `{ "token": "fcm_device_token" }`

---

## Upload Endpoints *(Protected)*

### POST /upload/image
Upload profile image.
**Content-Type:** `multipart/form-data`
**Body:** `image` (file, max 5MB)
**Response:** `{ "url": "https://res.cloudinary.com/...", "publicId": "..." }`

---

## WebSocket Events

Connect: `io('wss://your-backend.onrender.com', { auth: { token: 'jwt_token' } })`

### Emitted by Client
| Event | Payload | Description |
|-------|---------|-------------|
| `update_location` | `{ lat, lng }` | Update donor GPS |
| `join_request` | `requestId` | Join request room |
| `join_chat` | `chatId` | Join chat room |
| `send_message` | `{ chatId, content }` | Send chat message |
| `typing` | `{ chatId }` | Typing indicator start |
| `stop_typing` | `{ chatId }` | Typing indicator stop |
| `sos_alert` | `{ location, message }` | Emergency SOS |

### Received from Server
| Event | Description |
|-------|-------------|
| `new_emergency_request` | New blood request nearby |
| `request_feed_update` | Feed update (new/cancelled) |
| `request_accepted` | Donor accepted your request |
| `request_cancelled` | Request was cancelled |
| `donor_location_update` | Donor moved on map |
| `donor_availability_update` | Donor availability changed |
| `new_message` | New chat message |
| `user_typing` | Someone is typing |
| `user_stop_typing` | Someone stopped typing |

---

## Error Responses

All errors follow this format:
```json
{
  "error": "Human-readable error message",
  "details": ["validation error 1", "..."]
}
```

| Status | Meaning |
|--------|---------|
| 400 | Bad Request / Validation Error |
| 401 | Unauthorized (missing/invalid token) |
| 403 | Forbidden (insufficient role) |
| 404 | Not Found |
| 409 | Conflict (e.g., duplicate email) |
| 429 | Too Many Requests (rate limited) |
| 500 | Internal Server Error |
