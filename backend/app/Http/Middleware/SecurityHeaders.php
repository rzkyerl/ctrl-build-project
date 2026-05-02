<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

use Illuminate\Support\Facades\Vite;

class SecurityHeaders
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Generate CSP Nonce if Vite is used
        if (class_exists(Vite::class)) {
            Vite::useCspNonce();
        }

        $response = $next($request);

        // Proteksi XSS (Cross-Site Scripting)
        $response->headers->set('X-XSS-Protection', '1; mode=block');
        
        // Mencegah Clickjacking
        $response->headers->set('X-Frame-Options', 'SAMEORIGIN');
        
        // Mencegah MIME sniffing
        $response->headers->set('X-Content-Type-Options', 'nosniff');
        
        // Referrer Policy
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');
        
        // Content Security Policy (Enhanced)
        $csp = "default-src 'self'; ";
        $csp .= "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net; "; // Added common CDN if needed
        $csp .= "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; ";
        $csp .= "img-src 'self' data: https:; ";
        $csp .= "font-src 'self' https://fonts.gstatic.com; ";
        $csp .= "frame-ancestors 'none'; ";
        $csp .= "upgrade-insecure-requests;";
        
        $response->headers->set('Content-Security-Policy', $csp);

        // Permissions Policy
        $response->headers->set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), browsing-topics=()');

        // Strict Transport Security (HSTS)
        if ($request->isSecure()) {
            $response->headers->set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
        }

        return $response;
    }
}
