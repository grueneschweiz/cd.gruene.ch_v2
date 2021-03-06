<?php

namespace Database\Seeders;


use App\Group;
use App\GroupLogo;
use App\Image;
use App\Legal;
use App\Logo;
use App\Role;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     *
     * @return void
     */
    public function run()
    {
        $this->call(RootSeeder::class);
        factory(Group::class)->create();
        factory(Logo::class)->create();
        factory(Role::class)->create();
        factory(GroupLogo::class)->create();
        factory(Image::class, 10)->create();
        factory(Legal::class)->create();
    }
}
