import os, json, urllib.request, jwt
from dotenv import load_dotenv
from supabase import create_client
from jwt.algorithms import ECAlgorithm

load_dotenv()
SUPABASE_URL = os.getenv('SUPABASE_URL')
JWT_SECRET_RAW = os.getenv('JWT_SECRET', '')

anon_key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNpcHNtYnlqY2tncnhka3lzenV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1MTU0NTAsImV4cCI6MjA5NzA5MTQ1MH0.y4VbjSgyG4MQee_f2QmmXhmCP8na1BB-7Vr0rdS6rVw'
anon_sb = create_client(SUPABASE_URL, anon_key)

import sys
email = sys.argv[1]
password = sys.argv[2]

res = anon_sb.auth.sign_in_with_password({'email': email, 'password': password})
token = res.session.access_token

header = jwt.get_unverified_header(token)
print('JWT alg:', header['alg'], '  kid:', header.get('kid'))

# Fetch JWKS
jwks_url = SUPABASE_URL + '/auth/v1/.well-known/jwks.json'
with urllib.request.urlopen(jwks_url) as r:
    jwks = json.loads(r.read())

print('JWKS keys found:', len(jwks.get('keys', [])))
for k in jwks.get('keys', []):
    print('  key kid:', k.get('kid'), '  kty:', k.get('kty'), '  alg:', k.get('alg'))

# Find matching key
kid = header.get('kid')
matching = next((k for k in jwks['keys'] if k.get('kid') == kid), None)
if not matching:
    print('ERROR: No matching key for kid', kid)
else:
    pub_key = ECAlgorithm.from_jwk(json.dumps(matching))
    try:
        payload = jwt.decode(token, pub_key, algorithms=['ES256'], options={'verify_aud': False})
        print()
        print('ES256 verification: SUCCESS')
        print('sub:', payload['sub'], '  role:', payload.get('role'))
    except Exception as e:
        print('ES256 verification: FAIL -', e)
