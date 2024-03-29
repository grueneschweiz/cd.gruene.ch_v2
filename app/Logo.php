<?php

namespace App;

use App\Exceptions\LogoException;
use App\Logo\LogoFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * Class Logo
 *
 * @package App
 * @property int $id
 * @property int $added_by
 * @property User|null $addedBy
 * @property string $type
 * @property-read string $src_white
 * @property-read string $src_green
 * @property-read string $download
 * @property string $name
 * @property Group[] $groups
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property Carbon|null $deleted_at
 * @property-read int|null $groups_count
 * @property-read \Illuminate\Database\Eloquent\Collection|\App\Image[] $images
 * @property-read int|null $images_count
 * @method static bool|null forceDelete()
 * @method static \Illuminate\Database\Eloquent\Builder|\App\Logo newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder|\App\Logo newQuery()
 * @method static \Illuminate\Database\Query\Builder|\App\Logo onlyTrashed()
 * @method static \Illuminate\Database\Eloquent\Builder|\App\Logo query()
 * @method static bool|null restore()
 * @method static \Illuminate\Database\Eloquent\Builder|\App\Logo whereAddedBy($value)
 * @method static \Illuminate\Database\Eloquent\Builder|\App\Logo whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder|\App\Logo whereDeletedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder|\App\Logo whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder|\App\Logo whereName($value)
 * @method static \Illuminate\Database\Eloquent\Builder|\App\Logo whereType($value)
 * @method static \Illuminate\Database\Eloquent\Builder|\App\Logo whereUpdatedAt($value)
 * @method static \Illuminate\Database\Query\Builder|\App\Logo withTrashed()
 * @method static \Illuminate\Database\Query\Builder|\App\Logo withoutTrashed()
 * @mixin \Eloquent
 */
class Logo extends Model
{
    use SoftDeletes;

    /**
     * The accessors to append to the model's array form.
     *
     * @var array<int, string>
     */
    protected $appends = [
        'src_white',
        'src_green',
        'groups',
        'download',
    ];

    /**
     * The attributes that aren't mass assignable.
     *
     * @var array<string>|bool
     */
    protected $guarded = [];

    public function images()
    {
        return $this->hasMany(Image::class);
    }

    public function addedBy()
    {
        return $this->belongsTo(User::class, 'added_by');
    }

    public function getSrcWhiteAttribute()
    {
        return route('logo', ['logo' => $this->id, 'color' => 'light']);
    }

    public function getSrcGreenAttribute()
    {
        return route('logo', ['logo' => $this->id, 'color' => 'dark']);
    }

    public function getGroupsAttribute()
    {
        return $this->groups()->select('groups.id')->get()->pluck('id');
    }

    public function groups()
    {
        return $this->belongsToMany(Group::class);
    }

    public function getDownloadAttribute()
    {
        return route('logoPackage', ['logo' => $this->id]);
    }

    /**
     * @param  string  $color
     * @param  int|null  $width
     * @return string
     */
    public function getRelPath(
        string $color = \App\Logo\Logo::LOGO_COLOR_DARK,
        int    $width = null
    ): string
    {
        if (!$width) {
            $width = (int) config('app.logo_width');
        }

        try {
            $logo = LogoFactory::get($this->type, $color, [$this->name]);
            return $logo->getPng($width);
        } catch (Exceptions\LogoException $e) {
            if ($e->getCode() === LogoException::OVERSIZE) {
                abort(422, $e->getMessage());
            }

            Log::warning($e);
            return '';
        }
    }

    /**
     * @return string
     * @throws LogoException
     */
    public function getRelTemplateFilePath(): string
    {
        $logo = LogoFactory::get($this->type, \App\Logo\Logo::LOGO_COLOR_DARK, [$this->name]);
        return $logo->getLogoTemplateDirPath();
    }

    public function getSlug(): string
    {
        $name = mb_strtolower($this->name);
        $name = str_replace(['ä', 'ö', 'ü'], ['ae', 'oe', 'ue'], $name);
        $name = preg_replace('/\.ch$/', '', $name);
        return Str::slug($name); // removes any bad chars
    }
}
