<?php


namespace App\Http\Controllers\Upload;


use App\Exceptions\UploadException;
use App\Rules\FileExtensionRule;
use Illuminate\Support\Facades\Log;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class ChunkUploadStrategy extends UploadStrategy
{
    private const KEY_DATA = 'base64data';
    private const KEY_PART = 'part';

    /**
     * The base64 encoded uploaded data
     *
     * @var string
     */
    private $data;

    /**
     * The chunk number
     *
     * @var int
     */
    private $part;

    /**
     * Save the uploaded data as temporary file
     *
     * @param  Request  $request
     *
     * @return void
     */
    public function storeTmp(Request $request): void
    {
        // validate request and initiate state data
        $this->setValidatedData($request);

        // actually save the data
        try {
            $this->saveChunk();
        } catch (UploadException $e) {
            Log::error('Failed to save uploaded chunk. Storage put returned false.');
            abort(500, 'Internal Server Error.');
        }
    }

    /**
     * Validate the request data and move them into the class state
     *
     * @param  Request  $request
     */
    private function setValidatedData(Request $request)
    {
        // Initial validation for part and filename
        $validator = Validator::make($request->all(), [
            self::KEY_PART => 'required|integer|min:0',
            self::KEY_FILENAME => [
                'bail',
                'required',
                'string',
                new FileExtensionRule($this->allowedFileExt),
            ],
        ]);

        $validated = $validator->validated();
        $this->part = $validated[self::KEY_PART];
        $this->filename = $validated[self::KEY_FILENAME];

        // Additional validation for base64data
        $validator = Validator::make($request->all(), [
            self::KEY_DATA => [
                'bail',
                'required',
                'string',
                function ($attribute, $value, $fail) {
                    $current = 0 === $this->part ? 0 : $this->getCurrentTmpFileSize();
                    $fileMax = ceil($this->allowedFileSize * 4 / 3);
                    $chunkMax = ceil(config('app.uploads_max_chunk_size') * 1024 * 1024 * 4 / 3);

                    $base64max = min($fileMax - $current, $chunkMax);

                    $base64value = rtrim($this->extractData($value), '=');

                    if (strlen($base64value) > $base64max) {
                        $fail("The {$attribute} exceeds the maximum allowed size.");
                    }
                },
            ],
        ]);

        if ($validator->fails()) {
            $this->validationErrorAbort(self::KEY_DATA, 'Max file size exceeded.');
        }

        $validated = $validator->validated();
        $this->data = $validated[self::KEY_DATA];
    }

    /**
     * Return the size of the already uploaded chunks of this file.
     *
     * Returns zero if there were no chunks uploaded.
     *
     * @return int
     */
    private function getCurrentTmpFileSize()
    {
        $path = $this->getRelTmpPath($this->filename);

        if ( ! Storage::exists($path)) {
            return 0;
        }

        return Storage::size($path);
    }

    /**
     * Get the base64 encoded data from the given chunk
     *
     * @param  string  $chunk
     *
     * @return string
     */
    private function extractData(string $chunk): string
    {
        // the file is the part after the first comma
        $start = strpos($chunk, ',');

        if (false === $start) {
            if (0 === $this->part) {
                $this->validationErrorAbort(self::KEY_DATA, 'Invalid data format.');
            } else {
                return $chunk;
            }
        }

        return substr($chunk, $start + 1);
    }

    /**
     * Save the file chunk
     *
     * @throws UploadException
     */
    private function saveChunk()
    {
        $data  = $this->extractData($this->data);

        $relFilePath = $this->getRelTmpPath($this->filename);

        // don't use laravel's Storage::append() function because it adds a
        // newline character in between.
        if (0 !== $this->part) {
            if ( ! Storage::exists($relFilePath)) {
                $this->validationErrorAbort(self::KEY_PART, 'Invalid part number.');
            }

            $existingData = Storage::get($relFilePath);
            $data         = $existingData.$data;
        }

        $written = Storage::put($relFilePath, $data, 'private');

        if (false === $written) {
            throw new UploadException('Unable to store file.');
        }
    }
}
