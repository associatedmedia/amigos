<?php

namespace App\Http\Controllers\webadmin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AuthController extends Controller
{
    public function showLoginForm()
    {
        if (Auth::check() && Auth::user()->role === 'admin') {
            return redirect()->route('admin.dashboard');
        }
        return view('webadmin.auth.login');
    }

    public function login(Request $request)
    {
        $request->validate([
            'username' => ['required', 'string'], // Assuming admin logs in with mobile_no
            'password' => ['required'],
        ]);

        // Attempt to log in the admin user from the database
        $credentials = ['mobile_no' => $request->username, 'password' => $request->password, 'role' => 'admin'];

        if (Auth::attempt($credentials)) {
            $request->session()->regenerate();
            return redirect()->intended('/admin/dashboard');
        }

        return back()->withErrors([
            'username' => 'The provided credentials do not match our records.',
        ])->onlyInput('username');
    }

    public function logout(Request $request)
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/admin/login');
    }
}
