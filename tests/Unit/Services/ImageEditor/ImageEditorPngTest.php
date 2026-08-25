<?php
declare(strict_types=1);

namespace Tests\Unit\Services\ImageEditor;

use App\Image;
use App\Services\ImageEditor\ImageEditorPng;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ImageEditorPngTest extends TestCase
{
    public function testGetStorageDirOfUneditedImage(): void
    {
        $this->assertSame(
            'images/full',
            ImageEditorPng::getStorageDirOfUneditedImage(),
        );
    }

    public function testGetRelPathOfUneditedImage(): void
    {
        $image = $this->mock(Image::class, function ($mock) {
            $mock->shouldReceive('getAttribute')
                 ->with('filename')
                 ->andReturn('test.png');
        });

        $editor = new ImageEditorPng($image);

        $this->assertSame(
            'images/full/test.png',
            $editor->getRelPathOfUneditedImage(),
        );
    }

    public function testGetRelPath(): void
    {
        $image = $this->mock(Image::class);
        $image->shouldReceive('getAttribute')
              ->with('filename')
              ->andReturn('test.png');
        $image->shouldReceive('getAttribute')
              ->with('bleed')
              ->andReturn(null);

        $editor = new ImageEditorPng($image);

        $this->assertSame(
            'images/full/test-sRGB-0px.png',
            $editor->getRelPath(),
        );
    }

    public function testGetStorageDir(): void
    {
        $this->assertSame(
            'images/full',
            ImageEditorPng::getStorageDir(),
        );
    }

    /**
     * @dataProvider generateBleedProvider
     */
    public function testGenerateIfNeeded(int|null $bleed): void
    {
        $image = factory(Image::class)->make([
            'user_id' => 1,
            'logo_id' => 1,
            'bleed'   => $bleed,
        ]);

        $editor = new ImageEditorPng($image);

        $editor->generateIfNeeded();

        $this->assertTrue(
            Storage::exists($editor->getRelPath()),
        );

        $im   = new \Imagick(disk_path($editor->getRelPath()));
        $data = $im->identifyImage();

        $this->assertSame(
            'PNG (Portable Network Graphics)',
            $data['format'],
        );
        $this->assertSame(
            'sRGB',
            $data['colorSpace'],
        );
        $this->assertSame(
            $image->width - 2 * $bleed,
            $data['geometry']['width'],
        );
        $this->assertSame(
            $image->height - 2 * $bleed,
            $data['geometry']['height'],
        );
    }

    public static function generateBleedProvider(): array
    {
        return [
            'null'      => [null],
            'noBleed'   => [0],
            'withBleed' => [5],
        ];
    }
}
