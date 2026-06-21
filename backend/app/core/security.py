from datetime import datetime, timedelta
import bcrypt
from jose import jwt, JWTError
from app.core.config import SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES

# NOTE: using the `bcrypt` library directly instead of passlib's CryptContext.
# passlib 1.7.4's bcrypt backend-detection code crashes against bcrypt>=4.1
# (it probes a removed `__about__` attribute), so we bypass passlib entirely.

def hash_password(password: str) -> str:
    pwd_bytes = password.encode("utf-8")[:72]  # bcrypt's hard limit
    hashed = bcrypt.hashpw(pwd_bytes, bcrypt.gensalt())
    return hashed.decode("utf-8")

def verify_password(password: str, hashed: str) -> bool:
    pwd_bytes = password.encode("utf-8")[:72]
    return bcrypt.checkpw(pwd_bytes, hashed.encode("utf-8"))


# ==========================
# JWT TOKEN HELPERS
# ==========================
def create_access_token(data: dict, expires_minutes: int | None = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(
        minutes=expires_minutes if expires_minutes is not None else ACCESS_TOKEN_EXPIRE_MINUTES
    )
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def decode_access_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None
