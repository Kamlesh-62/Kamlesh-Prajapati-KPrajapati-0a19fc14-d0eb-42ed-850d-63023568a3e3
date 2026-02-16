import { HttpInterceptorFn } from '@angular/common/http';

const generateKey = () => {
  const cryptoObj =
    typeof globalThis !== 'undefined'
      ? (globalThis.crypto as Crypto | undefined)
      : undefined;
  if (cryptoObj?.randomUUID) {
    return cryptoObj.randomUUID();
  }
  const bytes = new Uint8Array(16);
  if (cryptoObj?.getRandomValues) {
    cryptoObj.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i += 1) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const toHex = (n: number) => n.toString(16).padStart(2, '0');
  const hex = Array.from(bytes, toHex).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
};

export const idempotencyInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.method.toUpperCase() !== 'POST') {
    return next(req);
  }
  if (req.headers.has('Idempotency-Key')) {
    return next(req);
  }
  return next(
    req.clone({
      setHeaders: {
        'Idempotency-Key': generateKey(),
      },
    })
  );
};
