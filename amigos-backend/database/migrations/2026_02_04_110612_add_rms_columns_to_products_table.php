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
        Schema::table('products', function (Blueprint $table) {
            //
            $table->string('old_db_code')->nullable()->after('id');
            $table->string('group')->nullable()->after('category'); 
            // Note: 'Group' is a reserved keyword in SQL, so usually lowercase 'group' or 'product_group' is safer. 
            // I'm using 'group' here, but be careful with raw queries.
            $table->string('gst')->nullable()->after('price');
            $table->decimal('tax_percentage', 5, 2)->default(0)->after('gst');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            //
            $table->dropColumn(['old_db_code', 'group', 'gst', 'tax_percentage']);
        });
    }
};
