from fastapi import HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
import os
import json
import urllib.request
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")
JWT_SECRET_RAW = os.getenv("JWT_SECRET", "")  # kept for fallback

# Supabase new projects use ES256 asymmetric signing.
# Fetch the public JWKS to verify tokens properly.
JWKS_URL = f"{SUPABASE_URL}/auth/v1/.well-known/jwks.json"

_jwks_cache = {}

def _load_jwks():
    global _jwks_cache
    try:
        with urllib.request.urlopen(JWKS_URL, timeout=10) as resp:
            data = json.loads(resp.read())
            for key in data.get("keys", []):
                kid = key.get("kid")
                if kid:
                    _jwks_cache[kid] = key
        print(f"[auth] Loaded {len(_jwks_cache)} JWKS key(s) from Supabase")
    except Exception as e:
        print(f"[auth] WARNING: Could not fetch JWKS: {e}")

_load_jwks()  # Load on startup

def _get_public_key(kid: str):
    from jwt.algorithms import ECAlgorithm, RSAAlgorithm
    key_data = _jwks_cache.get(kid)
    if not key_data:
        # Retry once in case of cache miss
        _load_jwks()
        key_data = _jwks_cache.get(kid)
    if not key_data:
        return None, None
    kty = key_data.get("kty", "EC")
    if kty == "EC":
        return ECAlgorithm.from_jwk(json.dumps(key_data)), "ES256"
    elif kty == "RSA":
        return RSAAlgorithm.from_jwk(json.dumps(key_data)), "RS256"
    return None, None

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
security = HTTPBearer()

def verify_token(credentials: HTTPAuthorizationCredentials = Security(security)):
    token = credentials.credentials
    try:
        header = jwt.get_unverified_header(token)
        alg = header.get("alg", "HS256")
        kid = header.get("kid")

        if alg in ("ES256", "RS256") and kid:
            # New Supabase: asymmetric signing via JWKS
            public_key, allowed_alg = _get_public_key(kid)
            if not public_key:
                raise HTTPException(status_code=401, detail=f"Unknown key ID: {kid}")
            payload = jwt.decode(
                token,
                public_key,
                algorithms=[allowed_alg],
                options={"verify_aud": False}
            )
        else:
            # Legacy Supabase: HS256 with JWT secret
            import base64
            try:
                secret = base64.b64decode(JWT_SECRET_RAW)
            except Exception:
                secret = JWT_SECRET_RAW.encode("utf-8")
            payload = jwt.decode(
                token,
                secret,
                algorithms=["HS256"],
                options={"verify_aud": False}
            )

        return payload["sub"]

    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Auth error: {str(e)}")
