<?php

namespace App\Http\Controllers\webadmin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AuthController extends Controller
{
    public function showLoginForm()
    {
        // Allow static admin or traditional authenticated admin
        if (session('is_admin') || (Auth::check() && Auth::user()->role === 'admin')) {
            return redirect()->route('admin.dashboard');
        }
        return view('webadmin.auth.login');
    }

    public function login(Request $request)
    {
        $request->validate([
            'username' => ['required'],
            'password' => ['required'],
        ]);

        if ($request->username === 'admin' && $request->password === '5656') {
            $request->session()->regenerate();
            $request->session()->put('is_admin', true);
            
            return redirect()->intended('/admin/dashboard');
        }

        return back()->withErrors([
            'username' => 'The provided credentials do not match our records.',
        ])->onlyInput('username');
    }

    public function logout(Request $request)
    {
        $request->session()->forget('is_admin');
        
        // Also log out regular Auth if it was used
        if (Auth::check()) {
            Auth::logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();
        }

        return redirect('/admin/login');
    }
}
