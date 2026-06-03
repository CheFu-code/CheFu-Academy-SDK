<?php

declare(strict_types=1);

namespace CheFu\Academy;

final class CheFuAcademyException extends \RuntimeException
{
    public function __construct(string $message, private readonly ?int $statusCode = null)
    {
        parent::__construct($message, $statusCode ?? 0);
    }

    public function statusCode(): ?int
    {
        return $this->statusCode;
    }
}
