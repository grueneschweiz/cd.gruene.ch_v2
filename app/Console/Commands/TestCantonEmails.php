<?php

namespace App\Console\Commands;

use App\Services\CantonEmailService;
use Illuminate\Console\Command;

class TestCantonEmails extends Command
{
    protected $signature = 'test:canton-emails';
    protected $description = 'Test canton email routing functionality';

    public function handle()
    {
        $this->info('Testing Canton Email Service...');
        $this->line(str_repeat('-', 50));

        $testCases = [
            'Zurich (ZH)' => ['/CH/ZH/'],
            'Vaud (VD)' => ['/CH/VD/'],
            'Bern (BE)' => ['/CH/BE/'],
            'Switzerland (CH)' => ['/CH/'],
            'Unknown (XX)' => ['/CH/XX/'],
            'Empty groups' => [],
        ];

        foreach ($testCases as $name => $groups) {
            $email = CantonEmailService::getCantonEmail($groups);
            $language = CantonEmailService::getCantonLanguage($groups);
            
            $this->info("{$name}:");
            $this->line("  Groups: " . json_encode($groups));
            $this->line("  Email: {$email}");
            $this->line("  Language: {$language}");
            $this->line('');
        }

        $this->info('Test completed!');
        return 0;
    }
}
