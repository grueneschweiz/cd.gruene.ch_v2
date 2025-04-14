<?php

namespace App\Http\Controllers;

use App\Exceptions\ImageEditorException;
use App\Http\Controllers\Upload\ChunkUploadStrategy;
use App\Http\Controllers\Upload\RegularUploadStrategy;
use App\Image;
use App\Rules\FileExtensionRule;
use App\Rules\ImageBackgroundRule;
use App\Rules\ImageBleedRule;
use App\Rules\ImageColorProfileRule;
use App\Rules\ImageLogoRule;
use App\Rules\ImageOriginalRule;
use App\Rules\ImmutableRule;
use App\Rules\UserLogoRule;
use App\Services\ImageEditor\ImageEditor;
use App\Services\ImageEditor\ImageEditorFactory;
use App\Services\ImageEditor\ImageEditorJpeg;
use App\Services\ImageEditor\ImageEditorPdf;
use App\Services\ImageEditor\ImageEditorPng;
use App\Services\ImageEditor\ImageEditorThumbnail;
use App\User;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class ImageController extends Controller
{
    use FileResponseTrait;

    private const ALLOWED_EXT = ['png', 'svg', 'jpg', 'jpeg'];

    /**
     * Return paginated list of all shareable raw images.
     *
     * @return Response
     */
    public function indexRaw()
    {
        return Image::raw()
                    ->shareable()
                    ->latest()
                    ->paginate(50);
    }

    /**
     * Return paginated list of matching final images.
     *
     * Search for final images with the given string using MySQL's full text
     * search. All text in the images keyword field is searched. The results
     * are primarily ordered by the best match, secondarily by creation date.
     *
     * @param  string  $terms
     *
     * @return \Illuminate\Pagination\LengthAwarePaginator<Image>|Response
     */
    public function searchFinal(string $terms)
    {
        $terms = $this->prepareTerms(urldecode($terms));

        if (!$terms) {
            return $this->indexFinal();
        }

        return Image::final()
                    ->selectRaw('*, MATCH (keywords) AGAINST (? IN BOOLEAN MODE) as score', [$terms])
                    ->whereRaw('MATCH (keywords) AGAINST (? IN BOOLEAN MODE)', [$terms])
                    ->orderBy('score', 'desc')
                    ->orderBy('created_at', 'desc')
                    ->paginate(50);
    }

    /**
     * Return paginated list of all final images.
     *
     * @return \Illuminate\Pagination\LengthAwarePaginator<Image>|Response
     */
    public function indexFinal()
    {
        return Image::final()
                    ->completed()
                    ->latest()
                    ->paginate(50);
    }

    /**
     * Return single raw image.
     *
     * @param  Image  $image
     *
     * @return Image|Response
     */
    public function show(Image $image)
    {
        return $image;
    }

    /**
     * Remove the specified resource from storage.
     *
     * @param  Image  $image
     *
     * @return \Illuminate\Contracts\Routing\ResponseFactory|Response
     * @throws \Exception
     */
    public function destroy(Image $image)
    {
        if ($image->legal) {
            if (!$image->legal->delete()) {
                return response('Could not delete images legal information. Image not deleted.', 500);
            }
        }

        if (!$image->delete()) {
            return response('Could not delete image.', 500);
        }

        return response(null, 204);
    }

    /**
     * Update the specified resource in storage.
     *
     * @param  Request  $request
     * @param  Image  $image
     *
     * @return Image|Response
     */
    public function update(Request $request, Image $image)
    {
        /** @var User $user */
        $user = Auth::user();

        $data = $request->validate([
            'id'          => ['sometimes', new ImmutableRule($image)],
            'user_id'     => ['sometimes', new ImmutableRule($image)],
            'logo_id'     => [
                'sometimes',
                'nullable',
                'exists:logos,id',
                new UserLogoRule($user),
                new ImageLogoRule($image),
            ],
            'background'  => [
                'sometimes',
                'required',
                'in:'.Image::BG_CUSTOM.','.Image::BG_TRANSPARENT.','.Image::BG_GRADIENT.','.Image::BG_ICONS,
                new ImageBackgroundRule($image),
            ],
            // if mutable we would have to check the legal etc
            'type'        => ['sometimes', new ImmutableRule($image)],
            'original_id' => [
                'sometimes',
                new ImageOriginalRule($image),
            ],
            // if mutable, we have to deduplicate the logo and the author text
            'keywords'    => ['sometimes', 'nullable', new ImmutableRule($image)],
            'filename'    => [
                'sometimes',
                'required',
                'string',
                'max:255',
                new FileExtensionRule(self::ALLOWED_EXT)
            ],
            'width'       => ['sometimes', new ImmutableRule($image)],
            'height'      => ['sometimes', new ImmutableRule($image)],
            'bleed'       => ['sometimes', new ImageBleedRule($image)],
            'resolution'  => ['sometimes', new ImmutableRule($image)],
            'created_at'  => ['sometimes', new ImmutableRule($image)],
            'updated_at'  => ['sometimes', new ImmutableRule($image)],
            'deleted_at'  => ['sometimes', new ImmutableRule($image)],
        ]);

        if ($request->has('filename')) {
            $handler          = $this->makeUploadHandler($data['filename']);
            $data['filename'] = $handler->storeFinal(ImageEditor::getStorageDirOfUneditedImage());
        }

        $image->fill($data);

        $this->generateThumbnail($image);

        if (!$image->save()) {
            return response('Could not save image.', 500);
        }

        return $image;
    }

    /**
     * Store a newly created resource in storage.
     *
     * @param  Request  $request
     * @param  Image  $image
     *
     * @return Image|Response
     */
    public function store(Request $request, Image $image)
    {
        $user = Auth::user();

        $data = $request->validate([
            'id'          => ['sometimes', new ImmutableRule($image)],
            'user_id'     => ['sometimes', new ImmutableRule($image)],
            'logo_id'     => [
                'sometimes',
                'nullable',
                'exists:logos,id',
                new UserLogoRule($user),
                new ImageLogoRule($image),
            ],
            'background'  => [
                'required',
                'in:'.Image::BG_CUSTOM.','.Image::BG_TRANSPARENT.','.Image::BG_GRADIENT.','.Image::BG_ICONS,
                new ImageBackgroundRule($image),
            ],
            'type'        => ['required', 'in:'.Image::TYPE_RAW.','.Image::TYPE_FINAL],
            'original_id' => [
                new ImageOriginalRule($image),
            ],
            'keywords'    => ['string', 'nullable'],
            'filename'    => [
                'required',
                'string',
                'max:255',
                new FileExtensionRule(self::ALLOWED_EXT)
            ],
            'width'       => ['sometimes', new ImmutableRule($image)],
            'height'      => ['sometimes', new ImmutableRule($image)],
            'bleed'       => ['requiredIf:type,'.Image::TYPE_FINAL, new ImageBleedRule($image)],
            'resolution'  => ['requiredIf:type,'.Image::TYPE_FINAL, 'min:1', 'max:600'],
            'created_at'  => ['sometimes', new ImmutableRule($image)],
            'updated_at'  => ['sometimes', new ImmutableRule($image)],
            'deleted_at'  => ['sometimes', new ImmutableRule($image)],
        ]);

        $handler          = $this->makeUploadHandler($data['filename']);
        $data['filename'] = $handler->storeFinal(ImageEditor::getStorageDirOfUneditedImage());

        $image->fill($data);

        $this->generateThumbnail($image);

        if (!$image->save()) {
            return response('Could not save image.', 500);
        }

        return $image;
    }

    /**
     * Store a newly created resource in storage.
     *
     * @param  Request  $request
     *
     * @return void
     */
    public function storeChunk(Request $request)
    {
        $handler = new ChunkUploadStrategy(self::ALLOWED_EXT);
        $handler->storeTmp($request);
    }

    /**
     * Display the specified resource file.
     *
     * @param  Image  $image
     *
     * @return BinaryFileResponse
     */
    public function showThumbnail(Image $image)
    {
        $this->generateThumbnail($image);
        $editor = app(ImageEditorThumbnail::class, ['image' => $image]);
        return $this->fileResponse($editor->getRelPath());
    }

    /**
     * Display the specified resource file.
     *
     * @param  Image  $image
     *
     * @return BinaryFileResponse
     */
    public function showFile(Request $request, ImageEditorFactory $editorFactory, Image $image)
    {
        Validator::make($request->query(), [
            'format'        => ['sometimes', 'in:'.ImageEditorPng::FILE_FORMAT.','.ImageEditorPdf::FILE_FORMAT.','.ImageEditorJpeg::FILE_FORMAT],
            'color_profile' => [
                'requiredIf:format,'.ImageEditorPdf::FILE_FORMAT,
                new ImageColorProfileRule($request),
            ],
            'resolution'    => [
                'requiredIf:format,'.ImageEditorPdf::FILE_FORMAT,
                'integer',
                'between:'.ImageEditorPdf::RESOLUTION_MIN.','.ImageEditorPdf::RESOLUTION_MAX
            ],
            'bleed'         => ['requiredIf:format,'.ImageEditorPdf::FILE_FORMAT, 'between:0,1']
        ])->validate();

        $format       = $request->query('format', $image->getFileTypeAttribute());
        $withBleed    = (bool) $request->query('bleed', null);
        $resolution   = is_numeric($request->query('resolution')) ? (int)$request->query('resolution') : null;
        $colorProfile = $request->query('color_profile', ImageEditorPng::COLOR_PROFILE);

        try {
            $editor = $editorFactory->make($image, $format, $withBleed, $resolution, $colorProfile);
            $editor->generateIfNeeded();
        } catch (\ImagickException|ImageEditorException $e) {
            Log::error($e);

            abort(500, 'Failed to process image.');
        }

        return $this->fileResponse($editor->getRelPath());
    }

    /**
     * Do only search word characters and allow partial matches (word start)
     *
     * @param  string  $string
     *
     * @return string
     */
    private function prepareTerms(string $string): string
    {
        $query = '';

        // quoted strings must be treated differently
        // so extract them first
        if (preg_match_all('/([\+\-]?".+")/U', $string, $quoted)) {
            $query  .= implode(' ', $quoted[0]).' ';
            $string = trim(str_replace($quoted[0], '', $string));
        }

        // terms with quantifiers can't have a wildcard either (innoDB 5.7)
        // so treat them separately as well
        if (preg_match_all('/([\+\-][\w\.]+)/u', $string, $quantified)) {
            $query  .= implode(' ', $quantified[0]).' ';
            $string = trim(str_replace($quantified[0], '', $string));
        }

        // if there are unquoted parts left, process them for partial matches
        if ($string) {
            $terms = preg_split("/[^\w\+\-\.]+/Uu", $string, 0, PREG_SPLIT_NO_EMPTY);
            if (!$terms) {
                return $query;
            }
            $query .= implode('* ', $terms).'*';
        }

        return $query;
    }

    /**
     * UploadHandler factory
     *
     * @param  string  $filename
     *
     * @return RegularUploadStrategy
     */
    private function makeUploadHandler(string $filename)
    {
        return new RegularUploadStrategy(
            self::ALLOWED_EXT,
            $filename
        );
    }

    /**
     * Just a wrapper to handle errors of the generateThumbnail method of the
     * model.
     *
     * @param  Image  $image
     *
     * @return void
     */
    private function generateThumbnail(Image $image): void
    {
        try {
            $editor = app(ImageEditorThumbnail::class, ['image' => $image]);
            $editor->generateIfNeeded();
        } catch (\ImagickException|ImageEditorException $e) {
            Log::error($e);

            abort(500, 'Failed to generate thumbnail.');
        }
    }
}
