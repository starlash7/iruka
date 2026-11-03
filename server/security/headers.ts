/** API responses must not become executable documents or be cached with another identity. */
export const apiSecurityHeaders={
 'cache-control':'no-store',
 'x-content-type-options':'nosniff',
 'referrer-policy':'no-referrer',
 'cross-origin-resource-policy':'same-origin',
 'content-security-policy':"default-src 'none'; frame-ancestors 'none'; base-uri 'none'; sandbox",
} as const;
