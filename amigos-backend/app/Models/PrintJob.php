<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PrintJob extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_id',
        'printer_type',
        'print_data',
        'status',
        'attempts',
        'error_message',
    ];

    protected $casts = [
        'print_data' => 'array',
    ];

    public function order()
    {
        return $this->belongsTo(Order::class);
    }
}
