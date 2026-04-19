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
        Schema::table('categories', function (Blueprint $table) {
            if (!Schema::hasColumn('categories', 'is_upsell_enabled')) {
                $table->boolean('is_upsell_enabled')->default(false);
            }
            if (!Schema::hasColumn('categories', 'upsell_product_ids')) {
                $table->json('upsell_product_ids')->nullable();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('categories', function (Blueprint $table) {
            $table->dropColumn(['is_upsell_enabled', 'upsell_product_ids']);
        });
    }
};
