<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('printer_setups', function (Blueprint $table) {
            $table->id();
            $table->string('operation_type')->unique();
            $table->string('printer_id')->nullable();
            $table->string('printer_model')->nullable();
            
            // Order Section
            $table->boolean('order_kitchen')->default(false);
            $table->boolean('order_as_inputted')->default(false);
            $table->boolean('order_group')->default(false);
            $table->boolean('kitchen_duplicate')->default(false);
            $table->boolean('kitchen_triplicate')->default(false);
            $table->boolean('order_duplicate')->default(false);
            $table->boolean('group_duplicate')->default(false);
            
            // Right Side Order Section
            $table->boolean('kitchen_printing_yes_no')->default(false);
            $table->boolean('order_print_through_printer_object')->default(false);
            $table->boolean('bill_print_through_printer_object')->default(false);
            $table->boolean('bill_printing_optional_at_billing')->default(false);
            
            // Billing Section
            $table->enum('billing_type', ['direct', 'group_based'])->default('direct');
            $table->boolean('bill_duplicate')->default(false);
            $table->boolean('slip_report')->default(false);
            $table->boolean('label')->default(false);
            
            // DOS Printing Section
            $table->integer('printer_type_cols')->default(80);
            $table->integer('no_of_line_print')->default(80);
            
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('printer_setups');
    }
};
