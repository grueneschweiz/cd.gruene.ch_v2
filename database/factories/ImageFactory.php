<?php

/** @var \Illuminate\Database\Eloquent\Factory $factory */

use App\Image;
use App\Logo;
use App\Services\ImageEditor\ImageEditor;
use App\User;
use Faker\Generator as Faker;
use Illuminate\Support\Facades\Storage;

$factory->define(Image::class, function (Faker $faker) {
    $imageWidth  = 1080;
    $imageHeight = 1080;

    $relDir = ImageEditor::getStorageDir();

    Storage::makeDirectory($relDir);

    $absDir   = disk_path($relDir);
    $filename = \Illuminate\Support\Str::random().'.jpeg';

    copy(__DIR__.DIRECTORY_SEPARATOR.'Image.jpeg', $absDir.DIRECTORY_SEPARATOR.$filename);

    Storage::setVisibility($relDir.DIRECTORY_SEPARATOR.$filename, 'private');

    return [
        'user_id'    => function () {
            return factory(User::class)->create()->id;
        },
        'logo_id'    => function () {
            return factory(Logo::class)->create()->id;
        },
        'type'       => Image::TYPE_FINAL,
        'background' => Image::BG_GRADIENT,
        'keywords'   => $faker->words(5, true),
        'filename'   => $filename,
        'width'      => $imageWidth,
        'height'     => $imageHeight,
        'bleed'      => null,
        'resolution' => 300,
    ];
});
