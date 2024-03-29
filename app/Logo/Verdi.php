<?php


namespace App\Logo;


class Verdi extends AbstractFlowerLogo
{
    private const TEMPLATE_DIR_NAME = 'verdi';
    private const BASE_LOGO_NAME = 'verdi-%s.svg';
    private const REFERENCE_LOGO_NAME = 'verdi.svg';

    public function getLogoIdentifier(int $width): string
    {
        return sprintf(self::BASE_LOGO_NAME, $this->colorScheme)
               ."-{$this->getSublineText()}-{$width}";
    }

    protected function getRelSublineOffsetX(): float
    {
        return 35.5;
    }

    protected function getRelSublineOffsetY(): float
    {
        return 103.5;
    }

    protected function getAbsBaseLogoPath(): string
    {
        return $this->baseLogoDirPath
               .DIRECTORY_SEPARATOR
               .sprintf(self::BASE_LOGO_NAME, $this->colorScheme);
    }

    protected function getSublineFontSize(): float
    {
        return 8.25;
    }

    protected function getTestOverlayPath(): ?string
    {
        return $this->getReferenceLogoDir()
               .DIRECTORY_SEPARATOR
               .self::REFERENCE_LOGO_NAME;
    }

    public function getTemplateDirName(): string
    {
        return self::TEMPLATE_DIR_NAME;
    }
}
