<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
{
    Schema::table('banners', function (Blueprint $table) {
        // We rename 'image_url' to 'image' to match your format, or just map it in controller. 
        // Let's keep 'image' as the column name for consistency.
        if (Schema::hasColumn('banners', 'image_url')) {
            $table->renameColumn('image_url', 'image');
        } else {
             $table->string('image');
        }
        
        $table->string('sub')->nullable(); // For 'sub' (subtitle)
        $table->string('target_screen')->nullable(); // For 'targetScreen'
        $table->json('target_params')->nullable();   // For 'targetParams'
    });
}

public function down(): void
{
    Schema::table('banners', function (Blueprint $table) {
        $table->dropColumn(['sub', 'target_screen', 'target_params']);
        $table->renameColumn('image', 'image_url');
    });
}
};
