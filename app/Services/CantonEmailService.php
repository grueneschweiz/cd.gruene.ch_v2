<?php

namespace App\Services;

class CantonEmailService
{
    public static function getCantonEmail(array $groups): string
    {
        $cantonConfig = config('app.cantons', []);
        
        // Extract canton from groups path
        $canton = self::extractCantonFromGroups($groups);
        
        // If canton is "CH" or not found, return admin email
        if ($canton === 'CH' || !isset($cantonConfig[$canton])) {
            return config('app.admin_email');
        }
        
        $email = $cantonConfig[$canton]['email'] ?? null;
        
        // Fallback to admin email if email is not configured
        return $email ?: config('app.admin_email');
    }
    
    public static function getCantonLanguage(array $groups): string
    {
        $cantonConfig = config('app.cantons', []);
        
        // Extract canton from groups path
        $canton = self::extractCantonFromGroups($groups);
        
        // If canton is "CH" or not found, return default language
        if ($canton === 'CH' || !isset($cantonConfig[$canton])) {
            return 'de'; // Default to German
        }
        
        return $cantonConfig[$canton]['lang'] ?? 'de';
    }
    
    public static function extractCantonFromGroups(array $groups): string
    {
        if (empty($groups)) {
            return 'CH';
        }
        
        // Look for a path like "/CH/VD/" and extract the last segment
        foreach ($groups as $group) {
            if (is_string($group) && str_starts_with($group, '/CH/')) {
                $parts = explode('/', trim($group, '/'));
                return end($parts); // Return the last part (VD, ZH, etc.)
            }
        }
        
        // If no specific canton found, assume CH
        return 'CH';
    }
}
