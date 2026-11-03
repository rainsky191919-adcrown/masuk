"""Local-only auth fixture + reverse proxy to a real isolated PostgREST database.

Never point this test fixture at a hosted environment. It binds loopback only.
"""
import base64
import hashlib
import hmac
import json
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.request import Request, urlopen
from urllib.error import HTTPError

SIGNING_KEY = b'masuk-local-test-only-signing-key-20261103'
USERS = {
    '00000000-0000-0000-0000-000000000001': ('Owner', 'rainsky191919@gmail.com'),
    '00000000-0000-0000-0000-000000000002': ('Rider', 'rider@example.test'),
    '00000000-0000-0000-0000-000000000003': ('Other', 'other@example.test'),
}


def session_for(user_id):
    name, email = USERS[user_id]
    def encode(value):
        return base64.urlsafe_b64encode(json.dumps(value).encode()).rstrip(b'=')
    raw = encode({'alg': 'HS256', 'typ': 'JWT'}) + b'.' + encode({
        'sub': user_id, 'role': 'authenticated', 'aud': 'authenticated',
        'exp': int(time.time()) + 3600, 'iat': int(time.time()),
    })
    signature = base64.urlsafe_b64encode(hmac.new(SIGNING_KEY, raw, hashlib.sha256).digest()).rstrip(b'=')
    user = {'id': user_id, 'aud': 'authenticated', 'role': 'authenticated', 'email': email,
            'email_confirmed_at': '2026-01-01T00:00:00Z', 'user_metadata': {'full_name': name}}
    return {'access_token': (raw + b'.' + signature).decode(), 'refresh_token': 'local-fixture-only',
            'expires_at': int(time.time()) + 3600, 'expires_in': 3600, 'token_type': 'bearer', 'user': user}


class Handler(BaseHTTPRequestHandler):
    def log_message(self, *_):
        pass  # No authorization/session logging.

    def send_json(self, status, data):
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Headers', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())

    def do_OPTIONS(self):
        self.send_json(200, {})

    def do_GET(self):
        if self.path == '/health':
            return self.send_json(200, {'local_fixture': True})
        if self.path == '/auth/v1/user':
            token = self.headers.get('Authorization', '').removeprefix('Bearer ')
            for user_id in USERS:
                if hmac.compare_digest(token, session_for(user_id)['access_token']):
                    return self.send_json(200, session_for(user_id)['user'])
            # Validate the signature; session_for uses current timestamps.
            try:
                raw, signature = token.rsplit('.', 1)
                expected = base64.urlsafe_b64encode(hmac.new(SIGNING_KEY, raw.encode(), hashlib.sha256).digest()).rstrip(b'=').decode()
                claims = json.loads(base64.urlsafe_b64decode(token.split('.')[1] + '=='))
                if hmac.compare_digest(signature, expected) and claims['sub'] in USERS and claims['exp'] > time.time():
                    return self.send_json(200, session_for(claims['sub'])['user'])
            except (ValueError, KeyError):
                pass
            return self.send_json(401, {'message': 'Local fixture session required'})
        self.send_json(404, {})

    def do_POST(self):
        if self.path.startswith('/auth/v1/logout'):
            return self.send_json(200, {})
        if self.path != '/rest/v1/rpc/masuk_command':
            return self.send_json(404, {})
        body = self.rfile.read(int(self.headers.get('Content-Length', 0)))
        headers = {'Content-Type': 'application/json'}
        authorization = self.headers.get('Authorization', '')
        if authorization != 'Bearer local-test-public-key':
            headers['Authorization'] = authorization
        req = Request('http://127.0.0.1:55431/rpc/masuk_command', data=body, headers=headers)
        try:
            with urlopen(req) as result:
                self.send_json(result.status, json.load(result))
        except HTTPError as error:
            self.send_json(error.code, json.load(error))


if __name__ == '__main__':
    ThreadingHTTPServer(('127.0.0.1', 55432), Handler).serve_forever()
