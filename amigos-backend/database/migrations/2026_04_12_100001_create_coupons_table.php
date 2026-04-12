<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('coupons', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->enum('type', ['flat', 'percent']);
            $table->decimal('value', 8, 2);
            $table->decimal('min_cart_amount', 8, 2)->default(0);
            $table->integer('usage_limit')->nullable()->comment('Max total uses');
            $table->integer('usage_limit_per_user')->nullable()->comment('Max uses per user');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('coupons');
    }
};
