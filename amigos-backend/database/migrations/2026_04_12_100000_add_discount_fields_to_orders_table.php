<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->decimal('first_order_discount', 8, 2)->default(0)->after('total_amount');
            $table->boolean('is_first_order')->default(false)->after('first_order_discount');
        });
    }

    public function down()
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn('first_order_discount');
            $table->dropColumn('is_first_order');
        });
    }
};
