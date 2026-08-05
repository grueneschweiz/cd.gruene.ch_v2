<?php
declare(strict_types=1);

namespace Tests\Unit\Services\ImageEditor;

use App\Image;
use App\Services\ImageEditor\ImageEditorJpeg;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ImageEditorJpegTest extends TestCase
{
    public function testGetStorageDirOfUneditedImage(): void
    {
        $this->assertSame(
            'images/full',
            ImageEditorJpeg::getStorageDirOfUneditedImage(),
        );
    }

    public function testGetRelPathOfUneditedImage(): void
    {
        $image = $this->mock(Image::class, function ($mock) {
            $mock->shouldReceive('getAttribute')
                 ->with('filename')
                 ->andReturn('test.jpeg');
        });

        $editor = new ImageEditorJpeg($image);

        $this->assertSame(
            'images/full/test.jpeg',
            $editor->getRelPathOfUneditedImage(),
        );
    }

    public function testGetRelPath(): void
    {
        $image = $this->mock(Image::class);
        $image->shouldReceive('getAttribute')
              ->with('filename')
              ->andReturn('test.jpeg');
        $image->shouldReceive('getAttribute')
              ->with('bleed')
              ->andReturn(null);

        $editor = new ImageEditorJpeg($image);

        $this->assertSame(
            'images/full/test-sRGB-0px.jpeg',
            $editor->getRelPath(),
        );
    }

    public function testGetStorageDir(): void
    {
        $this->assertSame(
            'images/full',
            ImageEditorJpeg::getStorageDir(),
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

        $editor = new ImageEditorJpeg($image);

        $editor->generateIfNeeded();

        $this->assertTrue(
            Storage::exists($editor->getRelPath()),
        );

        $im   = new \Imagick(disk_path($editor->getRelPath()));
        $data = $im->identifyImage();

        $this->assertSame(
            'JPEG (Joint Photographic Experts Group JFIF format)',
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
