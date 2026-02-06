<?php

namespace App\Http\Controllers;

use App\Models\Category; // Make sure this Model exists
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    public function index()
    {
        return response()->json(Category::all());
    }
}