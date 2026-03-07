<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AdminMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        // 1. Check if user is logged in AND is an admin
        if ($request->user() && $request->user()->role === 'admin') {
            return $next($request);
        }

        if ($request->expectsJson() || $request->is('api/*')) {
            return response()->json(['message' => 'Unauthorized. Admin access only.'], 403);
        }

        // 2. If not, kick them out to login page
        return redirect()->route('admin.login')->withErrors('Unauthorized. Admin access only.');
    }
}