<?php

namespace Tests\Feature\Logo;

use App\Logo\Logo;
use App\Logo\LogoFactory;
use Database\Seeders\RootSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;
use Tests\TestStorage;

class LogoTest extends TestCase
{
    use RefreshDatabase;
    use TestStorage;

    public function setUp(): void
    {
        parent::setUp();

        $this->seed(RootSeeder::class);
        $this->setUpTestStorage();
    }

    public function testGetPng_general()
    {
        $logo = LogoFactory::get('gruene', Logo::LOGO_COLOR_DARK, ['subline']);
        $path = $logo->getPng(200, true);

        self::assertFileExists(disk_path($path));
        self::assertEquals('image/png', Storage::mimeType($path));

        [$width] = getimagesize(disk_path($path));
        self::assertGreaterThanOrEqual(199, $width);
        self::assertLessThanOrEqual(201, $width);
    }

    /**
     * The subline text must keep vertical padding inside the magenta bar.
     * Regression test: text used to be positioned via annotateImage() with a
     * negative y offset, which let font metric differences push the glyphs
     * against (or beyond) the top edge of the bar.
     */
    public function testSublineTextHasPaddingInsideBar()
    {
        foreach (['Senseoberland', 'Nidwalden'] as $name) {
            $logo = LogoFactory::get('gruene', Logo::LOGO_COLOR_DARK, [$name]);
            $path = $logo->getPng(1000, true);

            [$topGap, $bottomGap] = $this->measureSublinePadding(disk_path($path));

            self::assertGreaterThanOrEqual(6, $topGap, "Missing top padding for '$name'");
            self::assertGreaterThanOrEqual(6, $bottomGap, "Missing bottom padding for '$name'");
            // vertically centered text: both gaps must be of similar magnitude
            self::assertGreaterThanOrEqual($bottomGap * 0.7, $topGap, "Text sits too high for '$name'");
            self::assertGreaterThanOrEqual($topGap * 0.7, $bottomGap, "Text sits too low for '$name'");
        }
    }

    /**
     * Measures the vertical gap between the subline text and the top/bottom
     * edge of the magenta bar (#E10078) in a generated logo PNG.
     *
     * @return array{0: int, 1: int} [medianTopGap, medianBottomGap] in pixels
     */
    private function measureSublinePadding(string $path): array
    {
        $im     = new \Imagick($path);
        $width  = $im->getImageWidth();
        $height = $im->getImageHeight();

        $isBarColor = function (array $c): bool {
            return abs($c['r'] - 0xE1) < 45 && $c['g'] < 70 && abs($c['b'] - 0x78) < 70;
        };
        $isTextColor = function (array $c): bool {
            return $c['r'] > 225 && $c['g'] > 225 && $c['b'] > 225;
        };

        // locate the magenta bar bounding box
        $minX = $width;
        $maxX = 0;
        $minY = $height;
        $maxY = 0;
        for ($y = 0; $y < $height; $y += 4) {
            for ($x = 0; $x < $width; $x += 4) {
                if (!$isBarColor($im->getImagePixelColor($x, $y)->getColor())) {
                    continue;
                }
                $minX = min($minX, $x);
                $maxX = max($maxX, $x);
                $minY = min($minY, $y);
                $maxY = max($maxY, $y);
            }
        }

        $topGaps    = [];
        $bottomGaps = [];
        for ($x = $minX + 8; $x <= $maxX - 8; $x += 4) {
            // top and bottom edge of the bar in this column
            $top = null;
            $bottom = null;
            for ($y = max(0, $minY - 100); $y < min($height, $minY + 300); $y++) {
                if ($isBarColor($im->getImagePixelColor($x, $y)->getColor())) {
                    $top ??= $y;
                    $bottom = $y;
                } elseif ($top !== null && $y > $bottom + 40) {
                    break;
                }
            }
            if ($top === null) {
                continue;
            }

            // first text pixel below the top edge
            for ($y = $top; $y < min($height, $top + 200); $y++) {
                $c = $im->getImagePixelColor($x, $y)->getColor();
                if ($isTextColor($c)) {
                    $topGaps[] = $y - $top;
                    break;
                }
                if (!$isBarColor($c) && $y > $top + 4) {
                    break;
                }
            }

            // last text pixel above the bottom edge
            for ($y = $bottom; $y > max(0, $bottom - 200); $y--) {
                $c = $im->getImagePixelColor($x, $y)->getColor();
                if ($isTextColor($c)) {
                    $bottomGaps[] = $bottom - $y;
                    break;
                }
                if (!$isBarColor($c) && $y < $bottom - 4) {
                    break;
                }
            }
        }

        sort($topGaps);
        sort($bottomGaps);

        self::assertNotEmpty($topGaps, 'No subline text found inside the bar');
        self::assertNotEmpty($bottomGaps, 'No subline text found inside the bar');

        return [
            $topGaps[intdiv(count($topGaps), 2)],
            $bottomGaps[intdiv(count($bottomGaps), 2)],
        ];
    }

    public function testGetPng_typesAndSchemes()
    {
        $types = [
            'alternative',
            'alternative-baar',
            'alternative-cham',
            'alternative-risch',
            'alternative-stadt-zug',
            'alternative-unteraegeri',
            'gruene',
            'gruene-vert-e-s',
            'gruene-verts',
            'verda',
            'verdi',
            'vert-e-s',
            'verts'
        ];
        $schemes = [
            Logo::LOGO_COLOR_DARK,
            Logo::LOGO_COLOR_LIGHT
        ];
        foreach($types as $type) {
            foreach ($schemes as $scheme) {
                $logo = LogoFactory::get($type, $scheme, ['subline']);
                $path = $logo->getPng(200, true);

                self::assertFileExists(disk_path($path));
            }
        }
    }
}
