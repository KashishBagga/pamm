# PAMM Verification Guide

This guide provides the necessary commands and workflows to verify the complete implementation of Assignments 1 and 2.

## 1. Authentication & RBAC (Assignment 1)

### Test Case: Login & Token Generation
**Objective**: Verify that login returns access/refresh tokens and user metadata.

```bash
# Login as Manager
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "manager.us.ar@example.com", "password": "Manager123!"}' | jq .
```

### Test Case: Access Control (RBAC)
**Objective**: Verify that only authorized roles can access patient data.

```bash
# 1. Login as User (Restricted)
LOGIN_RESP=$(curl -s -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user.us.ar@example.com", "password": "User123!"}')
TOKEN=$(echo $LOGIN_RESP | jq -r .access_token)

# 2. Attempt to list patients (Should fail with 403)
curl -s -X GET http://localhost:8000/api/patients \
  -H "Authorization: Bearer $TOKEN" | jq .
```

---

## 2. Patient Data Management & Encryption (Assignment 2)

### Test Case: Secure Excel Upload
**Objective**: Verify that a Manager can upload patient data and that it is encrypted.

1. **Prepare a sample Excel file** (`patients.xlsx`) with columns: `Patient ID`, `First Name`, `Last Name`, `Date of Birth`, `Gender`.

```bash
# Login as Manager
MANAGER_TOKEN=$(curl -s -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "manager.us.ar@example.com", "password": "Manager123!"}' | jq -r .access_token)

# Upload Patients (Simulation - replace path to your excel file)
curl -X POST http://localhost:8000/api/patients/upload \
  -H "Authorization: Bearer $MANAGER_TOKEN" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@/path/to/patients.xlsx" | jq .
```

### Test Case: On-the-fly Decryption
**Objective**: Verify that data is decrypted for the Manager but stored encrypted in the DB.

```bash
# 1. List Patients (Manager View - Data should be decrypted)
curl -s -X GET http://localhost:8000/api/patients \
  -H "Authorization: Bearer $MANAGER_TOKEN" | jq .

# 2. Check Database directly (Verification of Encryption)
docker-compose exec db psql -U user -d rbac_db -c "SELECT patient_id, first_name, last_name FROM patients LIMIT 5;"
# Observe that first_name and last_name are Base64 encrypted strings, while patient_id is plain text.
```

### Test Case: Data Isolation
**Objective**: Verify that Manager A cannot see Manager B's patients.

```bash
# 1. Login as Manager B (India Location)
INDIA_MANAGER_TOKEN=$(curl -s -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "manager.in.epa@example.com", "password": "Manager123!"}' | jq -r .access_token)

# 2. List Patients (Should be empty if Manager B hasn't uploaded any)
curl -s -X GET http://localhost:8000/api/patients \
  -H "Authorization: Bearer $INDIA_MANAGER_TOKEN" | jq .
```

---

## 3. Auditing & Compliance

### Test Case: PHI Access Audit Logs
**Objective**: Verify that all access events are logged.

```bash
# Fetch Audit Logs
curl -s -X GET http://localhost:8000/api/patients/audit \
  -H "Authorization: Bearer $MANAGER_TOKEN" | jq .
```

---

## 4. Frontend Verification (Manual)
1. **Manager Flow**:
   - Login as `manager.us.ar@example.com`.
   - Use the **Drag & Drop** area to upload an Excel file.
   - Verify table populates with decrypted names and DOBs.
   - Click **Edit (Pencil Icon)** on a row, change the 'First Name', and Save.
   - Scroll down to **Audit Trail** and verify the "EDIT" and "ACCESS" entries.
2. **Admin Flow**:
   - Login as `admin@example.com`.
   - Access the Admin Dashboard to manage users.
3. **Security Flow**:
   - Try accessing `/dashboard/manager` as a regular User. (Should redirect to User dashboard).
