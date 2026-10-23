<?php
declare(strict_types=1);

namespace Tests\Unit\Services\ImageEditor;

use App\Services\ImageEditor\ImageEditorFactory;
use Tests\TestCase;

class ImageEditorFactoryTest extends TestCase
{
    public function testMake__imageEditorPdf(): void
    {
        $factory = new ImageEditorFactory();

        $imageEditor = $factory->make(
            $this->createStub(\App\Image::class),
            'pdf',
            true,
            300,
            'FOGRA51'
        );

        $this->assertInstanceOf(\App\Services\ImageEditor\ImageEditorPdf::class, $imageEditor);
    }

    public function testMake__imageEditorPng(): void
    {
        $factory = new ImageEditorFactory();

        $imageEditor = $factory->make(
            $this->createStub(\App\Image::class),
            'png'
        );

        $this->assertInstanceOf(\App\Services\ImageEditor\ImageEditorPng::class, $imageEditor);
    }

    public function testMake__imageEditorJpeg(): void
    {
        $factory = new ImageEditorFactory();

        $imageEditor = $factory->make(
            $this->createStub(\App\Image::class),
            'jpeg'
        );

        $this->assertInstanceOf(\App\Services\ImageEditor\ImageEditorJpeg::class, $imageEditor);
    }

    public function testMake__imageEditorInvalidFileFormat(): void
    {
        $factory = new ImageEditorFactory();

        $this->expectException(\App\Exceptions\ImageEditorException::class);
        $this->expectExceptionMessage('Unknown file format: invalid');

        $factory->make(
            $this->createStub(\App\Image::class),
            'invalid'
        );
    }
}
