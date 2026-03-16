<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PrinterSetup extends Model
{
    use HasFactory;

    protected $fillable = [
        'operation_type',
        'printer_id',
        'printer_model',
        'order_kitchen',
        'order_as_inputted',
        'order_group',
        'kitchen_duplicate',
        'kitchen_triplicate',
        'order_duplicate',
        'group_duplicate',
        'kitchen_printing_yes_no',
        'order_print_through_printer_object',
        'bill_print_through_printer_object',
        'bill_printing_optional_at_billing',
        'billing_type',
        'bill_duplicate',
        'slip_report',
        'label',
        'printer_type_cols',
        'no_of_line_print',
    ];

    protected $casts = [
        'order_kitchen' => 'boolean',
        'order_as_inputted' => 'boolean',
        'order_group' => 'boolean',
        'kitchen_duplicate' => 'boolean',
        'kitchen_triplicate' => 'boolean',
        'order_duplicate' => 'boolean',
        'group_duplicate' => 'boolean',
        'kitchen_printing_yes_no' => 'boolean',
        'order_print_through_printer_object' => 'boolean',
        'bill_print_through_printer_object' => 'boolean',
        'bill_printing_optional_at_billing' => 'boolean',
        'bill_duplicate' => 'boolean',
        'slip_report' => 'boolean',
        'label' => 'boolean',
        'printer_type_cols' => 'integer',
        'no_of_line_print' => 'integer',
    ];
}
