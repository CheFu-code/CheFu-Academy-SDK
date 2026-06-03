# CheFu Academy PHP Client

Official PHP/Composer source client for the CheFu Academy API.

## Usage

```php
$client = new \CheFu\Academy\CheFuAcademyClient(apiKey: 'chf_publicId_secret');
$courses = $client->listCourses(['limit' => 5]);
```

## Local Install

```bash
composer install
```

## Registry Install

After the package is connected on Packagist:

```bash
composer require chefu/academy
```
