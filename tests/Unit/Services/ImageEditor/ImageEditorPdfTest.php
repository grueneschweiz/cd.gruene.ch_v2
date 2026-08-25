<?php
declare(strict_types=1);

namespace Tests\Unit\Services\ImageEditor;

use App\Exceptions\ImageEditorException;
use App\Image;
use App\Services\ImageEditor\ImageEditorPdf;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ImageEditorPdfTest extends TestCase
{
    /**
     * @dataProvider bleedProvider
     */
    public function testGetRelPath(int|null $bleed): void
    {
        $image = $this->mock(Image::class);
        $image->shouldReceive('getAttribute')
              ->with('filename')
              ->andReturn('test.png');
        $image->shouldReceive('getAttribute')
              ->with('bleed')
              ->andReturn($bleed);

        $editor = new ImageEditorPdf($image, $bleed > 0, 123);

        $bleedStr = $bleed && $bleed > 0 ? $bleed : 0;

        $this->assertSame(
            "images/full/test-FOGRA51-123dpi-{$bleedStr}px.pdf",
            $editor->getRelPath(),
        );
    }

    /**
     * @dataProvider resolutionProvider
     */
    public function testGetRelPath__invalidResolution(int|null $resolution): void
    {
        $image = $this->mock(Image::class);
        $image->shouldReceive('getAttribute')
              ->with('filename')
              ->andReturn('test.png');
        $image->shouldReceive('getAttribute')
              ->with('bleed')
              ->andReturn(0);

        $this->expectException(ImageEditorException::class);

        new ImageEditorPdf($image, false, $resolution);
    }

    /**
     * @dataProvider bleedProvider
     */
    public function testGenerateIfNeeded(int|null $bleed): void
    {
        copy(
            __DIR__.'/../../../assets/PSOcoated_v3.icc',
            disk_path('PSOcoated_v3.icc')
        );
        copy(
            __DIR__.'/../../../assets/sRGB_ICC_v4_Appearance.icc',
            disk_path('sRGB_ICC_v4_Appearance.icc')
        );

        $image = factory(Image::class)->make([
            'user_id' => 1,
            'logo_id' => 1,
            'bleed'   => $bleed,
        ]);

        $editor = new ImageEditorPdf(
            $image,
            $bleed && $bleed > 0,
            123
        );

        $editor->generateIfNeeded();

        $this->assertTrue(
            Storage::exists($editor->getRelPath()),
        );

        // the pdf properties must be tested manually
        // else we need another library etc. and mess with
        // the pdf standard.
        // the easiest way to test manually is to use adobe
        // acrobat pro with the preflight tool.
    }

    public static function bleedProvider(): array
    {
        return [
            'null'      => [null],
            'noBleed'   => [0],
            'withBleed' => [5],
        ];
    }

    public static function resolutionProvider(): array
    {
        return [
            'too low'  => [10],
            'too high' => [1000],
        ];
    }
}
