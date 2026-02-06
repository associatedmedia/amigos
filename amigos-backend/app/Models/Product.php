<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    use HasFactory;

    protected $table = 'products';

    // Allow these fields to be mass-assigned
    protected $fillable = [
        'name',
        'category',      // Storing category name directly (based on your Excel import)
        'price',
        'image_url',
        'is_veg',        // boolean
        'description',
        'is_available'
    ];

    /**
     * CASTING: Ensure data types are correct for the App
     */
    protected $casts = [
        'is_veg' => 'boolean',       // 1 becomes true, 0 becomes false
        'is_available' => 'boolean',
        'price' => 'float',
    ];

    /**
     * MAGIC ACCESSOR: Fix Image URLs automatically
     * usage: $product->image_url
     */
    public function getImageUrlAttribute($value)
    {
        // 1. If no image, return a default placeholder
        if (!$value) {
            // Use a generic placeholder if image is missing
            return 'https://placehold.co/400x400/png?text=No+Image';
        }

        // 2. If it's already a full link (http...), return it
        if (str_starts_with($value, 'http')) {
            return $value;
        }

        // 3. Otherwise, add the domain name (e.g. localhost:8000/storage/...)
        return asset($value);
    }
}