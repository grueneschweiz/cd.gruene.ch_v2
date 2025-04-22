<?php

use App\Image;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

class AddIconsBackgroundToImagesTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        DB::statement("ALTER TABLE images MODIFY COLUMN background ENUM('gradient', 'transparent', 'custom', 'icons') NOT NULL");
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        // ensure no rows use the 'icons' value
        DB::table('images')->where('background', 'icons')->update(['background' => 'gradient']);
        DB::statement("ALTER TABLE images MODIFY COLUMN background ENUM('gradient', 'transparent', 'custom') NOT NULL");
    }
}
