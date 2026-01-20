<?php

namespace Tests\Unit;

use App\Services\CantonEmailService;
use Tests\TestCase;

class CantonEmailServiceTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        
        // Set up test environment variables
        config(['app.cantons' => [
            'ZH' => ['email' => 'test-zh@example.com', 'lang' => 'de'],
            'VD' => ['email' => 'test-vd@example.com', 'lang' => 'fr'],
            'BE' => ['email' => 'test-be@example.com', 'lang' => 'de'],
        ]]);
    }

    public function testExtractsCantonFromGroups()
    {
        // Test German canton
        $groupsZh = ['/CH/ZH/'];
        $this->assertEquals('test-zh@example.com', CantonEmailService::getCantonEmail($groupsZh));
        $this->assertEquals('de', CantonEmailService::getCantonLanguage($groupsZh));
        
        // Test French canton
        $groupsVd = ['/CH/VD/'];
        $this->assertEquals('test-vd@example.com', CantonEmailService::getCantonEmail($groupsVd));
        $this->assertEquals('fr', CantonEmailService::getCantonLanguage($groupsVd));
        
        // Test CH fallback
        $groupsCh = ['/CH/'];
        $this->assertEquals(config('app.admin_email'), CantonEmailService::getCantonEmail($groupsCh));
        $this->assertEquals('de', CantonEmailService::getCantonLanguage($groupsCh));
        
        // Test unknown canton fallback
        $groupsUnknown = ['/CH/XX/'];
        $this->assertEquals(config('app.admin_email'), CantonEmailService::getCantonEmail($groupsUnknown));
        $this->assertEquals('de', CantonEmailService::getCantonLanguage($groupsUnknown));
    }
    
    public function testHandlesEmptyGroups()
    {
        $this->assertEquals(config('app.admin_email'), CantonEmailService::getCantonEmail([]));
        $this->assertEquals('de', CantonEmailService::getCantonLanguage([]));
    }
    
    public function testHandlesMultipleGroups()
    {
        $groups = ['/CH/VD/', '/CH/ZH/'];
        // Should use the first matching canton
        $this->assertEquals('test-vd@example.com', CantonEmailService::getCantonEmail($groups));
        $this->assertEquals('fr', CantonEmailService::getCantonLanguage($groups));
    }
}
