<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProductVariant extends Model
{
    use HasFactory;

    // Allow mass assignment for the import script
    protected $fillable = [
        'product_id',
        'variant_name',
        'price',
    ];

    // Optional: Setup the relationship back to the main product
    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}