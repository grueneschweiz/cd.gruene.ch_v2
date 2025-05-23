<?php

namespace App;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Carbon;

/**
 * Class Image
 *
 * @package App
 * @property int $id
 * @property int $user_id
 * @property User|null $user
 * @property int|null $logo_id
 * @property Logo|null $logo
 * @property int|null $original_id
 * @property Image|null $original
 * @property Legal|null $legal
 * @property string $type
 * @property string $background
 * @property string $keywords
 * @property string $filename
 * @property int $width
 * @property int $height
 * @property int|null $bleed  pixels
 * @property int|null $resolution  dpi
 * @property string $src
 * @property string $thumb_src
 * @property string $file_type
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property Carbon|null $deleted_at
 * @method static \Illuminate\Database\Eloquent\Builder|\App\Image final()
 * @method static bool|null forceDelete()
 * @method static \Illuminate\Database\Eloquent\Builder|\App\Image newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder|\App\Image newQuery()
 * @method static \Illuminate\Database\Query\Builder|\App\Image onlyTrashed()
 * @method static \Illuminate\Database\Eloquent\Builder|\App\Image query()
 * @method static \Illuminate\Database\Eloquent\Builder|\App\Image raw()
 * @method static bool|null restore()
 * @method static \Illuminate\Database\Eloquent\Builder|\App\Image completed()
 * @method static \Illuminate\Database\Eloquent\Builder|\App\Image shareable()
 * @method static \Illuminate\Database\Eloquent\Builder|\App\Image whereBackground($value)
 * @method static \Illuminate\Database\Eloquent\Builder|\App\Image whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder|\App\Image whereDeletedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder|\App\Image whereFilename($value)
 * @method static \Illuminate\Database\Eloquent\Builder|\App\Image whereHeight($value)
 * @method static \Illuminate\Database\Eloquent\Builder|\App\Image whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder|\App\Image whereKeywords($value)
 * @method static \Illuminate\Database\Eloquent\Builder|\App\Image whereLogoId($value)
 * @method static \Illuminate\Database\Eloquent\Builder|\App\Image whereOriginalId($value)
 * @method static \Illuminate\Database\Eloquent\Builder|\App\Image whereType($value)
 * @method static \Illuminate\Database\Eloquent\Builder|\App\Image whereUpdatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder|\App\Image whereUserId($value)
 * @method static \Illuminate\Database\Eloquent\Builder|\App\Image whereWidth($value)
 * @method static \Illuminate\Database\Query\Builder|\App\Image withTrashed()
 * @method static \Illuminate\Database\Query\Builder|\App\Image withoutTrashed()
 * @mixin \Eloquent
 */
class Image extends Model
{
    use SoftDeletes;

    public const TYPE_RAW = 'raw';
    public const TYPE_FINAL = 'final';

    public const BG_GRADIENT = 'gradient';
    public const BG_TRANSPARENT = 'transparent';
    public const BG_CUSTOM = 'custom';
    public const BG_ICONS = 'icons';

    /**
     * The attributes that should be hidden for arrays.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'filename',
        'deleted_at'
    ];

    /**
     * The accessors to append to the model's array form.
     *
     * @var array<int, string>
     */
    protected $appends = [
        'src',
        'thumb_src',
        'file_type',
        'shareable',
    ];

    /**
     * The attributes that aren't mass assignable.
     *
     * @var array<string>|bool
     */
    protected $guarded = [];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function logo()
    {
        return $this->belongsTo(Logo::class);
    }

    public function isShareable()
    {
        return $this->legal && $this->legal->shared;
    }

    public function isCompleted()
    {
        if ($this->background !== self::BG_CUSTOM) {
            return true;
        }

        if ($this->type === self::TYPE_FINAL) {
            return (bool) optional($this->original()->first())->legal()->exists();
        }

        return (bool) $this->legal;
    }

    public function legal()
    {
        return $this->hasOne(Legal::class);
    }

    public function original()
    {
        return $this->belongsTo(__CLASS__, 'original_id');
    }

    public function isFinal()
    {
        return $this->type === self::TYPE_FINAL;
    }

    /**
     * Scope a query to only include raw images.
     *
     * @param  Builder  $query
     *
     * @return Builder
     */
    public function scopeRaw($query)
    {
        return $query->where('type', self::TYPE_RAW);
    }

    /**
     * Scope a query to only include final images.
     *
     * @param  Builder  $query
     *
     * @return Builder
     */
    public function scopeFinal($query)
    {
        return $query->where('type', self::TYPE_FINAL);
    }

    /**
     * Scope a query to only include shareable images.
     *
     * @param  Builder  $query
     *
     * @return Builder
     */
    public function scopeShareable($query)
    {
        return $query->join('legals', 'images.id', '=', 'legals.image_id')
                     ->select('images.*')
                     ->where('legals.shared', true);
    }

    /**
     * Scope a query to only include images with custom background
     * if the legal was submitted.
     *
     * @param  Builder  $query
     *
     * @return Builder
     */
    public function scopeCompleted($query)
    {
        return $query
            ->where(function ($query) {
                $query->where('type', self::TYPE_FINAL)
                      ->where('background', self::BG_CUSTOM)
                      ->whereRaw('EXISTS (SELECT * FROM legals WHERE legals.image_id = images.original_id)');
            })->orWhere(function ($query) {
                $query->where('type', self::TYPE_RAW)
                      ->where('background', self::BG_CUSTOM)
                      ->whereRaw('EXISTS (SELECT * FROM legals WHERE legals.image_id = images.id)');
            })->orWhere('background', '<>', self::BG_CUSTOM);
    }

    public function getSrcAttribute()
    {
        return route('image', ['image' => $this->id]);
    }

    public function getThumbSrcAttribute()
    {
        return route('thumbnail', ['image' => $this->id]);
    }

    public function getFileTypeAttribute()
    {
        return substr($this->filename, strpos($this->filename, '.') + 1);
    }

    public function getShareableAttribute(): bool
    {
        if ($this->isFinal()) {
            if (! $this->original_id) {
                return false;
            }

            return (bool)self::find($this->original_id)?->isShareable();
        }

        return $this->isShareable();
    }
}
