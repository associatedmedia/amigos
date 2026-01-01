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
        Schema::table('orders', function (Blueprint $table) {
            //
            $table->string('customer_name')->nullable()->after('mobile_no');
            $table->string('order_number')->nullable()->after('customer_name');
            $table->integer('store_id')->nullable()->after('address');
            $table->string('payment_method')->nullable()->after('latitude');
            $table->integer('timestamp')->nullable()->after('payment_method');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            //
        });
    }
};
